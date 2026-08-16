import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ComingSoonProvider } from "@/components/ui/coming-soon-toast";
import { AuthProvider } from "@/components/providers/session-provider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "CrediBridge | Explainable Micro-Credit Scoring",
  description: "Turning real financial behaviour into explainable credit access for gig and informal-sector workers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased min-h-screen flex flex-col`}>
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ComingSoonProvider>
              <Navbar />
              <main className="flex-1 mt-16">
                {children}
              </main>
              <Footer />
            </ComingSoonProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
