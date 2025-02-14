import { useEffect, useState } from 'react'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { config } from '@/config/env'
import io from 'socket.io-client'

interface EnrichmentProgressProps {
  jobId: string
  onComplete?: () => void
  onError?: () => void
}

export function EnrichmentProgress({ jobId, onComplete, onError }: EnrichmentProgressProps) {
  const [progress, setProgress] = useState(0)
  const [currentQueue, setCurrentQueue] = useState('')
  const [status, setStatus] = useState<'waiting' | 'processing' | 'completed' | 'failed'>('waiting')

  useEffect(() => {
    const socket = io(config.apiBaseUrl, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    console.log("Socket connecting to:", config.apiBaseUrl)

    socket.on('connect', () => {
      console.log("Socket connected successfully")
    })

    socket.on('connect_error', (error) => {
      console.error("Socket connection error:", error)
    })

    // Join the job's room
    socket.emit('join', `job:${jobId}`)
    console.log("Joined room:", `job:${jobId}`)

    // Queue weights (each step's contribution to total progress)
    const queueWeights = {
      'url-validation-queue': 0.2,     // 20%
      'web-scraping-queue': 0.3,       // 30%
      'vms-check-queue': 0.3,          // 30%
      'report-generation-queue': 0.2    // 20%
    }

    // Listen for progress updates
    socket.on('pipeline_progress', (data: { 
      queueName: keyof typeof queueWeights, 
      processedCount: number, 
      totalCompanies: number 
    }) => {
      console.log("Received progress update:", {
        queue: data.queueName,
        processed: data.processedCount,
        total: data.totalCompanies
      })

      const { queueName, processedCount, totalCompanies } = data
      const queueProgress = (processedCount / totalCompanies) * 100
      const weightedProgress = queueProgress * queueWeights[queueName]
      
      // Add base progress from completed queues
      let baseProgress = 0
      if (queueName === 'web-scraping-queue') baseProgress = 20
      if (queueName === 'vms-check-queue') baseProgress = 50
      if (queueName === 'report-generation-queue') baseProgress = 80

      const totalProgress = Math.floor(baseProgress + weightedProgress)
      console.log("Calculated progress:", {
        queueProgress,
        weightedProgress,
        baseProgress,
        totalProgress
      })

      setProgress(totalProgress)
      setCurrentQueue(queueName)
      setStatus('processing')
    })

    // Handle job completion
    socket.on('pipeline_job_completed', () => {
      console.log("Job completed successfully")
      setProgress(100)
      setStatus('completed')
      onComplete?.()
    })

    // Handle job failure
    socket.on('pipeline_job_failed', (error) => {
      console.error("Job failed:", error)
      setStatus('failed')
      onError?.()
    })

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log("Socket disconnected:", reason)
    })

    // Cleanup
    return () => {
      console.log("Cleaning up socket connection")
      socket.off('connect')
      socket.off('connect_error')
      socket.off('pipeline_progress')
      socket.off('pipeline_job_completed')
      socket.off('pipeline_job_failed')
      socket.off('disconnect')
      socket.emit('leave', `job:${jobId}`)
      socket.disconnect()
    }
  }, [jobId, onComplete, onError])

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
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{currentQueue ? getQueueDisplay(currentQueue) : 'Starting...'}</span>
            <span>{progress}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
