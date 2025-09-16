import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function reqHeader(req: NextRequest, name: string) {
  return req.headers.get(name) || req.headers.get(name.toLowerCase());
}

function bad(message: string, code = 400) {
  return NextResponse.json({ error: message }, { status: code });
}

export async function POST(req: NextRequest) {
  const authz = reqHeader(req, "Authorization");
  const token = authz?.startsWith("Bearer ") ? authz.slice(7) : undefined;
  if (!token) return bad("Missing Authorization: Bearer <ADMIN_PROVISION_SECRET>", 401);
  if (token !== process.env.ADMIN_PROVISION_SECRET) return bad("Invalid admin secret", 401);

  const body = await req.json().catch(() => null);
  if (!body) return bad("Invalid JSON body");
  const { email, password, business_id, role = "owner" } = body;

  if (!email || !password || !business_id) {
    return bad("Required fields: email, password, business_id");
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !serviceRole) return bad("Server missing Supabase env vars", 500);

  const admin = createClient(url, serviceRole, { auth: { persistSession: false } });

  try {
    // 1) Does the user already exist?
    const { data: gotUserByEmail } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1,
      email
    } as any); // types are a bit narrow; this is safe in runtime

    let userId: string | null = null;

    if (gotUserByEmail?.users?.length) {
      userId = gotUserByEmail.users[0].id;
    } else {
      // 2) Create user with metadata (auto-confirmed)
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { business_id, role }
      });
      if (createErr) {
        return bad(`Auth admin.createUser failed: ${createErr.message}`, 500);
      }
      userId = created?.user?.id ?? null;
    }

    if (!userId) return bad("Could not create or find user in auth", 500);

    // 3) Upsert profile (idempotent)
    const { error: upsertErr } = await admin
      .from("profiles")
      .upsert(
        { id: userId, business_id, role },
        { onConflict: "id" }
      );
    if (upsertErr) {
      return bad(`Upsert profiles failed: ${upsertErr.message}`, 500);
    }

    return NextResponse.json({ ok: true, user_id: userId, email, business_id, role });
  } catch (e: any) {
    const msg = e?.message || String(e);
    return bad(`Unhandled server error: ${msg}`, 500);
  }
}
