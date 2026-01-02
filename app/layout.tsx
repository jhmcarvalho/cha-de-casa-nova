import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Chá de Casa Nova - Jeferson',
  description: 'Lista de presentes para o chá de casa nova',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}

