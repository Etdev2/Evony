import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Evony Scout",
  description: "Alliance monster intelligence and scouting platform",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
