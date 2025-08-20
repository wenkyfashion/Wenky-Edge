document.addEventListener("DOMContentLoaded", () => {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const container = document.getElementById("cartItems");

  if (cart.length === 0) {
    container.innerHTML = "<p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Your cart is empty 😢</p>";
    
    const totalAmountSpan = document.getElementById("totalAmount");
    if (totalAmountSpan) totalAmountSpan.textContent = "0";
    return;
  }

  displayCartItems(cart);
  calculateTotal(cart);

  function displayCartItems(cartItems) {
    container.innerHTML = "";

    cartItems.forEach((item, index) => {
      const wrapper = document.createElement("div");
      wrapper.className = "item-box";

      // Make wrapper clickable
      wrapper.onclick = () => {
        window.location.href = `product.html?id=${item.id}`;
      };

      // ✅ Fix: Always show first image (like home.html)
      const firstImage = item.images && item.images.length > 0 ? item.images[0] : "placeholder.jpg";

      wrapper.innerHTML = `
        <img src="${firstImage}" alt="${item.name}" class="item-img" />
        <h3>${item.name}</h3>
        <p>₹${item.price}</p>
      `;

      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Delete";
      deleteBtn.onclick = (event) => {
        event.stopPropagation(); 
        removeFromCart(index);
      };

      wrapper.appendChild(deleteBtn);
      container.appendChild(wrapper);
    });
  }

  window.removeFromCart = function(index) {
    const updatedCart = JSON.parse(localStorage.getItem("cart")) || [];
    updatedCart.splice(index, 1);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    location.reload();
  };

  function calculateTotal(cartItems) {
    let total = 0;
    cartItems.forEach(item => {
      total += parseFloat(item.price);
    });
    const totalAmountSpan = document.getElementById("totalAmount");
    if (totalAmountSpan) {
      totalAmountSpan.textContent = total;
    }
  }
});