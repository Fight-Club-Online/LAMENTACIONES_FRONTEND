"use client"

import { useState, useEffect, useRef } from "react"

// Configuraciones del MINI-PROYECTO 
const MINI_PROJECT_CONFIGS = {
  samurai: { frames: 9, width: 96, height: 64 },
  demonio: { frames: 4, width: 80, height: 64 },
  caballero: { frames: 7, width: 96, height: 64 },
  golem: { frames: 8, width: 96, height: 64 },
  esqueleto: { frames: 8, width: 96, height: 64 },
}

// Configuraciones basadas en dimensiones reales (CORREGIDAS para evitar deslizamiento)
// Usando las mismas configs que el mini-proyecto
const LOCAL_CONFIGS = {
  samurai: { frames: 9, width: 96, height: 96 },
  demonio: { frames: 4, width: 80, height: 71 },
  caballero: { frames: 7, width: 96, height: 84 },
  golem: { frames: 8, width: 96, height: 64 },
  esqueleto: { frames: 8, width: 96, height: 64 },
}

// URLs locales
const LOCAL_URLS = {
  samurai: "/FighterAssets/samurai/samurai_IDLE.png",
  demonio: "/FighterAssets/demonio/demonio_IDLE.png",
  caballero: "/FighterAssets/caballero/caballero_IDLE.png",
  golem: "/FighterAssets/golem/golem_IDLE.png",
  esqueleto: "/FighterAssets/esqueleto/esqueleto_IDLE.png",
}

type Character = keyof typeof LOCAL_CONFIGS

function SpriteAnimation({ 
  character, 
  url, 
  config,
  label,
}: { 
  character: string
  url: string
  config: { frames: number; width: number; height: number }
  label: string
}) {
  const spriteRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef(0)
  const [imageInfo, setImageInfo] = useState<{ width: number; height: number } | null>(null)
  
  const { frames, width, height } = config
  const totalWidth = width * frames

  // Detectar dimensiones reales
  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      setImageInfo({ width: img.width, height: img.height })
    }
    img.src = url
  }, [url])

  // Animacion frame por frame
  useEffect(() => {
    const frameTime = 100
    
    const interval = setInterval(() => {
      if (spriteRef.current) {
        frameRef.current = (frameRef.current + 1) % frames
        const offsetX = -frameRef.current * width
        spriteRef.current.style.backgroundPosition = `${offsetX}px 0`
      }
    }, frameTime)

    return () => clearInterval(interval)
  }, [frames, width])

  return (
    <div className="flex flex-col items-center gap-2 p-3 bg-zinc-900 rounded-lg border border-zinc-700">
      <span className="text-xs font-medium text-amber-400">{label}</span>
      <span className="text-sm font-medium text-zinc-300 capitalize">{character}</span>
      <div
        ref={spriteRef}
        className="border border-red-500/50"
        style={{
          width: width,
          height: height,
          backgroundImage: `url(${url})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: `${totalWidth}px ${height}px`,
          backgroundPosition: "0 0",
          imageRendering: "pixelated",
        }}
      />
      <div className="text-xs text-zinc-500 text-center">
        <div>{frames}f x {width}w x {height}h</div>
        {imageInfo && (
          <div className="text-zinc-600">Real: {imageInfo.width}x{imageInfo.height}</div>
        )}
      </div>
    </div>
  )
}

export default function SpriteTest() {
  const characters = Object.keys(LOCAL_CONFIGS) as Character[]

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <h1 className="text-3xl font-bold text-center mb-4">Sprite Test - Comparacion de Configs</h1>
      <p className="text-center text-zinc-400 mb-8">
        Comparando configs del mini-proyecto vs configs locales
      </p>

      <div className="max-w-6xl mx-auto space-y-8">
        {/* Mini-project configs */}
        <div>
          <h2 className="text-xl font-bold text-amber-400 mb-4">Config MINI-PROYECTO</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {characters.map((char) => (
              <SpriteAnimation
                key={`mini-${char}`}
                character={char}
                url={LOCAL_URLS[char]}
                config={MINI_PROJECT_CONFIGS[char]}
                label="Mini-Proyecto"
              />
            ))}
          </div>
        </div>

        {/* Local configs */}
        <div>
          <h2 className="text-xl font-bold text-cyan-400 mb-4">Config LOCAL (dimensiones reales)</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {characters.map((char) => (
              <SpriteAnimation
                key={`local-${char}`}
                character={char}
                url={LOCAL_URLS[char]}
                config={LOCAL_CONFIGS[char]}
                label="Local"
              />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-zinc-900 rounded-lg max-w-2xl mx-auto">
        <h2 className="text-lg font-bold mb-2">Nota</h2>
        <p className="text-sm text-zinc-400">
          El mini-proyecto y los archivos locales son IDENTICOS (mismo MD5 hash para caballero_IDLE).
          La diferencia es que el mini-proyecto usa configuraciones diferentes 
          (ej: caballero usa 7 frames de 96px en lugar de 8 frames de 84px).
        </p>
      </div>
    </div>
  )
}
