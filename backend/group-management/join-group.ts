import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { supabase } from '../supabase'

serve(async (req: { json: () => PromiseLike<{ group_id: any; join_code: any }> | { group_id: any; join_code: any } }) => {
  const { group_id, join_code } = await req.json()
  const user = (await supabase.auth.getUser()).data.user

  const groupRes = await supabase.from('groups').select('*').eq('id', group_id).single()
  if (!groupRes.data) return new Response('Group not found', { status: 404 })

  const group = groupRes.data

  if (!group.is_public && group.join_code !== join_code)
    return new Response('Invalid code', { status: 401 })

  if (!user) return new Response('User not authenticated', { status: 401 })

  const exists = await supabase.from('group_members').select('*', { count: 'exact' })
    .match({ group_id, user_id: user.id })
  if ((exists.count || 0) > 0)
    return new Response('Already joined', { status: 200 })

  await supabase.from('group_members').insert({ group_id, user_id: user.id })
  return new Response('Joined group', { status: 200 })
})