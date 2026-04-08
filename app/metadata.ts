import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Pacific Sunday 2026",
  description: "NFC-enabled fantasy golf platform — Pacific Sunday 2026",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Pacific Sunday",
  },
};

export const viewport: Viewport = {
  themeColor: "#0B1120",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};
