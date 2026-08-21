"use client";

import { VerifiedMark } from "@/components/ui/Avatar";

interface VerifiedNameProps {
  name: string;
  username?: string;
  verified?: boolean;
}

/**
 * Renders a user name with an inline gold verified badge when `verified` is true.
 * Use this component everywhere a username is displayed to ensure consistent badge rendering.
 */
export default function VerifiedName({ name, verified }: VerifiedNameProps) {
  return (
    <strong style={{ display: "inline-flex", alignItems: "center", gap: "2px", fontSize: "inherit", fontWeight: "inherit" }}>
      {name}
      {verified && <VerifiedMark />}
    </strong>
  );
}
