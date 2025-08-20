// profilePic.js

// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDwgvrtQEI_lMKVExy0sx7cJV0uE8HikTc",
  authDomain: "wenky-fashion.firebaseapp.com",
  projectId: "wenky-fashion",
  storageBucket: "wenky-fashion.firebasestorage.app",
  messagingSenderId: "278566676880",
  appId: "1:278566676880:web:e24e379fcacd332a6eab15"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Handle profile pic
onAuthStateChanged(auth, (user) => {
  const profileIcon = document.getElementById("profile-icon");

  if (!profileIcon) return;

  if (user && user.photoURL) {
    profileIcon.innerHTML = `
      <span class="login-icon">
        <img src="${user.photoURL}" alt="Profile" />
      </span>
    `;
  } else {
    // Optional fallback if no photoURL — shows a default icon or initials
    profileIcon.innerHTML = `👤`;
  }
});