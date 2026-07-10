import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist, Inter } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";
import { cn } from "~/lib/utils";
import { TooltipProvider } from "~/components/ui/tooltip";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Drawing Demo",
  description: "Drawing Demo",
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={cn(geist.variable, "font-sans", inter.variable)}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark')
                } else {
                  document.documentElement.classList.remove('dark')
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body>
        <svg className="absolute" style={{ height: 0, width: 0 }}>
          <filter
            id="protanopia-correct"
            colorInterpolationFilters="linearRGB"
          >
            <feColorMatrix
              type="matrix"
              values="
              1.00000  0.00000  0.00000 0 0
             -0.25500  1.25500  0.00000 0 0
              0.30333 -0.54500  1.24167 0 0
              0        0        0       1 0"
            />
          </filter>

          <filter
            id="deuteranopia-correct"
            colorInterpolationFilters="linearRGB"
          >
            <feColorMatrix
              type="matrix"
              values="
              1.00000  0.00000  0.00000 0 0
             -0.43750  1.43750  0.00000 0 0
              0.26250 -0.56250  1.30000 0 0
              0        0        0       1 0"
            />
          </filter>

          <filter
            id="tritanopia-correct"
            colorInterpolationFilters="linearRGB"
          >
            <feColorMatrix
              type="matrix"
              values="
              1.00000  0.00000  0.00000 0 0
              0.03500  1.53167 -0.56667 0 0
              0.03500 -0.51000  1.47500 0 0
              0        0        0       1 0"
            />
          </filter>
        </svg>
        <TRPCReactProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
