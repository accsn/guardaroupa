let allProducts = [];
let filteredProducts = [];

const typeList = [
  "acessórios",
  "blusa",
  "calça",
  "camiseta",
  "casaco",
  "moletom",
  "saia",
  "shorts",
  "vestido"
];

// LOAD PRODUCTS
async function loadProducts() {
  const res = await fetch("products.json");
  const data = await res.json();
  allProducts = data;
  filteredProducts = data;
  renderFilters();
  renderProducts();
}

// RENDER FILTER BUTTONS
function renderFilters() {
  const container = document.getElementById("type-filters");
  container.innerHTML = "";

  typeList.forEach(type => {
    const btn = document.createElement("button");
    btn.classList.add("filter-btn");
    btn.dataset.type = type;
    btn.textContent = type;

    btn.addEventListener("click", () => {
      // toggle active class
      const active = btn.classList.contains("active");
      document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
      if (!active) btn.classList.add("active");

      applyFilters();
    });

    container.appendChild(btn);
  });

  document.getElementById("size-filter").addEventListener("change", applyFilters);
}

// APPLY FILTER LOGIC
function applyFilters() {
  const activeTypeBtn = document.querySelector(".filter-btn.active");
  const selectedType = activeTypeBtn ? activeTypeBtn.dataset.type : "";
  const selectedSize = document.getElementById("size-filter").value;

  filteredProducts = allProducts.filter(p => {
    const matchesType = selectedType ? p.tags.includes(selectedType) : true;
    const matchesSize = selectedSize ? p.tags.includes(selectedSize) : true;
    return matchesType && matchesSize;
  });

  renderProducts();
}

// RENDER PRODUCTS
function renderProducts() {
  const grid = document.getElementById("product-grid");
  grid.innerHTML = "";

  filteredProducts.forEach(product => {
    const div = document.createElement("div");
    div.classList.add("product");

    if (!product.available) div.classList.add("unavailable");

    // PHOTOS
    let photosHTML = "";
    product.photos.forEach(photo => {
      photosHTML += `<img src="images/${photo}" alt="${product.name}">`;
    });

    div.innerHTML = `
      <div class="photo-stack">${photosHTML}</div>
      <h3>${product.name}</h3>
      <p>${product.description}</p>
      <p><strong>Tamanho:</strong> ${product.size}</p>

      ${product.available 
        ? `<button class="add-to-cart" data-name="${product.name}">Adicionar à Sacola</button>`
        : `<span class="unavailable-tag">Indisponível</span>`}
    `;

    grid.appendChild(div);
  });

  enableLightbox();
  enableCartButtons();
}

// LIGHTBOX
function enableLightbox() {
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");

  document.querySelectorAll(".photo-stack img").forEach(img => {
    img.addEventListener("click", () => {
      if (!img.complete || img.naturalWidth === 0) return;
      lightboxImg.src = img.src;
      lightbox.classList.remove("hidden");
    });
  });

  lightbox.addEventListener("click", () => {
    lightbox.classList.add("hidden");
  });
}

// CART LOGIC
let cart = JSON.parse(localStorage.getItem("cart")) || [];

function enableCartButtons() {
  document.querySelectorAll(".add-to-cart").forEach(btn => {
    btn.addEventListener("click", e => {
      const item = e.target.dataset.name;
      cart.push(item);
      localStorage.setItem("cart", JSON.stringify(cart));
      updateCartCount();
    });
  });
}

const cartCount = document.getElementById("cart-count");
function updateCartCount() {
  cartCount.textContent = cart.length;
}

const drawer = document.getElementById("cart-drawer");
document.getElementById("cart-button").addEventListener("click", () => {
  renderCart();
  drawer.classList.remove("hidden");
  drawer.classList.add("open");
});

document.getElementById("close-cart").addEventListener("click", () => {
  drawer.classList.remove("open");
  drawer.classList.add("hidden");
});

function renderCart() {
  const list = document.getElementById("cart-items");
  list.innerHTML = "";
  cart.forEach(item => {
    const li = document.createElement("li");
    li.textContent = item;
    list.appendChild(li);
  });
}

// FORM
document.getElementById("checkout-form").addEventListener("submit", () => {
  document.getElementById("order-field").value = cart.join(", ");
});

loadProducts();
