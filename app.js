"use strict";

// ---------- GLOBAL STATE ----------
let allProducts = [];
let filteredProducts = [];
let cart = [];
let lastFetchTime = 0;

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

// ---------- CONSTANTS / DOM ----------
const SHEET_URL =
  "https://script.google.com/macros/s/AKfycbySmByFBnRaaXNTYxIER6Ek69YXdCj7m95eAA2ZJF7kDxJYP2A6vKVo5uRPleLoVSg/exec";
const REFRESH_INTERVAL = 10000; // Refresh every 10 seconds

const productsGrid = document.getElementById("products-grid");
const typeFiltersContainer = document.getElementById("type-filters");
const sizeFilter = document.getElementById("size-filter");
const backToTop = document.getElementById("back-to-top");
const cartButton = document.getElementById("cart-button");
const cartDrawer = document.getElementById("cart-drawer");
const cartItemsList = document.getElementById("cart-items");
const cartCountSpan = document.getElementById("cart-count");
const closeCartBtn = document.getElementById("close-cart");
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightbox-img");
const checkoutForm = document.getElementById("checkout-form");
const orderField = document.getElementById("order-field");

// ---------- LOAD PRODUCTS FROM APPS SCRIPT ----------
async function loadProducts(silent = false) {
  try {
    if (!silent) {
      productsGrid.innerHTML = "<p style='text-align:center;padding:2rem;'>Carregando...</p>";
    }

    const res = await fetch(SHEET_URL + "?t=" + Date.now());
    const text = await res.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch (parseErr) {
      console.error("Erro ao interpretar JSON:", parseErr, text);
      if (!silent) {
        productsGrid.innerHTML =
          "<p style='text-align:center;padding:2rem;'>Erro ao ler produtos.</p>";
      }
      return;
    }

    allProducts = Array.isArray(data) ? data : [];
    filteredProducts = allProducts.slice();
    lastFetchTime = Date.now();

    if (!silent) {
      renderFilters();
    }
    renderProducts();

    console.log("Products loaded:", allProducts.length, "available:", allProducts.filter(p => p.available).length);
  } catch (error) {
    console.error("Erro ao carregar via Apps Script:", error);
    if (!silent) {
      productsGrid.innerHTML =
        "<p style='text-align:center;padding:2rem;'>Erro ao carregar produtos. Verifique sua conexão.</p>";
    }
  }
}

// ---------- MARK PRODUCTS AS UNAVAILABLE ----------
async function markProductsUnavailable(productNames) {
  try {
    console.log("Sending POST request to:", SHEET_URL);
    console.log("Products to mark unavailable:", productNames);
    
    const response = await fetch(SHEET_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain", // Changed from application/json
      },
      body: JSON.stringify({
        products: productNames
      }),
      mode: "no-cors" // Add this to bypass CORS
    });

    console.log("Response received:", response);
    
    // With no-cors mode, we can't read the response
    // But if we got here without error, it likely worked
    return true;
    
  } catch (error) {
    console.error("Error marking products unavailable:", error);
    return false;
  }
}

// ---------- AUTO-REFRESH ----------
function startAutoRefresh() {
  setInterval(() => {
    loadProducts(true); // silent refresh
  }, REFRESH_INTERVAL);
}

// ---------- FILTER BUTTONS ----------
function renderFilters() {
  if (!typeFiltersContainer) return;

  typeFiltersContainer.innerHTML = "";

  // Botão "todos"
  const showAll = document.createElement("button");
  showAll.textContent = "todos";
  showAll.classList.add("filter-btn", "active");
  showAll.addEventListener("click", () => {
    document.querySelectorAll(".filter-btn").forEach((b) =>
      b.classList.remove("active")
    );
    showAll.classList.add("active");
    filteredProducts = allProducts.slice();
    renderProducts();
  });
  typeFiltersContainer.appendChild(showAll);

  // Demais categorias
  typeList.forEach((type) => {
    const btn = document.createElement("button");
    btn.classList.add("filter-btn");
    btn.dataset.type = type;
    btn.textContent = type;

    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter-btn").forEach((b) =>
        b.classList.remove("active")
      );
      btn.classList.add("active");

      filteredProducts = allProducts.filter((p) =>
        Array.isArray(p.tags) ? p.tags.includes(type) : false
      );
      applySizeFilter(); // respeita o filtro de tamanho já escolhido
    });

    typeFiltersContainer.appendChild(btn);
  });
}

