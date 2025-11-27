import { MatchHistory } from '@/components/match/match-history'

export default function HistoryPage() {
  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold mb-4">Historique</h1>
      <MatchHistory />
    </div>
  )
}
