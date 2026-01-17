import { useState, useEffect } from 'react'
import styles from './QuizScreen.module.css'
import api from '../utils/api'

function QuizScreen({ quizData, quizType, onQuizComplete, soundEnabled }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [answeredQuestions, setAnsweredQuestions] = useState([])

  const currentQuestion = quizData.questions[currentQuestionIndex]

  const handleAnswerSelect = (answerIndex) => {
    if (showResult) return
    
    setSelectedAnswer(answerIndex)
    const isCorrect = currentQuestion.answers[answerIndex].correct

    if (soundEnabled) {
      const soundPath = isCorrect ? '/sounds/success.mp3' : '/sounds/error.mp3'
      const audio = new Audio(soundPath)
      audio.volume = 0.5
      audio.play().catch(() => {})
    }

    if (isCorrect) {
      setScore(score + 1)
    }

    setAnsweredQuestions([...answeredQuestions, {
      questionIndex: currentQuestionIndex,
      answerIndex,
      isCorrect
    }])

    // Отправляем статистику на сервер
    if (quizType) {
      api.post('/api/statistics', {
        quizType,
        questionId: currentQuestion.id,
        selectedAnswer: answerIndex,
        isCorrect
      }).catch(err => {
        console.error('Error saving statistics:', err)
      })
    }

    setShowResult(true)
  }

  const handleNext = () => {
    if (currentQuestionIndex < quizData.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setSelectedAnswer(null)
      setShowResult(false)
    } else {
      onQuizComplete(score, quizData.questions.length)
    }
  }

  const getCorrectAnswer = () => {
    return currentQuestion.answers.findIndex(answer => answer.correct)
  }

  const progress = ((currentQuestionIndex + 1) / quizData.questions.length) * 100

  return (
    <div className={styles.container}>
      <div className={styles.progressBar}>
        <div 
          className={styles.progressFill} 
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      <div className={styles.questionCard}>
        <div className={styles.questionHeader}>
          <span className={styles.questionNumber}>
            Вопрос {currentQuestionIndex + 1} из {quizData.questions.length}
          </span>
        </div>

        <div className={styles.questionContent}>
          {quizData.questions[0].task ? (
            <h2 className={styles.task}>{currentQuestion.task}</h2>
          ) : (
            <>
              <h2 className={styles.work}>{currentQuestion.work}</h2>
              {currentQuestion.image && (
                <img 
                  src={currentQuestion.image} 
                  alt={currentQuestion.work}
                  className={styles.workImage}
                  onError={(e) => {
                    e.target.style.display = 'none'
                  }}
                />
              )}
            </>
          )}
        </div>

        <div className={styles.answersGrid}>
          {currentQuestion.answers.map((answer, index) => {
            const isSelected = selectedAnswer === index
            const isCorrect = answer.correct
            const correctAnswerIndex = getCorrectAnswer()
            
            let answerClass = styles.answerCard
            if (showResult) {
              if (isCorrect) {
                answerClass += ` ${styles.correct}`
              } else if (isSelected && !isCorrect) {
                answerClass += ` ${styles.incorrect}`
              } else if (index === correctAnswerIndex && selectedAnswer !== null) {
                answerClass += ` ${styles.correct}`
              }
            }

            return (
              <div
                key={index}
                className={answerClass}
                onClick={() => handleAnswerSelect(index)}
              >
                {answer.image && (
                  <img 
                    src={answer.image} 
                    alt={answer.text}
                    className={styles.answerImage}
                    onError={(e) => {
                      e.target.style.display = 'none'
                    }}
                  />
                )}
                <span className={styles.answerText}>{answer.text}</span>
              </div>
            )
          })}
        </div>

        {showResult && (
          <div className={styles.result}>
            <div className={styles.resultHeader}>
              {currentQuestion.answers[selectedAnswer]?.correct ? (
                <span className={styles.resultIcon}>✓</span>
              ) : (
                <span className={styles.resultIconWrong}>✗</span>
              )}
              <h3 className={styles.resultTitle}>
                {currentQuestion.answers[selectedAnswer]?.correct 
                  ? 'Правильно!' 
                  : 'Неправильно'}
              </h3>
            </div>
            
            <p className={styles.explanation}>
              {currentQuestion.answers[selectedAnswer]?.explanation}
            </p>
            
            {currentQuestion.additionalInfo && (
              <div className={styles.additionalInfo}>
                <p>{currentQuestion.additionalInfo}</p>
              </div>
            )}

            <button 
              className={styles.nextButton}
              onClick={handleNext}
            >
              {currentQuestionIndex < quizData.questions.length - 1 
                ? 'Следующий вопрос' 
                : 'Завершить викторину'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default QuizScreen
