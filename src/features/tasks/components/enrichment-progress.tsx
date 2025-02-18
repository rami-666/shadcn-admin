import { useEffect, useState, useRef } from 'react'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { config } from '@/config/env'
import io from 'socket.io-client'
import { AlertCircle } from 'lucide-react'

interface EnrichmentProgressProps {
  jobId: string
  onComplete?: () => void
  onError?: () => void
}

interface QueueProgress {
  processedCount: number
  totalCompanies: number
  progress: number
  skippedCount: number
  failedCount: number
}

type QueueProgressMap = {
  'url-validation-queue': QueueProgress
  'web-scraping-queue': QueueProgress
  'vms-check-queue': QueueProgress
  'report-generation-queue': QueueProgress
}

export function EnrichmentProgress({ jobId, onComplete, onError }: EnrichmentProgressProps) {
  const [queueProgress, setQueueProgress] = useState<QueueProgressMap>({
    'url-validation-queue': { processedCount: 0, totalCompanies: 0, progress: 0, skippedCount: 0, failedCount: 0 },
    'web-scraping-queue': { processedCount: 0, totalCompanies: 0, progress: 0, skippedCount: 0, failedCount: 0 },
    'vms-check-queue': { processedCount: 0, totalCompanies: 0, progress: 0, skippedCount: 0, failedCount: 0 },
    'report-generation-queue': { processedCount: 0, totalCompanies: 0, progress: 0, skippedCount: 0, failedCount: 0 }
  })
  const [currentQueue, setCurrentQueue] = useState('')
  const [status, setStatus] = useState<'waiting' | 'processing' | 'completed' | 'failed'>('waiting')
  const [socketConnected, setSocketConnected] = useState(false)
  const socketRef = useRef<any>(null)

  useEffect(() => {
    try {
      if (!socketRef.current) {
        socketRef.current = io(`${config.apiBaseUrl}`)
        console.log("Attempting socket connection to:", config.apiBaseUrl)
      }

      const socket = socketRef.current

      socket.on('connect', () => {
        console.log("Socket connected successfully")
        setSocketConnected(true)
        socket.emit('join', `${jobId}`)
        console.log("Joined room:", `job:${jobId}`)
      })

      socket.on('connect_error', (error: Error) => {
        console.error("Socket connection error:", error)
        setSocketConnected(false)
      })

      socket.on('pipeline_progress', (data: { 
        queueName: keyof QueueProgressMap, 
        processedCount: number, 
        totalCompanies: number,
        skippedCount?: number
      }) => {
        console.log("[Debug] Raw pipeline_progress event received:", data)

        if (!data || typeof data !== 'object') {
          console.error("Invalid pipeline_progress data received:", data)
          return
        }

        const { queueName, processedCount, totalCompanies, skippedCount = 0 } = data
        
        if (!queueName || processedCount === undefined || !totalCompanies) {
          console.error("Missing required data in pipeline_progress event")
          return
        }

        setQueueProgress(prev => {
          // Calculate total skipped and failed companies across all queues
          const totalSkippedCompanies = Object.values(prev).reduce((total, queue) => total + queue.skippedCount, 0) + skippedCount - (prev[queueName].skippedCount || 0)
          const totalFailedCompanies = Object.values(prev).reduce((total, queue) => total + queue.failedCount, 0)
          const effectiveTotalCompanies = totalCompanies - totalSkippedCompanies - totalFailedCompanies

          // If no companies left to process, set all queues to 100% and status to failed
          if (effectiveTotalCompanies <= 0) {
            const completedState = Object.fromEntries(
              Object.entries(prev).map(([key, value]) => [
                key,
                {
                  ...value,
                  progress: 100,
                  skippedCount: key === queueName ? skippedCount : value.skippedCount,
                  failedCount: value.failedCount
                }
              ])
            ) as QueueProgressMap
            setStatus('failed')
            onError?.()
            return completedState
          }

          const newState = {
            ...prev,
            [queueName]: {
              ...prev[queueName],
              processedCount,
              totalCompanies,
              progress: Math.min(Math.floor((processedCount / effectiveTotalCompanies) * 100), 100),
              skippedCount,
              failedCount: prev[queueName].failedCount
            }
          }

          // If VMS check queue reaches 100%, set status to completed
          if (queueName === 'vms-check-queue' && 
              Math.min(Math.floor((processedCount / effectiveTotalCompanies) * 100), 100) === 100) {
            setStatus('completed')
            onComplete?.()
          }

          return newState
        })
        
        setCurrentQueue(queueName)
        if (status !== 'completed' && status !== 'failed') {
          setStatus('processing')
        }
      })

      socket.on('pipeline_job_failed', (data: { 
        jobId: string,
        queueName: keyof QueueProgressMap,
        error: string,
        processedCount: number,
        totalCompanies: number
      }) => {
        console.error("Job failed:", data.error)
        
        setQueueProgress(prev => {
          const totalSkippedCompanies = Object.values(prev).reduce((total, queue) => total + queue.skippedCount, 0)
          const totalFailedCompanies = Object.values(prev).reduce((total, queue) => total + queue.failedCount, 0) + 1
          const effectiveTotalCompanies = data.totalCompanies - totalSkippedCompanies - totalFailedCompanies

          // If no companies left to process, set all queues to 100% and status to failed
          if (effectiveTotalCompanies <= 0) {
            const completedState = Object.fromEntries(
              Object.entries(prev).map(([key, value]) => [
                key,
                {
                  ...value,
                  progress: 100,
                  failedCount: key === data.queueName ? value.failedCount + 1 : value.failedCount,
                  skippedCount: value.skippedCount,
                  processedCount: data.processedCount,
                  totalCompanies: data.totalCompanies
                }
              ])
            ) as QueueProgressMap
            setStatus('failed')
            onError?.()
            return completedState
          }

          return {
            ...prev,
            [data.queueName]: {
              ...prev[data.queueName],
              processedCount: data.processedCount,
              totalCompanies: data.totalCompanies,
              progress: Math.min(Math.floor((data.processedCount / effectiveTotalCompanies) * 100), 100),
              failedCount: prev[data.queueName].failedCount + 1,
              skippedCount: prev[data.queueName].skippedCount
            }
          }
        })

        if (status !== 'completed') {
          setStatus('failed')
          onError?.()
        }
      })

      socket.on('disconnect', (reason: string) => {
        console.log("Socket disconnected:", reason)
        setSocketConnected(false)
      })

    } catch (error) {
      console.error("Socket connection error:", error)
    }

    return () => {
      if (socketRef.current) {
        console.log("Cleaning up socket connection")
        const socket = socketRef.current
        socket.emit('leave', `job:${jobId}`)
        socket.disconnect()
        socketRef.current = null
      }
    }
  }, [jobId, onComplete, onError])

  useEffect(() => {
    console.log("Socket connected:", socketConnected)
  }, [socketConnected])

  const getQueueDisplay = (queue: string) => {
    switch (queue) {
      case 'url-validation-queue':
        return 'Validating URLs'
      case 'web-scraping-queue':
        return 'Scraping Websites'
      case 'vms-check-queue':
        return 'Checking VMS'
      case 'report-generation-queue':
        return 'Generating Reports'
      default:
        return 'Processing'
    }
  }

  const getStatusBadge = () => {
    switch (status) {
      case 'waiting':
        return <Badge variant="secondary">Waiting</Badge>
      case 'processing':
        return <Badge variant="default">Processing</Badge>
      case 'completed':
        return <Badge variant="default">Completed</Badge>
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
    }
  }

  const queueOrder: (keyof QueueProgressMap)[] = [
    'url-validation-queue',
    'web-scraping-queue',
    'report-generation-queue',
    'vms-check-queue'
  ]

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">
            Enrichment Progress
          </CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {queueOrder.map((queue) => (
            <div key={queue} className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{getQueueDisplay(queue)}</span>
                <span>{queueProgress[queue].progress}%</span>
              </div>
              <Progress value={queueProgress[queue].progress} className="h-2" />
              <div className="flex flex-col gap-1">
                {queueProgress[queue].skippedCount > 0 && (
                  <div className="flex items-center gap-1 text-xs text-yellow-500">
                    <AlertCircle className="h-3 w-3" />
                    <span>{queueProgress[queue].skippedCount} companies skipped</span>
                  </div>
                )}
                {queueProgress[queue].failedCount > 0 && (
                  <div className="flex items-center gap-1 text-xs text-destructive">
                    <AlertCircle className="h-3 w-3" />
                    <span>{queueProgress[queue].failedCount} companies failed</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
