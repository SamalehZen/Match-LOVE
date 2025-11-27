import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateRoomCode } from '@/lib/utils'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const code = generateRoomCode()
    const { data: room, error } = await supabase
      .from('rooms')
      .insert({ code, creator_id: user.id })
      .select()
      .single()
    if (error) throw error
    await supabase.from('room_members').insert({ room_id: room.id, user_id: user.id })
    return NextResponse.json({ room })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error' }, { status: 500 })
  }
}
