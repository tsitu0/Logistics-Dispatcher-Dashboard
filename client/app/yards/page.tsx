"use client"

import { FormEvent, useState } from "react"
import { Navbar } from "@/components/layout/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2, Trash2, Edit2 } from "lucide-react"
import { useYards, type Yard } from "@/lib/hooks/use-yards"

export default function YardsPage() {
  const { yards, isLoading, error, createYard, updateYard, deleteYard } = useYards()
  const [form, setForm] = useState<Omit<Yard, "id">>({ name: "", address: "", contact: "", notes: "" })
  const [isSaving, setIsSaving] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault()
    if (!form.name.trim()) return
    setIsSaving(true)
    try {
      if (editId) {
        await updateYard(editId, form)
      } else {
        await createYard(form)
      }
      setForm({ name: "", address: "", contact: "", notes: "" })
      setEditId(null)
    } finally {
      setIsSaving(false)
    }
  }

  const startEdit = (yard: Yard) => {
    setEditId(yard.id)
    setForm({ name: yard.name, address: yard.address || "", contact: yard.contact || "", notes: yard.notes || "" })
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-screen-xl mx-auto px-6 py-10 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold">Yard Management</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>{editId ? "Edit Yard" : "Add Yard"}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-4">
              <Input
                type="text"
                placeholder="Name"
                value={form.name}
                autoFocus
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                disabled={isSaving}
              />
              <Input
                type="text"
                placeholder="Address"
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                disabled={isSaving}
              />
              <Input
                type="text"
                placeholder="Contact"
                value={form.contact}
                onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))}
                disabled={isSaving}
              />
              <Input
                type="text"
                placeholder="Notes"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                disabled={isSaving}
              />
              <div className="md:col-span-4 flex gap-2">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Saving..." : editId ? "Update Yard" : "Add Yard"}
                </Button>
                {editId && (
                  <Button variant="ghost" onClick={() => setEditId(null)} disabled={isSaving} type="button">
                    Cancel
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </form>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Yards</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {isLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : yards.length === 0 ? (
              <p className="text-sm text-muted-foreground">No yards yet. Add one above.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2">Name</th>
                      <th className="text-left py-2 px-2">Address</th>
                      <th className="text-left py-2 px-2">Contact</th>
                      <th className="text-left py-2 px-2">Notes</th>
                      <th className="text-left py-2 px-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yards.map((yard) => (
                      <tr key={yard.id} className="border-b">
                        <td className="py-2 px-2">{yard.name}</td>
                        <td className="py-2 px-2">{yard.address || "-"}</td>
                        <td className="py-2 px-2">{yard.contact || "-"}</td>
                        <td className="py-2 px-2">{yard.notes || "-"}</td>
                        <td className="py-2 px-2">
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon" onClick={() => startEdit(yard)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteYard(yard.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
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
      </div>
    </div>
  )
}
