const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const os = require('os');

/**
 * Конфигурация сервера
 * Измените значения здесь для настройки поведения
 */
const CONFIG = {
  // Порт сервера
  port: 3001,

  // Режим kiosk (полноэкранный режим)
  // false - обычный режим с доступом к DevTools
  // true - полноэкранный kiosk режим (DevTools недоступны)
  kioskMode: false,

  // Автоматически открывать браузер при запуске
  openBrowser: true,

  // Отключить проверку CORS в браузере (--disable-web-security)
  // ВНИМАНИЕ: Это отключает защиту безопасности браузера!
  // Используйте только для разработки на локальном сервере
  disableWebSecurity: true,

  // Задержка перед открытием браузера (мс)
  browserDelay: 1000,

  // Путь к index.html (для проверки)
  indexHtmlPath: 'index.html',

  // Имя файла данных
  dataFileName: 'materials.json',
};

/**
 * Класс для управления настройками и запуском сервера
 * Поддерживает как обычный запуск через node, так и сборку через pkg
 */
class ServerSetup {
  constructor() {
    // Определяем базовую директорию
    this.isPkg = typeof process.pkg !== 'undefined';
    this.baseDir = this.isPkg ? path.dirname(process.execPath) : path.join(__dirname, '..', '..');

    // Используем конфигурацию из CONFIG
    this.config = {
      port: CONFIG.port,
      kioskMode: CONFIG.kioskMode,
      openBrowser: CONFIG.openBrowser,
      disableWebSecurity: CONFIG.disableWebSecurity,
      browserDelay: CONFIG.browserDelay,
      indexHtmlPath: CONFIG.indexHtmlPath,
      dataFileName: CONFIG.dataFileName,
    };

    // Определяем BUILD_DIR
    // Vite теперь собирает в build/ (изменено в vite.config.js)
    // В pkg режиме: exe находится в build/, статические файлы тоже там
    if (this.isPkg) {
      // При pkg exe находится в build/, статические файлы должны быть там же
      this.buildDir = this.baseDir; // build/ где находится launch.exe
    } else {
      // В режиме разработки используем build/ (куда Vite собирает)
      this.buildDir = path.join(this.baseDir, 'build');
    }

    // Определяем путь к директории данных
    if (this.isPkg) {
      // В pkg режиме: данные в build/data/ (рядом с launch.exe)
      this.dataDir = path.join(this.baseDir, 'data');
    } else {
      // В режиме разработки: используем build/data/
      this.dataDir = path.join(this.buildDir, 'data');
    }
    
    // Определяем путь к файлу данных (для обратной совместимости)
    if (this.isPkg) {
      this.dataFile = path.join(this.dataDir, this.config.dataFileName);
      this.dataFileFallback = null;
    } else {
      const buildPath = path.join(this.dataDir, this.config.dataFileName);
      const publicPath = path.join(this.baseDir, 'public', 'data', this.config.dataFileName);
      this.dataFile = buildPath;
      this.dataFileFallback = publicPath;
    }
  }

  /**
   * Получить базовую директорию
   */
  getBaseDir() {
    return this.baseDir;
  }

  /**
   * Получить директорию со статическими файлами
   */
  getBuildDir() {
    return this.buildDir;
  }

  /**
   * Получить путь к директории данных
   */
  getDataDir() {
    return this.dataDir;
  }

  /**
   * Получить путь к файлу данных
   * Проверяет существование файла и возвращает подходящий путь
   */
  async getDataFile() {
    if (this.isPkg) {
      return this.dataFile;
    }
    
    // Проверяем существование файла в build/data/, если нет - используем public/data/
    const buildExists = await fs.pathExists(this.dataFile);
    if (buildExists) {
      return this.dataFile;
    }
    
    // Если файла нет в build/data/, проверяем public/data/
    if (this.dataFileFallback) {
      const publicExists = await fs.pathExists(this.dataFileFallback);
      if (publicExists) {
        return this.dataFileFallback;
      }
    }
    
    // Если файла нет нигде, возвращаем путь к build/data/ (будет создан)
    return this.dataFile;
  }

  /**
   * Получить путь к файлу викторины
   * @param {string} quizType - тип викторины ('tools' или 'sculptors')
   */
  getQuizPath(quizType) {
    const fileName = quizType === 'tools' ? 'tools-quiz.json' : 'sculptors-quiz.json';
    if (this.isPkg) {
      return path.join(this.dataDir, fileName);
    }
    // В режиме разработки: пробуем build/data/, затем public/data/
    return path.join(this.dataDir, fileName);
  }

  /**
   * Получить путь к файлу статистики
   */
  getStatisticsPath() {
    if (this.isPkg) {
      return path.join(this.dataDir, 'statistics.json');
    }
    return path.join(this.dataDir, 'statistics.json');
  }

  /**
   * Проверить, запущен ли через pkg
   */
  isPkgMode() {
    return this.isPkg;
  }

