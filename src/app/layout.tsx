import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { SmoothScrollProvider } from "@/components/Providers/SmoothScrollProvider";
import { HeaderWrapper } from "@/components/layout/HeaderWrapper";
import AuthDebug from "@/components/debug/AuthDebug";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "LeadFlow - AI-Powered Lead Generation",
  description: "Complete end-to-end solution for lead generation. Discover, verify, and convert prospects into meetings with our AI-powered automation platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased" suppressHydrationWarning={true}>
        <SmoothScrollProvider>
          <AuthProvider>
            <HeaderWrapper />
            {children}
            <AuthDebug />
          </AuthProvider>
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
