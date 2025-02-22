import React from "react";
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";
import logo from "../assets/icons8-task-96.png";

const LoginPage = () => {
  const { login, user } = useAuth();

  if (user) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <img src={logo} className="mb-10" alt="" />
      <h1 className="text-3xl font-bold mb-2">Your Simple TODO</h1>
      <p className="text-gray-500">Welcome to your todo app</p>
      <button
        onClick={login}
        className="bg-blue-500 text-white mt-8 px-6 py-3 rounded-lg text-lg cursor-pointer"
      >
        Login with Google
      </button>
      <p className="text-gray-500 text-sm mt-14">
        All rights reserved by Md Jane Alam
      </p>
    </div>
  );
};

export default LoginPage;