  /**
   * Получить URL приложения
   */
  getAppUrl() {
    return `http://localhost:${this.config.port}`;
  }

  /**
   * Получить URL API
   */
  getApiUrl() {
    return `http://localhost:${this.config.port}/api`;
  }

  /**
   * Проверить существование index.html
   */
  async checkIndexHtml() {
    const indexHtmlPath = path.join(this.buildDir, this.config.indexHtmlPath);
    const exists = await fs.pathExists(indexHtmlPath);

    if (!exists) {
      console.error(`❌ Ошибка: файл ${this.config.indexHtmlPath} не найден по пути: ${indexHtmlPath}`);
      console.log(`📂 BUILD_DIR: ${this.buildDir}`);
      console.log(`📂 baseDir: ${this.baseDir}`);
      console.log(`📂 isPkg: ${this.isPkg}`);
      console.log(`📂 process.execPath: ${process.execPath}`);
      console.log(`📂 process.cwd(): ${process.cwd()}`);
    } else {
      console.log(`✅ ${this.config.indexHtmlPath} найден: ${indexHtmlPath}`);
    }

    return exists;
  }

  /**
   * Открыть браузер в kiosk режиме (только для Windows)
   */
  async openBrowser() {
    if (!this.config.openBrowser) {
      return;
    }

    if (os.platform() !== 'win32') {
      console.log('⚠️  Автоматическое открытие браузера поддерживается только на Windows');
      console.log(`🌐 Откройте браузер вручную: ${this.getAppUrl()}`);
      return;
    }

    const url = this.getAppUrl();

    if (!this.config.kioskMode) {
      console.log('💡 Kiosk режим выключен - DevTools доступны (F12 для открытия)');
    }
    if (this.config.disableWebSecurity) {
      console.log('⚠️  ВНИМАНИЕ: Проверка CORS отключена в браузере! Это небезопасно для продакшена.');
    }
    const chromePath = process.env.PROGRAMFILES + '\\Google\\Chrome\\Application\\chrome.exe';
    const edgePath = process.env['ProgramFiles(x86)'] + '\\Microsoft\\Edge\\Application\\msedge.exe';

    // Проверяем наличие Chrome
    const chromeExists = await fs.pathExists(chromePath);

    if (chromeExists) {
      // Открываем Chrome в kiosk режиме или обычном режиме
      let chromeFlags = '';

      // Добавляем флаги для отключения CORS, если включено
      if (this.config.disableWebSecurity) {
        chromeFlags += `--disable-web-security --user-data-dir="${os.tmpdir()}\\ChromeTempProfile" `;
      }

      if (this.config.kioskMode) {
        chromeFlags += `--autoplay-policy=no-user-gesture-required --app="${url}" --start-fullscreen --kiosk --disable-features=Translate,ContextMenuSearchWebFor,ImageSearch`;
      } else {
        chromeFlags += `--app="${url}" --auto-open-devtools-for-tabs`;
      }

      exec(`"${chromePath}" ${chromeFlags}`, (error) => {
        if (error) {
          console.error('❌ Ошибка открытия Chrome:', error);
        }
      });

      // Убиваем explorer.exe через 12 секунд для чистого kiosk режима
      if (this.config.kioskMode) {
        setTimeout(() => {
          exec('taskkill /f /im explorer.exe', (error) => {
            if (error && !error.message.includes('не найден')) {
              console.error('⚠️  Не удалось закрыть explorer.exe:', error.message);
            }
          });
        }, 12000);
      }
    } else {
      // Проверяем наличие Edge
      const edgeExists = await fs.pathExists(edgePath);

      if (edgeExists) {
        // Настраиваем Edge политики
        if (this.config.kioskMode) {
          exec('reg add "HKLM\\SOFTWARE\\Policies\\Microsoft\\Edge" /v "TranslateEnabled" /t REG_DWORD /d 0 /f >nul 2>&1', () => {});
          exec('reg add "HKLM\\SOFTWARE\\Policies\\Microsoft\\Edge" /v "ContextMenuSearchEnabled" /t REG_DWORD /d 0 /f >nul 2>&1', () => {});
          exec('reg add "HKLM\\SOFTWARE\\Policies\\Microsoft\\Edge" /v "VisualSearchEnabled" /t REG_DWORD /d 0 /f >nul 2>&1', () => {});
        }

        // Открываем Edge в kiosk режиме
        let edgeFlags = '';

        // Добавляем флаги для отключения CORS, если включено
        if (this.config.disableWebSecurity) {
          edgeFlags += `--disable-web-security --user-data-dir="${os.tmpdir()}\\EdgeTempProfile" `;
        }

        if (this.config.kioskMode) {
          edgeFlags += `--kiosk "${url}" --edge-kiosk-type=fullscreen --no-first-run --disable-features=msEdgeSidebarV2,msHub,msWelcomePage,msTranslations,msContextMenuSearch,msVisualSearch --disable-component-update --disable-prompt-on-repost --kiosk-idle-timeout-minutes=0`;
        } else {
          edgeFlags += `"${url}"`;
        }

        exec(`"${edgePath}" ${edgeFlags}`, (error) => {
          if (error) {
            console.error('❌ Ошибка открытия Edge:', error);
          }
        });
      } else {
        console.error('❌ Не найден ни Chrome, ни Edge. Откройте браузер вручную:', url);
      }
    }
  }

