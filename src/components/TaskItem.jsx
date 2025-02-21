import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function TaskItem({ id, title, description, category }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  // Apply styles for visual feedback during dragging
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1, // Reduce opacity while dragging
  };

  return (
    <div
      ref={setNodeRef} // Attach the drag-and-drop behavior
      style={style} // Apply styles for visual feedback
      {...attributes} // Spread accessibility attributes
      {...listeners} // Spread drag-and-drop listeners
      className="bg-white p-4 mb-2 rounded-lg shadow-md cursor-move"
    >
      <h3 className="font-bold">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
      <p className="text-xs text-gray-400">{category}</p>
    </div>
  );
}

export default TaskItem;