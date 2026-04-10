"use client";

import { Inter, Poppins } from "next/font/google";
import { usePathname } from "next/navigation";
import "./globals.css";
import AppShell from "@/app/components/layout/AppShell";
import ServiceWorkerRegistrar from "@/app/components/ui/ServiceWorkerRegistrar";
import InstallPrompt from "@/app/components/ui/InstallPrompt";
import { AuthProvider } from "@/app/context/AuthContext";
import { ToastProvider } from "@/app/context/ToastContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isStandalonePage = pathname === "/n" || pathname === "/login";

  if (isStandalonePage) {
    return <>{children}</>;
  }

  return <AppShell>{children}</AppShell>;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable} h-full`}>
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />
      </head>
      <body className="h-full antialiased" style={{ fontFamily: "var(--font-poppins), sans-serif" }}>
        <AuthProvider>
          <ToastProvider>
            <ServiceWorkerRegistrar />
            <InstallPrompt />
            <LayoutContent>{children}</LayoutContent>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
