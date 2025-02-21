import axios from "axios";

const apiClient = axios.create({
  baseURL: "https://todo-app-backend-seven-phi.vercel.app",
  headers: {
    "Content-Type": "application/json",
  },
});

export const fetchTasks = async (token) => {
  try {
    const response = await apiClient.get("/tasks", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching tasks:", error);
    throw error;
  }
};

// Add a new task
export const addTask = async (token, task) => {
  try {
    const response = await apiClient.post("/tasks", task, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error("Error adding task:", error);
    throw error;
  }
};

// Update an existing task
export const updateTask = async (token, taskId, updatedData) => {
  try {
    const response = await apiClient.put(`/tasks/${taskId}`, updatedData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error("Error updating task:", error);
    throw error;
  }
};

// Delete a task
export const deleteTask = async (token, taskId) => {
  try {
    const response = await apiClient.delete(`/tasks/${taskId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error("Error deleting task:", error);
    throw error;
  }
};
