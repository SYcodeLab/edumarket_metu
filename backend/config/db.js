require('dotenv').config();
const mysql = require('mysql2/promise');

const isProduction = process.env.NODE_ENV === 'production';
const dbHost = process.env.DB_HOST || 'localhost';

// Логика определения SSL: 
// 1. На продакшене (Render) пробуем включить SSL.
// 2. ИСКЛЮЧЕНИЕ: freesqldatabase.com не поддерживает SSL, поэтому для него выключаем.
const getSSLConfig = () => {
  if (!isProduction) return false;
  if (dbHost.includes('freesqldatabase.com')) return false;
  
  return { rejectUnauthorized: false };
};

const poolConfig = {
  host:               dbHost,
  port:               parseInt(process.env.DB_PORT) || 3306,
  database:           process.env.DB_NAME     || 'edumarket',
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || '',
  ssl:                getSSLConfig(),
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  connectTimeout:     30000,
  timezone:           '+06:00',
};

const pool = mysql.createPool(poolConfig);

// Проверка коннекта с детальным выводом
pool.getConnection()
  .then(c => {
    console.log(`✅ База данных готова!`);
    console.log(`📍 Хост: ${dbHost}`);
    console.log(`🔒 SSL: ${poolConfig.ssl ? 'Включен' : 'Выключен (совместимость)'}`);
    c.release();
  })
  .catch(e => {
    console.error('❌ Ошибка подключения к MySQL:');
    console.error(`👉 Сообщение: ${e.message}`);
    
    if (isProduction) {
      console.log('💡 Совет: Проверь, разрешены ли внешние IP в настройках твоей БД.');
    }
  });

module.exports = pool;