/* eslint-env node */
const express = require('express');
const path = require('path');
const { exec } = require('child_process');
const { existsSync } = require('fs');
const { platform } = require('os');

const app = express();
const PORT = 3001;

// Определяем путь к папке dist
// При запуске через pkg, пути к файлам отличаются
const fs = require('fs');
let distPath;

if (process.pkg) {
  // При запуске через pkg, assets находятся в snapshot
  // Пробуем разные возможные пути
  const possiblePaths = [
    path.join(__dirname, 'dist'), // /snapshot/sculpture-quizzes/dist
    path.join(__dirname, '../dist'), // альтернативный путь
    path.dirname(process.execPath), // рядом с исполняемым файлом
    path.join(path.dirname(process.execPath), 'dist'), // dist рядом с exe
  ];

  // Ищем существующий путь
  for (const testPath of possiblePaths) {
    if (existsSync(testPath) && existsSync(path.join(testPath, 'index.html'))) {
      distPath = testPath;
      console.log('PKG mode - Found dist at:', distPath);
      break;
    }
  }

  // Если не нашли, используем __dirname/dist и выводим отладочную информацию
  if (!distPath) {
    distPath = path.join(__dirname, 'dist');
    console.log('PKG mode - __dirname:', __dirname);
    console.log('PKG mode - process.execPath:', process.execPath);
    console.log('PKG mode - distPath:', distPath);

    // Список файлов в __dirname для отладки
    try {
      const files = fs.readdirSync(__dirname);
      console.log('PKG mode - files in __dirname:', files);
    } catch (e) {
      console.log('PKG mode - cannot read __dirname:', e.message);
    }

    // Проверяем dist папку
    try {
      if (existsSync(distPath)) {
        const distFiles = fs.readdirSync(distPath);
        console.log('PKG mode - files in dist:', distFiles);
      } else {
        console.log('PKG mode - dist folder does not exist at:', distPath);
      }
    } catch (e) {
      console.log('PKG mode - cannot read dist:', e.message);
    }
  }
} else {
  // При обычном запуске, dist находится рядом с server.cjs
  distPath = path.join(__dirname, 'dist');
}

// Middleware для парсинга JSON
app.use(express.json());

// Обслуживание статических файлов из папки dist
app.use(express.static(distPath));

// Функция для получения пути к файлам викторин
function getQuizPath(quizType) {
  const fileName = quizType === 'tools' ? 'tools-quiz.json' : 'sculptors-quiz.json';
  // Приоритет: public/data для разработки, затем dist/data при сборке
  const publicPath = path.join(__dirname, 'public', 'data', fileName);
  const distDataPath = path.join(distPath, 'data', fileName);
  
  // Проверяем в порядке приоритета
  if (existsSync(publicPath)) {
    return publicPath;
  }
  if (existsSync(distDataPath)) {
    return distDataPath;
  }
  // По умолчанию используем public/data
  return publicPath;
}

// Функция для получения пути к statistics.json
function getStatisticsPath() {
  // Приоритет: public/json для разработки, затем dist/json при сборке
  const publicPath = path.join(__dirname, 'public', 'json', 'statistics.json');
  const distJsonPath = path.join(distPath, 'json', 'statistics.json');
  const distPathOld = path.join(distPath, 'statistics.json');
  
  // Проверяем в порядке приоритета
  if (existsSync(publicPath)) {
    return publicPath;
  }
  if (existsSync(distJsonPath)) {
    return distJsonPath;
  }
  // Для обратной совместимости
  if (existsSync(distPathOld)) {
    return distPathOld;
  }
  // По умолчанию используем public/json
  return publicPath;
}

// API endpoints для работы с викторинами
app.get('/api/quiz/:type', (req, res) => {
  try {
    const quizType = req.params.type; // 'tools' или 'sculptors'
    const quizPath = getQuizPath(quizType);
    
    if (!existsSync(quizPath)) {
      return res.status(404).json({ error: 'Викторина не найдена' });
    }
    
    const data = fs.readFileSync(quizPath, 'utf8');
    const quizData = JSON.parse(data);
    res.json(quizData);
  } catch (error) {
    console.error('Error reading quiz:', error);
    res.status(500).json({ error: 'Не удалось загрузить викторину' });
  }
});