// ---------- RENDER PRODUCT GRID ----------
function renderProducts() {
  if (!productsGrid) return;

  productsGrid.innerHTML = "";

  if (!filteredProducts || filteredProducts.length === 0) {
    productsGrid.innerHTML =
      "<p style='text-align: center; padding: 2rem;'>Nenhum produto encontrado.</p>";
    return;
  }

  filteredProducts.forEach((product) => {
    const card = createProductCard(product);
    productsGrid.appendChild(card);
  });
}

// ---------- CREATE SINGLE PRODUCT CARD ----------
function createProductCard(product) {
  const card = document.createElement("div");
  card.classList.add("product");

  const images = Array.isArray(product.photos) ? product.photos : [];
  const hasMultipleImages = images.length > 1;

  const firstImage = images[0] || "images/placeholder.jpg";

  card.innerHTML = `
    <div class="carousel">
      <img src="${firstImage}"
           class="carousel-img"
           alt="${product.name || ""}">
      ${
        hasMultipleImages
          ? `
        <button class="arrow left" aria-label="Foto anterior">‹</button>
        <button class="arrow right" aria-label="Próxima foto">›</button>
      `
          : ""
      }
    </div>
    <div class="info">
      <h3>${product.name || ""}</h3>
      <p class="size">${product.size || product.s || "tamanho único"}</p>
      ${product.available ? "" : "<span class='unavailable-tag'>Indisponível</span>"}
      ${
        product.description
          ? `<p class="description">${product.description}</p>`
          : ""
      }
      <button class="add-to-cart">Adicionar à sacola</button>
    </div>
  `;

  if (hasMultipleImages) {
    setupCarousel(card, images);
  }

  if (!product.available) {
    card.classList.add("unavailable");
    card.style.pointerEvents = "none";
  }

  // botão "Adicionar à sacola"
  const addBtn = card.querySelector(".add-to-cart");
  if (addBtn && product.available) {
    addBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      addToCart(product);
    });
  }

  // Lightbox ao clicar na imagem principal
  const mainImg = card.querySelector(".carousel-img");
  if (mainImg) {
    mainImg.addEventListener("click", () => {
      openLightbox(mainImg.src, product.name);
    });
  }

  return card;
}

// ---------- CART LOGIC ----------
function addToCart(product) {
  cart.push(product);
  updateCartCount();
  renderCart();
  openCartDrawer();
}

function updateCartCount() {
  if (!cartCountSpan) return;
  cartCountSpan.textContent = cart.length;
}

function renderCart() {
  if (!cartItemsList || !orderField) return;

  cartItemsList.innerHTML = "";

  cart.forEach((item, index) => {
    const li = document.createElement("li");
    li.classList.add("cart-item");
    li.innerHTML = `
      <span>${index + 1}. ${item.name} (${item.size || item.s || "U"})</span>
      <button class="remove-item" data-index="${index}" aria-label="Remover item">×</button>
    `;
    cartItemsList.appendChild(li);
  });

  // Remover item
  cartItemsList.querySelectorAll(".remove-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.index);
      cart.splice(idx, 1);
      updateCartCount();
      renderCart();
    });
  });

  // Preenche campo escondido do formulário para o Google Forms
  orderField.value = cart
    .map(
      (item, index) =>
        `${index + 1}. ${item.name} - tamanho ${item.size || item.s || "U"}`
    )
    .join("\n");
}

function openCartDrawer() {
  if (!cartDrawer) return;
  cartDrawer.classList.remove("hidden");
  cartDrawer.classList.add("open");
}

