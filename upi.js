import CONFIG from "./config.js";

// Use QRCode from window (since loaded via <script> in HTML)
const QRCodeLib = window.QRCode;

// 1. Load order → Prefer "selectedProduct"
let selectedProduct = JSON.parse(localStorage.getItem("selectedProduct"));
let latestOrder = JSON.parse(localStorage.getItem("latestOrder"));

if (selectedProduct) {
  latestOrder = {
    product: selectedProduct,
    quantity: 1,
    total: selectedProduct.price,
    userInfo: {
      name: "Test User",
      phone: "9876543210",
      fullAddress: "Test Colony, India"
    }
  };
  localStorage.setItem("latestOrder", JSON.stringify(latestOrder));
} else if (!latestOrder) {
  // No product saved at all → fallback
  latestOrder = {
    product: { name: "Fallback Product" },
    quantity: 1,
    total: 199,
    userInfo: {
      name: "Test User",
      phone: "9876543210",
      fullAddress: "Fallback Colony, India"
    }
  };
}

// 2. Real UPI ID
const upiId = "6000015907@ybi";

// 3. Show order info
document.getElementById("upiOrderInfo").innerHTML = `
  <h3>${latestOrder.product.name}</h3>
  <p>Quantity: ${latestOrder.quantity}</p>
  <p>Total: ₹${latestOrder.total}</p>
`;

document.getElementById("upiId").textContent = upiId;

// 4. Generate UPI QR
const upiString = `upi://pay?pa=${upiId}&pn=Wenky%20Edge&am=${latestOrder.total}&cu=INR`;
QRCode.toCanvas(document.getElementById("upiQR"), upiString, { width: 200 }, (err) => {
  if (err) console.error("QR generation failed:", err);
});

// 5. Screenshot upload
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

// 6. Helper → send WhatsApp message
function sendWhatsAppMessage(msg) {
  if (CONFIG.mode === "test") {
    console.log("✅ WhatsApp message would be sent to:", CONFIG.whatsapp.number);
    console.log("Message:", msg);
    alert("🧪 Test mode: WhatsApp message simulated!");
  } else {
    const url = `https://wa.me/${CONFIG.whatsapp.number}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  }
}

// 7. Helper → send order to Shiprocket
async function sendToShiprocket(order) {
  if (CONFIG.mode === "test") {
    console.log("🧪 Simulating Shiprocket order API with data:", order);
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
        billing_address: order.userInfo.fullAddress,
        billing_city: "Unknown City",
        billing_pincode: "000000",
        billing_state: "Unknown State",
        billing_country: "India",
        billing_email: "customer@example.com",
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

// 8. On click "I have paid"
document.getElementById("markPaid").addEventListener("click", async () => {
  if (!screenshotBase64) {
    alert("⚠️ Please upload your payment screenshot.");
    return;
  }

  const msg = `*New Order Paid!*\n\nProduct: ${latestOrder.product.name}\nQty: ${latestOrder.quantity}\nTotal: ₹${latestOrder.total}\nCustomer: ${latestOrder.userInfo.name}\nPhone: ${latestOrder.userInfo.phone}\nAddress: ${latestOrder.userInfo.fullAddress}\n\nScreenshot attached (manual check needed).`;

  sendWhatsAppMessage(msg);
  await sendToShiprocket(latestOrder);

  alert("✅ Payment submitted! We will confirm your order soon.");
  window.location.href = "order.html";
});