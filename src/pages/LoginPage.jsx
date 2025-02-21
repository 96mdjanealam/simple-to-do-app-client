import React from "react";
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

const LoginPage = () => {
  const { login, user } = useAuth();

  if (user) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-4">Welcome to Todo App</h1>
      <button
        onClick={login}
        className="bg-blue-500 text-white px-6 py-3 rounded-lg text-lg cursor-pointer"
      >
        Login with Google
      </button>
    </div>
  );
};

export default LoginPage;
