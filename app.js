// LOAD PRODUCTS FROM JSON
async function loadProducts() {
  const response = await fetch("products.json");
  const products = await response.json();
  const grid = document.getElementById("product-grid");

  products.forEach(product => {
    const div = document.createElement("div");
    div.classList.add("product");

    // photo gallery
    let photosHTML = "";
    product.photos.forEach(photo => {
      photosHTML += `<img src="images/${photo}" alt="${product.name}">`;
    });

    div.innerHTML = `
      <div class="photo-stack">${photosHTML}</div>
      <h3>${product.name}</h3>
      <p class="desc">${product.description}</p>
      <p><strong>Tamanho:</strong> ${product.size}</p>
      <button class="add-to-cart" data-name="${product.name}">Adicionar à Sacola</button>
    `;

    grid.appendChild(div);
  });

  enableLightbox();
  enableCartButtons();
}

loadProducts();

// LIGHTBOX
function enableLightbox() {
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");

  document.querySelectorAll(".photo-stack img").forEach(img => {
    img.addEventListener("click", () => {

      // 🔒 SAFETY CHECK — only open if image actually exists
      if (!img.complete || img.naturalWidth === 0) return;

      lightboxImg.src = img.src;
      lightbox.classList.remove("hidden");
    });
  });

  lightbox.addEventListener("click", () => {
    lightbox.classList.add("hidden");
    lightboxImg.src = "";
  });
}

// CART LOGIC
let cart = JSON.parse(localStorage.getItem("cart")) || [];

const cartCount = document.getElementById("cart-count");
const cartItems = document.getElementById("cart-items");
const drawer = document.getElementById("cart-drawer");
const cartButton = document.getElementById("cart-button");
const closeCart = document.getElementById("close-cart");

function updateCartCount() {
  cartCount.textContent = cart.length;
}

function renderCart() {
  cartItems.innerHTML = "";
  cart.forEach(item => {
    const li = document.createElement("li");
