"use client"

import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Navbar } from "@/components/layout/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, ArrowLeft } from "lucide-react"
import { useContainers } from "@/lib/hooks/use-containers"

export default function ContainerDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const from = searchParams.get("from")
  const { containers, isLoading } = useContainers()
  const container = containers.find((c) => c.id === params.id)

  const backTarget = from === "board" ? "/board" : "/dashboard"

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (!container) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Container Not Found</h2>
            <Button onClick={() => router.push(backTarget)}>Back</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-10">
        <Button variant="ghost" onClick={() => router.push(backTarget)} className="mb-8">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Container Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Case Number</h3>
                <p className="text-lg font-mono">{container.caseNumber || "-"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Input Person</h3>
                <p className="text-lg">{container.inputPerson || "-"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">ETA (Estimated Time of Arrival)</h3>
                <p className="text-lg">{container.eta || "-"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Container ID</h3>
                <p className="text-lg font-mono">{container.containerNumber}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">MBL Number</h3>
                <p className="text-lg font-mono">{container.mblNumber || "-"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Status</h3>
                <p className="text-lg font-mono">{container.status || "AT_TERMINAL"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Chassis</h3>
                <p className="text-lg">{container.chassisId || "-"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Driver</h3>
                <p className="text-lg">{container.driverId || "-"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Demurrage</h3>
                <p className="text-lg">{container.demurrage || "-"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Size</h3>
                <p className="text-lg">{container.size || "-"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Terminal</h3>
                <p className="text-lg">{container.terminal || "-"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">LFD (Last Free Day)</h3>
                <p className="text-lg">{container.lfd || "-"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Appointment Time</h3>
                <p className="text-lg">{container.appointmentTime || "-"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Delivery Appointment</h3>
                <p className="text-lg">{container.deliveryAppointment || "-"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Empty Status</h3>
                <p className="text-lg">{container.emptyStatus || "-"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">RT LOC EMPTY APP</h3>
                <p className="text-lg">{container.rtLocEmptyApp || "-"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Yards</h3>
                <p className="text-lg">{container.yards || "-"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Yard Status</h3>
                <p className="text-lg">{container.yardStatus || "-"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">PU DRIVER</h3>
                <p className="text-lg">{container.puDriver || "-"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Delivery Address & Company Name</h3>
                <p className="text-lg">{container.deliveryAddressCompany || "-"}</p>
              </div>
            </div>

            {container.notes && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Notes</h3>
                <p className="text-base whitespace-pre-wrap">{container.notes}</p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button onClick={() => router.push(`/containers/${container.id}/edit`)}>Edit Container</Button>
              <Button variant="outline" onClick={() => router.push(backTarget)}>
                Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
