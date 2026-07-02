import {
  signInWithGoogle,
  signOutUser,
  watchAuth
} from "../firebase/auth.js";

import {
  loadTasks as loadCloudTasks,
  saveTask as saveCloudTask
} from "../firebase/firestore.js";

const taskTitleInput = document.querySelector("#task-title");
const taskNotesInput = document.querySelector("#task-notes");
const toggleNotesButton = document.querySelector("#toggle-notes");
const addTaskButton = document.querySelector("#add-task");
const taskList = document.querySelector("#task-list");
const emptyState = document.querySelector("#empty-state");
const charCount = document.querySelector("#char-count");
const toast = document.querySelector("#toast");
const undoButton = document.querySelector("#undo-clear");
const signInButton = document.querySelector("#sign-in");
const signOutButton = document.querySelector("#sign-out");
const authStatus = document.querySelector("#auth-status");

let tasks = [];
let currentUser = null;
let lastClearedTask = null;
let undoTimer = null;
let draggedTaskId = null;

function saveTasks() {
  localStorage.setItem("toDoTomorrowTasks", JSON.stringify(tasks));
}

function loadTasks() {
  const savedTasks = localStorage.getItem("toDoTomorrowTasks");
  tasks = savedTasks ? JSON.parse(savedTasks) : [];
}

function renderTasks() {
  taskList.innerHTML = "";
  emptyState.classList.toggle("hidden", tasks.length > 0);

  tasks.forEach((task) => {
    const item = document.createElement("li");
    item.className = "task-card";
    item.draggable = true;
    item.dataset.id = task.id;

    item.innerHTML = `
      <span class="drag-handle" aria-hidden="true">⋮⋮</span>
      <div class="task-content">
        <h2>${escapeHtml(task.title)}</h2>
        ${task.notes ? `<p>${escapeHtml(task.notes)}</p>` : ""}
      </div>
      <button class="clear-button" type="button" aria-label="Clear task">✓</button>
    `;

    taskList.appendChild(item);
  });
}

async function addTask() {
  const title = taskTitleInput.value.trim();
  const notes = taskNotesInput.value.trim();

  if (!title) return;

  if (!currentUser) {
    alert("Please sign in before adding tasks.");
    return;
  }

  await saveCloudTask(currentUser.uid, {
    title,
    notes
  });

  taskTitleInput.value = "";
  taskNotesInput.value = "";
  charCount.textContent = "0 / 100";
  taskTitleInput.focus();
}

function clearTask(id) {
  const item = taskList.querySelector(`[data-id="${id}"]`);
  const index = tasks.findIndex((task) => task.id === id);

  if (index === -1 || !item) return;

  item.classList.add("clearing");

  setTimeout(() => {
    lastClearedTask = {
      task: tasks[index],
      index
    };

    tasks.splice(index, 1);
    saveTasks();
    renderTasks();
    showToast();
  }, 180);
}

function showToast() {
  toast.classList.remove("hidden");

  clearTimeout(undoTimer);
  undoTimer = setTimeout(() => {
    lastClearedTask = null;
    toast.classList.add("hidden");
  }, 10000);
}

function undoClear() {
  if (!lastClearedTask) return;

  tasks.splice(lastClearedTask.index, 0, lastClearedTask.task);
  saveTasks();
  renderTasks();

  lastClearedTask = null;
  toast.classList.add("hidden");
  clearTimeout(undoTimer);
}

function updateCharacterCount() {
  charCount.textContent = `${taskTitleInput.value.length} / 100`;
}

function toggleNotes() {
  taskNotesInput.classList.toggle("hidden");

  toggleNotesButton.textContent = taskNotesInput.classList.contains("hidden")
    ? "+ Notes"
    : "− Notes";

  if (!taskNotesInput.classList.contains("hidden")) {
    taskNotesInput.focus();
  }
}

function handleDragStart(event) {
  const item = event.target.closest(".task-card");
  draggedTaskId = item.dataset.id;
  item.classList.add("dragging");
}

function handleDragEnd(event) {
  const item = event.target.closest(".task-card");
  item.classList.remove("dragging");
  draggedTaskId = null;
  saveTaskOrderFromDom();
}

function handleDragOver(event) {
  event.preventDefault();

  const afterElement = getDragAfterElement(taskList, event.clientY);
  const draggingItem = document.querySelector(".dragging");

  if (!draggingItem) return;

  if (afterElement == null) {
    taskList.appendChild(draggingItem);
  } else {
    taskList.insertBefore(draggingItem, afterElement);
  }
}

function getDragAfterElement(container, y) {
  const draggableElements = [
    ...container.querySelectorAll(".task-card:not(.dragging)")
  ];
 
  return draggableElements.reduce(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;

      if (offset < 0 && offset > closest.offset) {
        return {
          offset,
          element: child
        };
      }

      return closest;
    },
    {
      offset: Number.NEGATIVE_INFINITY,
      element: null
    }
  ).element;
}

function saveTaskOrderFromDom() {
  const orderedIds = [...taskList.querySelectorAll(".task-card")].map(
    (item) => item.dataset.id
  );

  tasks = orderedIds.map((id) => tasks.find((task) => task.id === id));
  saveTasks();
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

addTaskButton.addEventListener("click", addTask);
taskTitleInput.addEventListener("input", updateCharacterCount);

taskTitleInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    addTask();
  }
});

toggleNotesButton.addEventListener("click", toggleNotes);
undoButton.addEventListener("click", undoClear);

taskList.addEventListener("click", (event) => {
  const clearButton = event.target.closest(".clear-button");
  if (!clearButton) return;

  const item = clearButton.closest(".task-card");
  clearTask(item.dataset.id);
});

taskList.addEventListener("dragstart", handleDragStart);
taskList.addEventListener("dragend", handleDragEnd);
taskList.addEventListener("dragover", handleDragOver);

loadTasks();
renderTasks();
taskTitleInput.focus();

signInButton.addEventListener("click", async () => {
  try {
    await signInWithGoogle();
  } catch (error) {
    console.error(error);
    alert("Google sign in failed.");
  }
});

signOutButton.addEventListener("click", async () => {
  await signOutUser();
});

watchAuth((user) => {

  if (user) {

    authStatus.textContent = `Hi ${user.displayName}`;

    signInButton.classList.add("hidden");
    signOutButton.classList.remove("hidden");

  } else {

    authStatus.textContent = "Not signed in";

    signInButton.classList.remove("hidden");
    signOutButton.classList.add("hidden");

  }

});
