import { NextRequest, NextResponse } from 'next/server'
import { normaliseUnit, parseAmount } from '@/lib/utils'

export const runtime = 'nodejs'
export const maxDuration = 30

interface ParsedRecipe {
  name: string
  category: 'Main' | 'Side' | 'Brunch'
  source: string
  servings: number
  prepTimeMins: number | null
  cookTimeMins: number | null
  ingredients: Array<{
    name: string
    amount: number
    unit: string
    unitFlagged: boolean
    originalText: string
    confidence: 'high' | 'medium' | 'low'
  }>
  steps: string[]
  confidence: number
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('image') as File | null
    if (!file) return NextResponse.json({ error: 'No image provided' }, { status: 400 })

    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const mimeType = file.type

    // ── STEP 1: Google Cloud Vision OCR ─────────────────────────────────────
    let rawText = ''
    let ocrConfidence = 0.9

    if (process.env.GOOGLE_VISION_API_KEY) {
      const visionRes = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_VISION_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requests: [{
              image: { content: base64 },
              features: [{ type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 }],
            }]
          }),
        }
      )
      const visionData = await visionRes.json()
      rawText = visionData.responses?.[0]?.fullTextAnnotation?.text ?? ''
      const pages = visionData.responses?.[0]?.fullTextAnnotation?.pages ?? []
      ocrConfidence = pages[0]?.confidence ?? 0.9
    } else {
      // Mock OCR text when no Vision API key — useful for dev
      rawText = `Roast Chicken\nServes 4\nPrep: 15 mins | Cook: 90 mins\n\nIngredients:\n1.5kg whole chicken\n2 tbsp olive oil\n4 cloves garlic\n1 handful fresh herbs\n1 lemon\nsalt and pepper to taste\n\nMethod:\n1. Preheat oven to 200°C\n2. Rub chicken with oil and season well\n3. Stuff cavity with garlic, herbs and lemon\n4. Roast for 90 minutes until juices run clear`
      ocrConfidence = 0.95
    }

    if (ocrConfidence < 0.4) {
      return NextResponse.json({ error: 'Image quality too low — try a clearer photo', ocrConfidence }, { status: 422 })
    }

    // ── STEP 2: GPT-4o structured extraction ─────────────────────────────────
    const openaiKey = process.env.OPENAI_API_KEY
    if (!openaiKey) {
      // Return a mock parsed result in dev mode
      return NextResponse.json(mockParsedResult(rawText, ocrConfidence))
    }

    const prompt = `You are a recipe parser. Extract the recipe from the following OCR text and return ONLY valid JSON matching this exact schema — no markdown, no extra text:

{
  "name": string,
  "category": "Main" | "Side" | "Brunch",
  "source": string | null,
  "servings": number,
  "prepTimeMins": number | null,
  "cookTimeMins": number | null,
  "ingredients": [
    {
      "name": string,
      "amount": number,
      "unit": string,
      "originalText": string,
      "confidence": "high" | "medium" | "low"
    }
  ],
  "steps": string[]
}

Rules:
- category: infer from content (Brunch if eggs/morning/brunch keywords; Side if a salad/veg side; else Main)
- Convert fractions to decimals: 1/2 → 0.5, ¼ → 0.25
- Average ranges: "2-3 cups" → 2.5
- Mark confidence "low" if amount is vague (handful, pinch, to taste)
- source: extract author or book title if visible, else null

OCR TEXT:
${rawText}`

    const gptRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1500,
        temperature: 0.1,
      }),
    })

    const gptData = await gptRes.json()
    const rawJson = gptData.choices?.[0]?.message?.content ?? '{}'
    let parsed: ParsedRecipe

    try {
      parsed = JSON.parse(rawJson.replace(/```json|```/g, '').trim())
    } catch {
      return NextResponse.json({ error: 'Failed to parse recipe — please try manual entry' }, { status: 422 })
    }

    // ── STEP 3: Unit normalisation ────────────────────────────────────────────
    parsed.ingredients = parsed.ingredients.map(ing => {
      const { unit, flagged } = normaliseUnit(ing.unit)
      return {
        ...ing,
        unit,
        unitFlagged: flagged,
        confidence: flagged ? 'low' : ing.confidence,
      }
    })

    return NextResponse.json({ ...parsed, ocrConfidence })

  } catch (err) {
    console.error('OCR error:', err)
    return NextResponse.json({ error: 'Processing failed — please try again' }, { status: 500 })
  }
}

function mockParsedResult(rawText: string, confidence: number): ParsedRecipe & { ocrConfidence: number } {
  return {
    name: 'Roast Chicken',
    category: 'Main',
    source: 'User upload',
    servings: 4,
    prepTimeMins: 15,
    cookTimeMins: 90,
    ingredients: [
      { name: 'Whole chicken', amount: 1.5, unit: 'kg',     unitFlagged: false, originalText: '1.5kg whole chicken',  confidence: 'high'   },
      { name: 'Olive oil',     amount: 2,   unit: 'tbsp',   unitFlagged: false, originalText: '2 tbsp olive oil',     confidence: 'high'   },
      { name: 'Garlic',        amount: 4,   unit: 'cloves', unitFlagged: false, originalText: '4 cloves garlic',      confidence: 'high'   },
      { name: 'Fresh herbs',   amount: 1,   unit: 'handful',unitFlagged: true,  originalText: '1 handful fresh herbs', confidence: 'low'   },
      { name: 'Lemon',         amount: 1,   unit: 'each',   unitFlagged: false, originalText: '1 lemon',              confidence: 'high'   },
    ],
    steps: [
      'Preheat oven to 200°C',
      'Rub chicken with oil and season well',
      'Stuff cavity with garlic, herbs and lemon',
      'Roast for 90 minutes until juices run clear',
    ],
    ocrConfidence: confidence,
  }
}
