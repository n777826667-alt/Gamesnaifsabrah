import { NextResponse } from "next/server"

// In-memory storage for demo (in production, use a database)
let results: Array<{ food: string; timestamp: Date }> = []

export async function POST(request: Request) {
  try {
    const { food } = await request.json()

    if (!food) {
      return NextResponse.json({ success: false, error: "Food is required" }, { status: 400 })
    }

    // Save the result
    results.push({
      food,
      timestamp: new Date(),
    })

    return NextResponse.json({
      success: true,
      message: "Result saved successfully",
      totalResults: results.length,
    })
  } catch (error) {
    console.error("Save result error:", error)
    return NextResponse.json({ success: false, error: "Failed to save result" }, { status: 500 })
  }
}

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      results,
      totalResults: results.length,
    })
  } catch (error) {
    console.error("Get results error:", error)
    return NextResponse.json({ success: false, error: "Failed to get results" }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    results = []
    return NextResponse.json({
      success: true,
      message: "All results cleared successfully",
    })
  } catch (error) {
    console.error("Clear results error:", error)
    return NextResponse.json({ success: false, error: "Failed to clear results" }, { status: 500 })
  }
}
