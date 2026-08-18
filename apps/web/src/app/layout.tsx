import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TrailWrapped — Your year on the trail",
  description: "Free, open-source year-in-review for your outdoor activities.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
