import styles from './StartScreen.module.css'

function StartScreen({ onStartQuiz, quizType, title, subtitle, soundEnabled }) {
  const isToolsQuiz = quizType === 'tools'
  const gameClass = isToolsQuiz ? styles.game_tool : styles.game_sculptor

  const handleStart = () => {
    if (soundEnabled) {
      const audio = new Audio('/sounds/menu-click.mp3')
      audio.volume = 0.3
      audio.play().catch(() => { })
    }
    onStartQuiz()
  }

  return (
    <div className={`${styles.container} ${gameClass}`}>
      <div className={styles.card}>
        <h1 className={styles.title} dangerouslySetInnerHTML={{ __html: title || '' }} />
        <p className={styles.subtitle}>{subtitle}</p>
        <button
          type="button"
          className={styles.startButton}
          onClick={handleStart}
        >
          Начать викторину
        </button>
      </div>
    </div>
  )
}

export default StartScreen
