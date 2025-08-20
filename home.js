let allProducts = [];
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { getFirestore, doc, setDoc, updateDoc, getDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDwgvrtQEI_lMKVExy0sx7cJV0uE8HikTc",
  authDomain: "wenky-fashion.firebaseapp.com",
  projectId: "wenky-fashion",
  storageBucket: "wenky-fashion.firebasestorage.app",
  messagingSenderId: "278566676880",
  appId: "1:278566676880:web:e24e379fcacd332a6eab15"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


document.addEventListener("DOMContentLoaded", () => {
    fetch("products.json?v=" + new Date().getTime())
    .then(res => res.json())
    .then(data => {
      allProducts = data;
      showItems(allProducts);
    });
});

function showItems(products) {
  const container = document.getElementById("itemsList");
  container.innerHTML = "";

  products.forEach(product => {
    const a = document.createElement("a");
    a.href = `product.html?id=${product.id}`;
    a.style.textDecoration = "none";
    a.style.color = "inherit";

    const div = document.createElement("div");
    div.className = "item-box";
    div.innerHTML = `
      <img width="100%" height="auto" src="${product.images[0]}" alt="${product.name}" class="item-img" />
      <h3>${product.name}</h3>
      <p>₹${product.price}</p>
    `;

    const btn = document.createElement("button");
    btn.textContent = "Add to Cart";
    btn.onclick = (e) => {
      e.preventDefault();
      addToCart(product.id);
    };

    div.appendChild(btn);
    a.appendChild(div);
    container.appendChild(a);
  });
}

function filterItems() {
  const input = document.getElementById("searchInput").value.toLowerCase();
  const filtered = allProducts.filter(item =>
    item.name.toLowerCase().includes(input)
  );
  showItems(filtered);
}

function addToCart(id) {
  const product = allProducts.find(p => p.id === id.toString());
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  cart.push(product);
  localStorage.setItem("cart", JSON.stringify(cart));
  alert(`${product.name} added to cart!`);

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const userDocRef = doc(db, "cart", user.email);
      await updateDoc(userDocRef, {
        items: arrayUnion(product)
      }).catch(async () => {
        await setDoc(userDocRef, {
          items: [product]
        });
      });
    }
  });
}

window.filterItems = filterItems;