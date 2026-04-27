import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/auth-context"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "AI Chatbot - Your Intelligent Conversation Partner",
  description:
    "Experience the future of AI conversation with our advanced chatbot featuring voice input, translation, and file upload capabilities.",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <head>
        <style>{`
html {
  font-family: ${inter.style.fontFamily};
  --font-heading: var(--font-inter);
  --font-body: var(--font-inter);
}
        `}</style>
        {/* Monaco Environment script removed */}
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark" disableTransitionOnChange>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
