const SUPABASE_URL = "https://rvygarzpdacnhxwxsgxo.supabase.co";
const SUPABASE_KEY = "sb_publishable_KF9seUu_5VZWQVhhR27dYw_kyB_ewVY";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const WHATSAPP_NUMBER = "916367561630";
const UPI_ID = "6367561630@fam";

let products = [];
let cart = {};

const $ = id => document.getElementById(id);

$("year").textContent = new Date().getFullYear();

function normalizeProduct(p) {
  return {
    id: Number(p.id),
    name: p.name || "",
    price: Number(p.price || 0),
    category: p.category || "herbal",
    weight: p.weight || "",
    desc: p.description || p.desc || "",
    emoji: p.emoji || "🌿",
    stock: Number(p.stock || 0),
    image_url: p.image_url || "",
    images: p.images || "",
    video_url: p.video_url || ""
  };
}

// Load real products from Supabase
async function loadProducts() {
  const { data, error } = await supabaseClient
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Product loading error:", error.message);
    $("productGrid").innerHTML =
      "<p>उत्पाद लोड नहीं हुए। कृपया कुछ देर बाद कोशिश करें।</p>";
    return;
  }

  products = (data || []).map(normalizeProduct);
  renderProducts();
  renderCart();
}

function renderProducts() {
  const q = $("searchInput").value.trim().toLowerCase();
  const cat = $("categoryFilter").value;

  let list = products.filter(p =>
    (cat === "all" || p.category === cat) &&
    (p.name.toLowerCase().includes(q) ||
     p.desc.toLowerCase().includes(q))
  );

  if ($("sortFilter").value === "low")
    list.sort((a, b) => a.price - b.price);

  if ($("sortFilter").value === "high")
    list.sort((a, b) => b.price - a.price);

  $("productGrid").innerHTML = list.map(p => `
    <article class="product-card" onclick="showProduct(${p.id})">
      <div class="product-art">
  ${p.image_url
    ? `<img src="${escapeHTML(p.image_url)}" alt="${escapeHTML(p.name)}" style="width:100%;height:100%;object-fit:contain;">`
    : p.emoji}
</div>
      <div class="product-info">
        <span class="product-tag">${escapeHTML(p.weight)}</span>
        <h3>${escapeHTML(p.name)}</h3>
        <p>${escapeHTML(p.desc)}</p>
        <div class="product-buy">
          <strong>₹${p.price}</strong>
          <button class="add-btn" data-add="${p.id}">
            कार्ट में जोड़ें +
          </button>
        </div>
      </div>
    </article>
  `).join("") || "<p>कोई उत्पाद नहीं मिला।</p>";
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, ch => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[ch]);
}

function cartItems() {
  return Object.entries(cart)
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => ({
      product: products.find(p => p.id === Number(id)),
      qty
    }))
    .filter(x => x.product);
}

function renderCart() {
  const items = cartItems();

  $("cartCount").textContent =
    items.reduce((n, x) => n + x.qty, 0);

  $("cartItems").innerHTML = items.length
    ? items.map(({ product: p, qty }) => `
        <div class="cart-item">
          <div>
            <strong>${escapeHTML(p.name)}</strong>
            <p>₹${p.price} × ${qty}</p>
          </div>
          <div class="qty">
            <button data-dec="${p.id}">−</button>
            <span>${qty}</span>
            <button data-inc="${p.id}">+</button>
          </div>
        </div>
      `).join("")
    : '<p class="empty-cart">आपका कार्ट अभी खाली है।</p>';

  $("cartTotal").textContent = "₹" +
    items.reduce((n, x) => n + x.product.price * x.qty, 0);
}

function openCart() {
  history.pushState({ page: "cart" }, "", "?page=cart");
  renderCartPage();
}

function closeCart() {
  const page = document.getElementById("cartFullPage");
  if (page) page.remove();

  const url = new URL(window.location.href);
  url.searchParams.delete("page");
  history.replaceState({}, "", url);
}

