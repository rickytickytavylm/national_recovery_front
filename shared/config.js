/* =========================================================
   Национальная система восстановления — конфигурация клиента.
   Меняется в одном месте. Управляет источником данных.
   ========================================================= */
window.NSV_CONFIG = {
  ENV: "development",              // development | staging | production

  // Базовый URL backend. Если сервер недоступен и включён fallback —
  // данные берутся из constants.js (мок), интерфейс не ломается.
  API_BASE_URL: "http://localhost:3000/api",
  USE_MOCK_FALLBACK: true,

  // ДЕМО-РЕЖИМ (для показа прототипа без запуска сервера).
  // true  → публичная платформа и кабинет центра работают мгновенно на mock-данных,
  //         сеть не дёргается, ничего не «висит».
  // false → используется реальный backend (API_BASE_URL) с fallback на mock.
  DEMO_MODE: true,

  REQUEST_TIMEOUT_MS: 2500,        // таймаут запроса до перехода на mock
  STORAGE_PREFIX: "nsv:",          // префикс ключей localStorage

  // Демо-режим кабинета центра: если нет токена, автоматически входить
  // тестовым center_admin, чтобы кабинет сразу показывал реальные данные.
  CENTER_DEMO_LOGIN: { email: "center@recovery.local", password: "admin12345" },

  SUPPORT_PHONE: "8 800 123-45-67",
  SUPPORT_EMAIL: "help@recovery.system",
};
