import styles from './StartScreen.module.css'

function StartScreen({ onStartQuiz, quizType, title, subtitle, soundEnabled }) {
  const handleStart = () => {
    if (soundEnabled) {
      const audio = new Audio('/sounds/menu-click.mp3')
      audio.volume = 0.3
      audio.play().catch(() => {})
    }
    onStartQuiz()
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.subtitle}>{subtitle}</p>
        <button 
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
