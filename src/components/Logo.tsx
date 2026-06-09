export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display font-bold tracking-tight ${className}`}>
      <span className="text-foreground">Kau</span>
      <span className="text-gradient">z</span>
    </span>
  );
}