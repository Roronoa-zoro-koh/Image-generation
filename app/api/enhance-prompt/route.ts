import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { description } = await request.json()

    if (!description) {
      return NextResponse.json({ error: "Description is required" }, { status: 400 })
    }

    const openRouterApiKey = process.env.OPENROUTER_API_KEY
    if (!openRouterApiKey) {
      return NextResponse.json({ error: "OpenRouter API key not configured" }, { status: 500 })
    }

    console.log("[v0] API key exists:", !!openRouterApiKey)
    console.log("[v0] API key length:", openRouterApiKey.length)
    console.log("[v0] API key starts with:", openRouterApiKey.substring(0, 10) + "...")

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openRouterApiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "X-Title": "Comic Image Generator",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "system",
            content:
              "You are an expert at creating detailed, vivid prompts for comic-style image generation. Transform user descriptions into rich, detailed prompts that will produce high-quality comic book style artwork. Include specific details about art style, colors, composition, and visual elements that make for compelling comic book imagery.",
          },
          {
            role: "user",
            content: `Transform this description into a detailed comic-style image generation prompt: "${description}"`,
          },
        ],
        max_tokens: 200,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[v0] OpenRouter API error: ${response.status} - ${errorText}`)
      console.error(`[v0] Request headers:`, {
        Authorization: `Bearer ${openRouterApiKey.substring(0, 10)}...`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "X-Title": "Comic Image Generator",
      })
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    const enhancedPrompt = data.choices[0]?.message?.content

    if (!enhancedPrompt) {
      console.error("OpenRouter response:", data)
      throw new Error("No enhanced prompt received")
    }

    return NextResponse.json({ enhancedPrompt })
  } catch (error) {
    console.error("Error enhancing prompt:", error)
    return NextResponse.json({ error: "Failed to enhance prompt" }, { status: 500 })
  }
}
