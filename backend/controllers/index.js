const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const db      = require('../config/db');

const mkToken = u => jwt.sign(
  { id: u.id, name: u.name, email: u.email, role: u.role },
  process.env.JWT_SECRET, { expiresIn: '7d' }
);

const notify = (userId, title, message, type, link = null) =>
  db.query('INSERT INTO notifications (user_id,title,message,type,link) VALUES (?,?,?,?,?)',
    [userId, title, message, type, link]).catch(() => {});

// ── AUTH ──────────────────────────────────────────────────────────────────────
async function register(req, res) {
  const { name, email, password, role, company_name, full_name, specialty, study_year } = req.body;
  if (!name || !email || !password || !role)
    return res.status(400).json({ error: 'Заполните: name, email, password, role' });
  if (!['student','university','entrepreneur'].includes(role))
    return res.status(400).json({ error: 'Неверная роль' });
  if (password.length < 6)
    return res.status(400).json({ error: 'Пароль минимум 6 символов' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [ex] = await conn.query('SELECT id FROM users WHERE email=?', [email]);
    if (ex.length) return res.status(409).json({ error: 'Email уже зарегистрирован' });

    const hashed = await bcrypt.hash(password, 10);
    const [r] = await conn.query(
      'INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)',
      [name, email, hashed, role]
    );
    const uid = r.insertId;

    if (role === 'entrepreneur')
      await conn.query('INSERT INTO entrepreneurs (user_id,company_name) VALUES (?,?)', [uid, company_name || name]);
    if (role === 'university')
      await conn.query('INSERT INTO universities (user_id,full_name,code) VALUES (?,?,?)', [uid, full_name || name, '049']);
    if (role === 'student')
      await conn.query('INSERT INTO students (user_id,specialty,study_year) VALUES (?,?,?)', [uid, specialty || null, study_year || null]);

    await conn.query(
      'INSERT INTO notifications (user_id,title,message,type) VALUES (?,?,?,?)',
      [uid, '🎉 Добро пожаловать в EduMarket!', 'Аккаунт успешно создан. Заполните профиль для лучших результатов.', 'welcome']
    );
    await conn.commit();

    const user = { id: uid, name, email, role };
    res.status(201).json({ message: 'Регистрация успешна', token: mkToken(user), user });
  } catch (e) {
    await conn.rollback();
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера при регистрации' });
  } finally { conn.release(); }
}

async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Введите email и пароль' });
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email=?', [email]);
    if (!rows[0] || !await bcrypt.compare(password, rows[0].password))
      return res.status(401).json({ error: 'Неверный email или пароль' });
    const { password: _, ...u } = rows[0];
    res.json({ token: mkToken(rows[0]), user: u });
  } catch { res.status(500).json({ error: 'Ошибка сервера' }); }
}

async function me(req, res) {
  try {
    const [r] = await db.query(
      'SELECT id,name,email,role,phone,bio,avatar,created_at FROM users WHERE id=?',
      [req.user.id]
    );
    if (!r[0]) return res.status(404).json({ error: 'Не найден' });

    // Доп. данные по роли
    let extra = {};
    if (r[0].role === 'entrepreneur') {
      const [e] = await db.query('SELECT * FROM entrepreneurs WHERE user_id=?', [r[0].id]);
      extra = e[0] || {};
    } else if (r[0].role === 'university') {
      const [u] = await db.query('SELECT * FROM universities WHERE user_id=?', [r[0].id]);
      extra = u[0] || {};
    } else if (r[0].role === 'student') {
      const [s] = await db.query('SELECT * FROM students WHERE user_id=?', [r[0].id]);
      extra = s[0] || {};
    }
    res.json({ ...r[0], ...extra });
  } catch { res.status(500).json({ error: 'Ошибка' }); }
}

