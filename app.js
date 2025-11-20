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
  "sapato",
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
const toast = document.getElementById("toast");

/* ========== TOAST NOTIFICATION (MODAL) ========== */

#toast {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: var(--orange);
  color: var(--deep-brown);
  padding: 2rem 2.5rem;
  border-radius: 16px;
  border: 4px solid var(--brown);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  font-weight: bold;
  font-size: 1.3rem;
  z-index: 5000;
  text-align: center;
  max-width: 85%;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease, transform 0.3s ease;
}

#toast.show {
  opacity: 1;
  pointer-events: auto;
  transform: translate(-50%, -50%) scale(1.05);
}

#toast::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  z-index: -1;
}

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
    lastFetchTime = Date.now();

    if (!silent) {
      renderFilters();
      filteredProducts = allProducts.slice();
    } else {
      // On silent refresh, preserve the current filters
      reapplyCurrentFilters();
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
        "Content-Type": "text/plain",
      },
      body: JSON.stringify({
        products: productNames
      }),
      mode: "no-cors"
    });

    console.log("Response received:", response);
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
  if (!cartItemsList) return;

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

  // Update the hidden field
  updateOrderField();
}

function updateOrderField() {
  if (!orderField) return;
  
  const orderText = cart
    .map(
      (item, index) =>
        `${index + 1}. ${item.name} - tamanho ${item.size || item.s || "U"}`
    )
    .join("\n");
  
  orderField.value = orderText;
  
  console.log("Order field updated with:", orderText);
  console.log("Cart length:", cart.length);
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
    
    // Save cart data NOW before we do anything else
    const savedCart = cart.map(item => ({...item}));
    const productNames = savedCart.map(item => item.name);
    
    // Create the order text and set it ONCE
    const orderText = savedCart
      .map((item, index) => 
        `${index + 1}. ${item.name} - tamanho ${item.size || item.s || "U"}`
      )
      .join("\n");
    
    orderField.value = orderText;
    
    console.log("=== FORM SUBMISSION DEBUG ===");
    console.log("Saved cart items:", savedCart);
    console.log("Product names to mark unavailable:", productNames);
    console.log("Order field value:", orderField.value);
    
    // Verify all form fields have values
    const formData = new FormData(checkoutForm);
    console.log("=== ALL FORM DATA ===");
    for (let [key, value] of formData.entries()) {
      console.log(`${key}: ${value}`);
    }
    
    // Create a hidden iframe for form submission if it doesn't exist
    let iframe = document.querySelector('iframe[name="hidden_iframe"]');
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.name = 'hidden_iframe';
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
    }
    
    iframe.onload = function() {
      console.log("Form submission completed!");
      
      setTimeout(() => {
        // Show custom toast notification
        showToast("Pedido enviado! Vou ver e te respondo 💛", 4000);
        
        // Mark items as unavailable locally (optimistic update)
        productNames.forEach(name => {
          const product = allProducts.find(p => p.name === name);
          if (product) {
            product.available = false;
          }
        });
        
        // NOW we can safely clear the cart
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
      }, 500);
    };
    
    // Mark products as unavailable via API
    markProductsUnavailable(productNames);
    
    // Submit the form
    checkoutForm.target = 'hidden_iframe';
    checkoutForm.submit();
    
    console.log("Form submitted to iframe");
  });
}

// ---------- INIT ----------
loadProducts();
startAutoRefresh();