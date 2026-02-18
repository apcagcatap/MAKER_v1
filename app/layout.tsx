import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import { AuthStateListener } from '@/components/auth/auth-state-listener'
import './globals.css'

// Import Poppins font from Google Fonts
import { Poppins } from 'next/font/google'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
})

export const metadata: Metadata = {
 title: {
    template: '%s | MAKER',
    default: 'MAKER - Welcome',  
  },
  description: "The official Maker website application.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} ${poppins.variable}`}>
      <body className="font-sans" style={{ fontFamily: 'Poppins, sans-serif' }}>
        <AuthStateListener />
        {children}
        <Toaster position="bottom-right" />
        <Analytics />
      </body>
    </html>
  )
}