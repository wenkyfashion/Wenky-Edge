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

// ---------- Load selected product ----------
let selectedProduct = JSON.parse(localStorage.getItem("selectedProduct"));
if (!selectedProduct) {
  alert("No product selected!");
  window.location.href = "home.html";
}

const productInfoDiv = document.getElementById("productInfo");

// Show product images (gallery if multiple exist, fallback if single)
let imagesHTML = "";
if (Array.isArray(selectedProduct.images) && selectedProduct.images.length > 0) {
  imagesHTML = `
    <div class="product-gallery">
      <img id="mainImage" src="${selectedProduct.images[0]}" alt="${selectedProduct.name}" />
      <div class="thumbnail-container">
        ${selectedProduct.images.map((img, idx) => `
          <img class="thumbnail ${idx === 0 ? "active" : ""}" src="${img}" 
               onclick="document.getElementById('mainImage').src='${img}'; 
                        document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active')); 
                        this.classList.add('active');" />
        `).join("")}
      </div>
    </div>
  `;
} else {
  imagesHTML = `<img src="${selectedProduct.image}" width="100%" height="auto" alt="${selectedProduct.name}" />`;
}

productInfoDiv.innerHTML = `
  ${imagesHTML}
  <h3>${selectedProduct.name}</h3>
  <p>Price per item: ₹${selectedProduct.price}</p>
  <p>Total: ₹<span id="totalPrice"></span></p>
`;

const totalPriceEl = document.getElementById("totalPrice");
const quantityInput = document.getElementById("quantity");

function updateTotal() {
  const qty = parseInt(quantityInput.value) || 1;
  totalPriceEl.textContent = selectedProduct.price * qty;
}
quantityInput.addEventListener("input", updateTotal);
updateTotal();

// ---------- State & City (from external JSON) ----------
const stateSelect = document.getElementById("state");
const citySelect  = document.getElementById("city");

const allowedRegions = new Set([
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan",
  "Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Chandigarh","Delhi","Jammu and Kashmir","Ladakh","Puducherry",
  "Dadra and Nagar Haveli and Daman and Diu"
]);

let STATES_CITIES = {}; 

async function loadStatesCities() {
  try {
    const res = await fetch("states_cities.json?v=" + Date.now());
    STATES_CITIES = await res.json();

    const states = Object.keys(STATES_CITIES)
      .filter(s => allowedRegions.has(s))
      .sort((a,b) => a.localeCompare(b));

    for (const s of states) {
      const opt = document.createElement("option");
      opt.value = s;
      opt.textContent = s;
      stateSelect.appendChild(opt);
    }

    applySavedAddressToSelects();
  } catch (e) {
    console.error("Failed to load states_cities.json", e);
  }
}

stateSelect.addEventListener("change", () => {
  citySelect.innerHTML = '<option value="">Select City</option>';
  const st = stateSelect.value;
  if (!st || !STATES_CITIES[st]) return;

  const cities = [...STATES_CITIES[st]].sort((a,b) => a.localeCompare(b));
  for (const c of cities) {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    citySelect.appendChild(opt);
  }
});

loadStatesCities();

// ---------- Saved address (autofill) ----------
const saved = JSON.parse(localStorage.getItem("savedAddress"));

function applySavedAddressToInputs() {
  if (!saved) return;
  document.getElementById("name").value    = saved.name    || "";
  document.getElementById("phone").value   = saved.phone   || "";
  document.getElementById("address").value = saved.address || "";
  document.getElementById("pin").value     = saved.pin     || "";
  document.getElementById("town_village").value = saved.town_village || "";
}

function applySavedAddressToSelects() {
  if (!saved) return;
  if (saved.state && allowedRegions.has(saved.state)) {
    stateSelect.value = saved.state;
    stateSelect.dispatchEvent(new Event("change"));
    if (saved.city) {
      setTimeout(() => { citySelect.value = saved.city || ""; }, 100);
    }
  }
}
applySavedAddressToInputs();

// ---------- Save order to Firestore ----------
async function saveOrder(orderData) {
  localStorage.setItem("savedAddress", JSON.stringify(orderData.userInfo));
  localStorage.setItem("latestOrder", JSON.stringify(orderData));

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      alert("Please log in first.");
      window.location.href = "index.html";
      return;
    }

    try {
      const userDoc = doc(db, "orders", user.email);
      await updateDoc(userDoc, { items: arrayUnion(orderData) });
    } catch (err) {
      // if doc doesn't exist, create it
      await setDoc(doc(db, "orders", user.email), { items: [orderData] });
    }

    alert("✅ Order placed successfully! Redirecting to UPI payment…");
    window.location.href = "upi.html";
  });
}

// ---------- Place order ----------
window.confirmOrder = function confirmOrder() {
  const name    = document.getElementById("name").value.trim();
  const phone   = document.getElementById("phone").value.trim();
  const address = document.getElementById("address").value.trim();
  const state   = document.getElementById("state").value.trim();
  const city    = document.getElementById("city").value.trim();
  const town_village = document.getElementById("town_village").value.trim();
  const pin     = document.getElementById("pin").value.trim();
  const quantity = parseInt(quantityInput.value);

  const fullAddress = `${address}, ${town_village}, ${city}, ${state} - ${pin}`;
  
  if (!name || !phone || !address || !city || !state || !pin || quantity < 1) {
    alert("⚠️ Please fill all fields correctly.");
    return;
  }

  const orderData = {
    product: selectedProduct,
    quantity,
    total: selectedProduct.price * quantity,
    userInfo: { name, phone, address, town_village, city, state, pin, fullAddress },
    date: new Date().toLocaleString()
  };

  saveOrder(orderData);
};