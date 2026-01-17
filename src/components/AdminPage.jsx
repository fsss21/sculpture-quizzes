import { useState, useEffect } from 'react'
import styles from './AdminPage.module.css'
import AdminQuizEditor from './AdminQuizEditor'
import AdminStatistics from './AdminStatistics'
import api from '../utils/api'
import axios from 'axios'

function AdminPage() {
  const [activeTab, setActiveTab] = useState('tools')
  const [toolsQuiz, setToolsQuiz] = useState(null)
  const [sculptorsQuiz, setSculptorsQuiz] = useState(null)
  const [statistics, setStatistics] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      let toolsLoaded = false
      let sculptorsLoaded = false

      try {
        const [toolsRes, sculptorsRes, statsRes] = await Promise.all([
          api.get('/api/quiz/tools').catch((e) => {
            console.error('Error fetching tools quiz:', e)
            return null
          }),
          api.get('/api/quiz/sculptors').catch((e) => {
            console.error('Error fetching sculptors quiz:', e)
            return null
          }),
          api.get('/api/statistics').catch((e) => {
            console.error('Error fetching statistics:', e)
            return null
          })
        ])

        if (toolsRes && toolsRes.status === 200) {
          setToolsQuiz(toolsRes.data)
          toolsLoaded = true
        }

        if (sculptorsRes && sculptorsRes.status === 200) {
          setSculptorsQuiz(sculptorsRes.data)
          sculptorsLoaded = true
        }

        if (statsRes && statsRes.status === 200) {
          setStatistics(statsRes.data)
        }
      } catch (apiErr) {
        console.error('API error:', apiErr)
      }

      // Если не удалось загрузить данные через API, пробуем загрузить из public/data
      if (!toolsLoaded || !sculptorsLoaded) {
        try {
          const [toolsDataRes, sculptorsDataRes] = await Promise.all([
            axios.get('/data/tools-quiz.json').catch(() => null),
            axios.get('/data/sculptors-quiz.json').catch(() => null)
          ])
          
          if (toolsDataRes && toolsDataRes.status === 200 && !toolsLoaded) {
            setToolsQuiz(toolsDataRes.data)
          }
          
          if (sculptorsDataRes && sculptorsDataRes.status === 200 && !sculptorsLoaded) {
            setSculptorsQuiz(sculptorsDataRes.data)
          }
          
          if (!toolsLoaded || !sculptorsLoaded) {
            setError('Сервер API недоступен. Загружены данные из файлов. Для редактирования запустите сервер: npm run server')
          }
        } catch (fileErr) {
          console.error('Error loading from files:', fileErr)
          if (!toolsLoaded || !sculptorsLoaded) {
            setError('Не удалось загрузить данные. Убедитесь, что сервер запущен: npm run server')
          }
        }
      }
    } catch (err) {
      setError('Ошибка загрузки данных: ' + err.message)
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleQuizUpdate = async (quizType, updatedQuiz) => {
    try {
      const response = await api.put(`/api/quiz/${quizType}`, updatedQuiz)

      if (quizType === 'tools') {
        setToolsQuiz(updatedQuiz)
      } else {
        setSculptorsQuiz(updatedQuiz)
      }

      alert('Викторина успешно обновлена!')
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Неизвестная ошибка'
      alert('Ошибка обновления: ' + errorMessage)
      console.error('Error updating quiz:', err)
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Загрузка...</div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Административная панель</h1>
        <button 
          className={styles.refreshButton}
          onClick={loadData}
        >
          🔄 Обновить
        </button>
      </div>

      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'tools' ? styles.active : ''}`}
          onClick={() => setActiveTab('tools')}
        >
          🔨 Инструменты
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'sculptors' ? styles.active : ''}`}
          onClick={() => setActiveTab('sculptors')}
        >
          🎨 Скульпторы
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'statistics' ? styles.active : ''}`}
          onClick={() => setActiveTab('statistics')}
        >
          📊 Статистика
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === 'tools' && toolsQuiz && (
          <AdminQuizEditor
            quizType="tools"
            quizData={toolsQuiz}
            onUpdate={handleQuizUpdate}
          />
        )}

        {activeTab === 'sculptors' && sculptorsQuiz && (
          <AdminQuizEditor
            quizType="sculptors"
            quizData={sculptorsQuiz}
            onUpdate={handleQuizUpdate}
          />
        )}

        {activeTab === 'statistics' && (
          <AdminStatistics
            statistics={statistics}
            toolsQuiz={toolsQuiz}
            sculptorsQuiz={sculptorsQuiz}
          />
        )}
      </div>
    </div>
  )
}

export default AdminPage
