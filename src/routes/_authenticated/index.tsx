import { createFileRoute } from '@tanstack/react-router'
// import Dashboard from '@/features/dashboard'
import Tasks from '@/features/tasks'


export const Route = createFileRoute('/_authenticated/')({
  component: Tasks,
})
