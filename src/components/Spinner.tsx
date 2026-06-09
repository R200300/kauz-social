export function Spinner({ size = 24 }: { size?: number }) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <div
        className="absolute inset-0 rounded-full border-2 border-muted-foreground/30 border-t-foreground animate-spin"
        style={{ animation: "spin 1s linear infinite" }}
      />
    </div>
  );
}