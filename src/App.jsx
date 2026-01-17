import { useState, useEffect } from 'react'
import MainMenu from './components/MainMenu'
import StartScreen from './components/StartScreen'
import QuizScreen from './components/QuizScreen'
import ResultScreen from './components/ResultScreen'
import AdminPage from './components/AdminPage'
import { useSound } from './hooks/useSound'
import axios from 'axios'
import styles from './App.module.css'

const GAME_STATES = {
  MENU: 'menu',
  START: 'start',
  QUIZ: 'quiz',
  RESULT: 'result'
}

function App() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [gameState, setGameState] = useState(GAME_STATES.MENU)
  const [currentQuiz, setCurrentQuiz] = useState(null)
  const [quizData, setQuizData] = useState(null)
  const [score, setScore] = useState(0)
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [soundEnabled, setSoundEnabled] = useState(true)

  useEffect(() => {
    // Проверяем, находимся ли мы в админ-панели
    setIsAdmin(window.location.pathname === '/admin' || window.location.pathname.includes('/admin'))
  }, [])

  useEffect(() => {
    // Обработчик горячих клавиш для открытия админ-панели
    const handleKeyDown = (event) => {
      // Ctrl+Shift+A
      if (event.ctrlKey && event.shiftKey && event.key === 'A') {
        event.preventDefault()
        // Переходим на админ-панель
        window.location.href = '/admin'
      }
    }

    // Добавляем обработчик события
    window.addEventListener('keydown', handleKeyDown)

    // Очищаем обработчик при размонтировании
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  useSound(soundEnabled)

  // Если мы в админ-панели, показываем её
  if (isAdmin) {
    return <AdminPage />
  }

  const handleSelectQuiz = async (quizId) => {
    setCurrentQuiz(quizId)
    
    try {
      const response = await axios.get(`/data/${quizId === 'tools' ? 'tools-quiz' : 'sculptors-quiz'}.json`)
      setQuizData(response.data)
      setGameState(GAME_STATES.START)
    } catch (error) {
      console.error('Error loading quiz data:', error)
      // Если данные не загрузились, используем заглушку
      const fallbackData = quizId === 'tools' 
        ? {
            title: "Узнай инструмент по описанию",
            subtitle: "Какой инструмент нужен для этой задачи?",
            questions: []
          }
        : {
            title: "Угадай скульптора по произведению",
            subtitle: "Кто автор этого произведения?",
            questions: []
          }
      setQuizData(fallbackData)
      setGameState(GAME_STATES.START)
    }
  }

  const handleStartQuiz = () => {
    setScore(0)
    setGameState(GAME_STATES.QUIZ)
  }

  const handleQuizComplete = (finalScore, total) => {
    setScore(finalScore)
    setTotalQuestions(total)
    setGameState(GAME_STATES.RESULT)
  }

  const handleRestart = () => {
    setScore(0)
    setGameState(GAME_STATES.QUIZ)
  }

  const handleBackToMenu = () => {
    setCurrentQuiz(null)
    setQuizData(null)
    setScore(0)
    setTotalQuestions(0)
    setGameState(GAME_STATES.MENU)
  }

  return (
    <div className={styles.app}>
      {gameState === GAME_STATES.MENU && (
        <MainMenu 
          onSelectQuiz={handleSelectQuiz}
          soundEnabled={soundEnabled}
          setSoundEnabled={setSoundEnabled}
        />
      )}

      {gameState === GAME_STATES.START && quizData && (
        <StartScreen
          title={quizData.title}
          subtitle={quizData.subtitle}
          onStartQuiz={handleStartQuiz}
          quizType={currentQuiz}
          soundEnabled={soundEnabled}
        />
      )}

      {gameState === GAME_STATES.QUIZ && quizData && (
        <QuizScreen
          quizData={quizData}
          quizType={currentQuiz}
          onQuizComplete={handleQuizComplete}
          soundEnabled={soundEnabled}
        />
      )}

      {gameState === GAME_STATES.RESULT && (
        <ResultScreen
          score={score}
          totalQuestions={totalQuestions}
          onRestart={handleRestart}
          onBackToMenu={handleBackToMenu}
          soundEnabled={soundEnabled}
        />
      )}
    </div>
  )
}

export default App
