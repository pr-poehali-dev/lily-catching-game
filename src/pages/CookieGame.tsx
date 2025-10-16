import { useState, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Icon from '@/components/ui/icon'

interface GameObject {
  id: number
  x: number
  y: number
  speed: number
}

export default function CookieGame() {
  const [gameStarted, setGameStarted] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [playerX, setPlayerX] = useState(50)
  const [lilies, setLilies] = useState<GameObject[]>([])
  const [enemies, setEnemies] = useState<GameObject[]>([])
  const [isPaused, setIsPaused] = useState(false)
  
  const gameAreaRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number>()
  const lastSpawnRef = useRef(0)
  const enemySpawnRef = useRef(0)

  useEffect(() => {
    if (!gameStarted || isPaused || gameOver) return

    const gameLoop = (timestamp: number) => {
      if (timestamp - lastSpawnRef.current > 800) {
        setLilies(prev => [...prev, {
          id: Date.now(),
          x: Math.random() * 90 + 5,
          y: -5,
          speed: 1.5 + Math.random() * 1
        }])
        lastSpawnRef.current = timestamp
      }

      if (timestamp - enemySpawnRef.current > 3000) {
        setEnemies(prev => [...prev, {
          id: Date.now(),
          x: Math.random() * 90 + 5,
          y: -5,
          speed: 2 + Math.random() * 1.5
        }])
        enemySpawnRef.current = timestamp
      }

      setLilies(prev => prev.map(lily => ({
        ...lily,
        y: lily.y + lily.speed
      })).filter(lily => lily.y < 100))

      setEnemies(prev => prev.map(enemy => ({
        ...enemy,
        y: enemy.y + enemy.speed
      })).filter(enemy => enemy.y < 100))

      animationFrameRef.current = requestAnimationFrame(gameLoop)
    }

    animationFrameRef.current = requestAnimationFrame(gameLoop)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [gameStarted, isPaused, gameOver])

  useEffect(() => {
    if (!gameStarted || gameOver) return

    const checkCollisions = setInterval(() => {
      setLilies(prev => {
        const remaining = [...prev]
        const caught: number[] = []

        remaining.forEach((lily, index) => {
          if (lily.y > 80 && lily.y < 95) {
            const distance = Math.abs(lily.x - playerX)
            if (distance < 12) {
              caught.push(index)
            }
          }
        })

        if (caught.length > 0) {
          setScore(s => s + caught.length)
          return remaining.filter((_, i) => !caught.includes(i))
        }
        return remaining
      })

      setEnemies(prev => {
        const remaining = [...prev]
        
        remaining.forEach(enemy => {
          if (enemy.y > 80 && enemy.y < 95) {
            const distance = Math.abs(enemy.x - playerX)
            if (distance < 12) {
              setLives(l => {
                const newLives = l - 1
                if (newLives <= 0) {
                  setGameOver(true)
                }
                return newLives
              })
              return
            }
          }
        })

        return remaining
      })
    }, 50)

    return () => clearInterval(checkCollisions)
  }, [playerX, gameStarted, gameOver])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!gameAreaRef.current || !gameStarted || gameOver) return
    
    const rect = gameAreaRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    setPlayerX(Math.max(5, Math.min(95, x)))
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!gameAreaRef.current || !gameStarted || gameOver) return
    
    const rect = gameAreaRef.current.getBoundingClientRect()
    const x = ((e.touches[0].clientX - rect.left) / rect.width) * 100
    setPlayerX(Math.max(5, Math.min(95, x)))
  }

  const startGame = () => {
    setGameStarted(true)
    setGameOver(false)
    setScore(0)
    setLives(3)
    setLilies([])
    setEnemies([])
    setPlayerX(50)
    lastSpawnRef.current = 0
    enemySpawnRef.current = 0
  }

  const togglePause = () => {
    setIsPaused(!isPaused)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#87CEEB] via-[#B8E6F5] to-[#E8F5FA] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute text-white text-4xl animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`
            }}
          >
            ✨
          </div>
        ))}
      </div>

      <div className="text-center mb-6 z-10">
        <h1 
          className="text-5xl md:text-7xl font-black mb-2"
          style={{
            fontFamily: 'Fredoka One, cursive',
            color: '#FFD700',
            textShadow: '4px 4px 0 #8B4513, -2px -2px 0 #fff',
            WebkitTextStroke: '2px #8B4513'
          }}
        >
          COOKIE RUN
        </h1>
        <p 
          className="text-2xl md:text-3xl font-bold"
          style={{
            fontFamily: 'Fredoka One, cursive',
            color: '#FF699B',
            textShadow: '2px 2px 0 #8B4513'
          }}
        >
          ADVENTURE
        </p>
      </div>

      <Card 
        className="w-full max-w-md mb-4 p-4 rounded-3xl z-10"
        style={{
          background: 'linear-gradient(135deg, #FFF5E6 0%, #FFE8CC 100%)',
          border: '4px solid #8B4513',
          boxShadow: '0 8px 0 #6B3410'
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 bg-[#8B4513] rounded-full flex items-center justify-center text-2xl border-4 border-[#FFD700]">
              🍪
            </div>
            <div>
              <p className="text-sm font-bold text-[#8B4513]" style={{ fontFamily: 'Fredoka One, cursive' }}>
                Pure Vanilla Cookie
              </p>
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-[#8B4513]">SCORE</span>
                <span className="text-sm font-black text-[#FFD700]" style={{ fontFamily: 'Fredoka One, cursive' }}>
                  🍪 {score}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-1">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="text-2xl">
                {i < lives ? '❤️' : '🖤'}
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div
        ref={gameAreaRef}
        className="relative w-full max-w-md aspect-[3/4] rounded-3xl overflow-hidden cursor-none z-10"
        style={{
          background: 'linear-gradient(180deg, #B8E6F5 0%, #E8F5FA 100%)',
          border: '6px solid #8B4513',
          boxShadow: '0 12px 0 #6B3410'
        }}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
      >
        {!gameStarted && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-20">
            <Button
              onClick={startGame}
              size="lg"
              className="text-2xl px-12 py-8 rounded-full font-black"
              style={{
                fontFamily: 'Fredoka One, cursive',
                background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                border: '4px solid #8B4513',
                boxShadow: '0 6px 0 #6B3410',
                color: '#fff',
                textShadow: '2px 2px 0 #8B4513'
              }}
            >
              START GAME
            </Button>
          </div>
        )}

        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm z-20">
            <div 
              className="text-5xl font-black mb-4"
              style={{
                fontFamily: 'Fredoka One, cursive',
                color: '#FF699B',
                textShadow: '3px 3px 0 #8B4513, -2px -2px 0 #fff',
                WebkitTextStroke: '2px #8B4513'
              }}
            >
              GAME OVER!
            </div>
            <div 
              className="text-3xl font-bold mb-6"
              style={{
                fontFamily: 'Fredoka One, cursive',
                color: '#FFD700',
                textShadow: '2px 2px 0 #8B4513'
              }}
            >
              Score: {score} 🍪
            </div>
            <Button
              onClick={startGame}
              size="lg"
              className="text-xl px-10 py-6 rounded-full font-black"
              style={{
                fontFamily: 'Fredoka One, cursive',
                background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                border: '4px solid #8B4513',
                boxShadow: '0 6px 0 #6B3410',
                color: '#fff',
                textShadow: '2px 2px 0 #8B4513'
              }}
            >
              PLAY AGAIN
            </Button>
          </div>
        )}

        {gameStarted && !gameOver && (
          <>
            {lilies.map(lily => (
              <div
                key={lily.id}
                className="absolute text-4xl transition-transform"
                style={{
                  left: `${lily.x}%`,
                  top: `${lily.y}%`,
                  transform: 'translate(-50%, -50%) rotate(45deg)',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                }}
              >
                🌸
              </div>
            ))}

            {enemies.map(enemy => (
              <div
                key={enemy.id}
                className="absolute text-5xl animate-pulse"
                style={{
                  left: `${enemy.x}%`,
                  top: `${enemy.y}%`,
                  transform: 'translate(-50%, -50%)',
                  filter: 'drop-shadow(0 4px 8px rgba(139, 0, 139, 0.5))'
                }}
              >
                🦹‍♂️
              </div>
            ))}

            <div
              className="absolute text-5xl transition-all duration-100 z-10"
              style={{
                left: `${playerX}%`,
                bottom: '5%',
                transform: 'translateX(-50%)',
                filter: 'drop-shadow(0 4px 8px rgba(255, 215, 0, 0.5))'
              }}
            >
              <div className="relative">
                <div className="text-6xl">🍪</div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-3xl">🧺</div>
              </div>
            </div>
          </>
        )}
      </div>

      {gameStarted && !gameOver && (
        <div className="flex gap-3 mt-4 z-10">
          <Button
            onClick={togglePause}
            className="px-6 py-3 rounded-full font-bold"
            style={{
              fontFamily: 'Fredoka One, cursive',
              background: '#FFD700',
              border: '3px solid #8B4513',
              boxShadow: '0 4px 0 #6B3410',
              color: '#8B4513'
            }}
          >
            {isPaused ? '▶️ PLAY' : '⏸️ PAUSE'}
          </Button>
          
          <Button
            onClick={() => setGameStarted(false)}
            className="px-6 py-3 rounded-full font-bold"
            style={{
              fontFamily: 'Fredoka One, cursive',
              background: '#FF699B',
              border: '3px solid #8B4513',
              boxShadow: '0 4px 0 #6B3410',
              color: '#fff'
            }}
          >
            MENU
          </Button>
        </div>
      )}

      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Fredoka+One&display=swap" rel="stylesheet" />
    </div>
  )
}
