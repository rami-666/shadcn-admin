import {
  IconArrowDown,
  IconArrowRight,
  IconArrowUp,
  // IconCircle,
  IconCircleCheck,
  // IconCircleX,
  IconExclamationCircle,
  IconStopwatch,
  IconSearch,
  IconBuildingSkyscraper,
  IconDatabase,
} from '@tabler/icons-react'

export const labels = [
  {
    value: 'bug',
    label: 'Bug',
  },
  {
    value: 'feature',
    label: 'Feature',
  },
  {
    value: 'documentation',
    label: 'Documentation',
  },
]

export const statuses = [
  {
    value: 'processing',
    label: 'Processing',
    icon: IconStopwatch,
  },
  {
    value: 'pending',
    label: 'Pending',
    icon: IconStopwatch,
  },
  {
    value: 'completed',
    label: 'Completed',
    icon: IconCircleCheck,
  },
  {
    value: 'failed',
    label: 'Failed',
    icon: IconExclamationCircle,
  },
  {
    value: 'stalled',
    label: 'Stalled',
    icon: IconExclamationCircle,
  },


]

export const priorities = [
  {
    label: 'Low',
    value: 'low',
    icon: IconArrowDown,
  },
  {
    label: 'Medium',
    value: 'medium',
    icon: IconArrowRight,
  },
  {
    label: 'High',
    value: 'high',
    icon: IconArrowUp,
  },
]

export const tags = [
  {
    value: 'company_lookup',
    label: 'Company Lookup',
    icon: IconBuildingSkyscraper,
  },
  {
    value: 'data_enrichment',
    label: 'Data Enrichment',
    icon: IconDatabase,
  },
  {
    value: 'search_index',
    label: 'Search Index',
    icon: IconSearch,
  },
  {
    value: 'vms_check',
    label: 'VMS Check',
    icon: IconBuildingSkyscraper,
  },
]
