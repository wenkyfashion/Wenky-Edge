import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDwgvrtQEI_lMKVExy0sx7cJV0uE8HikTc",
  authDomain: "wenky-fashion.firebaseapp.com",
  projectId: "wenky-fashion",
  storageBucket: "wenky-fashion.firebasestorage.app",
  messagingSenderId: "278566676880",
  appId: "1:278566676880:web:e24e379fcacd332a6eab15",
  measurementId: "G-EQMVJ92EXC"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();

// Login with Google
const loginBtn = document.getElementById('login-btn');
const loginBtns = document.getElementById('login-btns');
const profileIcon = document.getElementById('profile-icon');

if (loginBtn) {
  loginBtn.addEventListener('click', () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
      .then(result => {
        if (loginBtns) loginBtns.style.display = 'none';
      })
      .catch(error => {
        alert("Login Failed: " + error.message);
      });
  });
}

onAuthStateChanged(auth, (user) => {
  if (user && loginBtns) {
    loginBtns.innerHTML = `
      <p style="color: white;">Welcome, ${user.displayName} 👋</p>
      <button id="explore-btn">Explore Wenky</button>
    `;

    const exploreBtn = document.getElementById('explore-btn');
    exploreBtn.addEventListener('click', () => {
      window.location.href = 'home.html';
    });
  }

  if (user && profileIcon) {
    profileIcon.innerHTML = `<img src="${user.photoURL}" alt="Profile" style="width: 30px; height: 30px; border-radius: 50%;" />`;
  }
});

// Go to profile
window.goToProfile = () => {
  if (auth.currentUser) {
    window.location.href = 'profile.html';
  } else {
    alert("Please login first to view your profile.");
  }
};
