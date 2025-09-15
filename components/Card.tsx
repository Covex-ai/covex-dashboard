// components/Card.tsx
export default function Card({ title, children, right }: { title?: string; children: React.ReactNode; right?: React.ReactNode; }) {
  return (
    <section className="card">
      {(title || right) && (
        <div className="flex items-center justify-between mb-4">
          {title ? <h3 className="text-lg font-semibold">{title}</h3> : <div />}
          {right}
        </div>
      )}
      {children}
    </section>
  );
}