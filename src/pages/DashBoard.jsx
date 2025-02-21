import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { addTask, fetchTasks, updateTask } from "../services/api";
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

  // Fetch tasks when the user changes
  useEffect(() => {
    if (user) {
      const token = user.accessToken;

      fetchTasks(token)
        .then((data) => {
          // Sort tasks by order before setting them in state
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

      // Add the new task to the state
      setTasks([...tasks, createdTask]);

      // Reset the form
      setNewTask({ title: "", description: "", category: "To-Do" });
    } catch (error) {
      console.error("Error adding task:", error);
    }
  };

  // Handle drag-and-drop events
  const onDragEnd = (result) => {
    const { source, destination } = result;

    // Dropped outside the list or in the same position
    if (!destination || (source.droppableId === destination.droppableId && source.index === destination.index)) {
      return;
    }

    // Reorder tasks within the same column
    if (source.droppableId === destination.droppableId) {
      const columnTasks = tasks.filter((task) => task.category === source.droppableId);
      const [movedTask] = columnTasks.splice(source.index, 1);
      columnTasks.splice(destination.index, 0, movedTask);

      const updatedTasks = tasks.map((task) =>
        task.category === source.droppableId ? columnTasks.find((t) => t._id === task._id) : task
      );

      setTasks(updatedTasks);

      // Update the backend
      try {
        updateTask(user.accessToken, movedTask._id, {
          order: destination.index,
        });
      } catch (error) {
        console.error("Error updating task order:", error);
      }
    } else {
      // Move task between columns
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

      // Update the backend
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
          <button
            onClick={logout}
            className="bg-red-500 text-white px-4 py-2 rounded"
          >
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
          onChange={(e) =>
            setNewTask({ ...newTask, description: e.target.value })
          }
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
        <button
          type="submit"
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Add Task
        </button>
      </form>

      {/* Render Tasks */}
      <main>
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* To-Do Column */}
            <Droppable droppableId="To-Do">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="bg-gray-100 p-4 rounded-lg"
                >
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
                            className="bg-white p-4 mb-2 rounded-lg shadow-md cursor-move"
                          >
                            <h3 className="font-bold">{task.title}</h3>
                            <p className="text-sm text-gray-600">{task.description}</p>
                            <p className="text-sm text-gray-600">{task.category}</p>
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
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="bg-gray-100 p-4 rounded-lg"
                >
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
                            className="bg-white p-4 mb-2 rounded-lg shadow-md cursor-move"
                          >
                            <h3 className="font-bold">{task.title}</h3>
                            <p className="text-sm text-gray-600">{task.description}</p>
                            <p className="text-sm text-gray-600">{task.category}</p>
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
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="bg-gray-100 p-4 rounded-lg"
                >
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
                            className="bg-white p-4 mb-2 rounded-lg shadow-md cursor-move"
                          >
                            <h3 className="font-bold">{task.title}</h3>
                            <p className="text-sm text-gray-600">{task.description}</p>
                            <p className="text-sm text-gray-600">{task.category}</p>
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
      </main>
    </div>
  );
}

export default DashboardPage;