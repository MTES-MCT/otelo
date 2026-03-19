'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'

interface SimulationEvent {
  type: 'scenario_updated' | 'simulation_deleted' | 'collaborator_joined' | 'collaborator_left'
  simulationId: string
  userId: string
  clientId: string
  timestamp: number
  data?: Record<string, unknown> | null
}

const HEARTBEAT_INTERVAL_MS = 20_000 // 20 seconds
const SESSION_STORAGE_KEY = 'otelo-sse-client-id'

function getStableClientId(): string {
  if (typeof window === 'undefined') return crypto.randomUUID()
  let id = sessionStorage.getItem(SESSION_STORAGE_KEY)
  if (!id) {
    id = crypto.randomUUID()
    sessionStorage.setItem(SESSION_STORAGE_KEY, id)
  }
  return id
}

export function useSimulationSSE(simulationId: string) {
  const queryClient = useQueryClient()
  const router = useRouter()
  const clientId = useRef(getStableClientId())

  useEffect(() => {
    const sendHeartbeat = () => {
      fetch(`/api/simulations/${simulationId}/heartbeat`, {
        method: 'POST',
      })
        .then((res) => res.json())
        .then((data) => {
          queryClient.setQueryData(['connections', simulationId], { count: data.count })
        })
        .catch(() => undefined)
    }

    sendHeartbeat()
    const interval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS)

    return () => {
      clearInterval(interval)

      fetch(`/api/simulations/${simulationId}/heartbeat`, {
        method: 'DELETE',
        keepalive: true,
      }).catch(() => undefined)
    }
  }, [simulationId, queryClient])

  useEffect(() => {
    const es = new EventSource(`/api/simulations/${simulationId}/events`)

    es.onmessage = (event) => {
      try {
        const data: SimulationEvent = JSON.parse(event.data)

        if (data.clientId === clientId.current) return

        queryClient.invalidateQueries({ queryKey: ['activity', simulationId] })
        queryClient.invalidateQueries({ queryKey: ['connections', simulationId] })

        switch (data.type) {
          case 'scenario_updated':
            queryClient.invalidateQueries({ queryKey: ['simulation', simulationId] })
            queryClient.invalidateQueries({ queryKey: ['simulation-scenario', simulationId] })
            toast.info('Un collaborateur a modifié le scénario', {
              description: 'Les données ont été mises à jour.',
            })
            break

          case 'simulation_deleted':
            toast.warning('Cette simulation a été supprimée')
            router.push('/tableaux-de-bord')
            break

          case 'collaborator_joined':
            queryClient.invalidateQueries({ queryKey: ['collaborators', simulationId] })
            toast.info('Un nouveau collaborateur a rejoint la simulation')
            break

          case 'collaborator_left':
            queryClient.invalidateQueries({ queryKey: ['collaborators', simulationId] })
            toast.info('Un collaborateur a quitté la simulation')
            break
        }
      } catch {
        // Ignore malformed events
      }
    }

    es.onerror = () => {
      // EventSource will automatically reconnect
    }

    return () => {
      es.close()
    }
  }, [simulationId, queryClient, router])

  return { clientId: clientId.current }
}
