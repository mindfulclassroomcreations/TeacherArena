import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TPT Product Idea Automation",
  description: "Automate research and organization of Teachers Pay Teachers product ideas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
