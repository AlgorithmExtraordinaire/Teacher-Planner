import type { Metadata } from "next";
import { Inter, Source_Serif_4, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

/**
 * The three typefaces of the design system, self-hosted at build time by
 * next/font: no request to fonts.googleapis.com, no flash of fallback text,
 * and the app still renders correctly if Google Fonts is unreachable.
 *
 * Source Serif 4 is loaded as a variable font across 300–600 because the
 * system uses it at 400 (large display), 500 (panel titles and metrics) and
 * in italic as the accent voice — enumerating static weights would ship
 * four files where one variable file does.
 */
const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Teacher & Departmental Planner — Swakopmund Christian Academy",
  description:
    "The academic operations platform of Swakopmund Christian Academy: co-planned lessons, learning analytics, and departmental governance in one workspace.",
};

/**
 * Root layout.
 *
 * There is no theme bootstrap script and no `data-theme` attribute any more.
 * The planner previously shipped three switchable themes; the system now has
 * one, so the colour scheme is a static property of the stylesheet. That
 * removes the inline script that used to run before first paint, and with it
 * the possibility of a flash between the default and the stored theme.
 *
 * `color-scheme: dark` tells the browser to render form controls,
 * scrollbars and the canvas behind an overscroll in dark chrome. Without it
 * a native <select> popup and the scrollbar gutter come back light on a
 * dark ground.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sourceSerif.variable} ${inter.variable} ${plexMono.variable} h-full antialiased`}
      style={{ colorScheme: "dark" }}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
