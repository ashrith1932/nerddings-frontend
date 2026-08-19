export function BrandMark({ inverted = false, size = 34 }: { inverted?: boolean; size?: number }) {
  const cream = "#FFFDEB";
  const black = "#000000";
  const background = inverted ? black : cream;
  const foreground = inverted ? cream : black;

  return (
    <svg
      aria-label="Nerdding mark"
      width={size}
      height={size}
      viewBox="0 0 400 400"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
    >
      <rect width="400" height="400" fill={background} />
      <polygon points="200,5 350,5 350,155" fill={foreground} />
      <circle cx="42" cy="42" r="17" fill={foreground} />
      <polygon points="42,215 42,390 217,390" fill={foreground} />
      <circle cx="352" cy="345" r="18" fill={foreground} />
    </svg>
  );
}

export function Wordmark({ compact = false, inverted = false }: { compact?: boolean; inverted?: boolean }) {
  return (
    <div className={`wordmark ${compact ? "wordmark-compact" : ""}`}>
      <BrandMark inverted={inverted} size={compact ? 28 : 33} />
      <span>nerdding</span>
    </div>
  );
}
