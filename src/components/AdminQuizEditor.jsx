import { useState } from 'react'
import styles from './AdminQuizEditor.module.css'
import api from '../utils/api'

function AdminQuizEditor({ quizType, quizData, onUpdate }) {
  const [editingId, setEditingId] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState(getInitialFormData())

  function getInitialFormData() {
    return {
      task: '',
      work: '',
      image: '',
      answers: [
        { text: '', correct: false, image: '', explanation: '' },
        { text: '', correct: false, image: '', explanation: '' },
        { text: '', correct: false, image: '', explanation: '' },
        { text: '', correct: false, image: '', explanation: '' }
      ],
      additionalInfo: ''
    }
  }

  const handleEdit = (question) => {
    setEditingId(question.id)
    setFormData({
      task: question.task || '',
      work: question.work || '',
      image: question.image || '',
      answers: question.answers || getInitialFormData().answers,
      additionalInfo: question.additionalInfo || ''
    })
    setShowAddForm(true)
  }

  const handleDelete = async (questionId) => {
    if (!confirm('Вы уверены, что хотите удалить этот вопрос?')) {
      return
    }

    try {
      await api.delete(`/api/quiz/${quizType}/question/${questionId}`)

      const updatedQuestions = quizData.questions.filter(q => q.id !== questionId)
      onUpdate(quizType, {
        ...quizData,
        questions: updatedQuestions
      })
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Неизвестная ошибка'
      alert('Ошибка удаления: ' + errorMessage)
    }
  }

  const handleSave = async () => {
    // Валидация
    if (quizType === 'tools' && !formData.task.trim()) {
      alert('Введите задачу')
      return
    }
    if (quizType === 'sculptors' && !formData.work.trim()) {
      alert('Введите название произведения')
      return
    }
    if (formData.answers.filter(a => a.text.trim()).length < 2) {
      alert('Добавьте хотя бы 2 варианта ответа')
      return
    }
    if (formData.answers.filter(a => a.correct).length !== 1) {
      alert('Должен быть выбран ровно один правильный ответ')
      return
    }

    try {
      const questionData = {
        ...formData,
        answers: formData.answers.filter(a => a.text.trim())
      }

      let updatedQuestion
      
      if (editingId) {
        // Обновление существующего вопроса
        const response = await api.put(`/api/quiz/${quizType}/question/${editingId}`, questionData)
        updatedQuestion = response.data
      } else {
        // Добавление нового вопроса
        const response = await api.post(`/api/quiz/${quizType}/question`, questionData)
        updatedQuestion = response.data
      }

      // Обновляем викторину локально
      const updatedQuiz = editingId
        ? {
            ...quizData,
            questions: quizData.questions.map(q =>
              q.id === editingId ? updatedQuestion : q
            )
          }
        : {
            ...quizData,
            questions: [...quizData.questions, updatedQuestion]
          }

      // Обновляем викторину на сервере
      await onUpdate(quizType, updatedQuiz)

      setShowAddForm(false)
      setEditingId(null)
      setFormData(getInitialFormData())
    } catch (err) {
      alert('Ошибка сохранения: ' + err.message)
    }
  }

  const handleCancel = () => {
    setShowAddForm(false)
    setEditingId(null)
    setFormData(getInitialFormData())
  }

  const updateAnswer = (index, field, value) => {
    const newAnswers = [...formData.answers]
    newAnswers[index] = { ...newAnswers[index], [field]: value }
    setFormData({ ...formData, answers: newAnswers })
  }

  const toggleCorrectAnswer = (index) => {
    const newAnswers = formData.answers.map((a, i) => ({
      ...a,
      correct: i === index
    }))
    setFormData({ ...formData, answers: newAnswers })
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>{quizData.title}</h2>
        <button
          className={styles.addButton}
          onClick={() => {
            setEditingId(null)
            setFormData(getInitialFormData())
            setShowAddForm(true)
          }}
        >
          + Добавить вопрос
        </button>
      </div>

      {showAddForm && (
        <div className={styles.form}>
          <h3>{editingId ? 'Редактирование вопроса' : 'Новый вопрос'}</h3>
          
          {quizType === 'tools' ? (
            <div className={styles.field}>
              <label>Задача:</label>
              <input
                type="text"
                value={formData.task}
                onChange={(e) => setFormData({ ...formData, task: e.target.value })}
                placeholder="Опишите задачу"
              />
            </div>
          ) : (
            <>
              <div className={styles.field}>
                <label>Название произведения:</label>
                <input
                  type="text"
                  value={formData.work}
                  onChange={(e) => setFormData({ ...formData, work: e.target.value })}
                  placeholder="Название скульптуры"
                />
              </div>
              <div className={styles.field}>
                <label>Изображение произведения:</label>
                <input
                  type="text"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="/images/sculptures/example.jpg"
                />
              </div>
            </>
          )}

          <div className={styles.answers}>
            <h4>Варианты ответов:</h4>
            {formData.answers.map((answer, index) => (
              <div key={index} className={styles.answerRow}>
                <input
                  type="checkbox"
                  checked={answer.correct}
                  onChange={() => toggleCorrectAnswer(index)}
                  className={styles.correctCheckbox}
                />
                <input
                  type="text"
                  value={answer.text}
                  onChange={(e) => updateAnswer(index, 'text', e.target.value)}
                  placeholder={`Вариант ${index + 1}`}
                  className={styles.answerText}
                />
                {quizType === 'tools' && (
                  <input
                    type="text"
                    value={answer.image}
                    onChange={(e) => updateAnswer(index, 'image', e.target.value)}
                    placeholder="Изображение"
                    className={styles.answerImage}
                  />
                )}
                <input
                  type="text"
                  value={answer.explanation}
                  onChange={(e) => updateAnswer(index, 'explanation', e.target.value)}
                  placeholder="Объяснение"
                  className={styles.answerExplanation}
                />
              </div>
            ))}
          </div>

          <div className={styles.field}>
            <label>Дополнительная информация:</label>
            <textarea
              value={formData.additionalInfo}
              onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
              placeholder="Интересные факты..."
              rows="3"
            />
          </div>

          <div className={styles.formActions}>
            <button className={styles.saveButton} onClick={handleSave}>
              Сохранить
            </button>
            <button className={styles.cancelButton} onClick={handleCancel}>
              Отмена
            </button>
          </div>
        </div>
      )}

      <div className={styles.questionsList}>
        {quizData.questions.map((question) => (
          <div key={question.id} className={styles.questionCard}>
            <div className={styles.questionHeader}>
              <span className={styles.questionId}>#{question.id}</span>
              <div className={styles.questionActions}>
                <button
                  className={styles.editButton}
                  onClick={() => handleEdit(question)}
                >
                  ✏️ Редактировать
                </button>
                <button
                  className={styles.deleteButton}
                  onClick={() => handleDelete(question.id)}
                >
                  🗑️ Удалить
                </button>
              </div>
            </div>
            <div className={styles.questionContent}>
              {quizType === 'tools' ? (
                <p className={styles.task}>{question.task}</p>
              ) : (
                <>
                  <p className={styles.work}>{question.work}</p>
                  {question.image && (
                    <img src={question.image} alt={question.work} className={styles.workImage} />
                  )}
                </>
              )}
              <div className={styles.answersList}>
                {question.answers.map((answer, index) => (
                  <div
                    key={index}
                    className={`${styles.answerItem} ${answer.correct ? styles.correct : ''}`}
                  >
                    {answer.correct && <span className={styles.correctMark}>✓</span>}
                    {answer.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AdminQuizEditor
