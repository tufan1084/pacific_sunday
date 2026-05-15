import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Pacific Sunday 2026",
  description: "NFC-enabled fantasy golf platform — Pacific Sunday 2026",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Pacific Sunday",
    startupImage: "/data/LOGO-PHOTO.png",
  },
  icons: {
    icon: [
      { url: "/data/LOGO-PHOTO.png", type: "image/png" },
    ],
    apple: "/data/LOGO-PHOTO.png",
    shortcut: "/data/LOGO-PHOTO.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#060D1F",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  // Soft keyboard shrinks the layout viewport instead of scrolling the page,
  // so the chat header stays put on mobile.
  interactiveWidget: "resizes-content",
};
