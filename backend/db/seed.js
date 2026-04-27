// db/seed.js — тестовые данные для проверки на хостинге
require('dotenv').config();
const mysql  = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function seed() {
  const isCloud = process.env.DB_SSL === 'true';
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost', port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root', password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'edumarket',
    ssl: isCloud ? { rejectUnauthorized: false } : false,
  });

  console.log('🌱 Добавляем тестовые данные...\n');

  try {
    const hash = await bcrypt.hash('123456', 10);

    // Пользователи
    const users = [
      ['МИТУ EduMarket',  'admin@mitu.edu.kz',    hash, 'university'],
      ['ТОО Kaspi Tech',  'kaspi@company.kz',     hash, 'entrepreneur'],
      ['ТОО Jusan Bank',  'jusan@company.kz',     hash, 'entrepreneur'],
      ['Айдар Сейткали',  'aydar@student.kz',     hash, 'student'],
      ['Дина Ахметова',   'dina@student.kz',      hash, 'student'],
      ['Арман Бекова',    'arman@student.kz',     hash, 'student'],
    ];

    const ids = [];
    for (const [name, email, pw, role] of users) {
      const [ex] = await conn.query('SELECT id FROM users WHERE email=?', [email]);
      if (ex.length) { ids.push(ex[0].id); continue; }
      const [r] = await conn.query('INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)', [name,email,pw,role]);
      ids.push(r.insertId);
      console.log(`  ✓ User: ${name} (${role})`);
    }

    const [uniId, k1Id, k2Id, s1Id, s2Id, s3Id] = ids;

    // Профили
    await conn.query('INSERT IGNORE INTO universities (user_id,full_name,code) VALUES (?,?,?)', [uniId,'Международный инженерно-технологический университет','049']);
    await conn.query('INSERT IGNORE INTO entrepreneurs (user_id,company_name,industry,city,description) VALUES (?,?,?,?,?)', [k1Id,'ТОО Kaspi Tech','FinTech','Алматы','Ведущая финтех-компания Казахстана']);
    await conn.query('INSERT IGNORE INTO entrepreneurs (user_id,company_name,industry,city,description) VALUES (?,?,?,?,?)', [k2Id,'ТОО Jusan Bank','Banking','Алматы','Цифровой банк нового поколения']);
    await conn.query('INSERT IGNORE INTO students (user_id,specialty,study_year,skills) VALUES (?,?,?,?)', [s1Id,'Информационные системы',3,'React,Node.js,Python']);
    await conn.query('INSERT IGNORE INTO students (user_id,specialty,study_year,skills) VALUES (?,?,?,?)', [s2Id,'Программная инженерия',2,'Vue.js,Java,SQL']);
    await conn.query('INSERT IGNORE INTO students (user_id,specialty,study_year,skills) VALUES (?,?,?,?)', [s3Id,'Компьютерные науки',4,'Python,ML,TensorFlow']);

    // Проекты
    const projects = [
      [k1Id,'Разработка мобильного приложения Kaspi QR','Нужна команда для разработки нового модуля QR-платежей в мобильном приложении Kaspi.kz. Работа с React Native, интеграция с платёжным API.','React Native,Node.js,PostgreSQL','IT',16,800000],
      [k1Id,'AI-чат-бот для поддержки клиентов','Разработка умного чат-бота на основе GPT для автоматизации поддержки клиентов. Интеграция с CRM системой.','Python,NLP,FastAPI,Docker','AI/ML',12,600000],
      [k2Id,'Дизайн системы для Jusan App','Создание единой дизайн-системы и UI-kit для мобильного и веб-приложения Jusan Bank в Figma.','Figma,UI/UX,Design System','Design',8,400000],
      [k2Id,'Data Dashboard для аналитиков банка','Разработка интерактивного дашборда для визуализации финансовых метрик и KPI банка.','React,D3.js,Python,SQL','Data',10,500000],
      [k1Id,'Система мониторинга транзакций','Разработка системы real-time мониторинга подозрительных транзакций с ML-моделью.','Python,Kafka,ML,Redis','AI/ML',20,1200000],
    ];

    for (const [eid,title,desc,skills,cat,weeks,budget] of projects) {
      const [ex] = await conn.query('SELECT id FROM projects WHERE title=?',[title]);
      if (!ex.length) {
        await conn.query('INSERT INTO projects (entrepreneur_id,title,description,skills_needed,category,duration_weeks,budget,status) VALUES (?,?,?,?,?,?,?,?)',[eid,title,desc,skills,cat,weeks,budget,'open']);
        console.log(`  ✓ Project: ${title}`);
      }
    }

    // Стажировки
    const internships = [
      [k1Id,'Frontend разработчик — стажёр','Ищем студентов 3-4 курса для прохождения практики в команде фронтенда. Работа с React, TypeScript, участие в реальных спринтах.','React,TypeScript,CSS',16,3,true,150000],
      [k2Id,'UX/UI дизайнер — стажёр','Практика в команде дизайна. Работа в Figma, участие в user research, создание прототипов для реальных продуктов.','Figma,UX Research,Prototyping',12,2,true,120000],
      [k1Id,'Data Analyst — стажёр','Анализ данных транзакций, создание отчётов и дашбордов. Работа с реальными данными под менторством Senior аналитика.','Python,SQL,Power BI',16,2,false,0],
    ];

    for (const [eid,title,desc,skills,weeks,places,paid,salary] of internships) {
      const [ex] = await conn.query('SELECT id FROM internships WHERE title=?',[title]);
      if (!ex.length) {
        await conn.query('INSERT INTO internships (entrepreneur_id,title,description,skills_needed,duration_weeks,places,is_paid,salary,status) VALUES (?,?,?,?,?,?,?,?,?)',[eid,title,desc,skills,weeks,places,paid?1:0,salary,'open']);
        console.log(`  ✓ Internship: ${title}`);
      }
    }

    // Приветственные уведомления
    for (const [name,email,pw,role] of users) {
      const [u] = await conn.query('SELECT id FROM users WHERE email=?',[email]);
      if (u[0]) {
        const [ex] = await conn.query('SELECT id FROM notifications WHERE user_id=? AND type=?',[u[0].id,'welcome']);
        if (!ex.length) {
          await conn.query('INSERT INTO notifications (user_id,title,message,type) VALUES (?,?,?,?)',[u[0].id,'Добро пожаловать в EduMarket!',`Аккаунт создан. Пароль для входа: 123456`,'welcome']);
        }
      }
    }

    console.log('\n✅ Тестовые данные добавлены!');
    console.log('\n📧 Тестовые аккаунты (пароль: 123456):');
    console.log('   🏫 admin@mitu.edu.kz    — ВУЗ');
    console.log('   💼 kaspi@company.kz     — Предприниматель (Kaspi Tech)');
    console.log('   💼 jusan@company.kz     — Предприниматель (Jusan Bank)');
    console.log('   🎓 aydar@student.kz     — Студент');
    console.log('   🎓 dina@student.kz      — Студент');
    console.log('   🎓 arman@student.kz     — Студент\n');
  } catch (err) {
    console.error('❌ Ошибка:', err.message);
  } finally {
    await conn.end();
  }
}

seed();