function closeCartDrawer() {
  if (!cartDrawer) return;
  cartDrawer.classList.remove("open");
  cartDrawer.classList.add("hidden");
}

// ---------- CAROUSEL PER CARD ----------
function setupCarousel(card, images) {
  const img = card.querySelector(".carousel-img");
  const left = card.querySelector(".arrow.left");
  const right = card.querySelector(".arrow.right");
  if (!img || !left || !right) return;

  let index = 0;

  right.addEventListener("click", (e) => {
    e.stopPropagation();
    index = (index + 1) % images.length;
    img.src = images[index];
  });

  left.addEventListener("click", (e) => {
    e.stopPropagation();
    index = (index - 1 + images.length) % images.length;
    img.src = images[index];
  });
}

// ---------- LIGHTBOX ----------
function openLightbox(src, altText) {
  if (!lightbox || !lightboxImg) return;

  lightboxImg.src = src;
  lightboxImg.alt = altText || "";
  lightbox.classList.remove("hidden");
}

function closeLightbox() {
  if (!lightbox) return;
  lightbox.classList.add("hidden");
}

// ---------- SIZE FILTER ----------
function applySizeFilter() {
  if (!sizeFilter) {
    renderProducts();
    return;
  }

  const selectedSize = sizeFilter.value;
  const activeTypeBtn = document.querySelector(".filter-btn.active");
  const activeType = activeTypeBtn && activeTypeBtn.dataset.type;

  let baseList;

  if (activeType) {
    baseList = allProducts.filter((p) =>
      Array.isArray(p.tags) ? p.tags.includes(activeType) : false
    );
  } else {
    baseList = allProducts.slice();
  }

  if (!selectedSize) {
    filteredProducts = baseList;
  } else {
    filteredProducts = baseList.filter((p) =>
      Array.isArray(p.tags) ? p.tags.includes(selectedSize) : false
    );
  }

  renderProducts();
}

if (sizeFilter) {
  sizeFilter.addEventListener("change", applySizeFilter);
}

// ---------- BACK TO TOP ----------
if (backToTop) {
  window.addEventListener("scroll", () => {
    backToTop.style.display = window.scrollY > 200 ? "block" : "none";
  });

  backToTop.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });
}

// ---------- CART + LIGHTBOX EVENTS ----------
if (cartButton) {
  cartButton.addEventListener("click", openCartDrawer);
}

if (closeCartBtn) {
  closeCartBtn.addEventListener("click", closeCartDrawer);
}

if (lightbox) {
  lightbox.addEventListener("click", closeLightbox);
}

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeLightbox();
    closeCartDrawer();
  }
});

// ---------- CHECKOUT FORM ----------
if (checkoutForm) {
  checkoutForm.addEventListener("submit", async (e) => {
    e.preventDefault(); // Prevent default form submission
    
    // Get product names from cart
    const productNames = cart.map(item => item.name);
    
    console.log("Submitting order with products:", productNames);
    
    // Try to mark products as unavailable via API
    await markProductsUnavailable(productNames);
    
    // Submit the form to Google Forms
    const formData = new FormData(checkoutForm);
    
    try {
      await fetch(checkoutForm.action, {
        method: "POST",
        body: formData,
        mode: "no-cors"
      });
    } catch (err) {
      console.log("Form submitted (no-cors mode)");
    }
    
    alert("Pedido enviado! Vou ver e te respondo 💛");
    
    // Mark items as unavailable locally (optimistic update)
    productNames.forEach(name => {
      const product = allProducts.find(p => p.name === name);
      if (product) {
        product.available = false;
      }
    });
    
    // Clear cart and refresh
    cart = [];
    updateCartCount();
    renderCart();
    closeCartDrawer();
    
    // Re-render to show items as unavailable
    applySizeFilter();
    
    // Refresh from server after a delay
    setTimeout(() => {
      loadProducts(true);
    }, 2000);
  });
}

// ---------- INIT ----------
loadProducts();
startAutoRefresh();