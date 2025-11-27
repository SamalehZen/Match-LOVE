import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RoomInvitationsDialog } from '@/components/room/room-invitations-dialog'

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-5xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Tableau de bord</h1>
        <RoomInvitationsDialog />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <div className="font-medium">Créer une room</div>
              <div className="text-sm text-neutral-600">Démarrez une nouvelle session privée</div>
            </div>
            <Link href="/room/create"><Button>Créer</Button></Link>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <div className="font-medium">Rejoindre une room</div>
              <div className="text-sm text-neutral-600">Entrez un code et rejoignez</div>
            </div>
            <Link href="/room/join"><Button variant="outline">Rejoindre</Button></Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
