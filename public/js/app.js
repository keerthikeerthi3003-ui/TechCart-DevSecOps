const productDetails = {
  "Wireless Headphones": {
    icon: "🎧",
    description: "Comfortable wireless audio for work and everyday use.",
  },
  "Mechanical Keyboard": {
    icon: "⌨️",
    description: "Responsive mechanical keyboard built for productivity.",
  },
  "Wireless Mouse": {
    icon: "🖱️",
    description: "Lightweight wireless mouse with smooth precision control.",
  },
  "HD Webcam": {
    icon: "📷",
    description: "Clear HD video for meetings, classes and streaming.",
  },
  "USB-C Hub": {
    icon: "🔌",
    description: "Expand your laptop with practical USB and display ports.",
  },
  "Power Bank": {
    icon: "🔋",
    description: "Portable charging power for phones and accessories.",
  },
};

let products = [];
let cart = [];

async function loadProducts() {
  const response = await fetch("/api/products");
  products = await response.json();
  renderProducts();
}

function renderProducts() {
  const grid = document.getElementById("product-grid");

  grid.innerHTML = products
    .map((product) => {
      const details = productDetails[product.name];

      return `
        <article class="product-card">
          <div class="product-icon">${details.icon}</div>

          <h3>${product.name}</h3>

          <p>${details.description}</p>

          <div class="product-bottom">
            <span class="price">$${product.price.toFixed(2)}</span>

            <button
              class="add-btn"
              onclick="addToCart(${product.id})"
            >
              Add to Cart
            </button>
          </div>
        </article>
      `;
    })
    .join("");
}

function addToCart(productId) {
  const product = products.find((item) => item.id === productId);
  const existing = cart.find((item) => item.id === productId);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      ...product,
      quantity: 1,
    });
  }

  renderCart();
}

function changeQuantity(productId, amount) {
  const item = cart.find((product) => product.id === productId);

  if (!item) {
    return;
  }

  item.quantity += amount;

  if (item.quantity <= 0) {
    removeFromCart(productId);
    return;
  }

  renderCart();
}

function removeFromCart(productId) {
  cart = cart.filter((item) => item.id !== productId);
  renderCart();
}

function renderCart() {
  const cartItems = document.getElementById("cart-items");

  const itemCount = cart.reduce((total, item) => total + item.quantity, 0);

  const subtotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  document.getElementById("cart-count").textContent = itemCount;
  document.getElementById("subtotal").textContent = `$${subtotal.toFixed(2)}`;
  document.getElementById("total").textContent = `$${subtotal.toFixed(2)}`;

  if (cart.length === 0) {
    cartItems.innerHTML = `<p class="empty-cart">Your cart is empty.</p>`;
    return;
  }

  cartItems.innerHTML = cart
    .map(
      (item) => `
        <div class="cart-item">
          <div>
            <div class="cart-item-name">${item.name}</div>
            <div>$${item.price.toFixed(2)}</div>

            <div class="cart-item-controls">
              <button
                class="qty-btn"
                onclick="changeQuantity(${item.id}, -1)"
              >
                -
              </button>

              <span>${item.quantity}</span>

              <button
                class="qty-btn"
                onclick="changeQuantity(${item.id}, 1)"
              >
                +
              </button>

              <button
                class="remove-btn"
                onclick="removeFromCart(${item.id})"
              >
                Remove
              </button>
            </div>
          </div>

          <strong>
            $${(item.price * item.quantity).toFixed(2)}
          </strong>
        </div>
      `
    )
    .join("");
}

document
  .getElementById("checkout-btn")
  .addEventListener("click", () => {
    const message = document.getElementById("checkout-message");

    if (cart.length === 0) {
      message.textContent = "Add an item before checkout.";
      return;
    }

    message.textContent =
      "Demo checkout successful — thank you for using TechCart!";
  });

loadProducts();