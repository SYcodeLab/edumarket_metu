import React from 'react';
// Импортируем реальный каталог, так как файл Catalog.jsx у тебя есть в папке
import CatalogPage from './Catalog';

// Вспомогательный компонент для единообразного стиля страниц
const PageLayout = ({ title, description }) => (
  <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif' }}>
    <h2 style={{ color: '#1e3a8a', fontSize: '2.5rem' }}>{title}</h2>
    <p style={{ color: '#666', fontSize: '1.1rem' }}>{description}</p>
    <div style={{ 
      marginTop: '30px', 
      height: '4px', 
      width: '60px', 
      background: '#ef4444', 
      margin: '30px auto' 
    }}></div>
  </div>
);

// 1. Реальный каталог
export const Catalog = CatalogPage;

// 2. Остальные страницы (пока как качественные заглушки, которые ты сможешь наполнять)
export const Landing = () => (
  <PageLayout 
    title="Добро пожаловать в EduMarket" 
    description="Платформа для поиска стажировок и практики студентов МИТУ. Найди свой путь в IT уже сегодня." 
  />
);

export const LoginPage = () => <PageLayout title="Вход в систему" description="Авторизуйтесь, чтобы получить доступ к профилю." />;
export const RegisterPage = () => <PageLayout title="Регистрация" description="Создайте аккаунт студента или компании." />;
export const Dashboard = () => <PageLayout title="Панель управления" description="Ваша активность и ключевые показатели." />;
export const Internships = () => <PageLayout title="Стажировки" description="Список актуальных предложений от партнеров." />;
export const Applications = () => <PageLayout title="Мои отклики" description="Статус ваших заявок на практику." />;
export const Contracts = () => <PageLayout title="Договоры" description="Юридические документы и соглашения с компаниями." />;
export const Analytics = () => <PageLayout title="Аналитика" description="Статистика востребованности навыков." />;
export const Notifications = () => <PageLayout title="Уведомления" description="Последние обновления по вашим проектам." />;
export const CreateProject = () => <PageLayout title="Создать проект" description="Опубликуйте новый проект для поиска команды." />;
export const MyProjects = () => <PageLayout title="Мои проекты" description="Управление вашими текущими разработками." />;
export const CreateInternship = () => <PageLayout title="Создать стажировку" description="Форма для добавления новой вакансии (для компаний)." />;
export const Profile = () => <PageLayout title="Профиль" description="Ваши навыки, резюме и контактные данные." />;

// Default экспорт для структуры Vite
const Index = () => <Landing />;
export default Index;