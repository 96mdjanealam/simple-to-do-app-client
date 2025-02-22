import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { addTask, fetchTasks, updateTask, deleteTask } from "../services/api";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import logo from "../assets/icons8-task-96.png"

function DashboardPage() {
  const { user, logout, login } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [isActivityLog, setIsActivityLog] = useState(false);
  const [isSwitchingUser, setIsSwitchingUser] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    category: "To-Do",
  });
  const [editingTaskId, setEditingTaskId] = useState(null); // Track the task being edited
  const [activityLog, setActivityLog] = useState([]); // Activity log state

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

  // Function to add a log entry
  const addLogEntry = (message) => {
    const timestamp = new Date().toLocaleString();
    setActivityLog((prevLog) => [...prevLog, `${timestamp}: ${message}`]);
  };

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
      alert("Title is required and must be less than 50 characters.");
      return;
    }

    try {
      const token = user.accessToken;
      const createdTask = await addTask(token, newTask);

      setTasks([...tasks, createdTask]);
      setNewTask({ title: "", description: "", category: "To-Do" });

      // Log the addition of a new task
      addLogEntry(
        `Task "${createdTask.title}" added to "${createdTask.category}".`
      );
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

      // Log the update of a task
      addLogEntry(`Task "${updatedData.title}" updated.`);
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  // Handle deleting a task
  const handleDeleteTask = async (taskId) => {
    try {
      const token = user.accessToken;
      const taskToDelete = tasks.find((task) => task._id === taskId);

      await deleteTask(token, taskId);

      const updatedTasks = tasks.filter((task) => task._id !== taskId);
      setTasks(updatedTasks);

      // Log the deletion of a task
      addLogEntry(`Task "${taskToDelete.title}" deleted.`);
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  // Handle drag-and-drop events
  const onDragEnd = async (result) => {
    const { source, destination } = result;

    // If there's no destination or the task hasn't moved, do nothing
    if (
      !destination ||
      (source.droppableId === destination.droppableId &&
        source.index === destination.index)
    ) {
      return;
    }

    // Optimistically update the frontend state
    let updatedTasks;

    if (source.droppableId === destination.droppableId) {
      // Task moved within the same column
      const columnTasks = tasks.filter(
        (task) => task.category === source.droppableId
      );
      const [movedTask] = columnTasks.splice(source.index, 1);
      columnTasks.splice(destination.index, 0, movedTask);

      // Recalculate order for all tasks in the column
      columnTasks.forEach((task, index) => {
        task.order = index;
      });

      updatedTasks = [
        ...tasks.filter((task) => task.category !== source.droppableId),
        ...columnTasks,
      ];
      addLogEntry(
        `Task "${movedTask.title}" reordered in "${source.droppableId}".`
      );
    } else {
      // Task moved to a different column
      const sourceColumnTasks = tasks.filter(
        (task) => task.category === source.droppableId
      );
      const destinationColumnTasks = tasks.filter(
        (task) => task.category === destination.droppableId
      );

      const [movedTask] = sourceColumnTasks.splice(source.index, 1);
      destinationColumnTasks.splice(destination.index, 0, {
        ...movedTask,
        category: destination.droppableId,
      });

      // Recalculate order for tasks in both columns
      sourceColumnTasks.forEach((task, index) => {
        task.order = index;
      });
      destinationColumnTasks.forEach((task, index) => {
        task.order = index;
      });

      updatedTasks = [
        ...tasks.filter(
          (task) =>
            task.category !== source.droppableId &&
            task.category !== destination.droppableId
        ),
        ...sourceColumnTasks,
        ...destinationColumnTasks,
      ];

      addLogEntry(
        `Task "${movedTask.title}" moved from "${source.droppableId}" to "${destination.droppableId}".`
      );
    }

    // Update the frontend state optimistically
    setTasks(updatedTasks);

    try {
      // Update the backend
      if (source.droppableId === destination.droppableId) {
        await Promise.all(
          updatedTasks
            .filter((task) => task.category === source.droppableId)
            .map((task) =>
              updateTask(user.accessToken, task._id, { order: task.order })
            )
        );
      } else {
        await Promise.all([
          ...updatedTasks
            .filter((task) => task.category === source.droppableId)
            .map((task) =>
              updateTask(user.accessToken, task._id, { order: task.order })
            ),
          ...updatedTasks
            .filter((task) => task.category === destination.droppableId)
            .map((task) =>
              updateTask(user.accessToken, task._id, {
                order: task.order,
                category: task.category,
              })
            ),
        ]);
      }
    } catch (error) {
      console.error("Error updating task order/category:", error);

      // Revert the frontend state if the backend update fails
      setTasks((prevTasks) => [...prevTasks]);
      alert("Failed to update task. Please try again.");
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center justify-center gap-4">
        <img src={logo} className="w-10" alt="" />
        <h1 className="text-2xl font-bold">Todo App</h1>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleSwitchUser}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            {isSwitchingUser ? "Switching..." : "Switch User"}
          </button>
          <button
            onClick={logout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Add Task Form */}
      <form onSubmit={handleAddTask} className="mb-6 w-full md:w-1/2 mx-auto">
        <div className="flex flex-col gap-2 items-center">
          <div className="flex gap-2 w-full">
            <input
              type="text"
              value={newTask.title}
              onChange={(e) =>
                setNewTask({ ...newTask, title: e.target.value })
              }
              placeholder="Title"
              className="border-2 border-blue-200 rounded-xl w-1/2 p-2"
            />
            <input
              type="text"
              value={newTask.description}
              onChange={(e) =>
                setNewTask({ ...newTask, description: e.target.value })
              }
              placeholder="Description"
              className="border-2 border-blue-200 rounded-xl w-1/2 p-2"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={newTask.category}
              onChange={(e) =>
                setNewTask({ ...newTask, category: e.target.value })
              }
              className="border-2 border-blue-200 rounded-xl p-2"
            >
              <option>To-Do</option>
              <option>In Progress</option>
              <option>Done</option>
            </select>
            <button
              type="submit"
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl"
            >
              Add Task
            </button>
          </div>
        </div>
      </form>
      {/* Activity Log */}
      <button
        className="px-4 font-semibold py-2 bg-yellow-400 rounded-xl mb-4"
        onClick={() => {
          setIsActivityLog((prev) => !prev);
        }}
      >
        {`${isActivityLog ? "Close" : "Open"} Activity Log`}
      </button>

      {isActivityLog && (
        <div className="w-full mb-4 p-4 rounded-lg bg-gray-100">
          <h2 className="text-lg font-bold mb-2">Activity Log</h2>
          <ul className="space-y-2">
            {activityLog.map((log, index) => (
              <li key={index} className="text-sm text-gray-700">
                {log}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Render Tasks */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex flex-col md:flex-row gap-4">
          {/* To-Do Column */}
          <Droppable droppableId="To-Do">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="w-full p-4 rounded-lg bg-gray-100"
              >
                <h2 className="text-lg font-bold mb-2">To-Do</h2>
                {tasks
                  .filter((task) => task.category === "To-Do")
                  .map((task, index) => (
                    <Draggable
                      key={task._id}
                      draggableId={task._id}
                      index={index}
                    >
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="mb-2 p-2 border-2 border-gray-200 rounded-lg bg-white"
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
                              <div className="flex flex-wrap gap-2">
                                <input
                                  name="title"
                                  defaultValue={task.title}
                                  className="border-2 border-gray-200 rounded-xl p-2 mr-2"
                                />
                                <input
                                  name="description"
                                  defaultValue={task.description}
                                  className="border-2 border-gray-200 rounded-xl p-2 mr-2"
                                />
                                <select
                                  name="category"
                                  defaultValue={task.category}
                                  className="border-2 border-gray-200 rounded-xl p-2 mr-2"
                                >
                                  <option>To-Do</option>
                                  <option>In Progress</option>
                                  <option>Done</option>
                                </select>
                              </div>

                              <button
                                type="submit"
                                className="bg-green-500 hover:bg-green-600 text-white mt-2 cursor-pointer px-2 py-1 rounded-lg"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingTaskId(null)}
                                className="bg-gray-500 hover:bg-gray-600 text-white mt-2 px-2 py-1 rounded-lg cursor-pointer ml-2"
                              >
                                Cancel
                              </button>
                            </form>
                          ) : (
                            <div className="flex justify-between items-center">
                              <div>
                                <div>{task.title}</div>
                                <div className="text-sm text-gray-600">
                                  {task.description}
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => setEditingTaskId(task._id)}
                                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded-lg"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteTask(task._id)}
                                  className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded-lg"
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
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="w-full p-4 rounded-lg bg-gray-100"
              >
                <h2 className="text-lg font-bold mb-2">In Progress</h2>
                {tasks
                  .filter((task) => task.category === "In Progress")
                  .map((task, index) => (
                    <Draggable
                      key={task._id}
                      draggableId={task._id}
                      index={index}
                    >
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="mb-2 p-2 border-2 border-gray-200 rounded-lg bg-white"
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
                              <div className="flex flex-wrap gap-2">
                                <input
                                  name="title"
                                  defaultValue={task.title}
                                  className="border-2 border-gray-200 rounded-xl p-2 mr-2"
                                />
                                <input
                                  name="description"
                                  defaultValue={task.description}
                                  className="border-2 border-gray-200 rounded-xl p-2 mr-2"
                                />
                                <select
                                  name="category"
                                  defaultValue={task.category}
                                  className="border-2 border-gray-200 rounded-xl p-2 mr-2"
                                >
                                  <option>To-Do</option>
                                  <option>In Progress</option>
                                  <option>Done</option>
                                </select>
                              </div>
                              <button
                                type="submit"
                                className="bg-green-500 hover:bg-green-600 text-white mt-2 cursor-pointer px-2 py-1 rounded-lg"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingTaskId(null)}
                                className="bg-gray-500 hover:bg-gray-600 text-white mt-2 px-2 py-1 rounded-lg cursor-pointer ml-2"
                              >
                                Cancel
                              </button>
                            </form>
                          ) : (
                            <div className="flex justify-between items-center">
                              <div>
                                <div>{task.title}</div>
                                <div className="text-sm text-gray-600">
                                  {task.description}
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => setEditingTaskId(task._id)}
                                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded-lg"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteTask(task._id)}
                                  className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded-lg"
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
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="w-full p-4 rounded-lg bg-gray-100"
              >
                <h2 className="text-lg font-bold mb-2">Done</h2>
                {tasks
                  .filter((task) => task.category === "Done")
                  .map((task, index) => (
                    <Draggable
                      key={task._id}
                      draggableId={task._id}
                      index={index}
                    >
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="mb-2 p-2 border-2 border-gray-200 rounded-lg bg-white"
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
                              <div className="flex flex-wrap gap-2">
                                <input
                                  name="title"
                                  defaultValue={task.title}
                                  className="border-2 border-gray-200 rounded-xl p-2 mr-2"
                                />
                                <input
                                  name="description"
                                  defaultValue={task.description}
                                  className="border-2 border-gray-200 rounded-xl p-2 mr-2"
                                />
                                <select
                                  name="category"
                                  defaultValue={task.category}
                                  className="border-2 border-gray-200 rounded-xl p-2 mr-2"
                                >
                                  <option>To-Do</option>
                                  <option>In Progress</option>
                                  <option>Done</option>
                                </select>
                              </div>
                              <button
                                type="submit"
                                className="bg-green-500 hover:bg-green-600 text-white mt-2 cursor-pointer px-2 py-1 rounded-lg"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingTaskId(null)}
                                className="bg-gray-500 hover:bg-gray-600 text-white mt-2 px-2 py-1 rounded-lg cursor-pointer ml-2"
                              >
                                Cancel
                              </button>
                            </form>
                          ) : (
                            <div className="flex justify-between items-center">
                              <div>
                                <div>{task.title}</div>
                                <div className="text-sm text-gray-600">
                                  {task.description}
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => setEditingTaskId(task._id)}
                                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded-lg"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteTask(task._id)}
                                  className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded-lg"
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
