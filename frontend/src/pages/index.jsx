import React from 'react';

// Общий стиль для заглушек, чтобы вайб был поприятнее
const PageWrapper = ({ name }) => (
  <div style={{ 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    justifyContent: 'center', 
    height: '100vh', 
    fontFamily: 'sans-serif',
    background: '#f0f2f5',
    color: '#1a1a1a'
  }}>
    <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>{name}</h1>
    <p style={{ color: '#666' }}>EduMarket METU — в процессе разработки</p>
    <div style={{ 
      marginTop: '2rem', 
      padding: '1rem 2rem', 
      background: '#007bff', 
      color: 'white', 
      borderRadius: '8px' 
    }}>
      Скоро здесь будет контент
    </div>
  </div>
);

// Именованные экспорты для App.jsx
export const Landing = () => <PageWrapper name="Landing Page" />;
export const LoginPage = () => <PageWrapper name="Login" />;
export const RegisterPage = () => <PageWrapper name="Registration" />;
export const Dashboard = () => <PageWrapper name="Dashboard" />;
export const Internships = () => <PageWrapper name="Internships" />;
export const Applications = () => <PageWrapper name="Applications" />;
export const Contracts = () => <PageWrapper name="Contracts" />;
export const Analytics = () => <PageWrapper name="Analytics" />;
export const Notifications = () => <PageWrapper name="Notifications" />;
export const CreateProject = () => <PageWrapper name="Create Project" />;
export const MyProjects = () => <PageWrapper name="My Projects" />;
export const CreateInternship = () => <PageWrapper name="Create Internship" />;
export const Profile = () => <PageWrapper name="Profile" />;

// Default экспорт
const Index = () => <Landing />;
export default Index;