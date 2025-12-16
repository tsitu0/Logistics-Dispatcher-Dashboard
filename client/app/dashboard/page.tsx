"use client"

import { useCallback, useMemo, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/layout/navbar"
import { SearchAndFilters } from "@/components/dashboard/search-and-filters"
import { DashboardTable } from "@/components/dashboard/dashboard-table"
import { AssignmentModal } from "@/components/dashboard/assignment-modal"
import { useContainers, type Container } from "@/lib/hooks/use-containers"
import { useDrivers } from "@/lib/hooks/use-drivers"
import { useChassis } from "@/lib/hooks/use-chassis"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function DashboardPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  useEffect(() => {
    const session = localStorage.getItem("dispatcher_session")
    if (!session) {
      router.push("/login")
    } else {
      setIsAuthenticated(true)
    }
    setIsCheckingAuth(false)
  }, [router])

  const { containers, isLoading, error, moveContainerStatus, updateContainer } = useContainers()
  const { drivers } = useDrivers()
  const { chassis } = useChassis()

  const [searchId, setSearchId] = useState("")
  const [selectedContainerForAssignment, setSelectedContainerForAssignment] = useState<Container | null>(null)
  const [isMoving, setIsMoving] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)
  const [assignmentError, setAssignmentError] = useState("")

  const filteredContainers = useMemo(() => {
    const containerList = Array.isArray(containers)
      ? containers.filter((container) => (container.status || "AT_TERMINAL") === "AT_TERMINAL")
      : []

    if (!searchId.trim()) {
      return containerList
    }

    return containerList.filter((container) => {
      return container.containerNumber?.toLowerCase().includes(searchId.toLowerCase()) ?? false
    })
  }, [containers, searchId])

  const handleSendToTransit = async (id: string) => {
    setIsMoving(true)
    try {
      await moveContainerStatus(id, "IN_TRANSIT_FROM_TERMINAL")
    } finally {
      setIsMoving(false)
    }
  }

  const handleAssign = (container: Container) => {
    setSelectedContainerForAssignment(container)
    setAssignmentError("")
  }

  const handleAssignmentSubmit = useCallback(
    async (driverId: string, chassisId: string) => {
      if (!selectedContainerForAssignment) return

      setIsAssigning(true)
      setAssignmentError("")
      try {
        await updateContainer(selectedContainerForAssignment.id, {
          driverId,
          chassisId,
        })
        setSelectedContainerForAssignment(null)
      } catch (err) {
        setAssignmentError(err instanceof Error ? err.message : "Failed to assign resources")
      } finally {
        setIsAssigning(false)
      }
    },
    [selectedContainerForAssignment, updateContainer],
  )

  const handleReset = () => {
    setSearchId("")
  }

  if (isCheckingAuth) {
    return <div className="min-h-screen bg-background" />
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-screen-2xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-4xl font-bold">Dispatcher Dashboard</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.push("/containers/import")} className="bg-transparent">
              Import XLSX
            </Button>
            <Button onClick={() => router.push("/containers/new")} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Container
            </Button>
          </div>
        </div>

        <SearchAndFilters searchId={searchId} onSearchIdChange={setSearchId} onReset={handleReset} />

        <DashboardTable
          containers={filteredContainers}
          isLoading={isLoading}
          error={error}
          onSendToTransit={handleSendToTransit}
          onAssign={handleAssign}
          isMoving={isMoving}
        />

        <AssignmentModal
          container={selectedContainerForAssignment}
          drivers={drivers}
          chassis={chassis}
          isOpen={!!selectedContainerForAssignment}
          isLoading={isAssigning}
          error={assignmentError}
          onSubmit={handleAssignmentSubmit}
          onClose={() => setSelectedContainerForAssignment(null)}
        />
      </div>
    </div>
  )
}
