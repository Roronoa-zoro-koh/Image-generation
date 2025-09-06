"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Download, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface GeneratedImage {
  url: string
  prompt: string
  enhancedPrompt: string
  timestamp: number
}

export function ComicImageGenerator() {
  const [description, setDescription] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null)
  const [history, setHistory] = useState<GeneratedImage[]>([])

  const handleGenerate = async () => {
    if (!description.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      // Step 1: Enhance the prompt using OpenRouter
      const enhanceResponse = await fetch("/api/enhance-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: description.trim() }),
      })

      if (!enhanceResponse.ok) {
        throw new Error("Failed to enhance prompt")
      }

      const { enhancedPrompt } = await enhanceResponse.json()

      // Step 2: Generate the image
      const imageResponse = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: enhancedPrompt }),
      })

      if (!imageResponse.ok) {
        throw new Error("Failed to generate image")
      }

      const { imageUrl } = await imageResponse.json()

      const newImage: GeneratedImage = {
        url: imageUrl,
        prompt: description.trim(),
        enhancedPrompt,
        timestamp: Date.now(),
      }

      setGeneratedImage(newImage)
      setHistory((prev) => [newImage, ...prev.slice(0, 4)]) // Keep last 5 images

      // Save to localStorage
      localStorage.setItem("comic-generator-history", JSON.stringify([newImage, ...history.slice(0, 4)]))
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = async (imageUrl: string, filename: string) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${filename}.png`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError("Failed to download image")
    }
  }

  // Load history from localStorage on component mount
  useState(() => {
    const savedHistory = localStorage.getItem("comic-generator-history")
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory))
      } catch (err) {
        console.error("Failed to load history:", err)
      }
    }
  })

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
                Describe your comic image
              </label>
              <Textarea
                id="description"
                placeholder="A superhero flying over a city at sunset, comic book style..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[100px] resize-none"
                disabled={isLoading}
              />
            </div>
            <Button onClick={handleGenerate} disabled={!description.trim() || isLoading} className="w-full" size="lg">
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Comic Image"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Generated Image Display */}
      {generatedImage && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="text-center">
                <img
                  src={generatedImage.url || "/placeholder.svg"}
                  alt={generatedImage.prompt}
                  className="max-w-full h-auto rounded-lg shadow-lg mx-auto"
                />
              </div>
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 space-y-2">
                  <div>
                    <h3 className="font-medium text-sm text-foreground">Original Prompt:</h3>
                    <p className="text-sm text-muted-foreground">{generatedImage.prompt}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-foreground">Enhanced Prompt:</h3>
                    <p className="text-sm text-muted-foreground">{generatedImage.enhancedPrompt}</p>
                  </div>
                </div>
                <Button
                  onClick={() => handleDownload(generatedImage.url, `comic-${generatedImage.timestamp}`)}
                  variant="outline"
                  size="sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* History Section */}
      {history.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-medium text-foreground mb-4">Recent Generations</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {history.map((item, index) => (
                <div key={item.timestamp} className="space-y-2">
                  <img
                    src={item.url || "/placeholder.svg"}
                    alt={item.prompt}
                    className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setGeneratedImage(item)}
                  />
                  <p className="text-xs text-muted-foreground truncate">{item.prompt}</p>
                  <Button
                    onClick={() => handleDownload(item.url, `comic-${item.timestamp}`)}
                    variant="ghost"
                    size="sm"
                    className="w-full"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
