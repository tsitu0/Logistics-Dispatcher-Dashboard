"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Loader2, Edit, Eye, MoveRight } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CONTAINER_STATUSES } from "@/lib/constants/container-status"
import type { Container } from "@/lib/hooks/use-containers"

interface ContainerTableProps {
  containers: Container[]
  isLoading: boolean
  error: string | null
  onSendToTransit: (id: string) => Promise<void>
  isMoving?: boolean
}

const STATUS_LABELS = Object.fromEntries(CONTAINER_STATUSES.map((s) => [s.id, s.label]))

export function ContainerTable({ containers, isLoading, error, onSendToTransit, isMoving = false }: ContainerTableProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Containers</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : containers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No containers found. Create one to get started.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2.5 px-3 font-semibold">Case #</th>
                  <th className="text-left py-2.5 px-3 font-semibold">Input Person</th>
                  <th className="text-left py-2.5 px-3 font-semibold">ETA</th>
                  <th className="text-left py-2.5 px-3 font-semibold">Container #</th>
                  <th className="text-left py-2.5 px-3 font-semibold">MBL#</th>
                  <th className="text-left py-2.5 px-3 font-semibold">Chassis</th>
                  <th className="text-left py-2.5 px-3 font-semibold">Driver</th>
                  <th className="text-left py-2.5 px-3 font-semibold">Demurrage</th>
                  <th className="text-left py-2.5 px-3 font-semibold">Size</th>
                  <th className="text-left py-2.5 px-3 font-semibold">Terminal</th>
                  <th className="text-left py-2.5 px-3 font-semibold">LFD</th>
                  <th className="text-left py-2.5 px-3 font-semibold">Appointment</th>
                  <th className="text-left py-2.5 px-3 font-semibold">Notes</th>
                  <th className="text-left py-2.5 px-3 font-semibold">Delivery Appt</th>
                  <th className="text-left py-2.5 px-3 font-semibold">Empty Status</th>
                  <th className="text-left py-2.5 px-3 font-semibold">RT LOC EMPTY APP</th>
                  <th className="text-left py-2.5 px-3 font-semibold">Yards</th>
                  <th className="text-left py-2.5 px-3 font-semibold">PU DRIVER</th>
                  <th className="text-left py-2.5 px-3 font-semibold">Delivery Address & Company</th>
                  <th className="text-left py-2.5 px-3 font-semibold">Billing Party</th>
                  <th className="text-left py-2.5 px-3 font-semibold">Status</th>
                  <th className="text-left py-2.5 px-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {containers.map((container, index) => (
                  <tr key={container.id || `${container.containerNumber}-${index}`} className="border-b hover:bg-muted/50">
                    <td className="py-2.5 px-3 font-mono text-xs">{container.caseNumber || "-"}</td>
                    <td className="py-2.5 px-3 text-xs">{container.inputPerson || "-"}</td>
                    <td className="py-2.5 px-3 text-xs">{container.eta || "-"}</td>
                    <td className="py-2.5 px-3 font-mono text-xs">{container.containerNumber || "-"}</td>
                    <td className="py-2.5 px-3 font-mono text-xs">{container.mblNumber || "-"}</td>
                    <td className="py-2.5 px-3 text-xs">{container.chassisId || "-"}</td>
                    <td className="py-2.5 px-3 text-xs">{container.driverId || "-"}</td>
                    <td className="py-2.5 px-3 text-xs">{container.demurrage || "-"}</td>
                    <td className="py-2.5 px-3 text-xs">{container.size || "-"}</td>
                    <td className="py-2.5 px-3 text-xs">{container.terminal || "-"}</td>
                    <td className="py-2.5 px-3 text-xs">{container.lfd || "-"}</td>
                    <td className="py-2.5 px-3 text-xs">{container.appointmentTime || "-"}</td>
                    <td className="py-2.5 px-3 text-xs max-w-36 truncate" title={container.notes || "-"}>
                      {container.notes || "-"}
                    </td>
                    <td className="py-2.5 px-3 text-xs">{container.deliveryAppointment || "-"}</td>
                    <td className="py-2.5 px-3 text-xs">{container.emptyStatus || "-"}</td>
                    <td className="py-2.5 px-3 text-xs">{container.rtLocEmptyApp || "-"}</td>
                    <td className="py-2.5 px-3 text-xs">{container.yards || "-"}</td>
                    <td className="py-2.5 px-3 text-xs">{container.puDriver || "-"}</td>
                    <td className="py-2.5 px-3 text-xs max-w-40 truncate" title={container.deliveryAddressCompany || "-"}>
                      {container.deliveryAddressCompany || "-"}
                    </td>
                    <td className="py-2.5 px-3 text-xs">{container.billingParty || "-"}</td>
                    <td className="py-2.5 px-3 text-xs font-semibold">
                      {STATUS_LABELS[container.status || "AT_TERMINAL"] || container.status || "At Terminal"}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex gap-2">
                        <Link href={`/containers/${container.id}?from=dashboard`}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/containers/${container.id}/edit`}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-auto px-2"
                          onClick={() => onSendToTransit(container.id)}
                          disabled={isMoving}
                        >
                          <MoveRight className="h-4 w-4 mr-1" />
                          Send to Transit
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
