"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/layout/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Upload } from "lucide-react"
import { useContainers } from "@/lib/hooks/use-containers"

interface ImportResult {
  insertedCount: number
  updatedCount: number
  skippedCount: number
  totalRows: number
}

export default function ImportContainersPage() {
  const router = useRouter()
  const { importFromFile, isImporting } = useContainers()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState("")
  const [result, setResult] = useState<ImportResult | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError("")
    setResult(null)

    if (!selectedFile) {
      setError("Please choose an .xlsx file to upload.")
      return
    }

    try {
      const response = await importFromFile(selectedFile)
      setResult(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import containers.")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">Import Containers</h1>
          <Button variant="outline" onClick={() => router.push("/dashboard")} className="bg-transparent">
            Back to Dashboard
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Upload XLSX</CardTitle>
            <CardDescription>Upload a spreadsheet formatted like your sample to create/update containers.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Choose file</label>
                <Input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                  disabled={isImporting}
                />
                <p className="text-xs text-muted-foreground">
                  Expected headers include: Case Number, Input Person, Container #, MBL#, SIZE, TERMINALS, LFD, APPT,
                  NOTES/COMMENTS, DELIVERY APPT, EMPTY STATUS, RT LOC EMPTY APPT, YARDS, PU DRIVER, DELIVERY ADDRESS,
                  BILLING PARTY.
                </p>
              </div>

              <Button type="submit" className="flex items-center gap-2" disabled={isImporting}>
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Upload & Import
                  </>
                )}
              </Button>
            </form>

            {result && (
              <div className="mt-6 rounded-lg border p-4 bg-muted/40">
                <h2 className="text-sm font-semibold mb-2">Import summary</h2>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Total rows</dt>
                    <dd className="font-medium">{result.totalRows}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Inserted</dt>
                    <dd className="font-medium">{result.insertedCount}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Updated</dt>
                    <dd className="font-medium">{result.updatedCount}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Skipped (missing Container #)</dt>
                    <dd className="font-medium">{result.skippedCount}</dd>
                  </div>
                </dl>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
