import { createLazyFileRoute } from '@tanstack/react-router'
import CompaniesPage from '@/features/tasks/components/companies-page'

export const Route = createLazyFileRoute('/_authenticated/tasks/$jobId')({
  component: CompaniesPage,
}) 