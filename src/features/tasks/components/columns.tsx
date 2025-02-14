import { ColumnDef } from '@tanstack/react-table'
import { statuses, tags } from '../data/data'
import { Task } from '../data/schema'
import { DataTableColumnHeader } from './data-table-column-header'
import { DataTableRowActions } from './data-table-row-actions'
import { Link } from '@tanstack/react-router'
import { IconListDetails } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'

export const columns: ColumnDef<Task>[] = [
  {
    id: 'actions',
    header: () => <div className="w-[30px]" />,
    cell: ({ row }) => (
      <Link
        to="/tasks/$jobId"
        params={{ jobId: row.original.id }}
        className="block w-[30px]"
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="View Companies"
        >
          <IconListDetails className="h-4 w-4" />
        </Button>
      </Link>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'id',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Job ID' />
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
    cell: ({ row }) => (
      <div className='w-[200px]'>
        <Link
          to="/tasks/$jobId"
          params={{ jobId: row.original.id }}
          className="text-blue-600 hover:underline"
        >
          {row.getValue('name')}
        </Link>
      </div>
    ),
    enableSorting: true,
    enableHiding: false,
  },
  {
    accessorKey: 'total_companies',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Total' />
    ),
    cell: ({ row }) => <div className='w-[10px]'>{row.getValue('total_companies')}</div>,
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'processed_companies',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Processed' />
    ),
    cell: ({ row }) => <div className='w-[10px]'>{row.getValue('processed_companies')}</div>,
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'tag',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Tag' />
    ),
    cell: ({ row }) => {
      const tag = tags.find(
        (tag) => tag.value === row.getValue('tag')
      )

      if (!tag) {
        return <div className='w-[100px]'>-</div>
      }

      return (
        <div className='flex w-[100px] items-center'>
          {tag.icon && (
            <tag.icon className='mr-2 h-4 w-4 text-muted-foreground' />
          )}
          <span>{tag.label}</span>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    cell: ({ row }) => {
      const status = statuses.find(
        (status) => status.value === row.getValue('status')
      )

      if (!status) {
        return null
      }

      return (
        <div className='flex w-[100px] items-center'>
          {status.icon && (
            <status.icon className='mr-2 h-4 w-4 text-muted-foreground' />
          )}
          <span>{status.label}</span>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: 'created_at',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Created At' />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue('created_at'))
      return <div className='w-[80px]'>{date.toLocaleDateString()}</div>
    },
    enableSorting: true,
    enableHiding: false,
  },
  {
    id: 'actions',
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
]
