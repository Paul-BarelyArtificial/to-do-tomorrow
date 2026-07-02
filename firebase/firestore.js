import {
  getFirestore,
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

import { app } from "./config.js";

export const db = getFirestore(app);

function tasksCollection(userId) {
  return collection(db, "users", userId, "tasks");
}

export function watchTasks(userId, callback) {
  return onSnapshot(tasksCollection(userId), (snapshot) => {
    const tasks = snapshot.docs.map((document) => ({
      id: document.id,
      ...document.data()
    }));

    tasks.sort((a, b) => {
      const aOrder = a.order ?? 0;
      const bOrder = b.order ?? 0;
      return aOrder - bOrder;
    });

    callback(tasks);
  });
}

export async function saveTask(userId, task) {
  await addDoc(tasksCollection(userId), {
    title: task.title,
    notes: task.notes,
    order: Date.now(),
    createdAt: serverTimestamp()
  });
}

export async function deleteTask(userId, taskId) {
  await deleteDoc(doc(db, "users", userId, "tasks", taskId));
}

export async function updateTaskOrder(userId, tasks) {
  const updates = tasks.map((task, index) => {
    return updateDoc(doc(db, "users", userId, "tasks", task.id), {
      order: index
    });
  });

  await Promise.all(updates);
}
