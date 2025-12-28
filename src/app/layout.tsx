import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Golden Friends',
  description: 'Family Feud style party game for friends',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