function renderCartPage() {
  let page = document.getElementById("cartFullPage");

  if (!page) {
    page = document.createElement("main");
    page.id = "cartFullPage";
    document.body.appendChild(page);
  }

  page.style.cssText = `
    position:fixed;
    inset:0;
    z-index:100001;
    overflow-y:auto;
    background:#f7faf6;
    padding:20px;
    box-sizing:border-box;
    font-family:inherit;
    color:#173d2e;
  `;

  const items = cartItems();

  page.innerHTML = `
    <button id="cartBack"
      style="padding:12px 18px;border:0;border-radius:12px;
      background:#e8f1e6;font-size:17px">
      ← वापस दुकान पर
    </button>

    <h1 style="margin-top:25px">🛒 आपका कार्ट</h1>

    <div id="cartPageItems"></div>

    <div style="background:white;padding:20px;
      border-radius:16px;margin-top:20px">
      <h2>कुल: ₹${items.reduce((sum, item) =>
        sum + item.price * item.qty, 0)}</h2>
      <button id="cartCheckout"
        style="width:100%;padding:16px;background:#123c2b;
        color:white;border:0;border-radius:12px;font-size:18px">
        ऑर्डर करें
      </button>
    </div>
  `;

  document.getElementById("cartBack").onclick = closeCart;

  const list = document.getElementById("cartPageItems");

  if (!items.length) {
    list.innerHTML = "<p>आपका कार्ट खाली है।</p>";
  } else {
    list.innerHTML = items.map(item => `
      <article style="background:white;padding:16px;
        margin-top:12px;border-radius:14px">
        <h3>${escapeHTML(item.name)}</h3>
        <p>₹${item.price}</p>
        <button data-minus="${item.id}">−</button>
        <strong style="margin:0 15px">${item.qty}</strong>
        <button data-plus="${item.id}">+</button>
        <button data-remove="${item.id}"
          style="float:right;color:#b42318">
          हटाएँ ✕
        </button>
      </article>
    `).join("");
  }

  list.querySelectorAll("[data-plus]").forEach(button => {
    button.onclick = () => {
      const id = button.dataset.plus;
      cart[id] = (cart[id] || 0) + 1;
      renderCart();
      renderCartPage();
    };
  });

  list.querySelectorAll("[data-minus]").forEach(button => {
    button.onclick = () => {
      const id = button.dataset.minus;
      cart[id] = (cart[id] || 0) - 1;
      if (cart[id] <= 0) delete cart[id];
      renderCart();
      renderCartPage();
    };
  });

  list.querySelectorAll("[data-remove]").forEach(button => {
    button.onclick = () => {
      delete cart[button.dataset.remove];
      renderCart();
      renderCartPage();
    };
  });

  document.getElementById("cartCheckout").onclick = () => {
    closeCart();
    openCart();
  };
}

document.addEventListener("click", e => {
  const add = e.target.closest("[data-add]");
  const inc = e.target.closest("[data-inc]");
  const dec = e.target.closest("[data-dec]");

  if (add || inc) {
    const id = Number((add || inc).dataset[add ? "add" : "inc"]);
    cart[id] = (cart[id] || 0) + 1;
    renderCart();
    if (add) openCart();
  }

  if (dec) {
    const id = Number(dec.dataset.dec);
    cart[id] = Math.max(0, (cart[id] || 0) - 1);
    renderCart();
  }
});

$("cartOpen").addEventListener("click", openCart);
$("cartClose").addEventListener("click", closeCart);
$("cartBackdrop").addEventListener("click", closeCart);

$("searchInput").addEventListener("input", renderProducts);
$("categoryFilter").addEventListener("change", renderProducts);
$("sortFilter").addEventListener("change", renderProducts);

$("menuToggle").addEventListener("click", () =>
  $("nav").classList.toggle("nav-open")
);

