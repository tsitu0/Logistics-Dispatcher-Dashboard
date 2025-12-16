"use client"

import { useEffect, useMemo, useState } from "react"
import { Navbar } from "@/components/layout/navbar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2, Undo2 } from "lucide-react"
import { CONTAINER_STATUSES } from "@/lib/constants/container-status"
import { useContainers, type Container } from "@/lib/hooks/use-containers"
import { useYards, type Yard } from "@/lib/hooks/use-yards"

const BOARD_STATUSES_ORDER = [
  "IN_TRANSIT_FROM_TERMINAL",
  "ON_WAY_TO_CUSTOMER",
  "ON_WAY_TO_YARD",
  "AT_CUSTOMER_YARD",
  "EMPTY_AT_CUSTOMER",
  "AT_OTHER_YARD",
  "RETURNING_TO_TERMINAL",
  "RETURNED",
]
const BOARD_STATUSES = BOARD_STATUSES_ORDER.map((id) => CONTAINER_STATUSES.find((s) => s.id === id)).filter(
  (s): s is { id: string; label: string } => Boolean(s),
)
const STATUS_LABELS = Object.fromEntries(CONTAINER_STATUSES.map((s) => [s.id, s.label]))
const NEXT_STATUS_MAP: Record<string, string | null> = {
  AT_TERMINAL: "IN_TRANSIT_FROM_TERMINAL",
  IN_TRANSIT_FROM_TERMINAL: "ON_WAY_TO_CUSTOMER",
  ON_WAY_TO_CUSTOMER: "AT_CUSTOMER_YARD",
  ON_WAY_TO_YARD: "AT_OTHER_YARD",
  AT_CUSTOMER_YARD: "EMPTY_AT_CUSTOMER",
  AT_OTHER_YARD: "EMPTY_AT_CUSTOMER",
  EMPTY_AT_CUSTOMER: "RETURNING_TO_TERMINAL",
  RETURNING_TO_TERMINAL: "RETURNED",
  RETURNED: null,
}

const orderValue = (container: Container) =>
  typeof container.orderIndex === "number" ? container.orderIndex : Number.MAX_SAFE_INTEGER

const sortContainersForBoard = (a: Container, b: Container) => {
  const orderDiff = orderValue(a) - orderValue(b)
  if (orderDiff !== 0) return orderDiff

  const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
  const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
  return dateB - dateA
}

