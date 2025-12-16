"use client"

import { useCallback, useEffect, useState } from "react"
import { apiClient } from "@/lib/api-client"

export interface Yard {
  id: string
  name: string
  address?: string
  contact?: string
  notes?: string
}

export function useYards() {
  const [yards, setYards] = useState<Yard[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchYards = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await apiClient.get<Yard[]>("/yards")
      setYards(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch yards")
      setYards([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchYards()
  }, [fetchYards])

  const createYard = useCallback(
    async (yard: Omit<Yard, "id">) => {
      const created = await apiClient.post<Yard>("/yards", yard)
      setYards((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
      return created
    },
    [],
  )

  const updateYard = useCallback(
    async (id: string, yard: Partial<Yard>) => {
      const updated = await apiClient.put<Yard>(`/yards/${id}`, yard)
      setYards((prev) => prev.map((y) => (y.id === id ? updated : y)))
      return updated
    },
    [],
  )

  const deleteYard = useCallback(
    async (id: string) => {
      await apiClient.delete(`/yards/${id}`)
      setYards((prev) => prev.filter((y) => y.id !== id))
    },
    [],
  )

  return { yards, isLoading, error, fetchYards, createYard, updateYard, deleteYard }
}
