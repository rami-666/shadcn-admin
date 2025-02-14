import { z } from 'zod'

export const companySchema = z.object({
  id: z.string(),
  name: z.string(),
  domain: z.string(),
  vms: z.boolean().nullable(),
  report_ready: z.boolean().nullable(),
  status: z.enum(['completed', 'failed']).nullable(),
  status_message: z.string().nullable(),
  created_at: z.string()
})

export type Company = z.infer<typeof companySchema>

export const companiesResponseSchema = z.object({
  success: z.boolean(),
  jobId: z.string(),
  totalCompanies: z.number(),
  companies: z.array(companySchema)
})

export type CompaniesResponse = z.infer<typeof companiesResponseSchema> 