import { ComicImageGenerator } from "@/components/comic-image-generator"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">Comic Image Generator</h1>
            <p className="text-muted-foreground">Describe your idea and we'll create a comic-style image for you</p>
          </div>
          <ComicImageGenerator />
        </div>
      </div>
    </main>
  )
}