export default function BoardPage() {
  const { containers, isLoading, error, moveContainerStatus } = useContainers()
  const { yards } = useYards()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [localContainers, setLocalContainers] = useState<Container[]>([])

  useEffect(() => {
    setLocalContainers(containers.filter((c) => (c.status || "AT_TERMINAL") !== "AT_TERMINAL"))
  }, [containers])

  const groupedByStatus = useMemo(() => {
    const groups: Record<string, Container[]> = {}
    localContainers.forEach((container) => {
      const status = container.status || "IN_TRANSIT_FROM_TERMINAL"
      groups[status] = groups[status] || []
      groups[status].push(container)
    })
    Object.keys(groups).forEach((status) => {
      groups[status] = groups[status].sort(sortContainersForBoard)
    })
    return groups
  }, [localContainers])

  const yardMap = useMemo(() => {
    const map: Record<string, Yard> = {}
    yards.forEach((y) => {
      map[y.id] = y
    })
    return map
  }, [yards])

  const selectedContainer = useMemo(
    () => (selectedId ? localContainers.find((c) => c.id === selectedId) ?? null : null),
    [selectedId, localContainers],
  )

  const computeOrderIndex = (
    targetStatus: string,
    targetYardId: string | null,
    excludeId?: string | null,
    position: "top" | "bottom" = "top",
  ) => {
    const targetList = (groupedByStatus[targetStatus] || []).filter((c) => {
      if (targetStatus !== "AT_OTHER_YARD") return c.id !== excludeId
      return c.id !== excludeId && (c.yardId ?? null) === targetYardId
    })

    const idx = position === "top" ? 0 : targetList.length

    const prev = idx > 0 ? targetList[idx - 1] : undefined
    const next = targetList[idx] || undefined

    if (!prev && !next) return 0
    if (!prev) return orderValue(next) - 1
    if (!next) return orderValue(prev) + 1
    return (orderValue(prev) + orderValue(next)) / 2
  }

  const handleMove = async (
    targetStatus: string,
    opts?: {
      yardId?: string | null
      yardStatus?: "LOADED" | "EMPTY" | null
      position?: "top" | "bottom"
      containerId?: string
    },
  ) => {
    const sourceId = opts?.containerId || selectedId
    if (!sourceId) return
    const moving = localContainers.find((c) => c.id === sourceId)
    if (!moving) return

    const { yardId: resolvedYardId, yardStatus: resolvedYardStatus } = await resolveYardInfoIfNeeded(
      targetStatus,
      opts?.yardId ?? moving.yardId ?? null,
      opts?.yardStatus ?? (moving.status === "AT_OTHER_YARD" ? (moving.yardStatus as any) ?? null : null),
    )

    if (targetStatus === "AT_OTHER_YARD" && (!resolvedYardId || !resolvedYardStatus)) {
      return
    }

    const orderIndex = computeOrderIndex(
      targetStatus,
      resolvedYardId ?? null,
      moving.id,
      opts?.position ?? "top",
    )
    const updatedContainer: Container = {
      ...moving,
      status: targetStatus,
      yardId: targetStatus === "AT_OTHER_YARD" ? resolvedYardId ?? null : null,
      yardStatus: targetStatus === "AT_OTHER_YARD" ? (resolvedYardStatus as any) : null,
      orderIndex,
    }

    const previous = localContainers
    setLocalContainers([...previous.filter((c) => c.id !== moving.id), updatedContainer])
    setSelectedId(null)

    try {
      await moveContainerStatus(moving.id, targetStatus, {
        yardId: updatedContainer.yardId,
        yardStatus: updatedContainer.yardStatus as any,
        orderIndex,
      })
    } catch (err) {
      console.error("Failed to move container", err)
      setLocalContainers(previous)
      alert("Could not move container. Please try again.")
    }
  }

  const renderContainerRow = (container: Container) => {
    const isSelected = selectedId === container.id
    return (
      <div
        key={container.id}
        onClick={() => setSelectedId(isSelected ? null : container.id)}
        className={`rounded-md border bg-card px-3 py-2 shadow-sm mb-2 cursor-pointer ${
          isSelected ? "ring-2 ring-primary" : ""
        }`}
      >
        {renderRowContent(container)}
      </div>
    )
  }

  const renderRowContent = (container: Container) => {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-[11px]">
              {STATUS_LABELS[container.status || "IN_TRANSIT_FROM_TERMINAL"] || container.status || "In Transit"}
            </Badge>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Case</p>
              <p className="font-semibold font-mono text-sm">{container.caseNumber || "-"}</p>
            </div>
            <div className="flex items-center gap-2">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Container</p>
                <p className="font-semibold font-mono text-sm">{container.containerNumber || "-"}</p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`/containers/${container.id}?from=board`}
                  className="text-primary hover:text-red-500 border border-transparent hover:border-red-500 rounded-sm p-1 transition-colors"
                  title="View full details"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </a>
                <a
                  href={`/containers/${container.id}/edit?from=board`}
                  className="text-primary hover:text-red-500 border border-transparent hover:border-red-500 rounded-sm p-1 transition-colors"
                  title="Edit container"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4Z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="Send back to dashboard"
              onClick={() => handleMove("AT_TERMINAL", { containerId: container.id, yardId: null, yardStatus: null })}
            >
              <Undo2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto pb-1 no-scrollbar">
          <div className="flex flex-wrap gap-3 w-full text-[11px] leading-5 items-start">
            <Field label="Input Person" value={container.inputPerson} />
            <Field label="ETA" value={container.eta} />
            <Field label="MBL#" value={container.mblNumber} />
            <Field label="Chassis" value={container.chassisId} />
            <Field label="Driver" value={container.driverId} />
            <Field label="Demurrage" value={container.demurrage} />
            <Field label="Size" value={container.size} />
            <Field label="Terminal" value={container.terminal} />
            <Field label="LFD" value={container.lfd} />
            <Field label="Appointment" value={container.appointmentTime} />
            <Field label="Notes" value={container.notes} wide />
            <Field label="Delivery Appt" value={container.deliveryAppointment} />
            <Field label="Empty Status" value={container.emptyStatus} />
            <Field label="RT LOC EMPTY APP" value={container.rtLocEmptyApp} />
            <Field label="Yards" value={container.yards || container.yardId} />
            <Field label="Yard Load" value={container.yardStatus} />
            <Field label="PU DRIVER" value={container.puDriver} />
            <Field label="Delivery Address & Company" value={container.deliveryAddressCompany} wide />
            <Field label="Billing Party" value={container.billingParty} />
          </div>
        </div>
      </div>
    )
  }

  const renderStageSection = (stageId: string, stageLabel: string) => {
    const list = (groupedByStatus[stageId] || []).sort(sortContainersForBoard)

    if (stageId === "AT_OTHER_YARD") {
      const groupedByYard: Record<
        string,
        { label: string; loaded: Container[]; empty: Container[]; yardId: string | null }
      > = {}

      yards.forEach((yard) => {
        groupedByYard[yard.id] = { label: yard.name, loaded: [], empty: [], yardId: yard.id }
      })

      list.forEach((c) => {
        const key = c.yardId || "unassigned"
        if (!groupedByYard[key]) {
          const label = c.yardId ? yardMap[c.yardId]?.name || c.yardId : "Unassigned Yard"
          groupedByYard[key] = { label, loaded: [], empty: [], yardId: c.yardId ?? null }
        }
        if (c.yardStatus === "EMPTY") {
          groupedByYard[key].empty.push(c)
        } else {
          groupedByYard[key].loaded.push(c)
        }
      })

      Object.values(groupedByYard).forEach((group) => {
        group.loaded = group.loaded.sort(sortContainersForBoard)
        group.empty = group.empty.sort(sortContainersForBoard)
      })

      return (
        <section
          key={stageId}
          id={stageId}
          className="rounded-xl border border-muted-foreground/20 bg-muted/20 overflow-hidden"
        >
          <StageHeader label={stageLabel} />
          <div className="p-4 space-y-4 w-full">
            {Object.keys(groupedByYard).length === 0 ? (
              <EmptyHint />
            ) : (
              Object.entries(groupedByYard).map(([key, yardGroup]) => {
                const yardId = yardGroup.yardId
                const yardDetails = yardId ? yardMap[yardId] : null
                const canMoveLoaded =
                  !!selectedContainer &&
                  (selectedContainer.status !== stageId ||
                    selectedContainer.yardId !== yardId ||
                    selectedContainer.yardStatus !== "LOADED")
                const canMoveEmpty =
                  !!selectedContainer &&
                  (selectedContainer.status !== stageId ||
                    selectedContainer.yardId !== yardId ||
                    selectedContainer.yardStatus !== "EMPTY")

                return (
                  <Card key={key} className="border-dashed border-muted-foreground/40 overflow-hidden">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between border-b border-muted-foreground/10 bg-card">
                      <CardTitle className="text-sm font-semibold">{yardGroup.label}</CardTitle>
                      {yardDetails && (
                        <div className="text-xs text-foreground flex flex-wrap gap-3">
                          {yardDetails.address && <span>Address: {yardDetails.address}</span>}
                          {yardDetails.contact && <span>Contact: {yardDetails.contact}</span>}
                          {yardDetails.notes && <span>Notes: {yardDetails.notes}</span>}
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="rounded-md border border-muted-foreground/20 p-3 bg-card/60">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold">Loaded</p>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" disabled={!canMoveLoaded} onClick={() => handleMove(stageId, { yardId, yardStatus: "LOADED" })}>
                              Move selected here
                            </Button>
                          </div>
                        </div>
                        {yardGroup.loaded.length === 0 ? (
                          <EmptyHint />
                        ) : (
                          yardGroup.loaded.map((c) => renderContainerRow(c))
                        )}
                      </div>
                      <div className="rounded-md border border-muted-foreground/20 p-3 bg-card/60">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold">Empty</p>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" disabled={!canMoveEmpty} onClick={() => handleMove(stageId, { yardId, yardStatus: "EMPTY" })}>
                              Move selected here
                            </Button>
                          </div>
                        </div>
                        {yardGroup.empty.length === 0 ? (
                          <EmptyHint />
                        ) : (
                          yardGroup.empty.map((c) => renderContainerRow(c))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </section>
      )
    }

    const canMoveHere = !!selectedContainer && selectedContainer.status !== stageId

    return (
      <section
        key={stageId}
        id={stageId}
        className="rounded-xl border border-muted-foreground/20 bg-muted/20 overflow-hidden"
      >
        <StageHeader
          label={stageLabel}
          action={
            <Button size="sm" variant="outline" disabled={!canMoveHere} onClick={() => handleMove(stageId)}>
              Move selected here
            </Button>
          }
        />
        <div className="p-4">{list.length === 0 ? <EmptyHint /> : list.map((c) => renderContainerRow(c))}</div>
      </section>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-screen-2xl w-full mx-auto px-6 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Transit Board</h1>
            <p className="text-muted-foreground text-sm">Select a row, then choose where it should go.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {BOARD_STATUSES.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="text-xs px-3 py-1 rounded-full border text-muted-foreground hover:text-foreground"
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            {BOARD_STATUSES.map((stage) => renderStageSection(stage.id, stage.label))}
          </div>
        )}
      </div>
    </div>
  )
}

function StageHeader({ label, action }: { label: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-muted-foreground/20 bg-card rounded-t-xl">
      <div className="flex items-center gap-3">
        <div className="h-2 w-2 rounded-full bg-primary" />
        <h2 className="text-lg font-semibold">{label}</h2>
      </div>
      {action}
    </div>
  )
}

async function resolveYardInfoIfNeeded(
  targetStatus: string,
  initialYardId: string | null,
  initialYardStatus: "LOADED" | "EMPTY" | null,
): Promise<{ yardId: string | null; yardStatus: "LOADED" | "EMPTY" | null }> {
  if (targetStatus !== "AT_OTHER_YARD") {
    return { yardId: null, yardStatus: null }
  }

  const yardId = initialYardId
  const yardStatus = initialYardStatus || (yardId ? "LOADED" : null)

  return { yardId, yardStatus }
}

function Field({ label, value, wide = false }: { label: string; value?: string | null; wide?: boolean }) {
  return (
    <div className={wide ? "min-w-[200px] max-w-xl" : "min-w-[120px] max-w-xs"}>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground whitespace-nowrap leading-4">{label}</p>
      <p className="text-[11px] font-medium leading-4 whitespace-normal break-words">{value || "-"}</p>
    </div>
  )
}

function EmptyHint() {
  return <p className="text-sm text-muted-foreground">No containers here yet.</p>
}
