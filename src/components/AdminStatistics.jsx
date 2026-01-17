import styles from './AdminStatistics.module.css'

function AdminStatistics({ statistics, toolsQuiz, sculptorsQuiz }) {
  const getQuestionText = (quizType, questionId) => {
    const quiz = quizType === 'tools' ? toolsQuiz : sculptorsQuiz
    if (!quiz) return 'Неизвестный вопрос'
    
    const question = quiz.questions.find(q => q.id === questionId)
    if (!question) return `Вопрос #${questionId}`
    
    return quizType === 'tools' 
      ? question.task 
      : question.work
  }

  const getQuizTitle = (quizType) => {
    return quizType === 'tools' 
      ? (toolsQuiz?.title || 'Инструменты')
      : (sculptorsQuiz?.title || 'Скульпторы')
  }

  const toolsStats = statistics.filter(s => s.quizType === 'tools')
  const sculptorsStats = statistics.filter(s => s.quizType === 'sculptors')

  const overallStats = {
    totalQuestions: toolsStats.length + sculptorsStats.length,
    totalAnswers: statistics.reduce((sum, s) => sum + (s.totalAnswers || 0), 0),
    correctAnswers: statistics.reduce((sum, s) => sum + (s.correctAnswers || 0), 0),
    accuracy: 0
  }

  if (overallStats.totalAnswers > 0) {
    overallStats.accuracy = ((overallStats.correctAnswers / overallStats.totalAnswers) * 100).toFixed(2)
  }

  return (
    <div className={styles.container}>
      <h2>Статистика викторин</h2>

      <div className={styles.overallStats}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{overallStats.totalQuestions}</div>
          <div className={styles.statLabel}>Всего вопросов</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{overallStats.totalAnswers}</div>
          <div className={styles.statLabel}>Всего ответов</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{overallStats.correctAnswers}</div>
          <div className={styles.statLabel}>Правильных ответов</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{overallStats.accuracy}%</div>
          <div className={styles.statLabel}>Точность</div>
        </div>
      </div>

      <div className={styles.quizSections}>
        <div className={styles.quizSection}>
          <h3>🔨 {getQuizTitle('tools')}</h3>
          {toolsStats.length === 0 ? (
            <p className={styles.noStats}>Нет статистики для этой викторины</p>
          ) : (
            <div className={styles.statsList}>
              {toolsStats.map((stat, index) => (
                <div key={index} className={styles.statItem}>
                  <div className={styles.statHeader}>
                    <span className={styles.questionText}>
                      {getQuestionText('tools', stat.questionId)}
                    </span>
                    <span className={styles.accuracy}>
                      {stat.accuracy}%
                    </span>
                  </div>
                  <div className={styles.statDetails}>
                    <span>Всего: {stat.totalAnswers}</span>
                    <span>Правильно: {stat.correctAnswers}</span>
                    <span>Неправильно: {stat.totalAnswers - stat.correctAnswers}</span>
                  </div>
                  {stat.answerStats && (
                    <div className={styles.answerStats}>
                      <strong>Распределение ответов:</strong>
                      {Object.entries(stat.answerStats).map(([key, count]) => (
                        <span key={key} className={styles.answerStatItem}>
                          {key}: {count}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.quizSection}>
          <h3>🎨 {getQuizTitle('sculptors')}</h3>
          {sculptorsStats.length === 0 ? (
            <p className={styles.noStats}>Нет статистики для этой викторины</p>
          ) : (
            <div className={styles.statsList}>
              {sculptorsStats.map((stat, index) => (
                <div key={index} className={styles.statItem}>
                  <div className={styles.statHeader}>
                    <span className={styles.questionText}>
                      {getQuestionText('sculptors', stat.questionId)}
                    </span>
                    <span className={styles.accuracy}>
                      {stat.accuracy}%
                    </span>
                  </div>
                  <div className={styles.statDetails}>
                    <span>Всего: {stat.totalAnswers}</span>
                    <span>Правильно: {stat.correctAnswers}</span>
                    <span>Неправильно: {stat.totalAnswers - stat.correctAnswers}</span>
                  </div>
                  {stat.answerStats && (
                    <div className={styles.answerStats}>
                      <strong>Распределение ответов:</strong>
                      {Object.entries(stat.answerStats).map(([key, count]) => (
                        <span key={key} className={styles.answerStatItem}>
                          {key}: {count}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminStatistics
