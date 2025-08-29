import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { Analytics } from "@vercel/analytics/next"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "WeSplit - Split Expenses Easily",
  description: "Simple and elegant expense splitting app. Create groups, add expenses, and track who owes what.",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" sizes="32x32" href="/payment32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/payment16.png" />
      </head>
      <body className={inter.className}>
        {children}
        <Toaster />
        <Analytics/>
      </body>
    </html>
  )
}
