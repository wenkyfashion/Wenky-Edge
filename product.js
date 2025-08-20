let allProducts = [];
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { getFirestore, doc, setDoc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

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
  const container = document.getElementById("productDetails");
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  fetch("products.json?v=" + new Date().getTime())
    .then(res => res.json())
    .then(data => {
      allProducts = data;
      const product = allProducts.find(p => p.id === id);

      if (!product) {
        container.innerHTML = "<p>Product not found 😢</p>";
        return;
      }

      // build gallery
      const imagesHTML = product.images.map(img => 
        `<div class="slide"><img src="${img}" alt="${product.name}"></div>`
      ).join("");

      container.innerHTML = `
        <div class="product-box">
          <div class="gallery">
            <div class="slides">${imagesHTML}</div>
            <button class="prev">❮</button>
            <button class="next">❯</button>
          </div>
          <h2>${product.name}</h2>
          <p><strong>Price:</strong> ₹${product.price}</p>
          <p style="margin: 1rem 0; font-size: 1.1rem;">${product.description}</p>
          <button onclick="addToCart('${product.id}')">Add to Cart</button>
          <button onclick="buyNow('${product.id}')">Buy Now</button>
        </div>
      `;

      initGallery();
    });
});

// simple gallery
function initGallery() {
  const slides = document.querySelector(".slides");
  const slideElements = document.querySelectorAll(".slide");
  let index = 0;

  function showSlide(i) {
    index = (i + slideElements.length) % slideElements.length;
    slides.style.transform = `translateX(-${index * 100}%)`;
  }

  document.querySelector(".prev").addEventListener("click", () => showSlide(index - 1));
  document.querySelector(".next").addEventListener("click", () => showSlide(index + 1));

  // swipe touch
  let startX = 0;
  slides.addEventListener("touchstart", e => startX = e.touches[0].clientX);
  slides.addEventListener("touchend", e => {
    let diff = e.changedTouches[0].clientX - startX;
    if (diff > 50) showSlide(index - 1);
    else if (diff < -50) showSlide(index + 1);
  });
}

// Expose functions
window.addToCart = async function(id) {
  const product = allProducts.find(p => p.id === id.toString());
  if (product) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    cart.push(product);
    localStorage.setItem("cart", JSON.stringify(cart));
    alert(`${product.name} added to cart!`);

    onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, "cart", user.email);
        await updateDoc(userDocRef, { items: arrayUnion(product) })
        .catch(async () => {
          await setDoc(userDocRef, { items: [product] });
        });
      }
    });
  }
};

window.buyNow = function(id) {
  const product = allProducts.find(p => p.id === id.toString());
  if (!product) return;

  localStorage.setItem("selectedProduct", JSON.stringify(product));
  window.location.href = "delivery.html";
};