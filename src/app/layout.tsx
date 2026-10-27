import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sign In - Flowtake Secure Email OTP Authentication",
  description:
    "Secure passwordless email OTP authentication system for Flowtake. Integrates seamlessly with Firebase Authentication and the Flowtake Flutter application.",
  keywords: ["Flowtake", "OTP", "Firebase", "Authentication", "Passwordless", "Flutter"],
  authors: [{ name: "Flowtake Team" }],
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} dark`}>
      <body className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#090b10] dark:text-slate-100 antialiased selection:bg-indigo-500 selection:text-white font-sans transition-colors duration-300">
        {children}
      </body>
    </html>
  );
}
