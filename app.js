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
  filteredProducts = data;  // show everything first
  renderFilters();
  renderProducts();         // render immediately, no filters yet
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
      document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      filteredProducts = allProducts.filter(p => p.tags.includes(type));
      renderProducts();
    });

    container.appendChild(btn);
  });

  const showAll = document.createElement("button");
  showAll.textContent = "todos";
  showAll.classList.add("filter-btn");
  showAll.addEventListener("click", () => {
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    showAll.classList.add("active");
    filteredProducts = allProducts;
    renderProducts();
  });

  container.appendChild(showAll);
  showAll.classList.add("active");}


// RENDER PRODUCT GRID
function renderProducts() {
  const grid = document.getElementById("products-grid");
  grid.innerHTML = "";

  filteredProducts.forEach(product => {
    const card = createProductCard(product);
    grid.appendChild(card);
  });
}


// CREATE A PRODUCT CARD
function createProductCard(product) {
  const card = document.createElement("div");
  card.classList.add("product-card");

  const images = product.photos;
  const hasMultipleImages = images && images.length > 1;

  card.innerHTML = `
    <div class="img-wrapper">
      <img src="${images[0]}" class="main-img" alt="${product.name}">
      
      ${hasMultipleImages ? `
        <button class="arrow left">‹</button>
        <button class="arrow right">›</button>
      ` : ""}
    </div>

    <div class="info">
      <h3>${product.name}</h3>
      <p class="price">R$ ${product.price ? product.price : "--"}</p>
      <p class="size">${product.size ? product.size : "tamanho único"}</p>
    </div>
  `;

  if (hasMultipleImages) {
    setupCarousel(card, images);
  }

  return card;
}


// CAROUSEL LOGIC PER CARD
function setupCarousel(card, images) {
  const img = card.querySelector(".main-img");
  const left = card.querySelector(".arrow.left");
  const right = card.querySelector(".arrow.right");

  let index = 0;

  right.addEventListener("click", () => {
    index = (index + 1) % images.length;
    img.src = images[index];
  });

  left.addEventListener("click", () => {
    index = (index - 1 + images.length) % images.length;
    img.src = images[index];
  });
}
