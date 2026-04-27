require('dotenv').config();
const mysql = require('mysql2/promise');

async function init() {
  const isCloud = process.env.DB_SSL === 'true';
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT) || 3306,
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    ssl:      isCloud ? { rejectUnauthorized: false } : false,
    multipleStatements: true,
  });

  console.log('🚀 Инициализация БД EduMarket v2...\n');

  try {
    const db = process.env.DB_NAME || 'edumarket';
    // Для облачных БД база уже создана — пропускаем CREATE DATABASE
    if (!isCloud) {
      await conn.query(`CREATE DATABASE IF NOT EXISTS \`${db}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    }
    await conn.query(`USE \`${db}\``);

    const tables = [
      [`users`, `
        id         INT AUTO_INCREMENT PRIMARY KEY,
        name       VARCHAR(255) NOT NULL,
        email      VARCHAR(255) UNIQUE NOT NULL,
        password   VARCHAR(255) NOT NULL,
        role       ENUM('student','university','entrepreneur') NOT NULL,
        phone      VARCHAR(50),
        bio        TEXT,
        avatar     VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      `],
      [`entrepreneurs`, `
        id           INT AUTO_INCREMENT PRIMARY KEY,
        user_id      INT NOT NULL,
        company_name VARCHAR(255) NOT NULL,
        bin          VARCHAR(12),
        industry     VARCHAR(255),
        website      VARCHAR(255),
        description  TEXT,
        city         VARCHAR(100),
        employees    INT,
        founded_year INT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      `],
      [`universities`, `
        id        INT AUTO_INCREMENT PRIMARY KEY,
        user_id   INT NOT NULL,
        full_name VARCHAR(500) NOT NULL,
        address   VARCHAR(500),
        website   VARCHAR(255),
        code      VARCHAR(20),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      `],
      [`students`, `
        id            INT AUTO_INCREMENT PRIMARY KEY,
        user_id       INT NOT NULL,
        university_id INT,
        specialty     VARCHAR(255),
        study_year    INT,
        skills        TEXT,
        github        VARCHAR(255),
        portfolio     VARCHAR(255),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      `],
      [`projects`, `
        id              INT AUTO_INCREMENT PRIMARY KEY,
        entrepreneur_id INT NOT NULL,
        title           VARCHAR(500) NOT NULL,
        description     TEXT NOT NULL,
        requirements    TEXT,
        result          TEXT,
        category        VARCHAR(255),
        skills_needed   TEXT,
        duration_weeks  INT,
        budget          DECIMAL(12,2),
        status          ENUM('open','closed','in_progress','completed') DEFAULT 'open',
        visibility      ENUM('public','private','university_only') DEFAULT 'public',
        deadline        DATE,
        views           INT DEFAULT 0,
        created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (entrepreneur_id) REFERENCES users(id) ON DELETE CASCADE
      `],
      [`internships`, `
        id              INT AUTO_INCREMENT PRIMARY KEY,
        entrepreneur_id INT NOT NULL,
        title           VARCHAR(500) NOT NULL,
        description     TEXT NOT NULL,
        position        VARCHAR(255),
        skills_needed   TEXT,
        duration_weeks  INT,
        places          INT DEFAULT 1,
        is_paid         TINYINT(1) DEFAULT 0,
        salary          DECIMAL(10,2),
        status          ENUM('open','closed','filled') DEFAULT 'open',
        visibility      ENUM('public','private') DEFAULT 'public',
        deadline        DATE,
        views           INT DEFAULT 0,
        created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (entrepreneur_id) REFERENCES users(id) ON DELETE CASCADE
      `],
      [`applications`, `
        id            INT AUTO_INCREMENT PRIMARY KEY,
        student_id    INT NOT NULL,
        project_id    INT,
        internship_id INT,
        cover_letter  TEXT,
        resume_url    VARCHAR(500),
        status        ENUM('pending','reviewing','accepted','rejected','withdrawn') DEFAULT 'pending',
        feedback      TEXT,
        created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id)    REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (project_id)    REFERENCES projects(id) ON DELETE SET NULL,
        FOREIGN KEY (internship_id) REFERENCES internships(id) ON DELETE SET NULL
      `],
      [`contracts`, `
        id                     INT AUTO_INCREMENT PRIMARY KEY,
        entrepreneur_id        INT,
        university_id          INT,
        student_id             INT,
        project_id             INT,
        internship_id          INT,
        title                  VARCHAR(500) NOT NULL,
        terms                  TEXT,
        status                 ENUM('draft','sent','signed_entrepreneur','signed_university','active','completed','cancelled') DEFAULT 'draft',
        start_date             DATE,
        end_date               DATE,
        entrepreneur_signed_at TIMESTAMP NULL,
        university_signed_at   TIMESTAMP NULL,
        created_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (entrepreneur_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (university_id)   REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (student_id)      REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (project_id)      REFERENCES projects(id) ON DELETE SET NULL,
        FOREIGN KEY (internship_id)   REFERENCES internships(id) ON DELETE SET NULL
      `],
      [`reviews`, `
        id          INT AUTO_INCREMENT PRIMARY KEY,
        reviewer_id INT,
        reviewee_id INT,
        contract_id INT,
        rating      TINYINT NOT NULL,
        comment     TEXT,
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (reviewee_id) REFERENCES users(id) ON DELETE SET NULL
      `],
      [`notifications`, `
        id         INT AUTO_INCREMENT PRIMARY KEY,
        user_id    INT NOT NULL,
        title      VARCHAR(255) NOT NULL,
        message    TEXT,
        type       VARCHAR(50),
        link       VARCHAR(255),
        is_read    TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      `],
      [`messages`, `
        id          INT AUTO_INCREMENT PRIMARY KEY,
        sender_id   INT NOT NULL,
        receiver_id INT NOT NULL,
        content     TEXT NOT NULL,
        is_read     TINYINT(1) DEFAULT 0,
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sender_id)   REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
      `],
      [`favorites`, `
        id         INT AUTO_INCREMENT PRIMARY KEY,
        user_id    INT NOT NULL,
        project_id INT,
        internship_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id)      REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (project_id)   REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (internship_id)REFERENCES internships(id) ON DELETE CASCADE
      `],
    ];

    for (const [name, cols] of tables) {
      await conn.query(`CREATE TABLE IF NOT EXISTS \`${name}\` (${cols}) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
      console.log(`  ✓ ${name}`);
    }

    console.log('\n✅ Все таблицы созданы!');
    console.log('📊 Можешь запустить: npm run db:seed — чтобы добавить тестовые данные\n');
  } catch (err) {
    console.error('\n❌ Ошибка:', err.message);
  } finally {
    await conn.end();
  }
}

init();
