import "./globals.css";
import type { Metadata } from "next";
import Shell from "@/components/Shell";

export const metadata: Metadata = { title: "LP QA Dashboard", description: "IC landing-page QA results" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="https://www.ic.com/ICM_Favicon.ico"></link>
      </head>
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
