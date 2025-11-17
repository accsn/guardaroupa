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
async function loadProducts() {
  try {
    const res = await fetch("products.json");
    const data = await res.json();
    allProducts = data;
    filteredProducts = data;
    renderFilters();
    renderProducts();
  } catch (error) {
    console.error("Erro ao carregar produtos:", error);
    document.getElementById("products-grid").innerHTML =
      "<p>Erro ao carregar produtos. Verifique se o arquivo products.json está no mesmo diretório.</p>";
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

  // wire up "Adicionar à sacola"
  const addBtn = card.querySelector(".add-to-cart");
  addBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    addToCart(product);
  });

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
    li.textContent = `${index + 1}. ${item.name} (${item.size || "U"})`;
    list.appendChild(li);
  });

  // texto que vai pro Netlify
  orderField.value = cart
    .map((item, index) => `${index + 1}. ${item.name} - tamanho ${item.size || "U"}`)
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

// eventos do carrinho
document.getElementById("cart-button").addEventListener("click", openCartDrawer);
document.getElementById("close-cart").addEventListener("click", closeCartDrawer);

loadProducts();
