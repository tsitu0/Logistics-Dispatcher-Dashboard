"use client"

import { useState, useEffect, useCallback } from "react"
import { apiClient } from "@/lib/api-client"

export interface Container {
  id: string
  containerNumber: string
  caseNumber?: string
  status?: string
  yardId?: string | null
  yardStatus?: "LOADED" | "EMPTY" | null
  orderIndex?: number
  createdAt?: string
  mblNumber?: string
  size?: string
  terminal?: string
  deliveryAddressCompany?: string
  appointmentTime?: string
  lfd?: string
  eta?: string
  billingParty?: string
  demurrage?: string
  inputPerson?: string
  notes?: string
  deliveryAppointment?: string
  emptyStatus?: string
  rtLocEmptyApp?: string
  yards?: string
  puDriver?: string // Added PU DRIVER field
  driverId?: string
  chassisId?: string
}

const normalizeContainer = (item: Container): Container => ({
  ...item,
  status: item.status || "AT_TERMINAL",
  yardId: item.yardId ?? null,
  yardStatus: (item as any).yardStatus ?? null,
  orderIndex: typeof item.orderIndex === "number" ? item.orderIndex : Number.MAX_SAFE_INTEGER,
})

export function useContainers() {
  const [containers, setContainers] = useState<Container[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isImporting, setIsImporting] = useState(false)

  const fetchContainers = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await apiClient.get<Container[]>("/containers")
      const normalized = (Array.isArray(data) ? data : []).map((item) => normalizeContainer(item))
      setContainers(normalized)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch containers")
      setContainers([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchContainers()
  }, [fetchContainers])

  const createContainer = useCallback(
    async (container: Omit<Container, "id">) => {
      try {
        const newContainer = await apiClient.post<Container>("/containers", container)
        const normalized = normalizeContainer(newContainer)
        setContainers([...containers, normalized])
        return normalized
      } catch (err) {
        throw err instanceof Error ? err : new Error("Failed to create container")
      }
    },
    [containers],
  )

  const updateContainer = useCallback(
    async (id: string, container: Partial<Container>) => {
      try {
        const updated = await apiClient.put<Container>(`/containers/${id}`, container)
        const normalized = normalizeContainer(updated)
        setContainers(containers.map((c) => (c.id === id ? normalized : c)))
        return normalized
      } catch (err) {
        throw err instanceof Error ? err : new Error("Failed to update container")
      }
    },
    [containers],
  )

  const deleteContainer = useCallback(
    async (id: string) => {
      try {
        await apiClient.delete(`/containers/${id}`)
        setContainers(containers.filter((c) => c.id !== id))
      } catch (err) {
        throw err instanceof Error ? err : new Error("Failed to delete container")
      }
    },
    [containers],
  )

  const moveContainerStatus = useCallback(
    async (id: string, status: string, options?: { yardId?: string | null; yardStatus?: "LOADED" | "EMPTY" | null; orderIndex?: number }) => {
      try {
        const payload: { status: string; yardId?: string | null; yardStatus?: "LOADED" | "EMPTY" | null; orderIndex?: number } = { status }
        if (options?.yardId !== undefined) {
          payload.yardId = options.yardId
        }
        if (options?.yardStatus !== undefined) {
          payload.yardStatus = options.yardStatus
        }
        if (typeof options?.orderIndex === "number") {
          payload.orderIndex = options.orderIndex
        }

        const updated = await apiClient.put<Container>(`/containers/${id}/status`, payload)
        const normalized = normalizeContainer(updated)
        setContainers(containers.map((c) => (c.id === id ? normalized : c)))
        return normalized
      } catch (err) {
        throw err instanceof Error ? err : new Error("Failed to move container")
      }
    },
    [containers],
  )

  const importFromFile = useCallback(
    async (file: File) => {
      if (!file) {
        throw new Error("Please select a file to upload")
      }

      setIsImporting(true)
      try {
        const result = await apiClient.upload<{ insertedCount: number; updatedCount: number; skippedCount: number; totalRows: number }>(
          "/containers/import",
          file,
        )
        await fetchContainers()
        return result
      } catch (err) {
        throw err instanceof Error ? err : new Error("Failed to import containers")
      } finally {
        setIsImporting(false)
      }
    },
    [fetchContainers],
  )

  return {
    containers,
    isLoading,
    error,
    fetchContainers,
    createContainer,
    updateContainer,
    moveContainerStatus,
    deleteContainer,
    importFromFile,
    isImporting,
  }
}
