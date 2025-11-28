import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'DateMatch - Trouvez le lieu parfait ensemble',
  description: 'Swipez ensemble pour trouver le restaurant idéal pour votre date',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen">
        <main className="min-h-screen max-w-md mx-auto">
          {children}
        </main>
      </body>
    </html>
  )
}
