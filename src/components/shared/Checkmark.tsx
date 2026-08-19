export type CheckmarkType = "gold" | "blue" | "green" | "purple" | "silver" | string;

const palette: Record<string, string> = {
  blue: "#3b82f6",
  green: "#16a34a",
  purple: "#7c3aed",
  silver: "#94a3b8",
};

export function Checkmark({ type, size = 14 }: { type?: CheckmarkType | null; size?: number }) {
  if (!type) return null;
  const gold = type === "gold";
  const color = palette[type] ?? "#64748b";
  const id = `checkmark-${type.replace(/[^a-z0-9]/gi, "")}-${size}`;
  return (
    <svg
      className={`nerdd-checkmark nerdd-checkmark-${type}`}
      width={size}
      height={size}
      viewBox="0 0 200 200"
      aria-label={`${type} verification`}
      role="img"
      style={{ flex: "0 0 auto" }}
    >
      {gold ? (
        <defs>
          <linearGradient id={`${id}-gold`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#bf953f" />
            <stop offset="25%" stopColor="#fcf6ba" />
            <stop offset="50%" stopColor="#b38728" />
            <stop offset="75%" stopColor="#fbf5b7" />
            <stop offset="100%" stopColor="#aa771c" />
          </linearGradient>
          <linearGradient id={`${id}-glow`} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ffe57f" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#996515" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.9" />
          </linearGradient>
        </defs>
      ) : null}
      <path d="M100 15 Q112 35 130 20 Q135 42 160 40 Q153 62 175 75 Q158 92 170 115 Q148 122 150 148 Q130 142 120 165 Q102 150 80 165 Q70 142 50 148 Q52 122 30 115 Q42 92 25 75 Q47 62 40 40 Q65 42 70 20 Q88 35 100 15 Z" fill={gold ? `url(#${id}-gold)` : color} stroke={gold ? "#fff2a3" : "rgba(255,255,255,.65)"} strokeWidth="1.5" />
      {gold ? <path d="M100 22 Q110 39 126 26 Q130 45 152 43 Q146 62 165 73 Q150 88 160 108 Q141 114 143 137 Q125 132 117 152 Q101 139 83 152 Q75 132 57 137 Q59 114 40 108 Q50 88 35 73 Q54 62 48 43 Q70 45 74 26 Q90 39 100 22 Z" fill="none" stroke={`url(#${id}-glow)`} strokeWidth="2.5" opacity="0.7" /> : null}
      <path d="M72 100 L90 118 L130 75" fill="none" stroke="#121212" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function UserNameWithCheckmark({ name, checkmarkType, className = "" }: { name: string; checkmarkType?: CheckmarkType | null; className?: string }) {
  return <span className={`nerdd-user-name ${className}`.trim()}><strong>{name}</strong>{checkmarkType ? <Checkmark type={checkmarkType} size={13} /> : null}</span>;
}