// Обновить викторину (все вопросы)
app.put('/api/quiz/:type', (req, res) => {
  try {
    const quizType = req.params.type;
    const quizPath = getQuizPath(quizType);
    
    // Создаем директорию если её нет
    const dir = path.dirname(quizPath);
    if (!existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Сохраняем обновленную викторину
    fs.writeFileSync(quizPath, JSON.stringify(req.body, null, 2), 'utf8');
    
    res.json(req.body);
  } catch (error) {
    console.error('Error updating quiz:', error);
    res.status(500).json({ error: 'Не удалось обновить викторину' });
  }
});

// Получить конкретный вопрос викторины
app.get('/api/quiz/:type/question/:id', (req, res) => {
  try {
    const quizType = req.params.type;
    const questionId = parseInt(req.params.id);
    const quizPath = getQuizPath(quizType);
    
    if (!existsSync(quizPath)) {
      return res.status(404).json({ error: 'Викторина не найдена' });
    }
    
    const data = fs.readFileSync(quizPath, 'utf8');
    const quizData = JSON.parse(data);
    const question = quizData.questions.find(q => q.id === questionId);
    
    if (!question) {
      return res.status(404).json({ error: 'Вопрос не найден' });
    }
    
    res.json(question);
  } catch (error) {
    console.error('Error reading question:', error);
    res.status(500).json({ error: 'Не удалось загрузить вопрос' });
  }
});

// Добавить новый вопрос в викторину
app.post('/api/quiz/:type/question', (req, res) => {
  try {
    const quizType = req.params.type;
    const quizPath = getQuizPath(quizType);
    
    let quizData = { title: '', subtitle: '', questions: [] };
    if (existsSync(quizPath)) {
      const data = fs.readFileSync(quizPath, 'utf8');
      quizData = JSON.parse(data);
    }
    
    // Определяем максимальный ID
    const maxId = quizData.questions.length > 0 
      ? Math.max(...quizData.questions.map(q => q.id || 0))
      : 0;
    
    // Добавляем новый вопрос
    const newQuestion = {
      id: maxId + 1,
      ...req.body
    };
    quizData.questions.push(newQuestion);
    
    // Сохраняем в файл
    const dir = path.dirname(quizPath);
    if (!existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(quizPath, JSON.stringify(quizData, null, 2), 'utf8');
    
    res.json(newQuestion);
  } catch (error) {
    console.error('Error creating question:', error);
    res.status(500).json({ error: 'Не удалось создать вопрос' });
  }
});

// Обновить вопрос викторины
app.put('/api/quiz/:type/question/:id', (req, res) => {
  try {
    const quizType = req.params.type;
    const questionId = parseInt(req.params.id);
    const quizPath = getQuizPath(quizType);
    
    if (!existsSync(quizPath)) {
      return res.status(404).json({ error: 'Викторина не найдена' });
    }
    
    const data = fs.readFileSync(quizPath, 'utf8');
    const quizData = JSON.parse(data);
    const questionIndex = quizData.questions.findIndex(q => q.id === questionId);
    
    if (questionIndex === -1) {
      return res.status(404).json({ error: 'Вопрос не найден' });
    }
    
    // Обновляем вопрос
    quizData.questions[questionIndex] = { 
      ...quizData.questions[questionIndex], 
      ...req.body, 
      id: questionId 
    };
    
    // Сохраняем в файл
    fs.writeFileSync(quizPath, JSON.stringify(quizData, null, 2), 'utf8');
    
    res.json(quizData.questions[questionIndex]);
  } catch (error) {
    console.error('Error updating question:', error);
    res.status(500).json({ error: 'Не удалось обновить вопрос' });
  }
});

// Удалить вопрос викторины
app.delete('/api/quiz/:type/question/:id', (req, res) => {
  try {
    const quizType = req.params.type;
    const questionId = parseInt(req.params.id);
    const quizPath = getQuizPath(quizType);
    
    if (!existsSync(quizPath)) {
      return res.status(404).json({ error: 'Викторина не найдена' });
    }
    
    const data = fs.readFileSync(quizPath, 'utf8');
    const quizData = JSON.parse(data);
    const initialLength = quizData.questions.length;
    quizData.questions = quizData.questions.filter(q => q.id !== questionId);
    
    if (quizData.questions.length === initialLength) {
      return res.status(404).json({ error: 'Вопрос не найден' });
    }
    
    // Удаляем статистику для этого вопроса
    const statsPath = getStatisticsPath();
    if (existsSync(statsPath)) {
      const stats = JSON.parse(fs.readFileSync(statsPath, 'utf8'));
      const filteredStats = stats.filter(s => 
        !(s.quizType === quizType && s.questionId === questionId)
      );
      fs.writeFileSync(statsPath, JSON.stringify(filteredStats, null, 2), 'utf8');
    }
    
    // Сохраняем в файл
    fs.writeFileSync(quizPath, JSON.stringify(quizData, null, 2), 'utf8');
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting question:', error);
    res.status(500).json({ error: 'Не удалось удалить вопрос' });
  }
});

// API endpoints для статистики викторин
app.post('/api/statistics', (req, res) => {
  try {
    const statsPath = getStatisticsPath();
    let statistics = [];
    
    // Читаем существующую статистику
    if (existsSync(statsPath)) {
      const data = fs.readFileSync(statsPath, 'utf8');
      statistics = JSON.parse(data);
    }
    
    const { quizType, questionId, selectedAnswer, isCorrect } = req.body;
    
    // Ищем существующую запись для этого вопроса
    let statEntry = statistics.find(s => 
      s.quizType === quizType && s.questionId === questionId
    );
    
    if (statEntry) {
      // Обновляем существующую статистику
      statEntry.totalAnswers = (statEntry.totalAnswers || 0) + 1;
      statEntry.correctAnswers = (statEntry.correctAnswers || 0) + (isCorrect ? 1 : 0);
      
      // Обновляем статистику по вариантам ответов
      if (!statEntry.answerStats) {
        statEntry.answerStats = {};
      }
      const answerKey = `option_${selectedAnswer}`;
      statEntry.answerStats[answerKey] = (statEntry.answerStats[answerKey] || 0) + 1;
      
      // Вычисляем процент правильных ответов
      statEntry.accuracy = ((statEntry.correctAnswers / statEntry.totalAnswers) * 100).toFixed(2);
    } else {
      // Создаем новую запись статистики
      statEntry = {
        quizType,
        questionId,
        totalAnswers: 1,
        correctAnswers: isCorrect ? 1 : 0,
        answerStats: {
          [`option_${selectedAnswer}`]: 1
        },
        accuracy: isCorrect ? '100.00' : '0.00'
      };
      statistics.push(statEntry);
    }
    
    // Сохраняем статистику
    const dir = path.dirname(statsPath);
    if (!existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(statsPath, JSON.stringify(statistics, null, 2), 'utf8');
    
    res.json(statEntry);
  } catch (error) {
    console.error('Error saving statistics:', error);
    res.status(500).json({ error: 'Не удалось сохранить статистику' });
  }
});

app.get('/api/statistics', (req, res) => {
  try {
    const statsPath = getStatisticsPath();
    if (!existsSync(statsPath)) {
      return res.json([]);
    }
    const data = fs.readFileSync(statsPath, 'utf8');
    const statistics = JSON.parse(data);
    res.json(statistics);
  } catch (error) {
    console.error('Error reading statistics:', error);
    res.status(500).json({ error: 'Не удалось загрузить статистику' });
  }
});

// Специальный маршрут для админ-панели
app.get('/admin', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Для всех остальных маршрутов возвращаем index.html (SPA routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Функция для запуска браузера в киоск-режиме
function launchBrowser() {
  const currentPlatform = platform();
  const url = `http://localhost:${PORT}/`;

  setTimeout(() => {
    if (currentPlatform === 'win32') {
      // Windows
      const chromePath = process.env['ProgramFiles'] + '\\Google\\Chrome\\Application\\chrome.exe';
      const edgePath = process.env['ProgramFiles(x86)'] + '\\Microsoft\\Edge\\Application\\msedge.exe';

      if (existsSync(chromePath)) {
        // Запуск Chrome в киоск-режиме
        const chromeArgs = [
          '--disable-web-security',
          `--user-data-dir="${process.env.TEMP}\\ChromeTempProfile"`,
          '--autoplay-policy=no-user-gesture-required',
          `--app="${url}"`,
          '--start-fullscreen',
          '--kiosk',
          '--disable-features=Translate,ContextMenuSearchWebFor,ImageSearch',
        ].join(' ');

        exec(`"${chromePath}" ${chromeArgs}`, (error) => {
          if (error) {
            console.error('Ошибка запуска Chrome:', error);
          }
        });
      } else if (existsSync(edgePath)) {
        // Настройка реестра для Edge (требует прав администратора)
        const regCommands = [
          'reg add "HKLM\\SOFTWARE\\Policies\\Microsoft\\Edge" /v "TranslateEnabled" /t REG_DWORD /d 0 /f',
          'reg add "HKLM\\SOFTWARE\\Policies\\Microsoft\\Edge" /v "ContextMenuSearchEnabled" /t REG_DWORD /d 0 /f',
          'reg add "HKLM\\SOFTWARE\\Policies\\Microsoft\\Edge" /v "VisualSearchEnabled" /t REG_DWORD /d 0 /f',
        ];

        // Выполняем команды реестра (могут не сработать без прав администратора)
        regCommands.forEach((cmd) => {
          exec(cmd, () => {}); // Игнорируем ошибки, если нет прав
        });

        // Запуск Edge в киоск-режиме
        const edgeArgs = [
          `--kiosk "${url}"`,
          '--edge-kiosk-type=fullscreen',
          '--no-first-run',
          '--disable-features=msEdgeSidebarV2,msHub,msWelcomePage,msTranslations,msContextMenuSearch,msVisualSearch',
          '--disable-component-update',
          '--disable-prompt-on-repost',
          '--kiosk-idle-timeout-minutes=0',
        ].join(' ');

        exec(`"${edgePath}" ${edgeArgs}`, (error) => {
          if (error) {
            console.error('Ошибка запуска Edge:', error);
          }
        });
      } else {
        console.log('Не найден ни Chrome, ни Edge. Откройте браузер вручную.');
        console.log(`URL: ${url}`);
      }

      // Убиваем explorer.exe через 12 секунд (опционально, можно закомментировать)
      setTimeout(() => {
        console.log('Kill Explorer...');
        exec('taskkill /f /im explorer.exe', (error) => {
          if (error) {
            // Игнорируем ошибки, если нет прав или explorer уже закрыт
          }
        });
      }, 12000);
    } else if (currentPlatform === 'darwin') {
      // macOS
      const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
      const safariPath = '/Applications/Safari.app';
      const edgePath = '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge';

      if (existsSync(chromePath)) {
        // Запуск Chrome в киоск-режиме на macOS
        const chromeArgs = [
          '--disable-web-security',
          `--user-data-dir="${process.env.TMPDIR || '/tmp'}/ChromeTempProfile"`,
          '--autoplay-policy=no-user-gesture-required',
          `--app="${url}"`,
          '--start-fullscreen',
          '--kiosk',
          '--disable-features=Translate,ContextMenuSearchWebFor,ImageSearch',
        ].join(' ');

        exec(`"${chromePath}" ${chromeArgs}`, (error) => {
          if (error) {
            console.error('Ошибка запуска Chrome:', error);
          }
        });
      } else if (existsSync(edgePath)) {
        // Запуск Edge в киоск-режиме на macOS
        const edgeArgs = [
          `--kiosk "${url}"`,
          '--edge-kiosk-type=fullscreen',
          '--no-first-run',
          '--disable-features=msEdgeSidebarV2,msHub,msWelcomePage,msTranslations,msContextMenuSearch,msVisualSearch',
        ].join(' ');

        exec(`"${edgePath}" ${edgeArgs}`, (error) => {
          if (error) {
            console.error('Ошибка запуска Edge:', error);
          }
        });
      } else if (existsSync(safariPath)) {
        // Запуск Safari (без киоск-режима, так как Safari не поддерживает флаги командной строки)
        exec(`open -a Safari "${url}"`, (error) => {
          if (error) {
            console.error('Ошибка запуска Safari:', error);
          } else {
            console.log('Safari открыт. Для полноэкранного режима нажмите Cmd+Ctrl+F');
          }
        });
      } else {
        console.log('Не найден ни Chrome, ни Edge, ни Safari. Откройте браузер вручную.');
        console.log(`URL: ${url}`);
      }
    } else {
      console.log('Автоматический запуск браузера доступен только на Windows и macOS');
      console.log(`Откройте браузер вручную: ${url}`);
    }
  }, 3000); // Ждем 3 секунды после запуска сервера
}

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Serving files from: ${distPath}`);

  // Запускаем браузер автоматически (Windows и macOS)
  if (platform() === 'win32' || platform() === 'darwin') {
    launchBrowser();
  }
});
