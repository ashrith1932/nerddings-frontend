import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nerdding — build in public",
  description: "The social network for people building the future.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
