import React from "react";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core"; // Import useDroppable
import TaskItem from "./TaskItem";

function TaskList({ tasks, category }) {
  const filteredTasks = tasks.filter((task) => task.category === category);

  // Use useDroppable to make the placeholder a valid drop target
  const { isOver, setNodeRef } = useDroppable({
    id: category, // Unique ID for the drop target (use the category name)
  });

  return (
    <SortableContext items={tasks.map((task) => task._id)} strategy={verticalListSortingStrategy}>
      <div ref={setNodeRef} className="space-y-2">
        {/* Render tasks */}
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => (
            <TaskItem key={task._id} id={task._id} {...task} />
          ))
        ) : (
          // Placeholder for empty column
          <div
            className={`bg-gray-200 p-4 rounded-lg text-center text-gray-500 ${
              isOver ? "bg-blue-100" : ""
            }`}
            style={{ minHeight: "50px", cursor: "pointer" }}
          >
            Drop tasks here
          </div>
        )}
      </div>
    </SortableContext>
  );
}

export default TaskList;