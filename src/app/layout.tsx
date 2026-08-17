import type { Metadata } from "next";
import "./globals.css";
import "@/components/social/social-enhancer.css";
import "@/components/social/social-enhancer-overrides.css";
import RouteTransitionSkeleton from "@/components/ui/RouteTransitionSkeleton";
import PageSkeleton from "@/components/ui/PageSkeleton";

export const metadata: Metadata = {
  title: "Nerddings — A Network for People Building Things",
  description:
    "Nerddings is a social network for students, developers, creators, founders, and organizations to share projects, discover people and ideas, connect with their network, explore events, and find opportunities.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <PageSkeleton />
        <RouteTransitionSkeleton />
      </body>
    </html>
  );
}
