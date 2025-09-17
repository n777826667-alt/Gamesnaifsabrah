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
  const [showMeatPopup, setShowMeatPopup] = useState(false)
  const [showProbabilityMessage, setShowProbabilityMessage] = useState(false)
  const [probabilityMessageFoods, setProbabilityMessageFoods] = useState<string[]>([])
  const [clickedFoods, setClickedFoods] = useState<Set<string>>(new Set())
  const [meatClickHistory, setMeatClickHistory] = useState<{ [key: string]: string[] }>({})
  const [fishClickedFoods, setFishClickedFoods] = useState<Set<string>>(new Set())
  const [waitingForFishFollow, setWaitingForFishFollow] = useState(false)

  const getPatternPredictions = (sequence: string[]): PredictionResult => {
    const lastTwo = sequence.slice(-2).join("→")
    const lastOne = sequence.slice(-1)[0]

    const patterns: { [key: string]: string[] } = {
      طماط: ["بيبار", "ذرة", "جزر", "جمبري", "بقره", "سمكة"],
      ذرة: ["طماط", "بيبار", "جزر", "جمبري", "بقره", "سمكة"],
      جزر: ["طماط", "بيبار", "ذرة", "جمبري", "بقره", "سمكة"],
      بيبار: ["طماط", "ذرة", "جزر", "جمبري", "بقره", "سمكة"],

      "بقره→جزر": ["جزر", "ذرة", "بيبار", "جمبري", "سمكة"],
      "جمبري→جزر": ["جزر", "ذرة", "بيبار", "كتكوت", "جمبري", "سمكة"],
      "كتكوت→جزر": ["جزر", "ذرة", "بيبار", "جمبري", "سمكة"],
      "سمكة→جزر": ["جزر", "ذرة", "بيبار", "كتكوت", "جمبري", "سمكة"],
    }

    const meatFoods = ["كتكوت", "بقره", "سمكة", "جمبري"]
    if (meatFoods.includes(lastOne)) {
      const clickHistory = meatClickHistory[lastOne] || []

      if (clickHistory.length === 0) {
        let allFoods = ["طماط", "بيبار", "ذرة", "جزر", "بقره", "سمكة"]
        if (lastOne === "كتكوت") {
          allFoods = ["طماط", "بيبار", "ذرة", "جزر", "بقره", "سمكة"]
        } else if (lastOne === "بقره") {
          allFoods = ["طماط", "بيبار", "ذرة", "جزر", "بقره", "سمكة", "جمبري"]
        } else if (lastOne === "سمكة") {
          allFoods = ["بيبار", "ذرة", "جزر", "جمبري"].filter((food) => !fishClickedFoods.has(food))
        } else if (lastOne === "جمبري") {
          allFoods = ["طماط", "بيبار", "ذرة", "جزر", "بقره", "سمكة", "جمبري", "كتكوت"]
        }

        const filteredFoods = allFoods.filter((food) => !clickedFoods.has(food))
        patterns[lastOne] = filteredFoods
      }
    }

    let matchedFoods: string[] = []

    if (patterns[lastTwo]) {
      matchedFoods = patterns[lastTwo]
    } else if (patterns[lastOne]) {
      matchedFoods = patterns[lastOne]
    }

    if (matchedFoods.length > 0) {
      const result: PredictionResult = {}

      if (meatFoods.includes(lastOne)) {
        const clickHistory = meatClickHistory[lastOne] || []
        matchedFoods = matchedFoods.filter((food) => !clickHistory.includes(food))
      }

      const predictions: Prediction[] = matchedFoods.map((food, index) => ({
        food,
        probability: 80 - index * 10,
      }))

      result[lastOne] = predictions
      return result
    }

    return {}
  }

  const checkProbabilityMessage = (sequence: string[]): string[] => {
    const lastTwo = sequence.slice(-2).join("→")
    const lastThree = sequence.slice(-3).join("→")
    const lastFour = sequence.slice(-4).join("→")

    const probabilityPatterns: { [key: string]: string[] } = {
      "جزر→ذرة→جزر→ذرة": ["بقره", "جمبري"],
      "بيبار→طماط→بيبار→طماط": ["بقره", "جمبري"],
      "ذرة→ذرة": ["جمبري", "سمكة"],
      "بيبار→بيبار": ["بقره", "كتكوت"],
      "طماط→طماط": ["جمبري", "بقره"],
      "ذرة→بيبار": ["ذرة", "بيبار"],
      "بيبار→ذرة": ["بيبار", "ذرة"],
      "طماط→جزر": ["جزر"],
      "جزر→طماط": ["طماط"],
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

    const radius = 120
    const angleRad = (pos.angle - 90) * (Math.PI / 180)
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

    const opacity = Math.max(prediction.probability / 100, 0.3)
    return `rgba(255, 0, 0, ${opacity})`
  }

  const getFoodBorder = (food: string) => {
    if (!selectedFood || !predictions[selectedFood]) return "4px solid #fff"

    const prediction = predictions[selectedFood].find((p) => p.food === food)
    if (!prediction) return "4px solid #fff"

    if (prediction.probability > 0) {
      return "6px solid #ff0000"
    }
    return "4px solid #fff"
  }

  const getFoodShadow = (food: string) => {
    if (!selectedFood || !predictions[selectedFood]) return "0 4px 8px rgba(0,0,0,0.3)"

    const prediction = predictions[selectedFood].find((p) => p.food === food)
    if (!prediction) return "0 4px 8px rgba(0,0,0,0.3)"

    if (prediction.probability > 0) {
      return "0 0 50px rgba(255, 0, 0, 0.9), 0 0 100px rgba(255, 0, 0, 0.6), 0 0 150px rgba(255, 0, 0, 0.3)"
    }

    return "0 4px 8px rgba(0,0,0,0.3)"
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
            setShowMeatPopup(true)
          }
        }
      } else {
        const response = await fetch("/api/predict?count=3")
        const data = await response.json()
        setPredictions(data.predictions)

        if (selectedFood && data.predictions[selectedFood]) {
          const meatFoods = ["سمكة", "بقره", "كتكوت", "جمبري"]
          const hasMeatPrediction = data.predictions[selectedFood].some(
            (pred: Prediction) => meatFoods.includes(pred.food) && pred.probability > 0,
          )

          if (hasMeatPrediction) {
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
    setShowMeatPopup(false)
    setShowProbabilityMessage(false)
    setProbabilityMessageFoods([])

    setSelectedFood(food)

    const newClickedFoods = new Set(clickedFoods)
    newClickedFoods.add(food)
    setClickedFoods(newClickedFoods)

    if (waitingForFishFollow) {
      // If we were waiting for a click after fish, record this food
      const newFishClickedFoods = new Set(fishClickedFoods)
      newFishClickedFoods.add(food)
      setFishClickedFoods(newFishClickedFoods)
      setWaitingForFishFollow(false)
    }

    if (food === "سمكة") {
      // When clicking fish, prepare to track the next click
      setWaitingForFishFollow(true)
    }

    const meatFoods = ["كتكوت", "بقره", "سمكة", "جمبري"]
    if (meatFoods.includes(food)) {
      const newHistory = { ...meatClickHistory }
      if (!newHistory[food]) {
        newHistory[food] = []
      }
      setMeatClickHistory(newHistory)
    }

    if (results.length > 0) {
      const lastFood = results[results.length - 1]
      if (meatFoods.includes(lastFood)) {
        const newHistory = { ...meatClickHistory }
        if (!newHistory[lastFood]) {
          newHistory[lastFood] = []
        }
        if (!newHistory[lastFood].includes(food)) {
          newHistory[lastFood].push(food)
        }
        setMeatClickHistory(newHistory)
      }
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

      const patternPredictions = getPatternPredictions(newResults)

      const probabilityFoods = checkProbabilityMessage(newResults)
      if (probabilityFoods.length > 0) {
        setProbabilityMessageFoods(probabilityFoods)
        setShowProbabilityMessage(true)
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
          setShowMeatPopup(true)
        }
      } else {
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
      setClickedFoods(new Set())
      setMeatClickHistory({})
      setFishClickedFoods(new Set())
      setWaitingForFishFollow(false)
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
          <h1
            className="text-3xl md:text-5xl lg:text-6xl font-bold text-yellow-400 mb-4 drop-shadow-2xl animate-pulse"
            style={{
              background: "linear-gradient(to right, #fbbf24, #ef4444, #ec4899)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              textShadow: "2px 2px 4px rgba(0,0,0,0.8), 0 0 20px rgba(255,255,255,0.3)",
              filter: "drop-shadow(0 0 10px rgba(251, 191, 36, 0.5))",
            }}
          >
            الرجل الالكتروني اليمني
          </h1>
          <div className="absolute inset-0 text-3xl md:text-5xl lg:text-6xl text-white opacity-20 blur-sm animate-pulse">
            الرجل الالكتروني اليمني
          </div>
        </div>
        <div className="relative mt-2">
          <p
            className="text-lg md:text-xl lg:text-2xl text-yellow-300 font-semibold drop-shadow-lg animate-bounce"
            style={{
              textShadow: "2px 2px 4px rgba(0,0,0,0.8), 0 0 10px rgba(255,255,0,0.5)",
            }}
          >
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

          {showProbabilityMessage &&
            probabilityMessageFoods.map((food, index) => {
              const position = getFoodPosition(food)
              return (
                <div
                  key={`probability-${food}-${index}`}
                  className="absolute z-40 pointer-events-none"
                  style={{
                    ...position,
                    transform: "translate(-50%, -150%)",
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
