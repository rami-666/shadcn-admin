import { useParams, Link } from '@tanstack/react-router'
import { useQuery, useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { IconArrowLeft } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { config } from '@/config/env'
import { companiesResponseSchema } from '../data/companies-schema'
import { DataTable } from './data-table'
import { companiesColumns } from './companies-columns'
import CompaniesProvider from '../context/companies-context'
import { CompaniesDialogs } from './companies-dialogs'
import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { RowSelectionState } from '@tanstack/react-table'
import { EnrichmentProgress } from './enrichment-progress'

export default function CompaniesPage() {
  const { jobId } = useParams({ from: '/_authenticated/tasks/$jobId' })
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [showProgress, setShowProgress] = useState(false)
  const [enrichmentJobId, setEnrichmentJobId] = useState<string>()
  const { toast } = useToast()

  const { data: jobDetails } = useQuery({
    queryKey: ['job', jobId],
    queryFn: async () => {
      const response = await axios.get(`${config.apiBaseUrl}/api/jobs/${jobId}`)
      return response?.data?.job
    }
  })

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['companies', jobId],
    queryFn: async () => {
      const response = await axios.get(`${config.apiBaseUrl}/api/jobs/company-lookup/${jobId}/companies`)
      return companiesResponseSchema.parse(response.data)
    }
  })

  const enrichMutation = useMutation({
    mutationFn: async (companyIds: string[]) => {
      const response = await axios.post(`${config.apiBaseUrl}/api/jobs/process-companies`, {
        companyIds,
        name: `Enrich ${jobDetails?.name}`
      })
      return response.data
    },
    onSuccess: (data) => {
      console.log("Enrichment job created:", data)
      setEnrichmentJobId(data.jobId)
      setShowProgress(true)
      setRowSelection({})
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to start companies enrichment process",
        variant: "destructive",
      })
    }
  })

  const handleEnrichCompanies = () => {
    const selectedCompanies = data?.companies
      .filter((_, index) => rowSelection[index])
      .map(company => company.id)

    if (!selectedCompanies?.length) {
      toast({
        title: "Warning",
        description: "Please select at least one company to enrich",
        variant: "destructive",
      })
      return
    }

    enrichMutation.mutate(selectedCompanies)
  }

  const handleEnrichmentComplete = () => {
    toast({
      title: "Success",
      description: "Companies enrichment process completed successfully",
    })
    setShowProgress(false)
    setEnrichmentJobId(undefined)
    refetch()
  }

  const handleEnrichmentError = () => {
    toast({
      title: "Error",
      description: "Companies enrichment process failed",
      variant: "destructive",
    })
    setShowProgress(false)
    setEnrichmentJobId(undefined)
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <CompaniesProvider>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/tasks">
              <Button variant="outline" size="sm" className="gap-2">
                <IconArrowLeft className="h-4 w-4" />
                Back to Jobs
              </Button>
            </Link>
           
            <h2 className="text-3xl font-bold tracking-tight">Companies for Job '{jobDetails?.name || jobId}'</h2>
          </div>
          <Button 
            onClick={handleEnrichCompanies}
            disabled={enrichMutation.isPending || Object.keys(rowSelection).length === 0}
          >
            {enrichMutation.isPending ? "Processing..." : "Enrich Companies"}
          </Button>
        </div>

        {showProgress && enrichmentJobId && (
          <div className="max-w-xl">
            <EnrichmentProgress 
              jobId={enrichmentJobId}
              onComplete={handleEnrichmentComplete}
              onError={handleEnrichmentError}
            />
          </div>
        )}

        <div className="space-y-4">
          <DataTable
            data={data?.companies || []}
            columns={companiesColumns}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
          />
        </div>
      </div>
      <CompaniesDialogs />
    </CompaniesProvider>
  )
} 