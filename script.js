// TEM'S & CO. STOREFRONT
// Connected to the live Base44 products API.

const WHATSAPP_NUMBER = "2348074608682";

const PRODUCTS_API_URL =
  "https://temscostudio.base44.app/api/public/listPublishedProducts";

const productGrid = document.getElementById("productGrid");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("productSearch");
const categoryFilter = document.getElementById("categoryFilter");
const loadMessage = document.getElementById("loadMessage");

let products = [];

// Current year
document.getElementById("year").textContent = new Date().getFullYear();

// Mobile navigation
const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");

menuToggle.addEventListener("click", () => {
  const isOpen = mainNav.classList.toggle("open");
  
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute(
    "aria-label",
    isOpen ? "Close navigation" : "Open navigation"
  );
});

mainNav.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", () => {
    mainNav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  });
});

// Format product prices
function formatPrice(value, currency = "NGN") {
  const amount = Number(value);
  
  if (!Number.isFinite(amount)) return "";
  
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: currency || "NGN",
      maximumFractionDigits: 0
    }).format(amount);
  } catch (error) {
    return `₦${amount.toLocaleString("en-NG")}`;
  }
}

// Create WhatsApp enquiry link
function makeWhatsAppLink(product) {
  const message = [
      "Hello TEM'S & CO.,",
      `I'm interested in ${product.name}.`,
      product.price != null ?
      `Price: ${formatPrice(product.price, product.currency || "NGN")}` :
      "",
      "Is this item still available?"
    ]
    .filter(Boolean)
    .join("\n");
  
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

// Get the main product image from Base44
function getProductImage(product) {
  return (
    product.primary_image ||
    (Array.isArray(product.images) ? product.images[0] : "") ||
    ""
  );
}

// Render products
function renderProducts() {
  const query = searchInput.value.trim().toLowerCase();
  const category = categoryFilter.value;
  
  // 1. Filter the products first
  let visibleProducts = products.filter(product => {
    const matchesSearch = (
      `${product.name || ""} ${product.description || ""}`
    ).toLowerCase().includes(query);
    
    const matchesCategory =
      category === "all" || product.category === category;
    
    const isPublished =
      product.publication_status == null ||
      product.publication_status === "Published";
    
    return matchesSearch && matchesCategory && isPublished;
  });
  
  // 2. Sort the filtered products so "Featured" items are at the top
  visibleProducts.sort((a, b) => {
    // Handle both boolean true and string "true"
    const aFeatured = a.featured === true || a.featured === "true" ? 1 : 0;
    const bFeatured = b.featured === true || b.featured === "true" ? 1 : 0;
    
    return bFeatured - aFeatured;
  });
  
  productGrid.innerHTML = "";
  
  if (!visibleProducts.length) {
    productGrid.appendChild(emptyState);
    emptyState.hidden = false;
    
    emptyState.querySelector("h3").textContent = products.length ?
      "No matching pieces found." :
      "The collection is being prepared.";
    
    emptyState.querySelector("p").textContent = products.length ?
      "Try another search or category." :
      "New pieces will appear here soon. Please check back shortly.";
    
    return;
  }
  
  visibleProducts.forEach(product => {
    const card = document.createElement("article");
    card.className = "product-card";
    
    // Product image
    const imageUrl = getProductImage(product);
    
    // Skip products without a public image
    if (!imageUrl) return;
    
    const image = document.createElement("img");
    image.src = imageUrl;
    image.alt = product.name || "TEM'S & CO. jewellery";
    image.loading = "lazy";
    
    image.onerror = () => {
      card.remove();
    };
    
    // Product information
    const info = document.createElement("div");
    info.className = "product-card-info";
    
    const name = document.createElement("h3");
    name.textContent = product.name || "Untitled product";
    
    const description = document.createElement("p");
    description.textContent = product.description || "";
    
    const price = document.createElement("p");
    price.className = "price";
    price.textContent = product.price != null ?
      formatPrice(product.price, product.currency || "NGN") :
      "";
    
    // Stock status
    const stock = document.createElement("p");
    stock.className = "stock-status";
    
    const isSoldOut = product.stock_status === "Sold Out";
    
    stock.textContent = isSoldOut ? "Sold Out" : "In Stock";
    
    if (isSoldOut) {
      stock.classList.add("sold-out");
    } else {
      stock.classList.add("in-stock");
    }
    
    // WhatsApp enquiry button
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = isSoldOut ?
      "Currently Sold Out" :
      "Enquire on WhatsApp";
    
    button.disabled = isSoldOut;
    
    if (!isSoldOut) {
      button.addEventListener("click", () => {
        window.open(
          makeWhatsAppLink(product),
          "_blank",
          "noopener,noreferrer"
        );
      });
    }
    
    info.append(name, description, price, stock, button);
    card.append(image, info);
    
    productGrid.appendChild(card);
  });
  
  // If every visible product was skipped because it had no image
  if (!productGrid.children.length) {
    productGrid.appendChild(emptyState);
    emptyState.hidden = false;
    
    emptyState.querySelector("h3").textContent =
      "Product photos coming soon.";
    
    emptyState.querySelector("p").textContent =
      "Please check back shortly for our latest collection.";
  }
}

// Populate category filter
function populateCategories() {
  const categories = [
    ...new Set(
      products
      .map(product => product.category)
      .filter(Boolean)
    )
  ].sort();
  
  categoryFilter.innerHTML =
    '<option value="all">All categories</option>';
  
  categories.forEach(category => {
    const option = document.createElement("option");
    
    option.value = category;
    option.textContent = category;
    
    categoryFilter.appendChild(option);
  });
}

// Load published products from Base44
async function loadProducts() {
  loadMessage.textContent = "Loading collection...";
  
  try {
    const response = await fetch(`${PRODUCTS_API_URL}?t=${Date.now()}`, {
      method: "GET",
      cache: "no-store",
      headers: {
        "Accept": "application/json"
      }
    });
    
    if (!response.ok) {
      throw new Error(
        `Product request failed (${response.status})`
      );
    }
    
    const data = await response.json();
    
    if (!data || !Array.isArray(data.products)) {
      throw new Error("Invalid product data received.");
    }
    
    products = data.products.filter(product =>
      product.publication_status == null ||
      product.publication_status === "Published"
    );
    
    populateCategories();
    renderProducts();
    
    loadMessage.textContent = "";
    
    console.log(
      `TEM'S & CO.: Loaded ${products.length} published products.`
    );
    
  } catch (error) {
    console.error(
      "Unable to load TEM'S & CO. products:",
      error
    );
    
    loadMessage.textContent =
      "We couldn't load the collection right now. Please try again later.";
  }
}

// Search and category events
searchInput.addEventListener("input", renderProducts);

categoryFilter.addEventListener("change", renderProducts);

// Start the storefront
loadProducts();