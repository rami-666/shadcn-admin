import { toast } from '@/hooks/use-toast'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { useCompanies } from '../context/companies-context'
import { useParams } from '@tanstack/react-router'
import { config } from '@/config/env'

export function CompaniesDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useCompanies()
  const { jobId } = useParams({ from: '/_authenticated/tasks/$jobId' })

  const handleDelete = async () => {
    if (!currentRow) return

    try {
      const response = await fetch(`${config.apiBaseUrl}/api/jobs/company-lookup/${jobId}/companies/${currentRow.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete company')
      }

      toast({
        title: 'Success',
        description: 'Company deleted successfully',
      })

      // Close the dialog and reset state
      setOpen(null)
      setTimeout(() => {
        setCurrentRow(null)
      }, 500)

      // Refresh the page to update the table
      window.location.reload()
    } catch (error) {
      console.error('Delete error:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete company',
        variant: 'destructive',
      })
    }
  }

  return (
    <>
      {currentRow && (
        <ConfirmDialog
          key='company-delete'
          destructive
          open={open === 'delete'}
          onOpenChange={() => {
            setOpen('delete')
            setTimeout(() => {
              setCurrentRow(null)
            }, 500)
          }}
          handleConfirm={handleDelete}
          className='max-w-md'
          title={`Delete Company: ${currentRow.name}`}
          desc={
            <>
              You are about to delete the company <strong>{currentRow.name}</strong>. <br />
              This action cannot be undone.
            </>
          }
          confirmText='Delete'
        />
      )}
    </>
  )
} 