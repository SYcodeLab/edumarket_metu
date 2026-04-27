import React from 'react';

// Именованные экспорты всех компонентов, которые ищет App.jsx
export const Landing = () => <div>Landing Page - EduMarket METU</div>;
export const LoginPage = () => <div>Login Page</div>;
export const RegisterPage = () => <div>Register Page</div>;
export const Dashboard = () => <div>Dashboard</div>;
export const Internships = () => <div>Internships</div>;
export const Applications = () => <div>Applications</div>;
export const Contracts = () => <div>Contracts</div>;
export const Analytics = () => <div>Analytics</div>;
export const Notifications = () => <div>Notifications</div>;

// Default экспорт тоже добавим на всякий случай
const Index = () => <div>Index Page</div>;
export default Index;