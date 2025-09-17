export default function Logo({ className = "h-6 w-auto" }: { className?: string }) {
  return (
    <div className={`font-semibold tracking-[0.25em] text-covex-ink ${className}`}>
      C O V E X
    </div>
  );
}