async function updateProfile(req, res) {
  const { name, phone, bio, company_name, industry, website, description, city, specialty, skills, github, portfolio } = req.body;
  try {
    if (name || phone || bio)
      await db.query('UPDATE users SET name=COALESCE(?,name), phone=COALESCE(?,phone), bio=COALESCE(?,bio) WHERE id=?',
        [name||null, phone||null, bio||null, req.user.id]);

    if (req.user.role === 'entrepreneur' && (company_name || industry || website || description || city))
      await db.query('UPDATE entrepreneurs SET company_name=COALESCE(?,company_name), industry=COALESCE(?,industry), website=COALESCE(?,website), description=COALESCE(?,description), city=COALESCE(?,city) WHERE user_id=?',
        [company_name||null, industry||null, website||null, description||null, city||null, req.user.id]);

    if (req.user.role === 'student' && (specialty || skills || github || portfolio))
      await db.query('UPDATE students SET specialty=COALESCE(?,specialty), skills=COALESCE(?,skills), github=COALESCE(?,github), portfolio=COALESCE(?,portfolio) WHERE user_id=?',
        [specialty||null, skills||null, github||null, portfolio||null, req.user.id]);

    res.json({ message: 'Профиль обновлён' });
  } catch(e) { console.error(e); res.status(500).json({ error: 'Ошибка' }); }
}

// ── PROJECTS ──────────────────────────────────────────────────────────────────
async function getProjects(req, res) {
  const { search='', category='', page=1, limit=12, sort='new' } = req.query;
  const offset = (page-1)*limit;
  const orderBy = sort==='popular' ? 'applications_count DESC' : sort==='budget' ? 'p.budget DESC' : 'p.created_at DESC';
  try {
    const [rows] = await db.query(`
      SELECT p.*, u.name AS entrepreneur_name, e.company_name, e.industry, e.city,
             COUNT(DISTINCT a.id) AS applications_count
      FROM projects p
      JOIN users u ON p.entrepreneur_id=u.id
      LEFT JOIN entrepreneurs e ON e.user_id=u.id
      LEFT JOIN applications a ON a.project_id=p.id
      WHERE p.status='open' AND p.visibility='public'
        AND (? = '' OR p.title LIKE ? OR p.description LIKE ? OR p.skills_needed LIKE ?)
        AND (? = '' OR p.category = ?)
      GROUP BY p.id
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `, [search,`%${search}%`,`%${search}%`,`%${search}%`, category,category, +limit, +offset]);

    const [[{total}]] = await db.query(`SELECT COUNT(*) AS total FROM projects WHERE status='open' AND visibility='public'`);
    res.json({ projects: rows, total, page: +page, pages: Math.ceil(total/limit) });
  } catch(e) { console.error(e); res.status(500).json({ error: 'Ошибка' }); }
}

