import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Système d\'Irrigation - Réseaux de Petri',
  description: 'Simulation d\'un système d\'irrigation basé sur les réseaux de Petri',
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