import styles from './MainMenu.module.css'

function MainMenu({ onSelectQuiz, soundEnabled, setSoundEnabled }) {
  const quizzes = [
    {
      id: 'tools',
      title: 'Узнай инструмент <br/> по описанию',
    },
    {
      id: 'sculptors',
      title: 'Угадай скульптора <br/> по произведению',
    }
  ]

  const handleQuizSelect = (quizId) => {
    if (soundEnabled) {
      const audio = new Audio('/sounds/menu-click.mp3')
      audio.volume = 0.3
      audio.play().catch(() => { })
    }
    onSelectQuiz(quizId)
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.mainTitle}>Инструменты скульптора</h1>
      </div>

      <div className={styles.quizzesGrid}>
        {quizzes.map(quiz => (
          <div key={quiz.id} className={styles.quizCard}>
            <div className={styles.quizTextBlock}>
              <h2 className={styles.quizTitle} dangerouslySetInnerHTML={{ __html: quiz.title }} />
            </div>
            <button
              type="button"
              onClick={() => handleQuizSelect(quiz.id)}
              className={styles.quizButton}>
              Начать викторину
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default MainMenu
