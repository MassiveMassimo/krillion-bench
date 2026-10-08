import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Stack_Sans_Text } from "next/font/google";
import { MotionProvider } from "@/components/motion-provider";
import { fontWeights } from "@/lib/font-weight";
import "./globals.css";

const stackSansText = Stack_Sans_Text({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-stack-sans-text",
});

export const metadata: Metadata = {
  title: "Krillion Bench",
  description: "General knowledge benchmark results for LLMs on Krillion.io.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={stackSansText.variable}>
      <body style={{ fontVariationSettings: fontWeights.normal }}>
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
