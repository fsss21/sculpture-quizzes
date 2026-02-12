import { useState } from 'react'
import styles from './QuizScreen.module.css'
import api from '../utils/api'

function QuizScreen({ quizData, quizType, onQuizComplete, soundEnabled }) {
  const isToolsQuiz = quizType === 'tools'
  const gameClass = isToolsQuiz ? styles.game_tool : styles.game_sculptor
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [answeredQuestions, setAnsweredQuestions] = useState([])

  const questions = quizData?.questions ?? []
  const hasQuestions = questions.length > 0
  const currentQuestion = hasQuestions ? questions[currentQuestionIndex] : null
  const hasTaskField = hasQuestions && questions[0].task != null && questions[0].task !== ''

  const handleAnswerSelect = (answerIndex) => {
    if (showResult || !currentQuestion) return

    setSelectedAnswer(answerIndex)
    const isCorrect = currentQuestion.answers[answerIndex].correct

    if (soundEnabled) {
      const soundPath = isCorrect ? '/sounds/success.mp3' : '/sounds/error.mp3'
      const audio = new Audio(soundPath)
      audio.volume = 0.5
      audio.play().catch(() => { })
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
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setSelectedAnswer(null)
      setShowResult(false)
    } else {
      onQuizComplete(score, questions.length)
    }
  }

  const getCorrectAnswer = () => {
    return currentQuestion ? currentQuestion.answers.findIndex(answer => answer.correct) : -1
  }

  if (!hasQuestions) {
    return (
      <div className={`${styles.container} ${gameClass}`}>
        <div className={styles.questionCard}>
          <p className={styles.task}>В этой викторине пока нет вопросов.</p>
          <button
            type="button"
            className={styles.nextButton}
            onClick={() => onQuizComplete(0, 0)}
          >
            Вернуться к результатам
          </button>
        </div>
      </div>
    )
  }

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  return (
    <div className={`${styles.container} ${gameClass}`}>
      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{ '--progress': `${progress}%` }}
        />
      </div>

      <div className={styles.questionCard}>
        <div className={styles.questionHeader}>
          <span className={styles.questionNumber}>
            Вопрос {currentQuestionIndex + 1} из {questions.length}
          </span>
        </div>

        <div className={styles.questionContent}>
          {hasTaskField ? (
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

        {showResult && (() => {
          const selectedAnswerData = selectedAnswer !== null ? currentQuestion.answers[selectedAnswer] : null
          const placeholderImg = quizType === 'tools'
            ? '/images/tools/place_holder_img.png'
            : '/images/sculptures/place_holder_img.png'
          const resultImageSrc = selectedAnswerData?.image || placeholderImg
          const isCorrect = currentQuestion.answers[selectedAnswer]?.correct
          return (
            <div className={styles.resultSection}>
              <div className={`${styles.result} ${isCorrect ? styles.result_correct : styles.result_incorrect}`}>
                <div className={styles.resultContent}>
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
                </div>
                <div className={styles.resultImageWrap}>
                  <img
                    src={resultImageSrc}
                    alt={selectedAnswerData?.text || ''}
                    className={styles.resultImage}
                    onError={(e) => {
                      e.target.onerror = null
                      e.target.src = placeholderImg
                    }}
                  />
                </div>
              </div>

              <div className={styles.resultButtonWrap}>
                <button
                  type="button"
                  className={styles.nextButton}
                  onClick={handleNext}
                >
                  {currentQuestionIndex < questions.length - 1
                    ? 'Следующий вопрос'
                    : 'Завершить викторину'}
                </button>
              </div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}

export default QuizScreen
