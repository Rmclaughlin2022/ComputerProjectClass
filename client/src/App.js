import React, { useEffect, useState } from "react";
import "./App.css";
import { db } from "./firebaseConfig"; // 👈 import the Firebase db
import { collection, getDocs } from "firebase/firestore";

function App() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "users")); // 👈 looks for a "users" collection
        const userList = [];
        querySnapshot.forEach((doc) => {
          userList.push({ id: doc.id, ...doc.data() });
        });
        setUsers(userList);
      } catch (error) {
        console.error("Error fetching users: ", error);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>🚀 Firebase Connected</h1>
        {users.length > 0 ? (
          <ul>
            {users.map((user) => (
              <li key={user.id}>{JSON.stringify(user)}</li>
            ))}
          </ul>
        ) : (
          <p>No users found in Firestore.</p>
        )}
      </header>
    </div>
  );
}

export default App;
