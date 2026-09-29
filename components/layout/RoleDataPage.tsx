import { RoleDataBoundary } from '@/components/layout/RoleShell'

export function RoleDataPage({ role, title, description }: { role: 'teacher' | 'admin'; title: string; description: string }) {
  return <RoleDataBoundary role={role} title={title} description={description} />
}
