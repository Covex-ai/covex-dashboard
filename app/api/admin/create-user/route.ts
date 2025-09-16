// app/api/admin/create-user/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const adminSecret = process.env.ADMIN_PROVISION_SECRET!; // <-- set this in Vercel

export async function POST(req: NextRequest) {
  try {
    // 1) Auth guard: only allow if header matches
    const authz = req.headers.get("authorization") || "";
    const token = authz.startsWith("Bearer ") ? authz.slice("Bearer ".length) : "";
    if (!token || token !== adminSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2) Parse body
    const { email, password, business_id, role } = await req.json();

    if (!email || !password || !business_id) {
      return NextResponse.json(
        { error: "Missing email, password, or business_id" },
        { status: 400 }
      );
    }

    // 3) Admin supabase client
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false }
    });

    // 4) Create user via Admin API (metadata seeds our trigger)
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // set true if you want them active immediately
      user_metadata: {
        business_id,
        role: role || "member",
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // 5) Respond with user id/email
    return NextResponse.json(
      { user_id: data.user?.id, email: data.user?.email },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
