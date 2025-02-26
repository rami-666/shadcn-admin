import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { io } from 'socket.io-client'
import { useEffect, useRef } from 'react'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Task } from '../data/schema'
import { config } from '@/config/env'
import { useQueryClient } from '@tanstack/react-query'


interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow?: Task
}

const formSchema = z.object({
  jobType: z.string().min(1, 'Job type is required.'),
  name: z.string().min(1, 'Name is required.'),
  csvFile: z.instanceof(File).refine(
    (file) => file.type === 'text/csv' || file.name.endsWith('.csv'),
    {
      message: 'File must be a CSV',
    }
  ),
})

type TasksForm = z.infer<typeof formSchema>

export function TasksMutateDrawer({ open, onOpenChange }: Props) {
  const queryClient = useQueryClient()
  const form = useForm<TasksForm>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      jobType: 'company_lookup',
      name: '',
    },
  })

  // Create a ref for the socket connection
  const socketRef = useRef<any>(null)

  // Cleanup socket connection on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [])

  const subscribeToJob = (jobId: string) => {
    // Initialize socket connection if not exists
    if (!socketRef.current) {
      socketRef.current = io(`${config.apiBaseUrl}`)
    }


    const socket = socketRef.current

    // Subscribe to job updates
    socket.emit('subscribe_to_job', jobId)

    socket.on('job_progress', (data: { progress: number }) => {
      console.log(`Progress: ${data.progress}%`)
      toast({
        title: 'Job Progress',
        description: `${Math.round(data.progress)}%`,
      })
    })

    socket.on('pipeline_job_started', () => {
      console.log("RAMI PIPELINE STARTED")
    })

    socket.on('job_completed', () => {
      console.log('Job completed!')
      toast({
        title: 'Job Completed',
        description: 'Your results are ready for download',
      })
      
      // Open download in new tab
      window.open(`/api/jobs/company-lookup/${jobId}/download`, '_blank')
      
      // Cleanup socket subscription
      unsubscribeFromJob(jobId)
    })

    socket.on('job_failed', (data: { error: string }) => {
      console.error('Job failed:', data.error)
      toast({
        title: 'Job Failed',
        description: data.error,
        variant: 'destructive',
      })
      
      // Cleanup socket subscription
      unsubscribeFromJob(jobId)
    })
  }

  const unsubscribeFromJob = (jobId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('unsubscribe_from_job', jobId)
      socketRef.current.disconnect()
      socketRef.current = null
    }
  }

  const onSubmit = async (data: TasksForm) => {
    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const text = e.target?.result as string
        // Split CSV into lines and remove empty lines
        const lines = text.split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0)
        
        // Remove header row
        const dataLines = lines.slice(1)
        
        let companies
        if (data.jobType === 'vms_check') {
          try {
            companies = dataLines.map(line => {
              const [name, domain] = line.split(',').map(field => field.trim())
              if (!name || !domain) {
                throw new Error('Invalid CSV format: Each row must contain both company name and domain')
              }
              return {
                name,
                domain
              }
            })
          } catch (error) {
            toast({
              title: 'Error',
              description: error instanceof Error ? error.message : 'Invalid CSV format',
              variant: 'destructive',
            })
            return
          }
        } else {
          // For company_lookup, only process the first column (company name)
          companies = dataLines.map(line => ({
            name: line.split(',')[0].trim(), // Only take the first column
            domain: null
          }))
        }

        console.log('Companies:', companies)
        console.log('Job type:', data.jobType)
        console.log('Number of companies:', companies.length)

        // Make POST request to API
        try {
          const response = await fetch(`${config.apiBaseUrl}/api/jobs/company-lookup`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              companies,
              jobType: data.jobType,
              name: data.name
            }),
          })

          if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`)
          }

          const result = await response.json()
          console.log('API Response:', result)

          // Subscribe to job updates via WebSocket
          if (result.jobId) {
            subscribeToJob(result.jobId)
            // Invalidate the tasks query to trigger a refetch
            queryClient.invalidateQueries({ queryKey: ['tasks'] })
          }

          toast({
            title: 'Job submitted successfully',
            description: (
              <pre className='mt-2 w-[340px] rounded-md bg-slate-950 p-4'>
                <code className='text-white'>
                  {JSON.stringify(
                    {
                      fileName: data.csvFile.name,
                      jobType: data.jobType,
                      numberOfCompanies: companies.length,
                      companies: companies.slice(0, 3), // Show first 3 companies in toast
                      jobId: result.jobId
                    },
                    null,
                    2
                  )}
                </code>
              </pre>
            ),
          })
        } catch (apiError) {
          console.error('API Error:', apiError)
          toast({
            title: 'Error',
            description: 'Failed to submit job to the server',
            variant: 'destructive',
          })
          return
        }
      }

      reader.readAsText(data.csvFile)
      onOpenChange(false)
      form.reset()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to process the CSV file',
        variant: 'destructive',
      })
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v)
        form.reset()
      }}
    >
      <SheetContent className='flex flex-col'>
        <SheetHeader className='text-left'>
          <SheetTitle>Upload Companies</SheetTitle>
          <SheetDescription>
            Upload a CSV file containing the list of companies.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            id='tasks-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='space-y-5 flex-1'
          >
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter job name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='jobType'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a job type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="company_lookup">Company Lookup</SelectItem>
                      <SelectItem value="vms_check">VMS Check</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='csvFile'
              render={({ field: { onChange, value, ...field } }) => (
                <FormItem className='space-y-1'>
                  <FormLabel>Upload CSV File</FormLabel>
                  <FormControl>
                    <Input
                      type='file'
                      accept='.csv'
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          onChange(file)
                        }
                      }}
                      required
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <SheetFooter className='gap-2'>
          <SheetClose asChild>
            <Button variant='outline'>Close</Button>
          </SheetClose>
          <Button form='tasks-form' type='submit'>
            Upload
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
