let allProducts = [];
let filteredProducts = [];
let cart = [];

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
const SHEET_URL = "https://script.google.com/macros/s/AKfycbySmByFBnRaaXNTYxIER6Ek69YXdCj7m95eAA2ZJF7kDxJYP2A6vKVo5uRPleLoVSg/exec";

// LOAD PRODUCTS DIRECTLY FROM GOOGLE APPS SCRIPT (JSON, instant, no cache)
async function loadProducts() {
  try {
    const res = await fetch(SHEET_URL + "?t=" + Date.now());  
    // ?t=Date.now() prevents browser caching

    const text = await res.text();
    const data = JSON.parse(text);

    allProducts = data;
    filteredProducts = data;

    renderFilters();
    renderProducts();

  } catch (error) {
    console.error("Erro ao carregar via Apps Script:", error);
    document.getElementById("products-grid").innerHTML =
      "<p>Erro ao carregar produtos. Verifique sua conexão.</p>";
  }
}

// RENDER FILTER BUTTONS
function renderFilters() {
  const container = document.getElementById("type-filters");
  container.innerHTML = "";

  // Botão "todos"
  const showAll = document.createElement("button");
  showAll.textContent = "todos";
  showAll.classList.add("filter-btn", "active");
  showAll.addEventListener("click", () => {
    document.querySelectorAll(".filter-btn").forEach((b) =>
      b.classList.remove("active")
    );
    showAll.classList.add("active");
    filteredProducts = allProducts;
    renderProducts();
  });
  container.appendChild(showAll);

  // Botões de categorias
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
      filteredProducts = allProducts.filter((p) => p.tags.includes(type));
      renderProducts();
    });

    container.appendChild(btn);
  });
}

// RENDER PRODUCT GRID
function renderProducts() {
  const grid = document.getElementById("products-grid");
  grid.innerHTML = "";

  if (filteredProducts.length === 0) {
    grid.innerHTML =
      "<p style='text-align: center; padding: 2rem;'>Nenhum produto encontrado.</p>";
    return;
  }

  filteredProducts.forEach((product) => {
    const card = createProductCard(product);
    grid.appendChild(card);
  });
}

// CREATE A PRODUCT CARD
function createProductCard(product) {
  const card = document.createElement("div");
  card.classList.add("product");

  const images = product.photos || [];
  const hasMultipleImages = images.length > 1;

  card.innerHTML = `
    <div class="carousel">
      <img src="${images[0] || "images/placeholder.jpg"}"
           class="carousel-img"
           alt="${product.name}">
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
      <h3>${product.name}</h3>
      <p class="size">${product.size || "tamanho único"}</p>
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
  }

  // botão "Adicionar à sacola"
  const addBtn = card.querySelector(".add-to-cart");
  addBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    addToCart(product);
  });

  // >>> NEW: abrir lightbox ao clicar na foto
  const mainImg = card.querySelector(".carousel-img");
  mainImg.addEventListener("click", () => {
    openLightbox(mainImg.src, product.name);
  });

  if (!product.available) {
  card.style.pointerEvents = "none";
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
  const countSpan = document.getElementById("cart-count");
  countSpan.textContent = cart.length;
}

function renderCart() {
  const list = document.getElementById("cart-items");
  const orderField = document.getElementById("order-field");

  list.innerHTML = "";

  cart.forEach((item, index) => {
    const li = document.createElement("li");
    li.classList.add("cart-item");
    li.innerHTML = `
      <span>${index + 1}. ${item.name} (${item.size || "U"})</span>
      <button class="remove-item" data-index="${index}" aria-label="Remover item">×</button>
    `;
    list.appendChild(li);
  });

  // botão de remover: liga depois de montar a lista
  list.querySelectorAll(".remove-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.index);
      cart.splice(idx, 1);
      updateCartCount();
      renderCart(); // re-render cart and hidden field
    });
  });

  // texto que vai pro Netlify
  orderField.value = cart
    .map(
      (item, index) =>
        `${index + 1}. ${item.name} - tamanho ${item.size || "U"}`
    )
    .join("\n");
}

function openCartDrawer() {
  const drawer = document.getElementById("cart-drawer");
  drawer.classList.remove("hidden");
  drawer.classList.add("open");
}

function closeCartDrawer() {
  const drawer = document.getElementById("cart-drawer");
  drawer.classList.remove("open");
  drawer.classList.add("hidden");
}


// CAROUSEL LOGIC PER CARD
function setupCarousel(card, images) {
  const img = card.querySelector(".carousel-img");
  const left = card.querySelector(".arrow.left");
  const right = card.querySelector(".arrow.right");
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
  const lightbox = document.getElementById("lightbox");
  const img = document.getElementById("lightbox-img");

  img.src = src;
  img.alt = altText || "";
  lightbox.classList.remove("hidden");
}

function closeLightbox() {
  const lightbox = document.getElementById("lightbox");
  lightbox.classList.add("hidden");
}


// SIZE FILTER
document.getElementById("size-filter").addEventListener("change", (e) => {
  const selectedSize = e.target.value;
  const activeTypeBtn = document.querySelector(".filter-btn.active");
  const activeType = activeTypeBtn && activeTypeBtn.dataset.type;

  if (selectedSize === "") {
    // Sem filtro de tamanho
    if (activeType) {
      filteredProducts = allProducts.filter((p) => p.tags.includes(activeType));
    } else {
      filteredProducts = allProducts;
    }
  } else {
    // Com filtro de tamanho
    if (activeType) {
      filteredProducts = allProducts.filter(
        (p) => p.tags.includes(activeType) && p.tags.includes(selectedSize)
      );
    } else {
      filteredProducts = allProducts.filter((p) =>
        p.tags.includes(selectedSize)
      );
    }
  }

  renderProducts();
});

// ----- BACK TO TOP BUTTON -----
const backToTop = document.getElementById("back-to-top");

window.addEventListener("scroll", () => {
  if (window.scrollY > 200) {
    backToTop.style.display = "block";
  } else {
    backToTop.style.display = "none";
  }
});

backToTop.addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
});


// eventos do carrinho
document.getElementById("cart-button").addEventListener("click", openCartDrawer);
document.getElementById("close-cart").addEventListener("click", closeCartDrawer);

// fechar lightbox clicando no fundo
document.getElementById("lightbox").addEventListener("click", closeLightbox);

// opcional: fechar com ESC
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeLightbox();
  }
});

const checkoutForm = document.getElementById("checkout-form");

checkoutForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(checkoutForm);

  const response = await fetch("https://formspree.io/f/myzlrkbw", {
    method: "POST",
    body: formData,
    headers: { Accept: "application/json" }
  });

 if (response.ok) {
  const orderText = document.getElementById("order-field").value;

  // Update your Google Sheet availability via Apps Script
  fetch("https://script.google.com/macros/s/AKfycbySmByFBnRaaXNTYxIER6Ek69YXdCj7m95eAA2ZJF7kDxJYP2A6vKVo5uRPleLoVSg/exec?order=" 
        + encodeURIComponent(orderText))
    .then(() => {
      alert("Pedido enviado! Vou ver e te respondo 💛");
      cart = [];
      updateCartCount();
      renderCart();
      closeCartDrawer();
    })
    .catch(err => {
      console.error("Erro ao atualizar planilha:", err);
      alert("Seu pedido foi enviado, mas houve um erro ao atualizar a disponibilidade. Vou corrigir manualmente 💛");
    });
}

});

loadProducts();
