"use client"

import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { Navbar } from "@/components/layout/navbar"
import { ContainerForm } from "@/components/containers/container-form"
import { useContainers } from "@/lib/hooks/use-containers"
import { Loader2 } from "lucide-react"

export default function EditContainerPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const from = searchParams.get("from")
  const backTarget = from === "board" ? "/board" : "/dashboard"
  const { containers, isLoading: isFetching, updateContainer } = useContainers()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const container = containers.find((c) => c.id === params.id)

  const handleSubmit = async (data: any) => {
    setIsLoading(true)
    setError("")
    try {
      await updateContainer(params.id as string, data)
      router.push(backTarget)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update container")
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetching) {
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
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-4xl font-bold mb-10">Edit Container</h1>
        <ContainerForm initialData={container} onSubmit={handleSubmit} isLoading={isLoading} error={error} />
      </div>
    </div>
  )
}
