import { NextResponse } from "next/server"

// Simulated AI model predictions based on the Python code logic
const foods = ["بيتزا", "سلطه", "كتكوت", "طماط", "بقره", "بيبار", "سمكة", "جزر", "جمبري", "ذرة"]

const predictionPatterns: { [key: string]: Array<{ food: string; probability: number }> } = {
  كتكوت: [
    { food: "جمبري", probability: 35.2 },
    { food: "جزر", probability: 28.7 },
    { food: "ذرة", probability: 22.1 },
    { food: "بيبار", probability: 8.5 },
    { food: "طماط", probability: 5.5 },
  ],
  طماط: [
    { food: "جزر", probability: 42.8 },
    { food: "بيبار", probability: 31.5 },
    { food: "ذرة", probability: 18.9 },
    { food: "كتكوت", probability: 4.2 },
    { food: "جمبري", probability: 2.6 },
  ],
  بقره: [
    { food: "جمبري", probability: 38.4 },
    { food: "طماط", probability: 29.6 },
    { food: "ذرة", probability: 21.3 },
    { food: "جزر", probability: 6.8 },
    { food: "بيبار", probability: 3.9 },
  ],
  بيبار: [
    { food: "جزر", probability: 45.7 },
    { food: "ذرة", probability: 32.1 },
    { food: "طماط", probability: 15.8 },
    { food: "كتكوت", probability: 4.1 },
    { food: "جمبري", probability: 2.3 },
  ],
  سمكة: [
    { food: "طماط", probability: 41.2 },
    { food: "جزر", probability: 28.9 },
    { food: "بقره", probability: 19.4 },
    { food: "ذرة", probability: 6.7 },
    { food: "بيبار", probability: 3.8 },
  ],
  جزر: [
    { food: "بيبار", probability: 39.6 },
    { food: "ذرة", probability: 33.2 },
    { food: "طماط", probability: 18.7 },
    { food: "جمبري", probability: 5.3 },
    { food: "كتكوت", probability: 3.2 },
  ],
  جمبري: [
    { food: "بيبار", probability: 36.8 },
    { food: "طماط", probability: 31.4 },
    { food: "جزر", probability: 22.9 },
    { food: "ذرة", probability: 5.8 },
    { food: "كتكوت", probability: 3.1 },
  ],
  ذرة: [
    { food: "جزر", probability: 44.3 },
    { food: "بيبار", probability: 29.7 },
    { food: "طماط", probability: 17.2 },
    { food: "جمبري", probability: 5.9 },
    { food: "كتكوت", probability: 2.9 },
  ],
  بيتزا: [
    { food: "سلطه", probability: 52.1 },
    { food: "كتكوت", probability: 28.4 },
    { food: "طماط", probability: 12.8 },
    { food: "جزر", probability: 4.2 },
    { food: "ذرة", probability: 2.5 },
  ],
  سلطه: [
    { food: "ذرة", probability: 41.7 },
    { food: "طماط", probability: 33.9 },
    { food: "جزر", probability: 18.6 },
    { food: "بيبار", probability: 3.9 },
    { food: "كتكوت", probability: 1.9 },
  ],
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const count = Number.parseInt(searchParams.get("count") || "3")

    // Simulate AI model prediction for all foods
    const predictions: { [key: string]: Array<{ food: string; probability: number }> } = {}

    foods.forEach((food) => {
      const foodPredictions = predictionPatterns[food] || [
        { food: "جزر", probability: 25.0 },
        { food: "طماط", probability: 20.0 },
        { food: "ذرة", probability: 15.0 },
        { food: "بيبار", probability: 10.0 },
        { food: "كتكوت", probability: 5.0 },
      ]

      predictions[food] = foodPredictions.slice(0, count)
    })

    return NextResponse.json({
      success: true,
      predictions,
    })
  } catch (error) {
    console.error("Prediction error:", error)
    return NextResponse.json({ success: false, error: "Failed to get predictions" }, { status: 500 })
  }
}
