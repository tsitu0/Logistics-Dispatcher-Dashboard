"use client"

import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/layout/navbar"
import { ContainerTable } from "@/components/containers/container-table"
import { useContainers } from "@/lib/hooks/use-containers"
import { Plus } from "lucide-react"

export default function ContainersPage() {
  const router = useRouter()
  const { containers, isLoading, error, moveContainerStatus } = useContainers()
  const [isMoving, setIsMoving] = useState(false)

  const terminalContainers = useMemo(
    () => (Array.isArray(containers) ? containers.filter((c) => (c.status || "AT_TERMINAL") === "AT_TERMINAL") : []),
    [containers],
  )

  const handleSendToTransit = async (id: string) => {
    setIsMoving(true)
    try {
      await moveContainerStatus(id, "IN_TRANSIT_FROM_TERMINAL")
    } finally {
      setIsMoving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-screen-2xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-4xl font-bold">Container Management</h1>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => router.push("/board")} className="bg-transparent">
              Board View
            </Button>
            <Button variant="outline" onClick={() => router.push("/containers/import")} className="bg-transparent">
              Import XLSX
            </Button>
            <Button onClick={() => router.push("/containers/new")} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Container
            </Button>
          </div>
        </div>
        <ContainerTable
          containers={terminalContainers}
          isLoading={isLoading}
          error={error}
          onSendToTransit={handleSendToTransit}
          isMoving={isMoving}
        />
      </div>
    </div>
  )
}
