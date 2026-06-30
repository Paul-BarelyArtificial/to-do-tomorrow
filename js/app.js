const taskTitleInput = document.querySelector("#task-title");
const taskNotesInput = document.querySelector("#task-notes");
const toggleNotesButton = document.querySelector("#toggle-notes");
const addTaskButton = document.querySelector("#add-task");
const taskList = document.querySelector("#task-list");
const emptyState = document.querySelector("#empty-state");
const charCount = document.querySelector("#char-count");
const toast = document.querySelector("#toast");
const undoButton = document.querySelector("#undo-clear");

let tasks = [];
let lastClearedTask = null;
let undoTimer = null;

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

function addTask() {
  const title = taskTitleInput.value.trim();
  const notes = taskNotesInput.value.trim();

  if (!title) return;

  const task = {
    id: crypto.randomUUID(),
    title,
    notes,
    createdAt: Date.now()
  };

  tasks.push(task);
  saveTasks();
  renderTasks();

  taskTitleInput.value = "";
  taskNotesInput.value = "";
  charCount.textContent = "0 / 100";
  taskTitleInput.focus();
}

function clearTask(id) {
  const item = taskList.querySelector(`[data-id="${id}"]`);
  const index = tasks.findIndex((task) => task.id === id);

  if (index === -1) return;

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

loadTasks();
renderTasks();
taskTitleInput.focus();