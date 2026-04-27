require('dotenv').config();
const mysql = require('mysql2/promise');

const isProduction = process.env.NODE_ENV === 'production';

// SSL нужен для облачных MySQL (PlanetScale, FreeSQLDatabase, Aiven)
const sslConfig = process.env.DB_SSL === 'true'
  ? { rejectUnauthorized: false }
  : false;

const pool = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  port:               parseInt(process.env.DB_PORT) || 3306,
  database:           process.env.DB_NAME     || 'edumarket',
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || '',
  ssl:                sslConfig,
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  connectTimeout:     30000,
  timezone:           '+06:00',
});

pool.getConnection()
  .then(c => {
    console.log(`✅ MySQL подключён [${isProduction ? 'PRODUCTION' : 'LOCAL'}]`);
    c.release();
  })
  .catch(e => {
    console.error('❌ MySQL ошибка:', e.message);
    if (isProduction) {
      console.error('   Проверь переменные окружения в Render Dashboard');
    } else {
      console.error('   Проверь что XAMPP → MySQL запущен');
    }
  });

module.exports = pool;
