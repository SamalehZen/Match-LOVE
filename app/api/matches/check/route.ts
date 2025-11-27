import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { room_id, round_number } = await request.json() as { room_id: string; round_number: number }
    if (!room_id || !round_number) return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })

    const { data: selections } = await supabase
      .from('selections')
      .select('*')
      .eq('room_id', room_id)
      .eq('round_number', round_number)
      .eq('validated', true)

    if (!selections || selections.length !== 2) return NextResponse.json({ error: 'Both must validate' }, { status: 400 })

    const [sel1, sel2] = selections as Array<{ user_id: string; place_ids: string[] }>
    const common = sel1.place_ids.filter((id) => sel2.place_ids.includes(id))

    if (common.length > 0) {
      const place_id = common[0]
      await supabase.from('matches').insert({ room_id, place_id, round_number, user_ids: [sel1.user_id, sel2.user_id] })
      await supabase.from('rooms').update({ status: 'matched' }).eq('id', room_id)

      const { data: place } = await supabase.from('places').select('*').eq('id', place_id).single()

      for (const uid of [sel1.user_id, sel2.user_id]) {
        await supabase.rpc('create_notification', {
          p_user_id: uid,
          p_type: 'match',
          p_title: 'Match trouvé ! 🎉',
          p_message: `Vous avez trouvé: ${place?.name || 'un lieu'}`,
        } as any)
      }

      return NextResponse.json({ matched: true, place })
    } else {
      for (const pid of [...sel1.place_ids, ...sel2.place_ids]) {
        await supabase.from('burned_places').upsert({ room_id, place_id: pid, round_number }, { onConflict: 'room_id,place_id' })
      }
      await supabase.from('rooms').update({ current_round: round_number + 1, status: 'waiting' }).eq('id', room_id)
      return NextResponse.json({ matched: false })
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error' }, { status: 500 })
  }
}
