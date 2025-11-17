/* ---------------------------------------
    GLOBAL DATA
--------------------------------------- */

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

/* ---------------------------------------
    LOAD PRODUCTS
--------------------------------------- */

async function loadProducts() {
  const res = await fetch("products.json");
  const data = await res.json();

  allProducts = data;
  filteredProducts = data;

  renderFilters();
  renderProducts();
}

loadProducts();

/* ---------------------------------------
    FILTERS
--------------------------------------- */

function renderFilters() {
  const container = document.getElementById("type-filters");
  container.innerHTML = "";

  typeList.forEach(type => {
    const btn = document.createElement("button");
    btn.classList.add("filter-btn");
    btn.dataset.type = type;
    btn.textContent = type;

    btn.addEventListener("click", () => {
      const active = btn.classList.contains("active");

      document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
      if (!active) btn.classList.add("active");

      applyFilters();
    });

    container.appendChild(btn);
  });

  document.getElementById("size-filter").addEventListener("change", applyFilters);
}

function applyFilters() {
  const activeTypeBtn = document.querySelector(".filter-btn.active");
  const selectedType = activeTypeBtn ? activeTypeBtn.dataset.type : "";
  const selectedSize = document.getElementById("size-filter").value;

  filteredProducts = allProducts.filter(p => {
    const matchType = selectedType ? p.tags.includes(selectedType) : true;
    const matchSize = selectedSize ? p.tags.includes(selectedSize) : true;
    return matchType && matchSize;
  });

  renderProducts();
}

/* ---------------------------------------
    RENDER PRODUCTS
--------------------------------------- */

function renderProducts() {
  const grid = document.getElementById("product-grid");
  grid.innerHTML = "";

  filteredProducts.forEach(product => {
    const div = document.createElement("div");
    div.classList.add("product");

    if (!product.available) {
      div.classList.add("unavailable");
    }

    const photosHTML = `
      <div class="carousel">
        <button class="carousel-btn left">←</button>
        <img class="carousel-img"
             src="images/${product.photos[0]}"
             data-index="0"
             alt="${product.name}">
        <button class="carousel-btn right">→</button>
      </div>
    `;

    div.innerHTML = `
      ${photosHTML}
      <h3>${product.name}</h3>
      <p>${product.description}</p>
      <p><strong>Tamanho:</strong> ${product.size}</p>

      ${
        product.available
          ? `<button class="add-to-cart" data-name="${product.name}">Adicionar à Sacola</button>`
          : `<span class="unavailable-tag">Indisponível</span>`
      }
    `;

    grid.appendChild(div);
  });

  enableCarousels(filteredProducts);
  enableLightbox();
  enableCartButtons();
}

/* ---------------------------------------
    CAROUSEL
--------------------------------------- */

function enableCarousels(products) {
  const carousels = document.querySelectorAll(".carousel");
  
  carousels.forEach((carousel, idx) => {
    const img = carousel.querySelector(".carousel-img");
    const left = carousel.querySelector(".left");
    const right = carousel.querySelector(".right");

    const photos = products[idx].photos;

    left.addEventListener("click", () => {
      let current = parseInt(img.dataset.index);
      current = (current - 1 + photos.length) % photos.length;
      img.dataset.index = current;
      img.src = "images/" + photos[current];
    });

    right.addEventListener("click", () => {
      let current = parseInt(img.dataset.index);
      current = (current + 1) % photos.length;
      img.dataset.index = current;
      img.src = "images/" + photos[current];
    });
  });
}

/* ---------------------------------------
    LIGHTBOX
--------------------------------------- */

function enableLightbox() {
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");

  document.querySelectorAll(".carousel-img").forEach(img => {
    img.addEventListener("click", () => {
      lightboxImg.src = img.src;
      lightbox.classList.remove("hidden");
    });
  });

  lightbox.addEventListener("click", () => {
    lightbox.classList.add("hidden");
  });
}

/* ---------------------------------------
    CART
--------------------------------------- */

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

/* ---------------------------------------
    CHECKOUT FORM
--------------------------------------- */

document.getElementById("checkout-form").addEventListener("submit", () => {
  document.getElementById("order-field").value = cart.join(", ");
});
