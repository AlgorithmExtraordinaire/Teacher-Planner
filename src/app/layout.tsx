import type { Metadata } from "next";
import { Inter, Poppins, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Self-hosted at build time by next/font: no third-party request, no flash of
// fallback text, and the app still works if Google Fonts is unreachable.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Teacher Planner — SCA",
  description: "Swakopmund Christian Academy teacher planning dashboard",
};

/**
 * Applies the saved theme before first paint.
 *
 * Without this the page renders in the default theme and then snaps to the
 * saved one — a visible flash, and a jarring one when the saved theme is dark.
 * It runs synchronously in <head>, ahead of any content.
 */
const THEME_BOOTSTRAP = `
(function(){
  try {
    var t = localStorage.getItem('tp-theme');
    if (t === 'zen-workspace' || t === 'deep-work' || t === 'lean-academy') {
      document.documentElement.setAttribute('data-theme', t);
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="lean-academy"
      className={`${inter.variable} ${poppins.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
