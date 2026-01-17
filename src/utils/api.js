import axios from 'axios'

// Определяем базовый URL для API
const getApiBase = () => {
  if (window.location.hostname === 'localhost' && window.location.port === '5173') {
    return 'http://localhost:3001'
  }
  return ''
}

// Создаем экземпляр axios с базовой конфигурацией
const api = axios.create({
  baseURL: getApiBase(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 секунд
})

// Интерцептор для обработки ошибок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Сервер вернул ответ с кодом ошибки
      console.error('API Error:', error.response.status, error.response.data)
    } else if (error.request) {
      // Запрос был отправлен, но ответа не получено
      console.error('API Error: No response received', error.request)
    } else {
      // Ошибка при настройке запроса
      console.error('API Error:', error.message)
    }
    return Promise.reject(error)
  }
)

export default api
export { getApiBase }
