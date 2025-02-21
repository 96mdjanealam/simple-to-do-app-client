import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { useAuth } from './context/AuthContext';
import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashBoard';
import Test from "./pages/Test"

function App() {
  const { user, loading } = useAuth();

  console.log(user);
 

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <Routes>
      {/* Redirect authenticated users to the dashboard */}
      <Route
        path="/"
        element={user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />}
      />
      {/* Login Page */}
      <Route path="/login" element={<LoginPage />} />
      {/* Dashboard Page */}
      <Route
        path="/dashboard"
        element={user ? <DashboardPage /> : <Navigate to="/login" />}
      />
      <Route
        path="/test"
        element={<Test></Test>}
      />
    </Routes>
  );
}

export default App
