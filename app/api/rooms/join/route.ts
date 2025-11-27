import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { code } = await request.json() as { code: string }
    if (!code) return NextResponse.json({ error: 'Code requis' }, { status: 400 })
    const { data: room } = await supabase.from('rooms').select('*').eq('code', code).maybeSingle()
    if (!room) return NextResponse.json({ error: 'Room introuvable' }, { status: 404 })
    await supabase.from('room_members').upsert({ room_id: room.id, user_id: user.id }, { onConflict: 'room_id,user_id' })
    return NextResponse.json({ room })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error' }, { status: 500 })
  }
}
