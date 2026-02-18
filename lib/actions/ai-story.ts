"use server"

import { GoogleGenerativeAI } from "@google/generative-ai"

export interface StoryGenerationOptions {
  title: string
  description: string
  difficulty: string
  genre: string
  topic: string
  setting: string
  temperature: number
}

const GENRE_GUIDANCE: Record<string, string> = {
  Adventure: "Create an exciting journey with challenges, exploration, and discovery. Include elements of bravery and problem-solving.",
  "Sci-Fi": "Incorporate futuristic technology and scientific concepts. Blend education with innovation and imagination.",
  Fantasy: "Weave magical elements, mythical creatures, and enchanted worlds. Make learning feel like a magical quest.",
  "Real-World": "Use contemporary, relatable scenarios students might actually encounter. Ground the learning in practical everyday contexts.",
}

export async function generateQuestStory(options: StoryGenerationOptions): Promise<{ title: string; content: string }[]> {
  try {
    const apiKey = process.env.GOOGLE_AI_API_KEY

    if (!apiKey) {
      throw new Error("Google AI API key not configured. Please add GOOGLE_AI_API_KEY to your .env.local file.")
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    
    // Try these models in order - based on what's available in Philippines region
    const modelNames = [
      "gemini-2.0-flash-exp",     // Gemini 3 Flash Preview
      "gemini-2.5-flash",          // Gemini 2.5 Flash
      "gemini-1.5-flash",          // Fallback to older version
      "gemini-2.5-pro",            // Gemini 2.5 Pro
      "gemini-1.5-pro"             // Fallback
    ]
    
    let model
    let lastError
    
    // Try each model until one works
    for (const modelName of modelNames) {
      try {
        console.log(`🔄 Trying model: ${modelName}`)
        model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: { temperature: options.temperature },
        })
        
        // Quick test to see if model is accessible
        await model.generateContent("test")
        console.log(`✅ Successfully loaded model: ${modelName}`)
        break
      } catch (error) {
        console.log(`❌ Model ${modelName} not available, trying next...`)
        lastError = error
        continue
      }
    }
    
    if (!model) {
      throw new Error(`No available models found. Last error: ${lastError}. Please check Google AI Studio for available models in your region.`)
    }

    const genreGuide = GENRE_GUIDANCE[options.genre] || "Create an engaging narrative that supports the learning objectives."

    const prompt = `You are a creative storyteller for educational quests. Create an engaging story with the following specifications:

Quest Title: ${options.title}
Quest Description: ${options.description}
Difficulty Level: ${options.difficulty}

STORY SPECIFICATIONS:
Genre: ${options.genre}
Genre Guidance: ${genreGuide}
Learning Topic / Context: ${options.topic}
Setting: ${options.setting || "Not specified — choose something fitting for the genre and topic."}

Generate 2-3 story segments that will engage learners and set the context for this quest. Each segment should:
- Be 100-200 words long
- Build excitement and curiosity
- Connect directly to the learning topic: "${options.topic}"
- Match the ${options.genre} genre style described above
- Be appropriate for learners at ${options.difficulty} level
${options.setting ? `- Take place in: ${options.setting}` : ""}

IMPORTANT: Return ONLY valid JSON in this exact format, with no markdown formatting, no code blocks, no extra text:
{
  "stories": [
    {
      "title": "Story Segment Title",
      "content": "Story content here..."
    }
  ]
}

Make it exciting, educational, and perfectly tailored to the specifications above!`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    console.log("✅ AI Response received")

    // Clean the response - remove markdown code blocks if present
    let cleanedText = text.trim()
    cleanedText = cleanedText.replace(/```json\n?/g, "")
    cleanedText = cleanedText.replace(/```\n?/g, "")
    cleanedText = cleanedText.trim()

    // Try to extract JSON from the response
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error("❌ Failed to extract JSON from response:", cleanedText)
      throw new Error("Failed to parse AI response. The AI didn't return valid JSON.")
    }

    const parsed = JSON.parse(jsonMatch[0])
    
    if (!parsed.stories || !Array.isArray(parsed.stories)) {
      throw new Error("Invalid AI response format. Missing 'stories' array.")
    }

    if (parsed.stories.length === 0) {
      throw new Error("AI returned no story segments.")
    }

    console.log(`✅ Successfully generated ${parsed.stories.length} story segments`)
    return parsed.stories
  } catch (error) {
    console.error("❌ Error generating story with AI:", error)
    
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase()
      
      if (errorMessage.includes("api key") || errorMessage.includes("api_key_invalid")) {
        throw new Error("Invalid or missing API key. Please check your GOOGLE_AI_API_KEY in .env.local")
      }
      if (errorMessage.includes("404") || errorMessage.includes("not found")) {
        throw new Error("Model not available. Please go to Google AI Studio > Get code to find the exact model name for your region.")
      }
      if (errorMessage.includes("403") || errorMessage.includes("permission")) {
        throw new Error("Permission denied. Your API key might not have access to Gemini models.")
      }
      if (errorMessage.includes("429") || errorMessage.includes("quota")) {
        throw new Error("Rate limit exceeded. Please wait a moment and try again.")
      }
      
      throw new Error(error.message)
    }
    
    throw new Error("Failed to generate story. Please try again.")
  }
}