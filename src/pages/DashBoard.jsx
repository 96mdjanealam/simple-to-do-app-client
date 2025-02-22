import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { addTask, fetchTasks, updateTask, deleteTask } from "../services/api";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

function DashboardPage() {
  const { user, logout, login } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [isSwitchingUser, setIsSwitchingUser] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    category: "To-Do",
  });
  const [editingTaskId, setEditingTaskId] = useState(null); // Track the task being edited

  // Fetch tasks when the user changes
  useEffect(() => {
    if (user) {
      const token = user.accessToken;

      fetchTasks(token)
        .then((data) => {
          const sortedTasks = data.sort((a, b) => a.order - b.order);
          setTasks(sortedTasks);
        })
        .catch((error) => {
          console.error("Error fetching tasks:", error);
        });
    }
  }, [user]);

  // Handle switching users
  const handleSwitchUser = async () => {
    try {
      setIsSwitchingUser(true);
      await login();
    } catch (err) {
      console.error("Error during login:", err);
    } finally {
      setIsSwitchingUser(false);
    }
  };

  // Handle adding a new task
  const handleAddTask = async (e) => {
    e.preventDefault();

    if (!newTask.title || newTask.title.length > 50) {
      alert("Title is required and must be <= 50 characters");
      return;
    }

    try {
      const token = user.accessToken;
      const createdTask = await addTask(token, newTask);

      setTasks([...tasks, createdTask]);
      setNewTask({ title: "", description: "", category: "To-Do" });
    } catch (error) {
      console.error("Error adding task:", error);
    }
  };

  // Handle updating a task
  const handleUpdateTask = async (taskId, updatedData) => {
    try {
      const token = user.accessToken;
      await updateTask(token, taskId, updatedData);

      const updatedTasks = tasks.map((task) =>
        task._id === taskId ? { ...task, ...updatedData } : task
      );

      setTasks(updatedTasks);
      setEditingTaskId(null); // Exit edit mode
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  // Handle deleting a task
  const handleDeleteTask = async (taskId) => {
    try {
      const token = user.accessToken;
      await deleteTask(token, taskId);

      const updatedTasks = tasks.filter((task) => task._id !== taskId);
      setTasks(updatedTasks);
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  // Handle drag-and-drop events
  const onDragEnd = (result) => {
    const { source, destination } = result;

    if (!destination || (source.droppableId === destination.droppableId && source.index === destination.index)) {
      return;
    }

    if (source.droppableId === destination.droppableId) {
      const columnTasks = tasks.filter((task) => task.category === source.droppableId);
      const [movedTask] = columnTasks.splice(source.index, 1);
      columnTasks.splice(destination.index, 0, movedTask);

      const updatedTasks = tasks.map((task) =>
        task.category === source.droppableId ? columnTasks.find((t) => t._id === task._id) : task
      );

      setTasks(updatedTasks);

      try {
        updateTask(user.accessToken, movedTask._id, { order: destination.index });
      } catch (error) {
        console.error("Error updating task order:", error);
      }
    } else {
      const sourceColumnTasks = tasks.filter((task) => task.category === source.droppableId);
      const destinationColumnTasks = tasks.filter((task) => task.category === destination.droppableId);
      const [movedTask] = sourceColumnTasks.splice(source.index, 1);
      destinationColumnTasks.splice(destination.index, 0, { ...movedTask, category: destination.droppableId });

      const updatedTasks = [
        ...tasks.filter((task) => task.category !== source.droppableId && task.category !== destination.droppableId),
        ...sourceColumnTasks,
        ...destinationColumnTasks,
      ];

      setTasks(updatedTasks);

      try {
        updateTask(user.accessToken, movedTask._id, {
          order: destination.index,
          category: destination.droppableId,
        });
      } catch (error) {
        console.error("Error updating task category and order:", error);
      }
    }
  };

  return (
    <div className="p-4">
      <header className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Todo App</h1>
        <div className="flex gap-2">
          <button
            onClick={handleSwitchUser}
            disabled={isSwitchingUser}
            className={`bg-blue-500 text-white px-4 py-2 rounded ${
              isSwitchingUser ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isSwitchingUser ? "Switching..." : "Switch User"}
          </button>
          <button onClick={logout} className="bg-red-500 text-white px-4 py-2 rounded">
            Logout
          </button>
        </div>
      </header>

      {/* Add Task Form */}
      <form onSubmit={handleAddTask} className="mb-4">
        <input
          type="text"
          placeholder="Title"
          value={newTask.title}
          onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
          className="border p-2 mr-2 w-64"
        />
        <input
          type="text"
          placeholder="Description"
          value={newTask.description}
          onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
          className="border p-2 mr-2 w-64"
        />
        <select
          value={newTask.category}
          onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
          className="border p-2 mr-2"
        >
          <option value="To-Do">To-Do</option>
          <option value="In Progress">In Progress</option>
          <option value="Done">Done</option>
        </select>
        <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">
          Add Task
        </button>
      </form>

      {/* Render Tasks */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* To-Do Column */}
          <Droppable droppableId="To-Do">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="bg-gray-100 p-4 rounded-lg">
                <h2 className="text-lg font-bold mb-2">To-Do</h2>
                {tasks
                  .filter((task) => task.category === "To-Do")
                  .map((task, index) => (
                    <Draggable key={task._id} draggableId={task._id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="bg-white p-4 mb-2 rounded-lg shadow-md"
                        >
                          {editingTaskId === task._id ? (
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                handleUpdateTask(task._id, {
                                  title: e.target.title.value,
                                  description: e.target.description.value,
                                  category: e.target.category.value,
                                });
                              }}
                            >
                              <input
                                type="text"
                                name="title"
                                defaultValue={task.title}
                                className="border p-2 mr-2 w-64"
                              />
                              <input
                                type="text"
                                name="description"
                                defaultValue={task.description}
                                className="border p-2 mr-2 w-64"
                              />
                              <select name="category" defaultValue={task.category} className="border p-2 mr-2">
                                <option value="To-Do">To-Do</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Done">Done</option>
                              </select>
                              <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingTaskId(null)}
                                className="bg-gray-500 text-white px-4 py-2 rounded ml-2"
                              >
                                Cancel
                              </button>
                            </form>
                          ) : (
                            <div className="flex justify-between items-center">
                              {/* Left Side: Task Details */}
                              <div>
                                <h3 className="font-bold">{task.title}</h3>
                                <p className="text-sm text-gray-600">{task.description}</p>
                              </div>

                              {/* Right Side: Buttons */}
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setEditingTaskId(task._id)}
                                  className="bg-yellow-500 text-white px-2 py-1 rounded"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteTask(task._id)}
                                  className="bg-red-500 text-white px-2 py-1 rounded"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>

          {/* In Progress Column */}
          <Droppable droppableId="In Progress">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="bg-gray-100 p-4 rounded-lg">
                <h2 className="text-lg font-bold mb-2">In Progress</h2>
                {tasks
                  .filter((task) => task.category === "In Progress")
                  .map((task, index) => (
                    <Draggable key={task._id} draggableId={task._id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="bg-white p-4 mb-2 rounded-lg shadow-md"
                        >
                          {editingTaskId === task._id ? (
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                handleUpdateTask(task._id, {
                                  title: e.target.title.value,
                                  description: e.target.description.value,
                                  category: e.target.category.value,
                                });
                              }}
                            >
                              <input
                                type="text"
                                name="title"
                                defaultValue={task.title}
                                className="border p-2 mr-2 w-64"
                              />
                              <input
                                type="text"
                                name="description"
                                defaultValue={task.description}
                                className="border p-2 mr-2 w-64"
                              />
                              <select name="category" defaultValue={task.category} className="border p-2 mr-2">
                                <option value="To-Do">To-Do</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Done">Done</option>
                              </select>
                              <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingTaskId(null)}
                                className="bg-gray-500 text-white px-4 py-2 rounded ml-2"
                              >
                                Cancel
                              </button>
                            </form>
                          ) : (
                            <div className="flex justify-between items-center">
                              {/* Left Side: Task Details */}
                              <div>
                                <h3 className="font-bold">{task.title}</h3>
                                <p className="text-sm text-gray-600">{task.description}</p>
                              </div>

                              {/* Right Side: Buttons */}
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setEditingTaskId(task._id)}
                                  className="bg-yellow-500 text-white px-2 py-1 rounded"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteTask(task._id)}
                                  className="bg-red-500 text-white px-2 py-1 rounded"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>

          {/* Done Column */}
          <Droppable droppableId="Done">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="bg-gray-100 p-4 rounded-lg">
                <h2 className="text-lg font-bold mb-2">Done</h2>
                {tasks
                  .filter((task) => task.category === "Done")
                  .map((task, index) => (
                    <Draggable key={task._id} draggableId={task._id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="bg-white p-4 mb-2 rounded-lg shadow-md"
                        >
                          {editingTaskId === task._id ? (
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                handleUpdateTask(task._id, {
                                  title: e.target.title.value,
                                  description: e.target.description.value,
                                  category: e.target.category.value,
                                });
                              }}
                            >
                              <input
                                type="text"
                                name="title"
                                defaultValue={task.title}
                                className="border p-2 mr-2 w-64"
                              />
                              <input
                                type="text"
                                name="description"
                                defaultValue={task.description}
                                className="border p-2 mr-2 w-64"
                              />
                              <select name="category" defaultValue={task.category} className="border p-2 mr-2">
                                <option value="To-Do">To-Do</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Done">Done</option>
                              </select>
                              <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingTaskId(null)}
                                className="bg-gray-500 text-white px-4 py-2 rounded ml-2"
                              >
                                Cancel
                              </button>
                            </form>
                          ) : (
                            <div className="flex justify-between items-center">
                              {/* Left Side: Task Details */}
                              <div>
                                <h3 className="font-bold">{task.title}</h3>
                                <p className="text-sm text-gray-600">{task.description}</p>
                              </div>

                              {/* Right Side: Buttons */}
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setEditingTaskId(task._id)}
                                  className="bg-yellow-500 text-white px-2 py-1 rounded"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteTask(task._id)}
                                  className="bg-red-500 text-white px-2 py-1 rounded"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      </DragDropContext>
    </div>
  );
}

export default DashboardPage;