import type { Place } from '@/types/place.types'

export function PlaceCard({ place, selected, burned, onToggle }: {
  place: Place
  selected: boolean
  burned: boolean
  onToggle: (id: string) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(place.id)}
      disabled={burned}
      className={`text-left rounded-lg border p-3 bg-white hover:bg-black/5 transition ${burned ? 'opacity-50 cursor-not-allowed' : ''} ${selected ? 'ring-2 ring-black' : ''}`}
    >
      {place.photos?.[0] && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={place.photos[0]} alt={place.name} className="w-full h-32 object-cover rounded-md mb-2" />
      )}
      <div className="font-medium">{place.name}</div>
      {place.address && <div className="text-xs text-neutral-600">{place.address}</div>}
      <div className="flex items-center gap-2 text-xs mt-1">
        {place.type && <span className="px-2 py-0.5 rounded bg-neutral-100">{place.type}</span>}
        {place.rating && <span>⭐ {place.rating} ({place.total_ratings || 0})</span>}
      </div>
      {selected && <div className="mt-2 text-xs font-medium text-green-600">Sélectionné</div>}
      {burned && <div className="mt-2 text-xs font-medium text-red-600">Grillé</div>}
    </button>
  )
}
