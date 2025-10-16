import { useState, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Icon from '@/components/ui/icon'

interface GameObject {
  id: number
  x: number
  y: number
  speed: number
  type?: 'lily' | 'magnet' | 'life'
}

export default function CookieGame() {
  const [gameStarted, setGameStarted] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [playerX, setPlayerX] = useState(50)
  const [lilies, setLilies] = useState<GameObject[]>([])
  const [enemies, setEnemies] = useState<GameObject[]>([])
  const [powerups, setPowerups] = useState<GameObject[]>([])
  const [isPaused, setIsPaused] = useState(false)
  const [highScore, setHighScore] = useState(0)
  const [showRecords, setShowRecords] = useState(false)
  const [hasMagnet, setHasMagnet] = useState(false)
  const magnetTimerRef = useRef<number>()

  useEffect(() => {
    const saved = localStorage.getItem('cookieRunHighScore')
    if (saved) {
      setHighScore(parseInt(saved))
    }
  }, [])
  
  const gameAreaRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number>()
  const lastSpawnRef = useRef(0)
  const enemySpawnRef = useRef(0)
  const powerupSpawnRef = useRef(0)

  useEffect(() => {
    if (!gameStarted || isPaused || gameOver) return

    const gameLoop = (timestamp: number) => {
      if (timestamp - lastSpawnRef.current > 800) {
        setLilies(prev => [...prev, {
          id: Date.now(),
          x: Math.random() * 90 + 5,
          y: -5,
          speed: 1.5 + Math.random() * 1,
          type: 'lily'
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

      if (timestamp - powerupSpawnRef.current > 8000) {
        const powerupType = Math.random() > 0.5 ? 'magnet' : 'life'
        setPowerups(prev => [...prev, {
          id: Date.now(),
          x: Math.random() * 90 + 5,
          y: -5,
          speed: 1.2,
          type: powerupType
        }])
        powerupSpawnRef.current = timestamp
      }

      setLilies(prev => prev.map(lily => {
        let newX = lily.x
        if (hasMagnet && lily.y > 40) {
          const distance = playerX - lily.x
          newX = lily.x + distance * 0.08
        }
        return {
          ...lily,
          x: newX,
          y: lily.y + lily.speed
        }
      }).filter(lily => lily.y < 100))

      setEnemies(prev => prev.map(enemy => ({
        ...enemy,
        y: enemy.y + enemy.speed
      })).filter(enemy => enemy.y < 100))

      setPowerups(prev => prev.map(powerup => ({
        ...powerup,
        y: powerup.y + powerup.speed
      })).filter(powerup => powerup.y < 100))

      animationFrameRef.current = requestAnimationFrame(gameLoop)
    }

    animationFrameRef.current = requestAnimationFrame(gameLoop)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [gameStarted, isPaused, gameOver, hasMagnet, playerX])

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

      setPowerups(prev => {
        const remaining = [...prev]
        const caught: number[] = []

        remaining.forEach((powerup, index) => {
          if (powerup.y > 80 && powerup.y < 95) {
            const distance = Math.abs(powerup.x - playerX)
            if (distance < 12) {
              caught.push(index)
              if (powerup.type === 'magnet') {
                setHasMagnet(true)
                if (magnetTimerRef.current) clearTimeout(magnetTimerRef.current)
                magnetTimerRef.current = window.setTimeout(() => setHasMagnet(false), 5000)
              } else if (powerup.type === 'life') {
                setLives(l => Math.min(l + 1, 5))
              }
            }
          }
        })

        if (caught.length > 0) {
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
                  setScore(currentScore => {
                    if (currentScore > highScore) {
                      setHighScore(currentScore)
                      localStorage.setItem('cookieRunHighScore', currentScore.toString())
                    }
                    return currentScore
                  })
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
    setPowerups([])
    setPlayerX(50)
    setShowRecords(false)
    setHasMagnet(false)
    if (magnetTimerRef.current) clearTimeout(magnetTimerRef.current)
    lastSpawnRef.current = 0
    enemySpawnRef.current = 0
    powerupSpawnRef.current = 0
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
            <div className="w-12 h-12 rounded-full flex items-center justify-center border-4 border-[#FFD700] overflow-hidden bg-white">
              <img 
                src="https://cdn.poehali.dev/files/ba984b48-624a-4564-91aa-f6914333d286.png" 
                alt="Pure Vanilla Cookie"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <p className="text-sm font-bold text-[#8B4513]" style={{ fontFamily: 'Fredoka One, cursive' }}>
                Pure Vanilla Cookie
              </p>
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-[#8B4513]">SCORE</span>
                <span className="text-sm font-black text-[#FFD700] flex items-center gap-1" style={{ fontFamily: 'Fredoka One, cursive' }}>
                  <img src="https://cdn.poehali.dev/files/ba984b48-624a-4564-91aa-f6914333d286.png" alt="" className="w-4 h-4 rounded-full object-contain" />
                  {score}
                </span>
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-xs font-bold text-[#2D1B69]">BEST</span>
                <span className="text-xs font-black text-[#2D1B69]" style={{ fontFamily: 'Fredoka One, cursive' }}>
                  ⭐ {highScore}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-1">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="text-xl">
                  {i < lives ? '❤️' : '🖤'}
                </div>
              ))}
            </div>
            {hasMagnet && (
              <div className="text-xs font-bold text-purple-600 animate-pulse" style={{ fontFamily: 'Fredoka One, cursive' }}>
                🧲 MAGNET
              </div>
            )}
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
        {!gameStarted && !showRecords && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 backdrop-blur-sm z-20 gap-4">
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
            <Button
              onClick={() => setShowRecords(true)}
              size="lg"
              className="text-xl px-10 py-6 rounded-full font-black"
              style={{
                fontFamily: 'Fredoka One, cursive',
                background: 'linear-gradient(135deg, #2D1B69 0%, #6E59A5 100%)',
                border: '4px solid #8B4513',
                boxShadow: '0 6px 0 #6B3410',
                color: '#fff',
                textShadow: '2px 2px 0 #000'
              }}
            >
              ⭐ RECORDS
            </Button>
          </div>
        )}

        {showRecords && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm z-20 p-8">
            <div 
              className="text-4xl font-black mb-6"
              style={{
                fontFamily: 'Fredoka One, cursive',
                color: '#FFD700',
                textShadow: '3px 3px 0 #8B4513, -2px -2px 0 #fff',
                WebkitTextStroke: '2px #8B4513'
              }}
            >
              ⭐ BEST SCORE ⭐
            </div>
            <div
              className="text-6xl font-black mb-8"
              style={{
                fontFamily: 'Fredoka One, cursive',
                color: '#FF699B',
                textShadow: '4px 4px 0 #8B4513'
              }}
            >
              {highScore} <img src="https://cdn.poehali.dev/files/ba984b48-624a-4564-91aa-f6914333d286.png" alt="" className="inline w-12 h-12 rounded-full object-contain ml-2" />
            </div>
            <Button
              onClick={() => setShowRecords(false)}
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
              BACK
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
              className="text-3xl font-bold mb-2"
              style={{
                fontFamily: 'Fredoka One, cursive',
                color: '#FFD700',
                textShadow: '2px 2px 0 #8B4513'
              }}
            >
              Score: {score} <img src="https://cdn.poehali.dev/files/ba984b48-624a-4564-91aa-f6914333d286.png" alt="" className="inline w-8 h-8 rounded-full object-contain" />
            </div>
            {score > highScore && (
              <div 
                className="text-2xl font-bold mb-4 animate-pulse"
                style={{
                  fontFamily: 'Fredoka One, cursive',
                  color: '#00FF00',
                  textShadow: '2px 2px 0 #006600'
                }}
              >
                🎉 NEW RECORD! 🎉
              </div>
            )}
            <div 
              className="text-xl font-bold mb-6"
              style={{
                fontFamily: 'Fredoka One, cursive',
                color: '#2D1B69',
                textShadow: '1px 1px 0 #fff'
              }}
            >
              Best: {highScore} ⭐
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
                className="absolute transition-all"
                style={{
                  left: `${lily.x}%`,
                  top: `${lily.y}%`,
                  transform: 'translate(-50%, -50%)',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                }}
              >
                <img 
                  src="https://cdn.poehali.dev/files/cf94fa06-37ce-491b-baa3-e47a0fddb58e.png" 
                  alt="Lily"
                  className="w-10 h-10 object-contain"
                />
              </div>
            ))}

            {powerups.map(powerup => (
              <div
                key={powerup.id}
                className="absolute animate-bounce"
                style={{
                  left: `${powerup.x}%`,
                  top: `${powerup.y}%`,
                  transform: 'translate(-50%, -50%)',
                  filter: 'drop-shadow(0 4px 8px rgba(255, 215, 0, 0.6))'
                }}
              >
                <div className="text-4xl">
                  {powerup.type === 'magnet' ? '🧲' : '❤️'}
                </div>
              </div>
            ))}

            {enemies.map(enemy => (
              <div
                key={enemy.id}
                className="absolute animate-pulse"
                style={{
                  left: `${enemy.x}%`,
                  top: `${enemy.y}%`,
                  transform: 'translate(-50%, -50%)',
                  filter: 'drop-shadow(0 4px 8px rgba(0, 50, 139, 0.6))'
                }}
              >
                <img 
                  src="https://cdn.poehali.dev/files/1e024d09-0691-446f-b089-929f7a6d0922.png" 
                  alt="Shadow Milk Cookie"
                  className="w-16 h-16 object-contain"
                />
              </div>
            ))}

            <div
              className="absolute z-10"
              style={{
                left: `${playerX}%`,
                bottom: '5%',
                transform: 'translateX(-50%)',
                filter: 'drop-shadow(0 4px 8px rgba(255, 215, 0, 0.5))',
                transition: 'left 0.1s linear'
              }}
            >
              <div className="relative">
                <img 
                  src="https://cdn.poehali.dev/files/ba984b48-624a-4564-91aa-f6914333d286.png" 
                  alt="Pure Vanilla Cookie"
                  className="w-24 h-24 object-contain"
                  style={{ imageRendering: 'crisp-edges' }}
                />
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