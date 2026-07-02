import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

import { app } from "./config.js";

export const db = getFirestore(app);

export async function loadTasks(userId) {

  const q = query(
    collection(db, "users", userId, "tasks"),
    orderBy("createdAt")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

}

export async function saveTask(userId, task) {

  await addDoc(
    collection(db, "users", userId, "tasks"),
    {
      title: task.title,
      notes: task.notes,
      createdAt: serverTimestamp()
    }
  );

}