import { ArrowUpRight } from "lucide-react";

export function SectionHeading({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: string }) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h2>{title}</h2>
      </div>
      {action && <button className="text-button">{action}<ArrowUpRight size={14} /></button>}
    </div>
  );
}
