import styles from './ResultScreen.module.css'

function ResultScreen({ score, totalQuestions, onRestart, onBackToMenu, soundEnabled }) {
  const percentage = Math.round((score / totalQuestions) * 100)
  
  const getResultIcon = () => {
    if (percentage >= 90) return '🏆'
    if (percentage >= 70) return '⭐'
    if (percentage >= 50) return '👍'
    return '📚'
  }

  const getResultText = () => {
    if (percentage >= 90) return 'Отлично!'
    if (percentage >= 70) return 'Хорошо!'
    if (percentage >= 50) return 'Неплохо!'
    return 'Продолжайте изучать!'
  }

  const getResultColor = () => {
    if (percentage >= 90) return '#4caf50'
    if (percentage >= 70) return '#2196f3'
    if (percentage >= 50) return '#ff9800'
    return '#f44336'
  }

  const handleButtonClick = (callback) => {
    if (soundEnabled) {
      const audio = new Audio('/sounds/menu-click.mp3')
      audio.volume = 0.3
      audio.play().catch(() => {})
    }
    callback()
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.resultIcon} style={{ color: getResultColor() }}>
          {getResultIcon()}
        </div>
        
        <h1 className={styles.title} style={{ color: getResultColor() }}>
          {getResultText()}
        </h1>
        
        <div className={styles.score}>
          <span className={styles.scoreNumber}>{score}</span>
          <span className={styles.scoreDivider}>/</span>
          <span className={styles.scoreTotal}>{totalQuestions}</span>
        </div>
        
        <div className={styles.percentage}>
          {percentage}% правильных ответов
        </div>

        <div className={styles.buttons}>
          <button 
            className={styles.button}
            onClick={() => handleButtonClick(onRestart)}
          >
            Пройти снова
          </button>
          <button 
            className={styles.buttonSecondary}
            onClick={() => handleButtonClick(onBackToMenu)}
          >
            Выбрать другую викторину
          </button>
        </div>
      </div>
    </div>
  )
}

export default ResultScreen
