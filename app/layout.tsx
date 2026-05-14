"use client";

import { Inter, Poppins } from "next/font/google";
import { usePathname } from "next/navigation";
import "./globals.css";
import AppShell from "@/app/components/layout/AppShell";
import ServiceWorkerRegistrar from "@/app/components/ui/ServiceWorkerRegistrar";
import InstallPrompt from "@/app/components/ui/InstallPrompt";
import { AuthProvider } from "@/app/context/AuthContext";
import { ToastProvider } from "@/app/context/ToastContext";
import { ConfirmProvider } from "@/app/context/ConfirmContext";
import { NotificationProvider } from "@/app/context/NotificationContext";

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
  const isStandalonePage = pathname === "/n" || pathname === "/login" || pathname?.startsWith("/post/");

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
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" type="image/png" href="/data/LOGO-PHOTO.png" />
        <link rel="shortcut icon" type="image/png" href="/data/LOGO-PHOTO.png" />
        <link rel="apple-touch-icon" href="/data/LOGO-PHOTO.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Pacific Sunday" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#020617" />
      </head>
      <body className="h-full antialiased" style={{ fontFamily: "var(--font-poppins), sans-serif" }}>
        <AuthProvider>
          <ToastProvider>
            <ConfirmProvider>
              <NotificationProvider>
                <ServiceWorkerRegistrar />
                <InstallPrompt />
                <LayoutContent>{children}</LayoutContent>
              </NotificationProvider>
            </ConfirmProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
