export function BrandMark({ inverted = false, size = 34 }: { inverted?: boolean; size?: number }) {
  const ink = inverted ? "#fff9e9" : "#171411";
  const ground = inverted ? "#171411" : "#fff9e9";
  return (
    <svg aria-label="Nerdding mark" width={size} height={size} viewBox="0 0 100 100" role="img">
      <rect width="100" height="100" rx="18" fill={ground} />
      <circle cx="21" cy="20" r="7" fill={ink} />
      <path d="M53 0h47v47L53 0Z" fill={ink} />
      <path d="M0 53v47h47L0 53Z" fill={ink} />
      <circle cx="79" cy="79" r="7" fill={ink} />
    </svg>
  );
}

export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`wordmark ${compact ? "wordmark-compact" : ""}`}>
      <BrandMark size={compact ? 28 : 33} />
      <span>nerdding</span>
    </div>
  );
}
