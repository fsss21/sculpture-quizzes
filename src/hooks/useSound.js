import { useEffect, useRef } from 'react'

export function useSound(soundEnabled) {
  const ambientSoundRef = useRef(null)
  const workshopSoundRef = useRef(null)

  useEffect(() => {
    if (soundEnabled) {
      // Запускаем фоновую музыку
      try {
        ambientSoundRef.current = new Audio('/sounds/ambient-music.mp3')
        ambientSoundRef.current.loop = true
        ambientSoundRef.current.volume = 0.2
        ambientSoundRef.current.play().catch(() => {
          // Игнорируем ошибки автоплея
        })
      } catch (error) {
        console.log('Ambient sound not available')
      }

      // Звуки мастерской
      try {
        workshopSoundRef.current = new Audio('/sounds/workshop-ambient.mp3')
        workshopSoundRef.current.loop = true
        workshopSoundRef.current.volume = 0.1
        workshopSoundRef.current.play().catch(() => {
          // Игнорируем ошибки автоплея
        })
      } catch (error) {
        console.log('Workshop sound not available')
      }
    } else {
      // Останавливаем звуки
      if (ambientSoundRef.current) {
        ambientSoundRef.current.pause()
        ambientSoundRef.current = null
      }
      if (workshopSoundRef.current) {
        workshopSoundRef.current.pause()
        workshopSoundRef.current = null
      }
    }

    return () => {
      if (ambientSoundRef.current) {
        ambientSoundRef.current.pause()
        ambientSoundRef.current = null
      }
      if (workshopSoundRef.current) {
        workshopSoundRef.current.pause()
        workshopSoundRef.current = null
      }
    }
  }, [soundEnabled])

  const playSound = (soundPath, volume = 0.5) => {
    if (!soundEnabled) return
    
    try {
      const audio = new Audio(soundPath)
      audio.volume = volume
      audio.play().catch(() => {
        // Игнорируем ошибки
      })
    } catch (error) {
      console.log('Sound playback error:', error)
    }
  }

  return { playSound }
}
