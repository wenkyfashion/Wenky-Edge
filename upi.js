import CONFIG from "./config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

// --- Firebase setup ---
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

let userEmail = ""; // logged-in email

onAuthStateChanged(auth, (user) => {
  if (user) {
    userEmail = user.email;
    console.log("✅ Logged-in email:", userEmail);
  } else {
    alert("⚠️ Please login to continue");
    window.location.href = "index.html";
  }
});

// --- Load latest order ---
let latestOrder = JSON.parse(localStorage.getItem("latestOrder"));
if (!latestOrder) {
  alert("⚠️ No order found. Please place an order first.");
  window.location.href = "home.html";
  throw new Error("No latestOrder in localStorage");
}

// --- UPI QR Setup ---
const upiId = "6000015907@ybi";
const upiOrderInfo = document.getElementById("upiOrderInfo");

upiOrderInfo.innerHTML = `
  <h3>${latestOrder.product.name}</h3>
  <p><b>Quantity:</b> ${latestOrder.quantity}</p>
  <p><b>Total:</b> ₹${latestOrder.total}</p>

  <div style="margin:10px 0; padding:10px; border:1px solid #ddd; border-radius:8px;">
    <h4>Customer Details</h4>
    <p><b>Name:</b> ${latestOrder.userInfo.name}</p>
    <p><b>Phone:</b> ${latestOrder.userInfo.phone}</p>
    <p><b>Email:</b> ${userEmail || "Not provided"}</p>
    <p><b>Address:</b> ${latestOrder.userInfo.fullAddress}</p>
  </div>

  <p style="margin-top:10px; font-weight:bold;">
    Pay here to confirm your order: ${upiId}
  </p>
  <div id="qr-wrapper" style="margin:15px 0; text-align:center;">
    <canvas id="upiQR"></canvas>
  </div>
`;

const upiString = `upi://pay?pa=${upiId}&pn=Wenky%20Edge&am=${latestOrder.total}&cu=INR`;
QRCode.toCanvas(document.getElementById("upiQR"), upiString, { width: 200 }, (err) => {
  if (err) console.error("❌ QR generation failed:", err);
});

// --- Screenshot Upload ---
const fileInput = document.getElementById("paymentScreenshot");
const previewImg = document.getElementById("preview");
let screenshotBase64 = "";

fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      screenshotBase64 = e.target.result;
      previewImg.src = screenshotBase64;
      previewImg.style.display = "block";
    };
    reader.readAsDataURL(file);
  }
});

// --- WhatsApp helper ---
function sendWhatsAppMessage(msg) {
  if (CONFIG.mode === "test") {
    console.log("🧪 WhatsApp test mode:", CONFIG.whatsapp.number);
    console.log("Message:", msg);
    alert("🧪 Test mode: WhatsApp message simulated!");
  } else {
    const url = `https://wa.me/${CONFIG.whatsapp.number}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  }
}

// --- Shiprocket helper ---
async function sendToShiprocket(order) {
  if (CONFIG.mode === "test") {
    console.log("🧪 Simulating Shiprocket order with:", order);
    return;
  }

  try {
    const loginRes = await fetch("https://apiv2.shiprocket.in/v1/external/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: CONFIG.shiprocket.email,
        password: CONFIG.shiprocket.password
      })
    });
    const loginData = await loginRes.json();
    if (!loginData.token) throw new Error("Shiprocket login failed");

    const token = loginData.token;

    await fetch("https://apiv2.shiprocket.in/v1/external/orders/create/adhoc", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        order_id: "ORDER_" + Date.now(),
        order_date: new Date().toISOString(),
        pickup_location: "Primary",
        billing_customer_name: order.userInfo.name,
        billing_address: order.userInfo.address,
        billing_city: order.userInfo.city,
        billing_pincode: order.userInfo.pin,
        billing_state: order.userInfo.state,
        billing_country: "India",
        billing_email: userEmail || "noemail@wenkyedge.com",
        billing_phone: order.userInfo.phone,
        order_items: [
          {
            name: order.product.name,
            sku: "SKU_" + Date.now(),
            units: order.quantity,
            selling_price: order.total
          }
        ],
        payment_method: "Prepaid",
        sub_total: order.total,
        length: 10,
        breadth: 10,
        height: 10,
        weight: 0.5
      })
    });
    console.log("✅ Order sent to Shiprocket successfully.");
  } catch (err) {
    console.error("❌ Shiprocket error:", err);
  }
}

// --- On "I have paid" ---
document.getElementById("markPaid").addEventListener("click", async () => {
  if (!screenshotBase64) {
    alert("⚠️ Please upload your payment screenshot.");
    return;
  }

  const msg = `*New Order Paid!*\n\n📦 Product: ${latestOrder.product.name}\n🔢 Qty: ${latestOrder.quantity}\n💰 Total: ₹${latestOrder.total}\n👤 Name: ${latestOrder.userInfo.name}\n📞 Phone: ${latestOrder.userInfo.phone}\n✉️ Email: ${userEmail}\n🏠 Address: ${latestOrder.userInfo.fullAddress}\n\n📷 Screenshot uploaded (manual check needed).`;

  sendWhatsAppMessage(msg);
  await sendToShiprocket(latestOrder);

  alert("✅ Payment submitted! We will confirm your order soon.");
  window.location.href = "order.html";
});