$("checkoutBtn").addEventListener("click", () => {
  const items = cartItems();

  if (!items.length) {
    alert("पहले कार्ट में उत्पाद जोड़ें।");
    return;
  }

  const name = $("customerName").value.trim();
  const address = $("customerAddress").value.trim();

  if (!name || !address) {
    alert("कृपया अपना नाम और डिलीवरी का पूरा पता भरें।");
    return;
  }

  const total = items.reduce(
    (n, x) => n + x.product.price * x.qty, 0
  );

  const lines = items.map(({ product: p, qty }) =>
    `• ${p.name} (${p.weight}) × ${qty} = ₹${p.price * qty}`
  ).join("\n");

  const msg =
    `नमस्ते Aashapura Ayurvedic Store,\n` +
    `मुझे यह ऑर्डर करना है:\n${lines}\n` +
    `कुल: ₹${total}\nनाम: ${name}\nपता: ${address}\n` +
    `कृपया उपलब्धता और डिलीवरी चार्ज की पुष्टि करें।`;

  window.open(
    `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`,
    "_blank",
    "noopener"
  );
});

// Admin login
async function adminLogin() {
  const email = $("adminEmail").value.trim();
  const password = $("adminPassword").value;

  if (!email || !password) {
    alert("Email और password भरें।");
    return;
  }

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    alert("Login failed: " + error.message);
    return;
  }

  if (data.user.id !== "6eeb63cc-1cec-4ac5-bc4b-12a0e6f951c3") {
    await supabaseClient.auth.signOut();
    alert("इस अकाउंट को Admin की अनुमति नहीं है।");
    return;
  }

  showAdminPanel(true);
}

function showAdminPanel(loggedIn) {
  $("adminLoginBox").style.display = loggedIn ? "none" : "block";
  $("adminProductBox").style.display = loggedIn ? "block" : "none";
}

// Restore login session after page reload
async function restoreAdminSession() {
  const { data, error } = await supabaseClient.auth.getUser();

  if (!error && data.user &&
      data.user.id === "6eeb63cc-1cec-4ac5-bc4b-12a0e6f951c3") {
    showAdminPanel(true);
  } else {
    showAdminPanel(false);
  }
}