  /**
   * Инициализировать директорию для данных
   */
  async initializeDataDir() {
    try {
      // Создаем директорию данных
      await fs.ensureDir(this.dataDir);
      
      // Копируем файлы викторин из public/data/ в build/data/, если их там нет
      if (!this.isPkg) {
        const publicDataDir = path.join(this.baseDir, 'public', 'data');
        const publicDataExists = await fs.pathExists(publicDataDir);
        
        if (publicDataExists) {
          const quizFiles = ['tools-quiz.json', 'sculptors-quiz.json', 'sounds-config.json'];
          
          for (const fileName of quizFiles) {
            const publicFile = path.join(publicDataDir, fileName);
            const buildFile = path.join(this.dataDir, fileName);
            
            const publicExists = await fs.pathExists(publicFile);
            const buildExists = await fs.pathExists(buildFile);
            
            if (publicExists && !buildExists) {
              await fs.copy(publicFile, buildFile);
              console.log(`✅ Скопирован ${fileName} в build/data/`);
            }
          }
        }
      }

      // Получаем актуальный путь к файлу данных
      const dataFile = await this.getDataFile();
      await fs.ensureDir(path.dirname(dataFile));

      // Проверяем существование файла
      const dataExists = await fs.pathExists(dataFile);
      console.log(`📂 Проверка файла данных: ${dataFile}`);
      console.log(`📂 Файл существует: ${dataExists}`);

      if (!dataExists) {
        console.log('✅ Директория для данных создана');
      } else {
        console.log('✅ Файл данных найден');
      }

      return true;
    } catch (error) {
      console.error('❌ Ошибка инициализации директории данных:', error);
      const dataFile = await this.getDataFile().catch(() => this.dataFile);
      console.error('❌ Путь к файлу:', dataFile);
      return false;
    }
  }

  /**
   * Вывести информацию о конфигурации сервера
   */
  logServerInfo() {
    console.log(`🚀 Сервер запущен на порту ${this.config.port}`);
    console.log(`📁 Данные сохраняются в: ${this.dataDir}`);
    console.log(`📂 Статические файлы из: ${this.buildDir}`);
    console.log(`📂 baseDir: ${this.baseDir}`);
    console.log(`📂 Викторины: ${this.getQuizPath('tools')} и ${this.getQuizPath('sculptors')}`);
    console.log(`🌐 API доступно по адресу: ${this.getApiUrl()}`);
    console.log(`🎨 Приложение: ${this.getAppUrl()}`);
    console.log(`🔧 Kiosk режим: ${this.config.kioskMode ? '✅ включен' : '❌ выключен (DevTools доступны)'}`);
    console.log(`🔒 Отключение CORS в браузере: ${this.config.disableWebSecurity ? '✅ включено (⚠️  небезопасно!)' : '❌ выключено'}`);
    if (this.config.openBrowser) {
      console.log(`🌐 Автооткрытие браузера: ✅ включено`);
    }
  }

  /**
   * Настроить Express приложение для работы со статическими файлами
   * @param {Express} app - Express приложение
   * @param {Object} express - Express модуль (для express.static)
   */
  setupStaticFiles(app, express) {
    // Раздача статических файлов из build (CSS, JS, изображения и т.д.)
    // Размещено после API маршрутов, чтобы API запросы обрабатывались первыми
    app.use(express.static(this.buildDir));

    // Fallback для SPA роутинга - все не-API запросы возвращают index.html
    // Должен быть последним, чтобы обрабатывать все маршруты, не обработанные выше
    app.use((req, res, next) => {
      // Пропускаем API запросы
      if (req.path.startsWith('/api')) {
        return next();
      }
      // Для всех остальных запросов возвращаем index.html
      res.sendFile(path.join(this.buildDir, this.config.indexHtmlPath));
    });
  }

  /**
   * Запустить сервер с автоматическим открытием браузера
   * @param {Express} app - Express приложение
   * @param {Function} onReady - Callback функция, вызываемая когда сервер готов
   */
  async startServer(app, onReady) {
    // Проверяем существование index.html
    await this.checkIndexHtml();

    // Запускаем сервер
    app.listen(this.config.port, async () => {
      this.logServerInfo();

      // Вызываем callback если указан
      if (onReady) {
        await onReady();
      }

      // Открываем браузер через задержку
      if (this.config.openBrowser) {
        setTimeout(async () => {
          await this.openBrowser();
        }, this.config.browserDelay);
      }
    });
  }
}

module.exports = ServerSetup;
