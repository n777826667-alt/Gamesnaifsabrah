"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

// Food items from the Python model
const foods = ["بيتزا", "سلطه", "كتكوت", "طماط", "بقره", "بيبار", "سمكة", "جزر", "جمبري", "ذرة"]

// Food positions around the wheel (clock positions)
const foodPositions = {
  كتكوت: { angle: 0, position: "12:00" }, // 12 o'clock
  طماط: { angle: 45, position: "1:30" }, // 1:30
  بقره: { angle: 90, position: "3:00" }, // 3 o'clock
  بيبار: { angle: 135, position: "4:30" }, // 4:30
  سمكة: { angle: 180, position: "6:00" }, // 6 o'clock
  جزر: { angle: 225, position: "7:30" }, // 7:30
  جمبري: { angle: 270, position: "9:00" }, // 9 o'clock
  ذرة: { angle: 315, position: "10:30" }, // 10:30
}

interface Prediction {
  food: string
  probability: number
}

interface PredictionResult {
  [key: string]: Prediction[]
}

export default function FoodWheelPage() {
  const [predictions, setPredictions] = useState<PredictionResult>({})
  const [selectedFood, setSelectedFood] = useState<string | null>(null)
  const [results, setResults] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showPopup, setShowPopup] = useState(false)
  const [popupFood, setPopupFood] = useState("")
  const [showMeatPopup, setShowMeatPopup] = useState(false)
  const [showMeatClickPopup, setShowMeatClickPopup] = useState(false)
  const [showMeatWarningPopup, setShowMeatWarningPopup] = useState(false)
  const [showProbabilityMessage, setShowProbabilityMessage] = useState(false)
  const [probabilityMessageFoods, setProbabilityMessageFoods] = useState<string[]>([])

  const getPatternPredictions = (sequence: string[]): PredictionResult => {
    const sequenceStr = sequence.join("→")
    const lastFew = sequence.slice(-5).join("→")
    const lastFour = sequence.slice(-4).join("→")
    const lastThree = sequence.slice(-3).join("→")
    const lastTwo = sequence.slice(-2).join("→")
    const lastOne = sequence.slice(-1)[0]

    // Pattern matching for specific sequences
    const patterns: { [key: string]: string[] } = {
      // New patterns for dark red highlighting
      جمبري: ["سمكة"], // When clicking shrimp, highlight fish
      "جزر→جزر": ["جمبري", "سمكة"], // When clicking carrot→carrot, highlight shrimp & fish

      "بيبار→ذرة→بيبار": ["ذرة", "جزر"],
      "ذرة→بيبار→ذرة": ["طماط", "جزر"],
      "طماط→جزر→طماط": ["بيبار", "ذرة"],
      "جزر→طماط→جزر": ["ذرة", "بيبار"],

      // Existing patterns
      "بيبار→ذرة→بيبار→ذرة→بيبار": ["جمبري", "بقره"],
      "طماط→جزر": ["سمكة", "جمبري", "بقره"],
      "ذرة→ذرة→ذرة→ذرة": ["كتكوت", "بقره", "سمكة", "جمبري"],
      "بيبار→بيبار→ذرة": ["سمكة", "جمبري", "بقره", "كتكوت"],
      "طماط→طماط→جزر": ["سمكة", "جمبري", "بقره", "كتكوت"],
      "جزر→طماط": ["سمكة", "جمبري", "بقره", "كتكوت"],
      "ذرة→ذرة→بيبار": ["سمكة", "جمبري", "بقره", "كتكوت"],
      "بيبار→ذرة": ["سمكة", "جمبري", "بقره", "كتكوت"],
      "ذرة→بيبار": ["سمكة", "جمبري", "بقره", "كتكوت"],
      "جزر→جزر→طماط": ["سمكة", "جمبري", "بقره", "كتكوت"],
      "جزر→جزر→جزر→طماط": ["سمكة", "جمبري", "بقره", "كتكوت"],
      "بيبار→بيبار→بيبار→ذرة": ["سمكة", "جمبري", "بقره", "كتكوت"],
      "طماط→طماط→طماط→ذرة": ["سمكة", "جمبري", "بقره", "كتكوت"],
    }

    // Check for pattern matches - prioritize longer patterns first
    let matchedFoods: string[] = []

    if (patterns[lastOne]) {
      matchedFoods = patterns[lastOne]
    } else if (patterns[lastFew]) {
      matchedFoods = patterns[lastFew]
    } else if (patterns[lastFour]) {
      matchedFoods = patterns[lastFour]
    } else if (patterns[lastThree]) {
      matchedFoods = patterns[lastThree]
    } else if (patterns[lastTwo]) {
      matchedFoods = patterns[lastTwo]
    }

    if (matchedFoods.length > 0) {
      const result: PredictionResult = {}
      const lastFood = sequence[sequence.length - 1]

      // Create predictions for the last clicked food
      const predictions: Prediction[] = matchedFoods.map((food, index) => ({
        food,
        probability: 80 - index * 15, // Decreasing probabilities: 80%, 65%, 50%, 35%
      }))

      // For patterns that require removing highlighting from other foods
      const patternsWithReduction = [
        "ذرة→ذرة→ذرة→ذرة",
        "طماط→طماط→جزر",
        "جزر→طماط",
        "ذرة→ذرة→بيبار",
        "بيبار→ذرة",
        "ذرة→بيبار",
        "طماط→جزر",
        "جزر→جزر→طماط",
        "جزر→جزر→جزر→طماط",
        "بيبار→بيبار→بيبار→ذرة",
        "طماط→طماط→طماط→ذرة",
      ]

      const shouldReduceHighlighting = patternsWithReduction.some(
        (pattern) => lastFew === pattern || lastFour === pattern || lastThree === pattern || lastTwo === pattern,
      )

      if (shouldReduceHighlighting && predictions.length > 3) {
        // Keep only 3 predictions for patterns that require reduction
        predictions.splice(3)
      } else if (lastFour === "ذرة→ذرة→ذرة→ذرة") {
        // Special case: remove highlighting from one other food
        predictions.splice(3, 1)
      }

      result[lastFood] = predictions
      return result
    }

    return {}
  }

  const checkProbabilityMessage = (sequence: string[]): string[] => {
    const lastTwo = sequence.slice(-2).join("→")
    const lastThree = sequence.slice(-3).join("→")
    const lastFour = sequence.slice(-4).join("→")

    // Pattern messages for "احتمال" above specific foods
    const probabilityPatterns: { [key: string]: string[] } = {
      "جزر→ذرة→جزر→ذرة": ["بقره", "جمبري"],
      "بيبار→طماط→بيبار→طماط": ["بقره", "جمبري"],

      // New patterns from user requirements
      "ذرة→ذرة": ["جمبري", "سمكة"],
      "بيبار→بيبار": ["بقره", "كتكوت"],
      "طماط→طماط": ["جمبري", "بقره"],
      "ذرة→بيبار": ["ذرة", "بيبار"],
      "بيبار→ذرة": ["بيبار", "ذرة"],
      "طماط→جزر": ["جزر"],
      "جزر→طماط": ["طماط"],

      // Existing patterns
      "ذرة→ذرة→بيبار": ["طماط", "جزر"],
      "ذرة→ذرة→ذرة→بيبار": ["طماط", "جزر"],
      "بيبار→بيبار→ذرة": ["طماط", "جزر"],
      "بيبار→بيبار→بيبار→ذرة": ["طماط", "جزر"],
      "طماط→طماط→جزر": ["ذرة", "بيبار"],
      "طماط→طماط→طماط→جزر": ["ذرة", "بيبار"],
      "جزر→جزر→طماط": ["ذرة", "بيبار"],
      "جزر→جزر→جزر→طماط": ["ذرة", "بيبار"],
    }

    if (probabilityPatterns[lastFour]) {
      return probabilityPatterns[lastFour]
    } else if (probabilityPatterns[lastThree]) {
      return probabilityPatterns[lastThree]
    } else if (probabilityPatterns[lastTwo]) {
      return probabilityPatterns[lastTwo]
    }

    return []
  }

  const getFoodPosition = (food: string) => {
    const pos = foodPositions[food as keyof typeof foodPositions]
    if (!pos) return { top: "50%", left: "50%" }

    const radius = 120 // Distance from center - reduced for smaller circle
    const angleRad = (pos.angle - 90) * (Math.PI / 180) // Convert to radians, adjust for top start
    const x = Math.cos(angleRad) * radius
    const y = Math.sin(angleRad) * radius

    return {
      top: `calc(50% + ${y}px)`,
      left: `calc(50% + ${x}px)`,
      transform: "translate(-50%, -50%)",
    }
  }

  const getFoodHighlight = (food: string) => {
    if (!selectedFood || !predictions[selectedFood]) return ""

    const prediction = predictions[selectedFood].find((p) => p.food === food)
    if (!prediction) return ""

    const opacity = Math.max(prediction.probability / 100, 0.3) // Minimum 30% opacity
    if (prediction.probability > 50) {
      return `rgba(255, 0, 0, ${opacity})` // Strong red for high probability
    } else if (prediction.probability > 25) {
      return `rgba(255, 165, 0, ${opacity})` // Orange for medium probability
    } else {
      return `rgba(255, 255, 0, ${opacity})` // Yellow for low probability
    }
  }

  const getFoodBorder = (food: string) => {
    if (!selectedFood || !predictions[selectedFood]) return "4px solid #fff"

    const prediction = predictions[selectedFood].find((p) => p.food === food)
    if (!prediction) return "4px solid #fff"

    const meatFoods = ["كتكوت", "جمبري", "بقره", "سمكة"]
    if (meatFoods.includes(food) && prediction.probability > 0) {
      return "6px solid #8B0000" // Dark red border for meat foods
    }

    if (prediction.probability > 50) {
      return "6px solid #ff0000" // Thick red border for high probability
    } else if (prediction.probability > 25) {
      return "5px solid #ffa500" // Medium orange border
    } else if (prediction.probability > 10) {
      return "4px solid #ffff00" // Yellow border for low probability
    } else if (prediction.probability > 0) {
      return "3px dashed #888888" // Dashed gray border for very low probability
    }
    return "4px solid #fff" // Default white border
  }

  const getFoodShadow = (food: string) => {
    if (!selectedFood || !predictions[selectedFood]) return "0 4px 8px rgba(0,0,0,0.3)"

    const prediction = predictions[selectedFood].find((p) => p.food === food)
    if (!prediction) return "0 4px 8px rgba(0,0,0,0.3)"

    const meatFoods = ["كتكوت", "جمبري", "بقره", "سمكة"]
    const lastTwo = results.slice(-2).join("→")
    const lastOne = results.slice(-1)[0]

    const isDarkRedPattern =
      (lastOne === "جمبري" && food === "سمكة") || (lastTwo === "جزر→جزر" && (food === "جمبري" || food === "سمكة"))

    if (isDarkRedPattern && prediction.probability > 0) {
      return "0 0 80px rgba(139, 0, 0, 1), 0 0 160px rgba(139, 0, 0, 0.9), 0 0 240px rgba(139, 0, 0, 0.7), 0 0 320px rgba(139, 0, 0, 0.5)" // Extra intense dark red glow
    } else if (meatFoods.includes(food) && prediction.probability > 0) {
      return "0 0 60px rgba(139, 0, 0, 1), 0 0 120px rgba(139, 0, 0, 0.8), 0 0 180px rgba(139, 0, 0, 0.6), 0 0 240px rgba(139, 0, 0, 0.4)" // Intense dark red glow for meat foods
    }

    if (prediction.probability > 50) {
      return "0 0 50px rgba(255, 0, 0, 0.9), 0 0 100px rgba(255, 0, 0, 0.6), 0 0 150px rgba(255, 0, 0, 0.3)" // Much stronger red glow
    } else if (prediction.probability > 25) {
      return "0 0 40px rgba(255, 165, 0, 0.8), 0 0 80px rgba(255, 165, 0, 0.5), 0 0 120px rgba(255, 165, 0, 0.3)" // Enhanced orange glow
    } else {
      return "0 0 35px rgba(255, 255, 0, 0.7), 0 0 70px rgba(255, 255, 0, 0.4), 0 0 105px rgba(255, 255, 0, 0.2)" // Enhanced yellow glow
    }
  }

  const getLowProbabilityIndicator = (food: string) => {
    if (!selectedFood || !predictions[selectedFood]) return null

    const prediction = predictions[selectedFood].find((p) => p.food === food)
    if (!prediction || prediction.probability > 10) return null

    // Show additional circle indicator for very low probability foods (0-10%)
    return (
      <div
        className="absolute inset-0 rounded-full border-2 border-dashed border-gray-400 animate-pulse"
        style={{
          transform: "scale(1.3)", // Make it slightly larger than the food image
          zIndex: -1,
        }}
      />
    )
  }

  useEffect(() => {
    getPredictions()
  }, [])

  const getPredictions = async () => {
    setIsLoading(true)
    try {
      const patternPredictions = getPatternPredictions(results)

      if (Object.keys(patternPredictions).length > 0) {
        setPredictions(patternPredictions)

        if (selectedFood && patternPredictions[selectedFood]) {
          const meatFoods = ["سمكة", "بقره", "كتكوت", "جمبري"]
          const hasMeatPrediction = patternPredictions[selectedFood].some(
            (pred: Prediction) => meatFoods.includes(pred.food) && pred.probability > 0,
          )

          if (hasMeatPrediction) {
            setShowPopup(false)
            setShowMeatPopup(true)
          }
        }
      } else {
        // Fall back to API predictions if no pattern match
        const response = await fetch("/api/predict?count=3")
        const data = await response.json()
        setPredictions(data.predictions)

        if (selectedFood && data.predictions[selectedFood]) {
          const meatFoods = ["سمكة", "بقره", "كتكوت", "جمبري"]
          const hasMeatPrediction = data.predictions[selectedFood].some(
            (pred: Prediction) => meatFoods.includes(pred.food) && pred.probability > 0,
          )

          if (hasMeatPrediction) {
            setShowPopup(false)
            setShowMeatPopup(true)
          }
        }
      }
    } catch (error) {
      console.error("Error getting predictions:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFoodClick = async (food: string) => {
    setShowPopup(false)
    setShowMeatPopup(false)
    setShowMeatClickPopup(false)
    setShowMeatWarningPopup(false)
    setShowProbabilityMessage(false)
    setProbabilityMessageFoods([])

    setSelectedFood(food)

    if (["بيبار", "طماط", "جزر", "ذرة"].includes(food)) {
      setPopupFood(food)
      setShowPopup(true)
    }

    if (["بقره", "كتكوت", "جمبري", "سمكة"].includes(food)) {
      setShowMeatWarningPopup(true)
    }

    try {
      await fetch("/api/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ food }),
      })

      const newResults = [...results, food]
      setResults(newResults)

      setIsLoading(true)

      // Check for pattern-based predictions with new sequence
      const patternPredictions = getPatternPredictions(newResults)

      const probabilityFoods = checkProbabilityMessage(newResults)
      if (probabilityFoods.length > 0) {
        setProbabilityMessageFoods(probabilityFoods)
        setShowProbabilityMessage(true)
        // Auto-hide after 10 seconds
        setTimeout(() => {
          setShowProbabilityMessage(false)
          setProbabilityMessageFoods([])
        }, 10000)
      }

      if (Object.keys(patternPredictions).length > 0) {
        setPredictions(patternPredictions)

        const meatFoods = ["بقره", "كتكوت", "جمبري", "سمكة"]
        const hasMeatPrediction =
          patternPredictions[food] &&
          patternPredictions[food].some((pred: Prediction) => meatFoods.includes(pred.food) && pred.probability > 0)

        if (hasMeatPrediction) {
          setShowPopup(false)
          setShowMeatPopup(true)
        }
      } else {
        // Fall back to API predictions
        const response = await fetch("/api/predict?count=3")
        const data = await response.json()
        setPredictions(data.predictions)
      }

      setIsLoading(false)
    } catch (error) {
      console.error("Error saving result:", error)
      setIsLoading(false)
    }
  }

  const clearResults = async () => {
    try {
      await fetch("/api/results", { method: "DELETE" })
      setResults([])
      setPredictions({})
      setShowProbabilityMessage(false)
      setProbabilityMessageFoods([])
    } catch (error) {
      console.error("Error clearing results:", error)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <video autoPlay loop muted playsInline className="absolute top-0 left-0 w-full h-full object-cover z-0">
        <source
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/995d39a878ffc35b5aa926d348d79b92-939eu4pQ4on0okHFYK06nF6K0x3NDY.mp4"
          type="video/mp4"
        />
      </video>

      <div className="absolute top-0 left-0 w-full h-full bg-black/30 z-5"></div>

      <div className="absolute top-0 left-0 right-0 z-20 p-6 text-center">
        <div className="relative">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-transparent bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 bg-clip-text mb-4 drop-shadow-2xl animate-pulse">
            الرجل الالكتروني اليمني
          </h1>
          <div className="absolute inset-0 text-3xl md:text-5xl lg:text-6xl text-white opacity-20 blur-sm animate-pulse">
            الرجل الالكتروني اليمني
          </div>
        </div>
        <div className="relative mt-2">
          <p className="text-lg md:text-xl lg:text-2xl text-yellow-300 font-semibold drop-shadow-lg animate-bounce">
            برمجه نايف صبره 777826667
          </p>
          <div className="absolute inset-0 text-lg md:text-xl lg:text-2xl text-red-400 opacity-30 blur-sm">
            برمجه نايف صبره 777826667
          </div>
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4 pt-32">
        <div className="relative mb-8">
          <img
            src="/عجلة_الطعام.png"
            alt="Food Wheel"
            className="w-80 h-80 md:w-96 md:h-96 lg:w-[480px] lg:h-[480px] object-contain"
          />

          {showMeatPopup && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
              <Card className="p-4 bg-yellow-400/95 backdrop-blur-sm border-2 border-yellow-600 shadow-2xl">
                <div className="text-center">
                  <p className="text-lg font-bold text-red-800">لاتنسى اللحوم</p>
                </div>
              </Card>
            </div>
          )}

          {showMeatWarningPopup && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
              <Card className="p-4 bg-red-600/95 backdrop-blur-sm border-2 border-red-800 shadow-2xl">
                <div className="text-center">
                  <p className="text-lg font-bold text-white">لاتراهن الجوله هذه</p>
                </div>
              </Card>
            </div>
          )}

          {showPopup && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
              <Card className="p-3 bg-red-600/95 backdrop-blur-sm border-2 border-yellow-400 shadow-2xl animate-pulse">
                <div className="text-center text-white">
                  <p className="text-base font-bold mb-2">لاتنسى ربما يعاود</p>
                  <p className="text-lg font-extrabold text-yellow-300">{popupFood}</p>
                </div>
              </Card>
            </div>
          )}

          {showProbabilityMessage &&
            probabilityMessageFoods.map((food, index) => {
              const position = getFoodPosition(food)
              return (
                <div
                  key={`probability-${food}-${index}`}
                  className="absolute z-40 pointer-events-none"
                  style={{
                    ...position,
                    transform: "translate(-50%, -150%)", // Position above the food
                  }}
                >
                  <Card className="p-2 bg-blue-400/95 backdrop-blur-sm border-2 border-blue-600 shadow-2xl animate-pulse">
                    <div className="text-center">
                      <p className="text-sm font-bold text-white whitespace-nowrap">احتمال</p>
                    </div>
                  </Card>
                </div>
              )
            })}

          {Object.entries(foodPositions).map(([food, _]) => (
            <button
              key={food}
              onClick={() => handleFoodClick(food)}
              className="absolute w-24 h-24 md:w-32 md:h-32 rounded-full shadow-lg transition-all duration-300 cursor-pointer"
              style={{
                ...getFoodPosition(food),
                boxShadow: getFoodShadow(food),
                border: getFoodBorder(food),
              }}
            >
              {getLowProbabilityIndicator(food)}
              <img
                src={
                  food === "طماط"
                    ? "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%D8%B7%D9%85%D8%A7%D8%B7-qkV4no6FkDnSjvjWoOrTCwRdPBaIwE.png"
                    : food === "جزر"
                      ? "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%D8%AC%D8%B2%D8%B1-KkMVomVT4OoppPFtm5R6WNzAKnUxnS.png"
                      : food === "سمكة"
                        ? "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%D8%B3%D9%85%D9%83%D8%A9-oBFfjaTRSIPvkhjV6C56XqapQmB50a.png"
                        : food === "بقره"
                          ? "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%D8%A8%D9%82%D8%B1%D9%87-rB2PZQANsafMgiyR8wZ3gFTBfCTUXK.png"
                          : food === "بيبار"
                            ? "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%D8%A8%D9%8A%D8%A8%D8%A7%D8%B1-BQft0rIPAUEbuPk6yJAZkzH3PX2q8G.png"
                            : food === "كتكوت"
                              ? "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%D9%83%D8%AA%D9%83%D9%88%D8%AA-lj6Ju1ya3jBlUUD9cjYwBJeDMDMf64.png"
                              : food === "ذرة"
                                ? "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%D8%B0%D8%B1%D8%A9-Wv74wfqcZWmPtfmon4QYYFXaopewXx.png"
                                : food === "جمبري"
                                  ? "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%D8%AC%D9%85%D8%A8%D8%B1%D9%8A-wV6T7wEKTwX2u1IY5iLQfnS8T2qfL1.png"
                                  : `/${food}.png`
                }
                alt={food}
                className="w-full h-full object-cover rounded-full"
              />
            </button>
          ))}
        </div>

        <div className="flex justify-between w-full max-w-md mb-8">
          <button
            onClick={() => handleFoodClick("بيتزا")}
            className="w-16 h-16 md:w-20 md:h-20 rounded-full shadow-lg transition-all duration-300"
            style={{
              boxShadow: getFoodShadow("بيتزا"),
              border: getFoodBorder("بيتزا"),
            }}
          >
            {getLowProbabilityIndicator("بيتزا")}
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%D8%A8%D9%8A%D8%AA%D8%B2%D8%A7-kgeE8lXk9kufhhYhtJJxHjXt0WATSe.png"
              alt="بيتزا"
              className="w-full h-full object-cover rounded-full"
            />
          </button>

          <button
            onClick={() => handleFoodClick("سلطه")}
            className="w-16 h-16 md:w-20 md:h-20 rounded-full shadow-lg transition-all duration-300"
            style={{
              boxShadow: getFoodShadow("سلطه"),
              border: getFoodBorder("سلطه"),
            }}
          >
            {getLowProbabilityIndicator("سلطه")}
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%D8%B3%D9%84%D8%B7%D8%A9-nC3OpL4lMFQoGo8x8nEVsIrH5V7yHz.png"
              alt="سلطه"
              className="w-full h-full object-cover rounded-full"
            />
          </button>
        </div>

        <div className="flex flex-wrap gap-4 justify-center">
          <Button onClick={clearResults} variant="destructive" className="px-6 py-2">
            حذف النتائج
          </Button>
        </div>

        {selectedFood && predictions[selectedFood] && (
          <Card className="mt-6 p-4 bg-white/90 backdrop-blur-sm">
            <h3 className="text-lg font-bold mb-2 text-center">توقعات {selectedFood}</h3>
            <div className="space-y-2">
              {predictions[selectedFood].map((pred, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span>{pred.food}</span>
                  <span className="font-bold text-blue-600">{pred.probability.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {results.length > 0 && (
          <Card className="mt-4 p-3 bg-white/90 backdrop-blur-sm">
            <p className="text-center">عدد النتائج المحفوظة: {results.length}</p>
          </Card>
        )}
      </div>
    </div>
  )
}
