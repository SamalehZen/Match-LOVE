import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 via-background to-secondary/10">
      <main className="mx-auto max-w-5xl px-6 py-16 space-y-16">
        <section className="text-center space-y-4">
          <h1 className="text-4xl sm:text-6xl font-bold">RaniyaMatch</h1>
          <p className="text-neutral-600 text-lg">Trouvez le lieu parfait pour vos rendez-vous en couple</p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/register"><Button>Commencer</Button></Link>
            <Link href="/login"><Button variant="outline">Se connecter</Button></Link>
          </div>
        </section>
        <section className="grid md:grid-cols-4 gap-4">
          <div className="rounded-lg border p-6 bg-white">
            <h3 className="font-semibold mb-2">1. Créez une room</h3>
            <p className="text-sm text-neutral-600">Invitez votre partenaire et démarrez un round.</p>
          </div>
          <div className="rounded-lg border p-6 bg-white">
            <h3 className="font-semibold mb-2">2. Sélectionnez des lieux</h3>
            <p className="text-sm text-neutral-600">Chacun choisit jusqu’à 3 lieux.</p>
          </div>
          <div className="rounded-lg border p-6 bg-white">
            <h3 className="font-semibold mb-2">3. Découvrez le match</h3>
            <p className="text-sm text-neutral-600">Comparez vos choix en temps réel.</p>
          </div>
          <div className="rounded-lg border p-6 bg-white">
            <h3 className="font-semibold mb-2">4. Profitez</h3>
            <p className="text-sm text-neutral-600">Planifiez votre rendez-vous facilement.</p>
          </div>
        </section>
      </main>
    </div>
  )
}