async function getProject(req, res) {
  try {
    const [rows] = await db.query(`
      SELECT p.*, u.name AS entrepreneur_name, u.email AS entrepreneur_email,
             e.company_name, e.industry, e.city, e.website, e.description AS company_desc, e.employees,
             COUNT(DISTINCT a.id) AS applications_count
      FROM projects p
      JOIN users u ON p.entrepreneur_id=u.id
      LEFT JOIN entrepreneurs e ON e.user_id=u.id
      LEFT JOIN applications a ON a.project_id=p.id
      WHERE p.id=?
      GROUP BY p.id
    `, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Проект не найден' });

    // Увеличиваем счётчик просмотров
    await db.query('UPDATE projects SET views=views+1 WHERE id=?', [req.params.id]);

    // Похожие проекты
    const [similar] = await db.query(`
      SELECT p.id, p.title, p.budget, p.category, e.company_name
      FROM projects p LEFT JOIN entrepreneurs e ON e.user_id=p.entrepreneur_id
      WHERE p.status='open' AND p.category=? AND p.id!=? LIMIT 3
    `, [rows[0].category, req.params.id]);

    res.json({ ...rows[0], similar });
  } catch(e) { console.error(e); res.status(500).json({ error: 'Ошибка' }); }
}

async function getMyProjects(req, res) {
  try {
    const [r] = await db.query(`
      SELECT p.*, COUNT(DISTINCT a.id) AS applications_count,
             COUNT(DISTINCT CASE WHEN a.status='pending' THEN a.id END) AS new_applications
      FROM projects p LEFT JOIN applications a ON a.project_id=p.id
      WHERE p.entrepreneur_id=?
      GROUP BY p.id ORDER BY p.created_at DESC
    `, [req.user.id]);
    res.json(r);
  } catch { res.status(500).json({ error: 'Ошибка' }); }
}

async function createProject(req, res) {
  const { title, description, requirements, result, category, skills_needed, duration_weeks, budget, visibility, deadline } = req.body;
  if (!title || !description) return res.status(400).json({ error: 'title и description обязательны' });
  const skills = Array.isArray(skills_needed) ? skills_needed.join(',') : (skills_needed||'');
  try {
    const [r] = await db.query(
      'INSERT INTO projects (entrepreneur_id,title,description,requirements,result,category,skills_needed,duration_weeks,budget,visibility,deadline) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      [req.user.id, title, description, requirements||null, result||null, category||null, skills, duration_weeks||null, budget||null, visibility||'public', deadline||null]
    );
    const [rows] = await db.query('SELECT * FROM projects WHERE id=?', [r.insertId]);
    res.status(201).json({ message: 'Проект создан', project: rows[0] });
  } catch(e) { console.error(e); res.status(500).json({ error: 'Ошибка' }); }
}

async function updateProject(req, res) {
  const { title, description, category, skills_needed, duration_weeks, budget, visibility, status, deadline } = req.body;
  try {
    const [c] = await db.query('SELECT entrepreneur_id FROM projects WHERE id=?', [req.params.id]);
    if (!c[0]) return res.status(404).json({ error: 'Не найден' });
    if (c[0].entrepreneur_id !== req.user.id) return res.status(403).json({ error: 'Нет прав' });
    const skills = Array.isArray(skills_needed) ? skills_needed.join(',') : (skills_needed||'');
    await db.query('UPDATE projects SET title=?,description=?,category=?,skills_needed=?,duration_weeks=?,budget=?,visibility=?,status=?,deadline=? WHERE id=?',
      [title, description, category, skills, duration_weeks, budget, visibility, status, deadline, req.params.id]);
    res.json({ message: 'Обновлено' });
  } catch { res.status(500).json({ error: 'Ошибка' }); }
}

async function deleteProject(req, res) {
  try {
    const [c] = await db.query('SELECT entrepreneur_id FROM projects WHERE id=?', [req.params.id]);
    if (!c[0]) return res.status(404).json({ error: 'Не найден' });
    if (c[0].entrepreneur_id !== req.user.id) return res.status(403).json({ error: 'Нет прав' });
    await db.query('DELETE FROM projects WHERE id=?', [req.params.id]);
    res.json({ message: 'Удалён' });
  } catch { res.status(500).json({ error: 'Ошибка' }); }
}

// ── INTERNSHIPS ───────────────────────────────────────────────────────────────
async function getInternships(req, res) {
  const { search='', page=1, limit=12, paid } = req.query;
  const offset = (page-1)*limit;
  try {
    let where = `i.status='open' AND (? = '' OR i.title LIKE ? OR i.description LIKE ?)`;
    const params = [search, `%${search}%`, `%${search}%`];
    if (paid === 'true')  { where += ' AND i.is_paid=1'; }
    if (paid === 'false') { where += ' AND i.is_paid=0'; }

    const [rows] = await db.query(`
      SELECT i.*, u.name AS entrepreneur_name, e.company_name, e.industry, e.city,
             COUNT(DISTINCT a.id) AS applications_count
      FROM internships i
      JOIN users u ON i.entrepreneur_id=u.id
      LEFT JOIN entrepreneurs e ON e.user_id=u.id
      LEFT JOIN applications a ON a.internship_id=i.id
      WHERE ${where}
      GROUP BY i.id ORDER BY i.created_at DESC LIMIT ? OFFSET ?
    `, [...params, +limit, +offset]);
    res.json(rows);
  } catch(e) { console.error(e); res.status(500).json({ error: 'Ошибка' }); }
}

async function createInternship(req, res) {
  const { title, description, position, skills_needed, duration_weeks, places, is_paid, salary, visibility, deadline } = req.body;
  if (!title || !description) return res.status(400).json({ error: 'title и description обязательны' });
  const skills = Array.isArray(skills_needed) ? skills_needed.join(',') : (skills_needed||'');
  try {
    const [r] = await db.query(
      'INSERT INTO internships (entrepreneur_id,title,description,position,skills_needed,duration_weeks,places,is_paid,salary,visibility,deadline) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      [req.user.id, title, description, position||null, skills, duration_weeks||null, places||1, is_paid?1:0, salary||null, visibility||'public', deadline||null]
    );
    const [rows] = await db.query('SELECT * FROM internships WHERE id=?', [r.insertId]);
    res.status(201).json({ message: 'Стажировка создана', internship: rows[0] });
  } catch(e) { console.error(e); res.status(500).json({ error: 'Ошибка' }); }
}

// ── APPLICATIONS ──────────────────────────────────────────────────────────────
async function apply(req, res) {
  const { project_id, internship_id, cover_letter } = req.body;
  if (!project_id && !internship_id) return res.status(400).json({ error: 'Укажите project_id или internship_id' });
  try {
    const [ex] = await db.query(
      'SELECT id FROM applications WHERE student_id=? AND (project_id=? OR internship_id=?)',
      [req.user.id, project_id||null, internship_id||null]
    );
    if (ex.length) return res.status(409).json({ error: 'Вы уже откликались' });

    await db.query(
      'INSERT INTO applications (student_id,project_id,internship_id,cover_letter) VALUES (?,?,?,?)',
      [req.user.id, project_id||null, internship_id||null, cover_letter||null]
    );

    if (project_id) {
      const [p] = await db.query('SELECT entrepreneur_id,title FROM projects WHERE id=?', [project_id]);
      if (p[0]) await notify(p[0].entrepreneur_id, '📩 Новый отклик', `${req.user.name} откликнулся на "${p[0].title}"`, 'application', `/projects/${project_id}`);
    }
    if (internship_id) {
      const [i] = await db.query('SELECT entrepreneur_id,title FROM internships WHERE id=?', [internship_id]);
      if (i[0]) await notify(i[0].entrepreneur_id, '📩 Новый отклик', `${req.user.name} откликнулся на стажировку "${i[0].title}"`, 'application');
    }

    res.status(201).json({ message: 'Отклик отправлен' });
  } catch(e) { console.error(e); res.status(500).json({ error: 'Ошибка' }); }
}

async function getMyApplications(req, res) {
  try {
    const [r] = await db.query(`
      SELECT a.*, p.title AS project_title, p.category, p.budget,
             i.title AS internship_title, i.position, i.salary, i.is_paid,
             u.name AS entrepreneur_name, e.company_name
      FROM applications a
      LEFT JOIN projects p ON a.project_id=p.id
      LEFT JOIN internships i ON a.internship_id=i.id
      LEFT JOIN users u ON (p.entrepreneur_id=u.id OR i.entrepreneur_id=u.id)
      LEFT JOIN entrepreneurs e ON e.user_id=u.id
      WHERE a.student_id=? ORDER BY a.created_at DESC
    `, [req.user.id]);
    res.json(r);
  } catch { res.status(500).json({ error: 'Ошибка' }); }
}

async function getProjectApplications(req, res) {
  try {
    const [p] = await db.query('SELECT entrepreneur_id FROM projects WHERE id=?', [req.params.id]);
    if (!p[0]) return res.status(404).json({ error: 'Не найден' });
    if (p[0].entrepreneur_id !== req.user.id) return res.status(403).json({ error: 'Нет доступа' });
    const [r] = await db.query(`
      SELECT a.*, u.name AS student_name, u.email AS student_email,
             s.specialty, s.study_year, s.skills, s.github, s.portfolio
      FROM applications a
      JOIN users u ON a.student_id=u.id
      LEFT JOIN students s ON s.user_id=u.id
      WHERE a.project_id=? ORDER BY a.created_at DESC
    `, [req.params.id]);
    res.json(r);
  } catch { res.status(500).json({ error: 'Ошибка' }); }
}

async function updateAppStatus(req, res) {
  const { status, feedback } = req.body;
  const ok = ['pending','reviewing','accepted','rejected','withdrawn'];
  if (!ok.includes(status)) return res.status(400).json({ error: 'Неверный статус' });
  try {
    await db.query('UPDATE applications SET status=?, feedback=? WHERE id=?', [status, feedback||null, req.params.id]);
    if (['accepted','rejected'].includes(status)) {
      const [a] = await db.query('SELECT student_id, project_id FROM applications WHERE id=?', [req.params.id]);
      if (a[0]) {
        const msg = status==='accepted' ? '🎉 Ваш отклик принят! Ожидайте связи с работодателем.' : '❌ Ваш отклик отклонён.';
        const link = a[0].project_id ? `/projects/${a[0].project_id}` : null;
        await notify(a[0].student_id, 'Статус заявки изменён', msg, 'application_status', link);
      }
    }
    res.json({ message: 'Статус обновлён' });
  } catch { res.status(500).json({ error: 'Ошибка' }); }
}

// ── CONTRACTS ─────────────────────────────────────────────────────────────────
async function createContract(req, res) {
  const { university_id, student_id, project_id, internship_id, title, terms, start_date, end_date } = req.body;
  if (!university_id || !title) return res.status(400).json({ error: 'university_id и title обязательны' });
  try {
    const [r] = await db.query(
      "INSERT INTO contracts (entrepreneur_id,university_id,student_id,project_id,internship_id,title,terms,status,start_date,end_date) VALUES (?,?,?,?,?,?,?,'sent',?,?)",
      [req.user.id, university_id, student_id||null, project_id||null, internship_id||null, title, terms||null, start_date||null, end_date||null]
    );
    await notify(university_id, '📄 Новый договор', `Получен договор: "${title}"`, 'contract', `/contracts`);
    const [rows] = await db.query('SELECT * FROM contracts WHERE id=?', [r.insertId]);
    res.status(201).json({ message: 'Договор создан', contract: rows[0] });
  } catch(e) { console.error(e); res.status(500).json({ error: 'Ошибка' }); }
}

async function getContracts(req, res) {
  const col = req.user.role==='entrepreneur' ? 'c.entrepreneur_id' :
              req.user.role==='university'   ? 'c.university_id'   : 'c.student_id';
  try {
    const [r] = await db.query(`
      SELECT c.*, ue.name AS entrepreneur_name, e.company_name,
             uu.name AS university_name, us.name AS student_name,
             p.title AS project_title, i.title AS internship_title
      FROM contracts c
      LEFT JOIN users ue ON c.entrepreneur_id=ue.id
      LEFT JOIN entrepreneurs e ON e.user_id=ue.id
      LEFT JOIN users uu ON c.university_id=uu.id
      LEFT JOIN users us ON c.student_id=us.id
      LEFT JOIN projects p ON c.project_id=p.id
      LEFT JOIN internships i ON c.internship_id=i.id
      WHERE ${col}=? ORDER BY c.created_at DESC
    `, [req.user.id]);
    res.json(r);
  } catch { res.status(500).json({ error: 'Ошибка' }); }
}

async function signContract(req, res) {
  try {
    const [rows] = await db.query('SELECT * FROM contracts WHERE id=?', [req.params.id]);
    const c = rows[0];
    if (!c) return res.status(404).json({ error: 'Не найден' });

    let newStatus, extra;
    if (req.user.role==='entrepreneur' && c.entrepreneur_id===req.user.id) {
      newStatus = 'signed_entrepreneur'; extra = ', entrepreneur_signed_at=NOW()';
    } else if (req.user.role==='university' && c.university_id===req.user.id) {
      newStatus = c.entrepreneur_signed_at ? 'active' : 'signed_university';
      extra = ', university_signed_at=NOW()';
    } else return res.status(403).json({ error: 'Нет прав' });

    await db.query(`UPDATE contracts SET status=? ${extra} WHERE id=?`, [newStatus, req.params.id]);

    if (newStatus==='active') {
      for (const uid of [c.entrepreneur_id, c.university_id, c.student_id].filter(Boolean))
        await notify(uid, '✅ Договор активирован', `"${c.title}" подписан обеими сторонами`, 'contract', '/contracts');
    }
    res.json({ message: 'Подписано', status: newStatus });
  } catch(e) { console.error(e); res.status(500).json({ error: 'Ошибка' }); }
}

// ── REVIEWS ───────────────────────────────────────────────────────────────────
async function createReview(req, res) {
  const { reviewee_id, contract_id, rating, comment } = req.body;
  if (!reviewee_id || !rating) return res.status(400).json({ error: 'reviewee_id и rating обязательны' });
  if (rating<1||rating>5) return res.status(400).json({ error: 'rating 1-5' });
  if (+reviewee_id === req.user.id) return res.status(400).json({ error: 'Нельзя оценить себя' });
  try {
    await db.query('INSERT INTO reviews (reviewer_id,reviewee_id,contract_id,rating,comment) VALUES (?,?,?,?,?)',
      [req.user.id, reviewee_id, contract_id||null, rating, comment||null]);
    await notify(reviewee_id, `⭐ Новый отзыв`, `Вам поставили оценку ${rating}/5`, 'review', '/profile');
    res.status(201).json({ message: 'Отзыв добавлен' });
  } catch { res.status(500).json({ error: 'Ошибка' }); }
}

async function getReviews(req, res) {
  try {
    const [r] = await db.query(`
      SELECT rv.*, u.name AS reviewer_name, u.role AS reviewer_role
      FROM reviews rv JOIN users u ON rv.reviewer_id=u.id
      WHERE rv.reviewee_id=? ORDER BY rv.created_at DESC
    `, [req.params.userId]);
    const avg = r.length ? (r.reduce((s,x)=>s+x.rating,0)/r.length).toFixed(1) : null;
    res.json({ reviews: r, average_rating: avg, total: r.length });
  } catch { res.status(500).json({ error: 'Ошибка' }); }
}

// ── NOTIFICATIONS ─────────────────────────────────────────────────────────────
async function getNotifications(req, res) {
  try {
    const [r] = await db.query(
      'SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );
    res.json({ notifications: r, unread_count: r.filter(n=>!n.is_read).length });
  } catch { res.status(500).json({ error: 'Ошибка' }); }
}

async function markAllRead(req, res) {
  try {
    await db.query('UPDATE notifications SET is_read=1 WHERE user_id=?', [req.user.id]);
    res.json({ message: 'Прочитано' });
  } catch { res.status(500).json({ error: 'Ошибка' }); }
}

// ── MESSAGES ──────────────────────────────────────────────────────────────────
async function sendMessage(req, res) {
  const { receiver_id, content } = req.body;
  if (!receiver_id || !content?.trim()) return res.status(400).json({ error: 'Нужны receiver_id и content' });
  if (+receiver_id === req.user.id) return res.status(400).json({ error: 'Нельзя писать самому себе' });
  try {
    await db.query('INSERT INTO messages (sender_id,receiver_id,content) VALUES (?,?,?)',
      [req.user.id, receiver_id, content.trim()]);
    await notify(receiver_id, '💬 Новое сообщение', `${req.user.name}: ${content.slice(0,60)}...`, 'message', `/messages/${req.user.id}`);
    res.status(201).json({ message: 'Отправлено' });
  } catch { res.status(500).json({ error: 'Ошибка' }); }
}

async function getMessages(req, res) {
  try {
    const [r] = await db.query(`
      SELECT m.*, u.name AS sender_name, u.role AS sender_role, u.avatar AS sender_avatar
      FROM messages m JOIN users u ON m.sender_id=u.id
      WHERE (m.sender_id=? AND m.receiver_id=?) OR (m.sender_id=? AND m.receiver_id=?)
      ORDER BY m.created_at ASC
    `, [req.user.id, req.params.userId, req.params.userId, req.user.id]);
    // Помечаем как прочитанные
    await db.query('UPDATE messages SET is_read=1 WHERE sender_id=? AND receiver_id=?',
      [req.params.userId, req.user.id]);
    res.json(r);
  } catch { res.status(500).json({ error: 'Ошибка' }); }
}

async function getChats(req, res) {
  try {
    const [r] = await db.query(`
      SELECT DISTINCT
        IF(m.sender_id=?, m.receiver_id, m.sender_id) AS partner_id,
        u.name AS partner_name, u.role AS partner_role,
        (SELECT content FROM messages WHERE (sender_id=? AND receiver_id=partner_id) OR (sender_id=partner_id AND receiver_id=?) ORDER BY created_at DESC LIMIT 1) AS last_message,
        (SELECT created_at FROM messages WHERE (sender_id=? AND receiver_id=partner_id) OR (sender_id=partner_id AND receiver_id=?) ORDER BY created_at DESC LIMIT 1) AS last_at,
        (SELECT COUNT(*) FROM messages WHERE sender_id=partner_id AND receiver_id=? AND is_read=0) AS unread
      FROM messages m
      JOIN users u ON u.id = IF(m.sender_id=?, m.receiver_id, m.sender_id)
      WHERE m.sender_id=? OR m.receiver_id=?
      ORDER BY last_at DESC
    `, [req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id]);
    res.json(r);
  } catch(e) { console.error(e); res.status(500).json({ error: 'Ошибка' }); }
}

// ── FAVORITES ─────────────────────────────────────────────────────────────────
async function toggleFavorite(req, res) {
  const { project_id, internship_id } = req.body;
  if (!project_id && !internship_id) return res.status(400).json({ error: 'Нужен project_id или internship_id' });
  try {
    const [ex] = await db.query(
      'SELECT id FROM favorites WHERE user_id=? AND (project_id=? OR internship_id=?)',
      [req.user.id, project_id||null, internship_id||null]
    );
    if (ex.length) {
      await db.query('DELETE FROM favorites WHERE id=?', [ex[0].id]);
      res.json({ saved: false });
    } else {
      await db.query('INSERT INTO favorites (user_id,project_id,internship_id) VALUES (?,?,?)',
        [req.user.id, project_id||null, internship_id||null]);
      res.json({ saved: true });
    }
  } catch { res.status(500).json({ error: 'Ошибка' }); }
}

async function getFavorites(req, res) {
  try {
    const [r] = await db.query(`
      SELECT f.id, f.project_id, f.internship_id, f.created_at,
             p.title AS project_title, p.budget, p.category, p.status AS project_status,
             e1.company_name AS project_company,
             i.title AS internship_title, i.salary, i.is_paid, i.status AS internship_status,
             e2.company_name AS internship_company
      FROM favorites f
      LEFT JOIN projects p ON f.project_id=p.id
      LEFT JOIN entrepreneurs e1 ON e1.user_id=p.entrepreneur_id
      LEFT JOIN internships i ON f.internship_id=i.id
      LEFT JOIN entrepreneurs e2 ON e2.user_id=i.entrepreneur_id
      WHERE f.user_id=? ORDER BY f.created_at DESC
    `, [req.user.id]);
    res.json(r);
  } catch { res.status(500).json({ error: 'Ошибка' }); }
}

// ── USERS / SEARCH ────────────────────────────────────────────────────────────
async function searchUsers(req, res) {
  const { q='', role } = req.query;
  if (q.length < 2) return res.json([]);
  try {
    let query = `SELECT u.id, u.name, u.role, u.avatar,
      e.company_name, e.industry, e.city,
      s.specialty, s.study_year
      FROM users u
      LEFT JOIN entrepreneurs e ON e.user_id=u.id
      LEFT JOIN students s ON s.user_id=u.id
      WHERE (u.name LIKE ? OR e.company_name LIKE ?)`;
    const params = [`%${q}%`, `%${q}%`];
    if (role) { query += ' AND u.role=?'; params.push(role); }
    query += ' LIMIT 10';
    const [r] = await db.query(query, params);
    res.json(r);
  } catch { res.status(500).json({ error: 'Ошибка' }); }
}

async function getUserProfile(req, res) {
  try {
    const [u] = await db.query('SELECT id,name,email,role,bio,avatar,created_at FROM users WHERE id=?', [req.params.id]);
    if (!u[0]) return res.status(404).json({ error: 'Не найден' });

    let extra = {};
    if (u[0].role==='entrepreneur') {
      const [e] = await db.query('SELECT * FROM entrepreneurs WHERE user_id=?', [u[0].id]);
      const [p] = await db.query('SELECT id,title,status,budget,category FROM projects WHERE entrepreneur_id=? AND status="open" LIMIT 5', [u[0].id]);
      extra = { ...e[0], projects: p };
    } else if (u[0].role==='student') {
      const [s] = await db.query('SELECT * FROM students WHERE user_id=?', [u[0].id]);
      extra = s[0] || {};
    } else if (u[0].role==='university') {
      const [un] = await db.query('SELECT * FROM universities WHERE user_id=?', [u[0].id]);
      extra = un[0] || {};
    }

    const [reviews] = await db.query(`
      SELECT rv.rating, rv.comment, rv.created_at, u2.name AS reviewer_name
      FROM reviews rv JOIN users u2 ON rv.reviewer_id=u2.id
      WHERE rv.reviewee_id=? ORDER BY rv.created_at DESC LIMIT 5
    `, [req.params.id]);
    const avg = reviews.length ? (reviews.reduce((s,r)=>s+r.rating,0)/reviews.length).toFixed(1) : null;

    res.json({ ...u[0], ...extra, reviews, average_rating: avg });
  } catch(e) { console.error(e); res.status(500).json({ error: 'Ошибка' }); }
}

// ── STATS ─────────────────────────────────────────────────────────────────────
async function getStats(req, res) {
  try {
    const [[p]]  = await db.query("SELECT COUNT(*) AS c FROM projects WHERE status='open'");
    const [[i]]  = await db.query("SELECT COUNT(*) AS c FROM internships WHERE status='open'");
    const [[ct]] = await db.query("SELECT COUNT(*) AS c FROM contracts WHERE status='active'");
    const [[ap]] = await db.query("SELECT COUNT(*) AS c FROM applications");
    const [u]    = await db.query("SELECT role, COUNT(*) AS c FROM users GROUP BY role");
    const users  = {}; u.forEach(x => users[x.role] = x.c);
    res.json({ open_projects: p.c, open_internships: i.c, active_contracts: ct.c, total_applications: ap.c, users });
  } catch { res.status(500).json({ error: 'Ошибка' }); }
}

module.exports = {
  register, login, me, updateProfile,
  getProjects, getProject, getMyProjects, createProject, updateProject, deleteProject,
  getInternships, createInternship,
  apply, getMyApplications, getProjectApplications, updateAppStatus,
  createContract, getContracts, signContract,
  createReview, getReviews,
  getNotifications, markAllRead,
  sendMessage, getMessages, getChats,
  toggleFavorite, getFavorites,
  searchUsers, getUserProfile,
  getStats,
};
