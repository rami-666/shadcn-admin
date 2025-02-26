import { ColumnDef } from '@tanstack/react-table'
import { Company } from '../data/companies-schema'
import { DataTableColumnHeader } from './data-table-column-header'
import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { IconTrash, IconDownload, IconEye } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useCompanies } from '../context/companies-context'
import { Badge } from '@/components/ui/badge'
import { config } from '@/config/env'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import ReactMarkdown from 'react-markdown'

export const companiesColumns: ColumnDef<Company>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'id',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Company ID' />
    ),
    cell: ({ row }) => <div className='w-[300px]'>{row.getValue('id')}</div>,
    enableSorting: false,
    enableHiding: true,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Name' />
    ),
    cell: ({ row }) => <div className='w-[200px]'>{row.getValue('name')}</div>,
    enableSorting: true,
    enableHiding: false,
  },
  {
    accessorKey: 'domain',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Domain' />
    ),
    cell: ({ row }) => <div className='w-[200px]'>{row.getValue('domain')}</div>,
    enableSorting: true,
    enableHiding: false,
  },
  {
    accessorKey: 'vms',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='VMS' />
    ),
    cell: ({ row }) => {
      const value = row.getValue('vms') as boolean | null
      return (
        <div className='w-[100px]'>
          {value === null ? (
            <Badge variant="outline">Unknown</Badge>
          ) : value ? (
            <Badge variant="default">Yes</Badge>
          ) : (
            <Badge variant="secondary">No</Badge>
          )}
        </div>
      )
    },
    enableSorting: true,
    enableHiding: false,
  },
  {
    accessorKey: 'report_ready',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Report Ready' />
    ),
    cell: ({ row }) => {
      const value = row.getValue('report_ready') as boolean | null
      const [isOpen, setIsOpen] = useState(false)
      const [report, setReport] = useState<{ name: string; domain: string; report: string } | null>(null)
      const [isLoading, setIsLoading] = useState(false)

      const handleViewReport = async () => {
        setIsLoading(true)
        try {
          const response = await fetch(`${config.apiBaseUrl}/api/jobs/company/${row.original.id}/report-content`)
          const data = await response.json()
          if (data.success) {
            setReport(data.company)
            setIsOpen(true)
          }
        } catch (error) {
          console.error('Failed to fetch report:', error)
        } finally {
          setIsLoading(false)
        }
      }

      return (
        <div className='w-[100px]'>
          {value === null ? (
            <Badge variant="outline">Unknown</Badge>
          ) : value ? (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleViewReport}
                disabled={isLoading}
              >
                <IconEye className="h-4 w-4 mr-1" />
                View
              </Button>
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-3xl max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle>Company Report</DialogTitle>
                    <DialogDescription>
                      Report for {report?.name} ({report?.domain})
                    </DialogDescription>
                  </DialogHeader>
                  <ScrollArea className="mt-4 h-full max-h-[60vh] w-full rounded-md border p-4">
                    {report?.report && (
                      <ReactMarkdown className="prose dark:prose-invert">
                        {report.report}
                      </ReactMarkdown>
                    )}
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            </>
          ) : (
            <Badge variant="secondary">No</Badge>
          )}
        </div>
      )
    },
    enableSorting: true,
    enableHiding: false,
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    cell: ({ row }) => {
      const status = row.getValue('status') as string | null
      return (
        <div className='w-[100px]'>
          {status ? (
            <Badge variant={status === 'completed' ? 'default' : 'destructive'}>
              {status}
            </Badge>
          ) : (
            <Badge variant="secondary">Pending</Badge>
          )}
        </div>
      )
    },
    enableSorting: true,
    enableHiding: false,
  },
  {
    accessorKey: 'status_message',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Status Message' />
    ),
    cell: ({ row }) => (
      <div className='w-[300px] truncate' title={row.getValue('status_message') || ''}>
        {row.getValue('status_message') || '-'}
      </div>
    ),
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: 'created_at',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Created At' />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue('created_at'))
      return <div className='w-[150px]'>{date.toLocaleDateString()}</div>
    },
    enableSorting: true,
    enableHiding: false,
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const { setOpen, setCurrentRow } = useCompanies()
      const company = row.original
      
      const handleDownloadReport = () => {
        window.open(`${config.apiBaseUrl}/api/jobs/company/${company.id}/report`, '_blank')
      }

      return (
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              variant='ghost'
              className='flex h-8 w-8 p-0 data-[state=open]:bg-muted'
            >
              <DotsHorizontalIcon className='h-4 w-4' />
              <span className='sr-only'>Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-[160px]'>
            {company.report_ready && (
              <>
                <DropdownMenuItem onClick={handleDownloadReport}>
                  Download Report
                  <DropdownMenuShortcut>
                    <IconDownload size={16} />
                  </DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem
              onClick={() => {
                setCurrentRow(row.original)
                setOpen('delete')
              }}
              className='text-red-600'
            >
              Delete
              <DropdownMenuShortcut>
                <IconTrash size={16} />
              </DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
] 