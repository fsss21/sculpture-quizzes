import styles from './ResultScreen.module.css'

function ResultScreen({ score, totalQuestions, onRestart, onBackToMenu, soundEnabled }) {
  const safeTotal = totalQuestions > 0 ? totalQuestions : 1
  const percentage = Math.round((score / safeTotal) * 100)
  
  const getResultText = () => {
    if (percentage >= 90) return 'Отлично!'
    if (percentage >= 70) return 'Хорошо!'
    if (percentage >= 50) return 'Неплохо!'
    return 'Продолжайте изучать!'
  }

  const getResultLevelClass = () => {
    if (percentage >= 70) return styles.result_excellent  // отлично или хорошо — зелёный
    if (percentage >= 50) return styles.result_okay       // средний — жёлтый
    return styles.result_poor                              // плохо — красный
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
      <div className={`${styles.card} ${getResultLevelClass()}`}>
        <h1 className={styles.title}>
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
            type="button"
            className={styles.button}
            onClick={() => handleButtonClick(onRestart)}
          >
            Пройти снова
          </button>
          <button
            type="button"
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
