import type React from "react"
import type { Metadata } from "next"
import { Space_Grotesk, DM_Sans } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/auth-context"
import "./globals.css"

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-space-grotesk",
})

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm-sans",
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
    <html lang="en" suppressHydrationWarning className={`${spaceGrotesk.variable} ${dmSans.variable}`}>
      <head>
        <style>{`
html {
  font-family: ${dmSans.style.fontFamily};
  --font-heading: ${spaceGrotesk.variable};
  --font-body: ${dmSans.variable};
}
        `}</style>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined') {
                window.MonacoEnvironment = {
                  getWorkerUrl: function (moduleId, label) {
                    if (label === 'json') {
                      return 'data:text/javascript;charset=utf-8,' + encodeURIComponent('self.MonacoEnvironment = { baseUrl: "/" }; importScripts("/monaco-editor/min/vs/language/json/json.worker.js");');
                    }
                    if (label === 'css' || label === 'scss' || label === 'less') {
                      return 'data:text/javascript;charset=utf-8,' + encodeURIComponent('self.MonacoEnvironment = { baseUrl: "/" }; importScripts("/monaco-editor/min/vs/language/css/css.worker.js");');
                    }
                    if (label === 'html' || label === 'handlebars' || label === 'razor') {
                      return 'data:text/javascript;charset=utf-8,' + encodeURIComponent('self.MonacoEnvironment = { baseUrl: "/" }; importScripts("/monaco-editor/min/vs/language/html/html.worker.js");');
                    }
                    if (label === 'typescript' || label === 'javascript') {
                      return 'data:text/javascript;charset=utf-8,' + encodeURIComponent('self.MonacoEnvironment = { baseUrl: "/" }; importScripts("/monaco-editor/min/vs/language/typescript/ts.worker.js");');
                    }
                    return 'data:text/javascript;charset=utf-8,' + encodeURIComponent('self.MonacoEnvironment = { baseUrl: "/" }; importScripts("/monaco-editor/min/vs/editor/editor.worker.js");');
                  }
                };
              }
            `,
          }}
        />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
