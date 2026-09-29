import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required')
  }
  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function getAuthenticatedStudent(request?: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) throw new Error('Supabase public environment variables are required')

  const cookieStore = await cookies()
  const authClient = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (values) => {
        try {
          values.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Route handlers can read auth cookies even when the response cannot mutate them.
        }
      },
    },
  })

  const bearer = request?.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  const { data: authData, error: authError } = bearer
    ? await authClient.auth.getUser(bearer)
    : await authClient.auth.getUser()
  if (authError || !authData.user) return null

  const admin = getSupabaseServerClient()
  const { data: user, error: userError } = await admin.from('users').select('id,role').eq('auth_user_id', authData.user.id).single()
  if (userError || !user || user.role !== 'student') return null
  const { data: student, error: studentError } = await admin.from('students').select('id,user_id').eq('user_id', user.id).single()
  if (studentError || !student) return null
  return { authUser: authData.user, user, student, admin }
}
