import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    // Using Replicate for image generation (you can switch to other services)
    const replicateApiKey = process.env.REPLICATE_API_TOKEN
    if (!replicateApiKey) {
      return NextResponse.json({ error: "Replicate API key not configured" }, { status: 500 })
    }

    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Token ${replicateApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4", // SDXL model
        input: {
          prompt: `${prompt}, comic book style, vibrant colors, bold lines, dynamic composition`,
          negative_prompt: "blurry, low quality, distorted, ugly, bad anatomy",
          width: 1024,
          height: 1024,
          num_inference_steps: 25,
          guidance_scale: 7.5,
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`Replicate API error: ${response.status}`)
    }

    const prediction = await response.json()

    // Poll for completion
    let imageUrl = null
    let attempts = 0
    const maxAttempts = 30 // 30 seconds timeout

    while (!imageUrl && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 1000)) // Wait 1 second

      const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: {
          Authorization: `Token ${replicateApiKey}`,
        },
      })

      if (statusResponse.ok) {
        const statusData = await statusResponse.json()

        if (statusData.status === "succeeded" && statusData.output) {
          imageUrl = Array.isArray(statusData.output) ? statusData.output[0] : statusData.output
        } else if (statusData.status === "failed") {
          throw new Error("Image generation failed")
        }
      }

      attempts++
    }

    if (!imageUrl) {
      throw new Error("Image generation timed out")
    }

    return NextResponse.json({ imageUrl })
  } catch (error) {
    console.error("Error generating image:", error)
    return NextResponse.json({ error: "Failed to generate image" }, { status: 500 })
  }
}
