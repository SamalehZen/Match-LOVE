import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json() as { room_id: string; invited_user_id?: string; email?: string }
    let invitedId = body.invited_user_id

    if (!invitedId && body.email) {
      const { data: profile } = await admin.from('profiles').select('id').eq('email', body.email).maybeSingle()
      if (!profile) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })
      invitedId = profile.id
    }

    if (!body.room_id || !invitedId) return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })

    const { data: room } = await supabase.from('rooms').select('*').eq('id', body.room_id).single()
    if (!room) return NextResponse.json({ error: 'Room introuvable' }, { status: 404 })
    if (room.creator_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data: invitation, error } = await supabase
      .from('room_invitations')
      .insert({ room_id: body.room_id, inviter_id: user.id, invited_user_id: invitedId })
      .select()
      .single()
    if (error) throw error

    await supabase.rpc('create_notification', {
      p_user_id: invitedId,
      p_type: 'invitation',
      p_title: 'Invitation à rejoindre une room',
      p_message: 'Votre partenaire vous a invité à une room RaniyaMatch',
      p_data: { room_id: body.room_id },
    } as any)

    return NextResponse.json({ invitation })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error' }, { status: 500 })
  }
}
