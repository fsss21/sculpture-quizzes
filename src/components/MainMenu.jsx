import styles from './MainMenu.module.css'

function MainMenu({ onSelectQuiz, soundEnabled, setSoundEnabled }) {
  const quizzes = [
    {
      id: 'tools',
      title: 'Узнай инструмент по описанию',
      subtitle: 'Какой инструмент нужен для этой задачи?',
      description: 'Проверьте свои знания о скульптурных инструментах',
      icon: '🔨'
    },
    {
      id: 'sculptors',
      title: 'Угадай скульптора по произведению',
      subtitle: 'Кто автор этого произведения?',
      description: 'Узнайте больше о великих скульпторах',
      icon: '🎨'
    }
  ]

  const handleQuizSelect = (quizId) => {
    if (soundEnabled) {
      const audio = new Audio('/sounds/menu-click.mp3')
      audio.volume = 0.3
      audio.play().catch(() => {})
    }
    onSelectQuiz(quizId)
  }

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled)
    if (!soundEnabled) {
      const audio = new Audio('/sounds/menu-click.mp3')
      audio.volume = 0.3
      audio.play().catch(() => {})
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.mainTitle}>Инструменты скульптора</h1>
        <button 
          className={styles.soundButton}
          onClick={toggleSound}
          aria-label={soundEnabled ? 'Выключить звук' : 'Включить звук'}
        >
          {soundEnabled ? '🔊' : '🔇'}
        </button>
      </div>

      <div className={styles.quizzesGrid}>
        {quizzes.map(quiz => (
          <div
            key={quiz.id}
            className={styles.quizCard}
            onClick={() => handleQuizSelect(quiz.id)}
          >
            <div className={styles.quizIcon}>{quiz.icon}</div>
            <h2 className={styles.quizTitle}>{quiz.title}</h2>
            <p className={styles.quizSubtitle}>{quiz.subtitle}</p>
            <p className={styles.quizDescription}>{quiz.description}</p>
            <button className={styles.quizButton}>
              Начать викторину →
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default MainMenu