// Add product to Supabase
async function addAdminProduct() {
  const { data: { user }, error: authError } =
    await supabaseClient.auth.getUser();

  if (authError || !user ||
      user.id !== "6eeb63cc-1cec-4ac5-bc4b-12a0e6f951c3") {
    alert("Admin login करें।");
    showAdminPanel(false);
    return;
  }

  const name = $("pName").value.trim();
  const price = Number($("pPrice").value);
  const stock = Number($("pStock").value);

  if (!name || $("pPrice").value === "" ||
      !Number.isFinite(price) || price < 0 ||
      $("pStock").value === "" ||
      !Number.isInteger(stock) || stock < 0) {
    alert("Product name, सही price और stock भरें।");
    return;
  }
const imageFiles = Array.from($("pImages").files).slice(0, 4);
const imageUrls = [];

for (const file of imageFiles) {
  if (!file.type.startsWith("image/")) {
    alert("Sirf image files select karo.");
    return;
  }

  const path = `${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

  const { error: uploadError } = await supabaseClient
    .storage
    .from("product-images")
    .upload(path, file, { contentType: file.type });

  if (uploadError) {
    alert("Image upload failed: " + uploadError.message);
    return;
  }

  const { data: urlData } = supabaseClient
    .storage
    .from("product-images")
    .getPublicUrl(path);

  imageUrls.push(urlData.publicUrl);
}
  const product = {
    name,
    description: $("pDescription").value.trim(),
    price,
    category: $("pCategory").value.trim() || "herbal",
    weight: $("pWeight").value.trim(),
    stock,
    video_url: $("pVideo").value.trim(),
    image_url: imageUrls[0] || "",
images: JSON.stringify(imageUrls),
    is_active: true
  };

  const { data, error } = await supabaseClient
    .from("products")
    .insert(product)
    .select()
    .single();

  if (error) {
    alert("Product save नहीं हुआ: " + error.message);
    return;
  }

  alert("Product सफलतापूर्वक सेव हुआ!");
  $("pName").value = "";
  $("pDescription").value = "";
  $("pPrice").value = "";
  $("pCategory").value = "";
  $("pWeight").value = "";
  $("pStock").value = "";
  $("pVideo").value = "";

  await loadProducts();
}

// Logout
async function adminLogout() {
  await supabaseClient.auth.signOut();
  showAdminPanel(false);
}

// Existing HTML button uses this global function
window.adminLogin = adminLogin;
window.addAdminProduct = addAdminProduct;
window.adminLogout = adminLogout;

// Start the page
loadProducts();
restoreAdminSession();
async function deleteProduct(id) {
  if (!confirm("Kya aap ye product delete karna chahte hain?")) return;

  const { error } = await supabaseClient
    .from("products")
    .delete()
    .eq("id", id);

  if (error) {
    alert("Delete nahi hua: " + error.message);
    return;
  }

  alert("Product delete ho gaya!");
  await loadProducts();
}

window.deleteProduct = deleteProduct;
function showProduct(id) {
  const p = products.find(item => item.id === Number(id));
  if (!p) return;

  const url = new URL(window.location.href);
  url.searchParams.set("product", p.id);
  history.pushState({ productId: p.id }, "", url);

  renderProductPage(p);
}

function renderProductPage(p) {
  const oldPage = document.getElementById("productFullPage");
  if (oldPage) oldPage.remove();

  const page = document.createElement("main");
  page.id = "productFullPage";

  page.style.cssText = `
    position:fixed;
    inset:0;
    z-index:100000;
    overflow-y:auto;
    background:#fff;
    padding:20px;
    box-sizing:border-box;
    color:#173d2e;
    font-family:inherit;
  `;

  const image = p.image_url
    ? `<img src="${escapeHTML(p.image_url)}"
        alt="${escapeHTML(p.name)}"
        style="width:100%;height:320px;object-fit:contain;
        background:#eef5ed;border-radius:18px;">`
    : `<div style="height:250px;display:grid;place-items:center;
        background:#eef5ed;border-radius:18px;font-size:80px;">
        ${escapeHTML(p.emoji)}
       </div>`;

  page.innerHTML = `
    <button id="backToProducts"
      style="padding:12px 18px;border:0;border-radius:12px;
      background:#edf5ec;font-size:17px;margin-bottom:20px;">
      ← वापस दुकान पर
    </button>

    ${image}

    <h1 style="font-size:28px;margin-top:24px;">
      ${escapeHTML(p.name)}
    </h1>

    <h2 style="font-size:30px;">₹${p.price}</h2>

    <p style="background:#edf5ec;display:inline-block;
      padding:12px 16px;border-radius:12px;">
      📦 ${escapeHTML(p.weight)}
    </p>

    <p style="font-size:18px;line-height:1.7;">
      ${escapeHTML(p.desc)}
    </p>

    ${p.video_url ? `
      <h3>Product Video</h3>
      <a href="${escapeHTML(p.video_url)}"
         target="_blank" rel="noopener">
        ▶ वीडियो देखें
      </a>
    ` : ""}

    <button id="fullPageAddCart"
      style="width:100%;padding:17px;margin:24px 0;
      border:0;border-radius:14px;background:#123c2b;
      color:white;font-size:19px;">
      🛒 कार्ट में जोड़ें
    </button>
  `;

  document.body.appendChild(page);

  document.getElementById("backToProducts").onclick = () => {
    page.remove();
    const url = new URL(window.location.href);
    url.searchParams.delete("product");
    history.replaceState({}, "", url);
  };

  document.getElementById("fullPageAddCart").onclick = () => {
    const button = document.querySelector(`[data-add="${p.id}"]`);
    if (button) button.click();
    page.remove();

    const url = new URL(window.location.href);
    url.searchParams.delete("product");
    history.replaceState({}, "", url);
  };
}

window.showProduct = showProduct;
function addToCartFromDetails(id) {
  document.getElementById("productModal")?.remove();
  const button = document.querySelector(`[data-add="${id}"]`);
  if (button) button.click();
}

window.showProduct = showProduct;
window.addToCartFromDetails = addToCartFromDetails;
