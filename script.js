// TEM'S & CO. storefront
// Products are intentionally NOT demo data. Connect the real Base44 endpoint here.
const WHATSAPP_NUMBER = "2348074608682";
const PRODUCTS_API_URL = ""; // Add the published, read-only products endpoint when Base44 is ready.

const productGrid = document.getElementById("productGrid");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("productSearch");
const categoryFilter = document.getElementById("categoryFilter");
const loadMessage = document.getElementById("loadMessage");

let products = [];

document.getElementById("year").textContent = new Date().getFullYear();

const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");

menuToggle.addEventListener("click", () => {
  const isOpen = mainNav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
});

mainNav.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", () => {
    mainNav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  });
});

function formatPrice(value, currency = "NGN") {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(amount);
}

function makeWhatsAppLink(product) {
  const message = [
    "Hello TEM'S & CO.,",
    `I'm interested in ${product.name}.`,
    product.price != null ? `Price: ${formatPrice(product.price, product.currency || "NGN")}` : "",
    "Is this item still available?"
  ].filter(Boolean).join("\n");

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

function renderProducts() {
  const query = searchInput.value.trim().toLowerCase();
  const category = categoryFilter.value;

  const visibleProducts = products.filter(product => {
    const matchesSearch = `${product.name || ""} ${product.description || ""}`.toLowerCase().includes(query);
    const matchesCategory = category === "all" || product.category === category;
    return matchesSearch && matchesCategory && product.published !== false && product.status !== "sold";
  });

  productGrid.innerHTML = "";

  if (!visibleProducts.length) {
    productGrid.appendChild(emptyState);
    emptyState.hidden = false;
    emptyState.querySelector("h3").textContent = products.length
      ? "No matching pieces found."
      : "The collection is being prepared.";
    emptyState.querySelector("p").textContent = products.length
      ? "Try another search or category."
      : "New pieces will appear here soon. Please check back shortly.";
    return;
  }

  visibleProducts.forEach(product => {
    const card = document.createElement("article");
    card.className = "product-card";

    const image = document.createElement("img");
    image.src = product.imageUrl || product.image_url || "";
    image.alt = product.name || "Jewellery product";
    image.loading = "lazy";

    const info = document.createElement("div");
    info.className = "product-card-info";

    const name = document.createElement("h3");
    name.textContent = product.name || "Untitled product";

    const description = document.createElement("p");
    description.textContent = product.description || "";

    const price = document.createElement("p");
    price.className = "price";
    price.textContent = product.price != null
      ? formatPrice(product.price, product.currency || "NGN")
      : "";

    const enquiry = document.createElement("a");
    enquiry.href = makeWhatsAppLink(product);
    enquiry.target = "_blank";
    enquiry.rel = "noopener";
    enquiry.textContent = "Enquire on WhatsApp";
    enquiry.setAttribute("aria-label", `Enquire about ${product.name || "this product"} on WhatsApp`);

    const button = document.createElement("button");
    button.type = "button";
    button.addEventListener("click", () => window.open(enquiry.href, "_blank", "noopener"));

    // Build card using textContent to avoid injecting untrusted product HTML.
    button.textContent = "Enquire on WhatsApp";
    info.append(name, description, price, button);
    card.append(image, info);
    productGrid.appendChild(card);
  });
}

function populateCategories() {
  const categories = [...new Set(products.map(item => item.category).filter(Boolean))].sort();
  categoryFilter.innerHTML = '<option value="all">All categories</option>';
  categories.forEach(category => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categoryFilter.appendChild(option);
  });
}

async function loadProducts() {
  if (!PRODUCTS_API_URL) {
    renderProducts();
    return;
  }

  loadMessage.textContent = "Loading collectionâ¦";
  try {
    const response = await fetch(PRODUCTS_API_URL, {
      method: "GET",
      headers: { "Accept": "application/json" }
    });
    if (!response.ok) throw new Error(`Product request failed (${response.status})`);

    const data = await response.json();
    products = Array.isArray(data) ? data : (data.products || []);
    populateCategories();
    renderProducts();
    loadMessage.textContent = "";
  } catch (error) {
    console.error("Unable to load TEM'S & CO. products:", error);
    loadMessage.textContent = "We couldn't load the collection right now. Please try again later.";
  }
}

searchInput.addEventListener("input", renderProducts);
categoryFilter.addEventListener("change", renderProducts);

loadProducts();
