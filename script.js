const SUPABASE_URL = "https://rvygarzpdacnhxwxsgxo.supabase.co";
const SUPABASE_KEY = "sb_publishable_KF9seUu_5VZWQVhhR27dYw_kyB_ewVY";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let WHATSAPP_NUMBER = String((window.AASHAPURA_CONFIG && window.AASHAPURA_CONFIG.support) || "916367561630");
let UPI_ID = "6367561630@fam";
let UPI_NAME = "Aashapura Ayurveda";
window.AASHAPURA_QR = "";
/* Admin-editable UPI/QR (table payment_settings, supabase_v28.sql). Falls back to the values above. */
window.aashapuraApplyPay = function (c) {
  if (!c) return;
  if (c.upi_id && /^[A-Za-z0-9._\-]{2,}@[A-Za-z][A-Za-z0-9]+$/.test(c.upi_id)) UPI_ID = c.upi_id;
  if (c.payee_name) UPI_NAME = c.payee_name;
  window.AASHAPURA_QR = c.qr_url || "";
};
try { window.aashapuraApplyPay(JSON.parse(localStorage.getItem("aashapura_pay") || "null")); } catch (e) {}
try {
  supabaseClient.from("payment_settings").select("upi_id,payee_name,qr_url").eq("id", 1).maybeSingle().then(r => {
    if (r && r.data) { window.aashapuraApplyPay(r.data); try { localStorage.setItem("aashapura_pay", JSON.stringify(r.data)); } catch (e) {} }
  }).catch(() => {});
} catch (e) {}

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
    video_url: p.video_url || "",
    mrp: Number(p.mrp || 0),
    cod_available: p.cod_available !== false,
    ay_ingredients: p.ay_ingredients || "",
    ay_benefits: p.ay_benefits || "",
    ay_usage: p.ay_usage || "",
    ay_dose: p.ay_dose || "",
    ay_precautions: p.ay_precautions || ""
  };
}

// Load real products from Supabase
async function loadProducts() {
  // Fetch products without filtering on is_active: older/admin-added rows may
  // have NULL or false in this optional column and otherwise disappear from the shop.
  let { data, error } = await supabaseClient
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  // Some older products tables do not have created_at. Retry without ordering
  // so one optional column cannot hide the entire storefront.
  if (error) {
    console.warn("Product query with created_at failed; retrying:", error.message);
    const retry = await supabaseClient.from("products").select("*");
    data = retry.data;
    error = retry.error;
  }

  if (error) {
    console.error("Product loading error:", error.message);
    $("productGrid").innerHTML =
      `<p>उत्पाद लोड नहीं हुए: ${escapeHTML(error.message)}. Supabase की products Read Policy जाँचें।</p>`;
    return;
  }

  products = (data || []).map(normalizeProduct);
  renderProducts();
  renderCart();
}

function renderProducts() {
  const q = $("searchInput").value.trim().toLowerCase();
  const cat = $("categoryFilter").value;
let list = products.filter(p => {
  const name = String(p.name || "").toLowerCase();
  const desc = String(p.desc || p.description || "").toLowerCase();
  const category = String(p.category || "").trim().toLowerCase();
  const selectedCategory = String(cat || "all").trim().toLowerCase();

  const categoryMatch =
    selectedCategory === "all" ||
    category === selectedCategory;

  const searchMatch =
    !q || name.includes(q) || desc.includes(q);

  return categoryMatch && searchMatch;
});
  
  const sort = $("sortFilter").value;

if (sort === "low") {
  list.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
} else if (sort === "high") {
  list.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
}

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
    .filter(([id, qty]) => Number(qty) > 0)
    .map(([id, qty]) => {
      const product = products.find(
        p => String(p.id) === String(id)
      );

      if (!product) return null;

      return {
        id: product.id,
        name: product.name,
        price: Number(product.price) || 0,
        weight: product.weight || "",
        product: product,
        qty: Number(qty)
      };
    })
    .filter(Boolean);
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
  // Open cart as a real full-page view, not a floating overlay.
  document.querySelectorAll("body > header, body > main, body > section, body > footer, body > nav").forEach(el => {
    if (el.id !== "cartFullPage" && el.id !== "profilePage" && !el.dataset.cartHidden) {
      el.dataset.cartHidden = el.hidden ? "1" : "0";
      el.hidden = true;
    }
  });
  history.pushState({ page: "cart" }, "", "?page=cart");
  renderCartPage();
}

function closeCart() {
  const page = document.getElementById("cartFullPage");
  if (page) page.remove();
  document.querySelectorAll("[data-cart-hidden]").forEach(el => {
    el.hidden = el.dataset.cartHidden === "1";
    delete el.dataset.cartHidden;
  });
  const url = new URL(window.location.href);
  url.searchParams.delete("page");
  history.replaceState({}, "", url.pathname + url.search + url.hash);
}

function renderCartPage() {
  let page = document.getElementById("cartFullPage");

  if (!page) {
    page = document.createElement("main");
    page.id = "cartFullPage";
    document.body.appendChild(page);
  }

  page.style.cssText = `
    position:relative;
    width:100%;
    min-height:100vh;
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
    openPremiumCheckout();
  };
}

document.addEventListener("click", e => {
  const add = e.target.closest("[data-add]");
  const inc = e.target.closest("[data-inc]");
  const dec = e.target.closest("[data-dec]");

  // Prevent the card click handler from triggering a second add.
  if (add) {
    e.preventDefault();
    e.stopPropagation();
    const id = String(add.dataset.add);
    const product = products.find(p => String(p.id) === id);
    if (!product) return;
    cart[id] = (Number(cart[id]) || 0) + 1;
    renderCart();
    showStoreToast(`${product.name} कार्ट में जोड़ा गया`, "success");
    return;
  }
  if (inc) {
    e.preventDefault();
    e.stopPropagation();
    const id = String(inc.dataset.inc);
    cart[id] = (Number(cart[id]) || 0) + 1;
    renderCart();
    return;
  }
  if (dec) {
    e.preventDefault();
    e.stopPropagation();
    const id = String(dec.dataset.dec);
    cart[id] = Math.max(0, (Number(cart[id]) || 0) - 1);
    if (!cart[id]) delete cart[id];
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
    `नमस्ते Aashapura Ayurveda,\n` +
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
  const loginBox = $("adminLoginBox");
  const productBox = $("adminProductBox");

  if (loginBox) {
    loginBox.style.display = loggedIn ? "none" : "block";
  }

  if (productBox) {
    productBox.style.display = loggedIn ? "block" : "none";
  }

  if (loggedIn) {
    renderAdminProducts();
  }
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
let adminProductSaving = false;
async function addAdminProduct() {
  if (adminProductSaving) return;
  adminProductSaving = true;
  const saveBtn = document.querySelector('#adminProductBox button[onclick="addAdminProduct()"]');
  if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = "Saving…"; }
  try { await addAdminProductInternal(); } finally { adminProductSaving = false; if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = "Save Product"; } }
}
async function addAdminProductInternal() {
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
const allFiles = Array.from($("pImages").files).slice(0, 12);
const isVidF = f => f.type.startsWith("video/");
const imageFiles = allFiles.filter(f => f.type.startsWith("image/")).slice(0, 10);
const videoFiles = allFiles.filter(isVidF).slice(0, 2);
if (allFiles.length && !imageFiles.length && !videoFiles.length) { alert("Sirf photo ya video select karo."); return; }
const tooBig = videoFiles.find(f => f.size > 50 * 1024 * 1024);
if (tooBig) { alert("Video 50 MB se chhota hona chahiye: " + tooBig.name); return; }
const imageUrls = [];
const videoUrls = [];

/* photos pehle, videos baad me (taaki image_url hamesha photo ho) */
for (const file of imageFiles.concat(videoFiles)) {
  const path = `${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

  const { error: uploadError } = await supabaseClient
    .storage
    .from("product-images")
    .upload(path, file, { contentType: file.type });

  if (uploadError) {
    alert((isVidF(file) ? "Video" : "Image") + " upload failed: " + uploadError.message);
    return;
  }

  const { data: urlData } = supabaseClient
    .storage
    .from("product-images")
    .getPublicUrl(path);

  (isVidF(file) ? videoUrls : imageUrls).push(urlData.publicUrl);
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
images: JSON.stringify(imageUrls.concat(videoUrls)),
    is_active: true,
    ...(Number($("pMrp")?.value) > 0 ? { mrp: Number($("pMrp").value) } : {})
  };
  const AY = { ay_ingredients: "pAyIng", ay_benefits: "pAyBen", ay_usage: "pAyUse", ay_dose: "pAyDose", ay_precautions: "pAyCaut" };
  let ayFilled = false;
  Object.keys(AY).forEach(k => { const v = ($(AY[k]) && $(AY[k]).value.trim()) || ""; if (v) { product[k] = v; ayFilled = true; } });

  let { data, error } = await supabaseClient
    .from("products")
    .insert(product)
    .select()
    .single();

  /* Ayurveda columns missing (supabase_v23.sql not run yet): save the product without them */
  if (error && /ay_/i.test(error.message || "")) {
    Object.keys(AY).forEach(k => delete product[k]);
    ({ data, error } = await supabaseClient.from("products").insert(product).select().single());
    if (!error && ayFilled) alert("Product save ho gaya, par Ayurveda info save nahi hui. Pehle supabase_v23.sql Supabase me run karo, phir Edit se info daalo.");
  }

  if (error) {
    alert("Product save नहीं हुआ: " + error.message);
    return;
  }

  showStoreToast("Product सफलतापूर्वक सेव हुआ!", "success");
  $("pName").value = "";
  $("pDescription").value = "";
  $("pPrice").value = "";
  $("pCategory").value = "";
  $("pWeight").value = "";
  $("pStock").value = "";
  $("pVideo").value = "";
  Object.values(AY).forEach(id => { if ($(id)) $(id).value = ""; });

  await loadProducts();
}

// Admin-only product management: delete a database row after confirmation.
async function renderAdminProducts() {
  const host = $("adminProductList");
  if (!host) return;
  host.innerHTML = '<p>Products लोड हो रहे हैं…</p>';
  const { data: { user } = {} } = await supabaseClient.auth.getUser();
  if (!user || user.id !== "6eeb63cc-1cec-4ac5-bc4b-12a0e6f951c3") {
    host.innerHTML = '';
    return;
  }
  const { data, error } = await supabaseClient.from("products")
    .select("id,name,price,category,weight").order("created_at", { ascending: false });
  if (error) {
    host.innerHTML = '<p style="color:#b42318">Products लोड नहीं हुए: ' + escapeHTML(error.message) + '</p>';
    return;
  }
  if (!data || !data.length) {
    host.innerHTML = '<p>अभी कोई product नहीं है।</p>';
    return;
  }
  host.innerHTML = data.map(p => `<div style="display:flex;gap:10px;align-items:center;justify-content:space-between;border:1px solid #e5e7eb;border-radius:10px;padding:10px;margin:8px 0;background:#fff">
    <div style="min-width:0"><strong>${escapeHTML(p.name || 'Unnamed product')}</strong><div style="font-size:12px;color:#666">₹${Number(p.price || 0)} · ${escapeHTML(p.weight || '')}</div></div>
    <button type="button" data-delete-product="${escapeHTML(String(p.id))}" style="flex-shrink:0;background:#b42318;color:white;border:0;border-radius:8px;padding:9px 11px">Delete</button>
  </div>`).join('');
  host.querySelectorAll('[data-delete-product]').forEach(btn => {
    btn.onclick = async () => {
      const productId = btn.dataset.deleteProduct;
      const product = data.find(p => String(p.id) === String(productId));
      if (!(await confirm(`“${product?.name || 'Product'}” को स्थायी रूप से हटाएँ?`))) return;
      btn.disabled = true; btn.textContent = 'Deleting…';
      const { data: { user: currentUser } = {} } = await supabaseClient.auth.getUser();
      if (!currentUser || currentUser.id !== "6eeb63cc-1cec-4ac5-bc4b-12a0e6f951c3") {
        showStoreToast('Admin permission नहीं है।', 'error'); return;
      }
      const { error: deleteError } = await supabaseClient.from('products').delete().eq('id', productId);
      if (deleteError) {
        showStoreToast('Delete नहीं हुआ: ' + deleteError.message, 'error');
        btn.disabled = false; btn.textContent = 'Delete'; return;
      }
      showStoreToast('Product delete हो गया।', 'success');
      await loadProducts(); await renderAdminProducts();
    };
  });
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
window.renderAdminProducts = renderAdminProducts;

// Start the page
loadProducts();
restoreAdminSession();
async function deleteProduct(id) {
  if (!(await confirm("Do you really want to delete this product?"))) return;

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

  const imageList = (() => {
  try {
    const saved = typeof p.images === "string"
      ? JSON.parse(p.images || "[]")
      : p.images;

    const urls = Array.isArray(saved) ? saved : [];
    if (p.image_url && !urls.includes(p.image_url)) {
      urls.unshift(p.image_url);
    }
    return urls.filter(Boolean);
  } catch {
    return p.image_url ? [p.image_url] : [];
  }
})();

let currentImage = 0;
  const image = imageList.length
    ? `<div style="position:relative;background:#eef5ed;border-radius:18px;overflow:hidden;">
        <img id="productSlideImage" src="${escapeHTML(imageList[0])}" alt="${escapeHTML(p.name)}" style="width:100%;max-height:420px;object-fit:contain;display:block;">
        ${imageList.length > 1 ? `
          <button id="slidePrev" type="button" aria-label="पिछली फ़ोटो" style="position:absolute;left:8px;top:50%;transform:translateY(-50%);border:0;border-radius:50%;width:40px;height:40px;background:rgba(255,255,255,.9);font-size:20px">‹</button>
          <button id="slideNext" type="button" aria-label="अगली फ़ोटो" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);border:0;border-radius:50%;width:40px;height:40px;background:rgba(255,255,255,.9);font-size:20px">›</button>` : ""}
      </div>
      ${imageList.length > 1 ? `<div style="display:flex;gap:8px;margin-top:10px;overflow-x:auto">
        ${imageList.map((u, i) => `<img data-slide="${i}" src="${escapeHTML(u)}" alt="" style="width:64px;height:64px;object-fit:cover;border-radius:10px;border:2px solid ${i === 0 ? "#246b45" : "#ddd"};cursor:pointer">`).join("")}
      </div>` : ""}`
    : `<div style="height:250px;display:grid;place-items:center;background:#eef5ed;border-radius:18px;font-size:80px">${escapeHTML(p.emoji)}</div>`;

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
const slideImage = page.querySelector("#productSlideImage");

  if (slideImage && imageList.length > 1) {
    const showSlide = index => {
      currentImage = (index + imageList.length) % imageList.length;
      slideImage.src = imageList[currentImage];
      page.querySelectorAll("[data-slide]").forEach((thumb, i) => {
        thumb.style.borderColor = i === currentImage ? "#246b45" : "#ddd";
      });
    };

    page.querySelector("#slidePrev").onclick = () => showSlide(currentImage - 1);
    page.querySelector("#slideNext").onclick = () => showSlide(currentImage + 1);
    page.querySelectorAll("[data-slide]").forEach(thumb => {
      thumb.onclick = () => showSlide(Number(thumb.dataset.slide));
    });

    let touchStartX = 0;
    slideImage.addEventListener("touchstart", e => { touchStartX = e.changedTouches[0].clientX; }, { passive: true });
    slideImage.addEventListener("touchend", e => {
      const diff = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(diff) > 40) showSlide(currentImage + (diff < 0 ? 1 : -1));
    }, { passive: true });
  }

  document.body.appendChild(page);

  document.getElementById("backToProducts").onclick = () => {
    page.remove();
    const url = new URL(window.location.href);
    url.searchParams.delete("product");
    history.replaceState({}, "", url);
  };

  document.getElementById("fullPageAddCart").onclick = (e) => {
  e.preventDefault();
  e.stopPropagation();

  const id = String(p.id);
  const product = products.find(item => String(item.id) === id);

  if (!product) {
    showStoreToast("उत्पाद नहीं मिला। दुकान दोबारा खोलें।", "error");
    return;
  }

  cart[id] = (Number(cart[id]) || 0) + 1;

  renderCart();
  page.remove();

  const url = new URL(window.location.href);
  url.searchParams.delete("product");
  history.replaceState({}, "", url);

  showStoreToast(`${product.name} कार्ट में जोड़ा गया`, "success");
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


/* AASHAPURA ENHANCEMENTS v6 — keeps existing products and checkout intact */
const AASHAPURA_ADMIN_UID = "6eeb63cc-1cec-4ac5-bc4b-12a0e6f951c3";
let signedInUser = null;
let appliedCoupon = null;

function accountNotice(message, isError=false) {
  const el = $("accountMessage");
  if (el) { el.textContent = message; el.style.color = isError ? "#b42318" : "#26734d"; }
}
function setAccountButtons(user) {
  if ($("googleLoginBtn")) $("googleLoginBtn").hidden = !!user;
  if ($("profileBtn")) $("profileBtn").hidden = !user;
}
async function startGoogleLogin() {
  const redirectTo = window.location.origin + window.location.pathname;
  const { error } = await supabaseClient.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo }
  });
  if (error) alert("Sign In शुरू नहीं हुआ: " + error.message);
}
async function openAccountModal() {
  if (!signedInUser) { await startGoogleLogin(); return; }
  const profilePage = $("profilePage");
  if (profilePage) {
    profilePage.hidden = false;
    document.querySelectorAll("body > header, body > main, body > section").forEach(el => {
      if (el.id !== "profilePage" && el.id !== "adminPanel") {
        el.dataset.profileHidden = el.hidden ? "1" : "0";
        el.hidden = true;
      }
    });
    history.pushState({page:"profile"}, "", "#profile");
  }
  if (window.aashapuraRenderProfileAddr) window.aashapuraRenderProfileAddr();
  $("accountEmail").textContent = signedInUser.email || "";
  const { data, error } = await supabaseClient.from("customer_profiles")
    .select("full_name, phone, address").eq("user_id", signedInUser.id).maybeSingle();
  if (error) {
  accountNotice("प्रोफ़ाइल लोड नहीं हुई: " + error.message, true);
  return;
}

$("profileName").value = data?.full_name || "";
$("profilePhone").value = data?.phone || "";
$("profileAddress").value = data?.address || "";
}
async function saveCustomerProfile() {
  if (!signedInUser) return alert("पहले Sign In करें।");
  const full_name = $("profileName").value.trim();
  const phone = $("profilePhone").value.trim();
  const address = $("profileAddress").value.trim();
  if (!full_name || !phone) return accountNotice("नाम और मोबाइल भरें।", true);
  if (!/^[0-9+\-\s]{10,15}$/.test(phone)) return accountNotice("मोबाइल नंबर सही भरें।", true);
  const { error } = await supabaseClient.from("customer_profiles").upsert({
    user_id: signedInUser.id, full_name, phone, address, updated_at: new Date().toISOString()
  }, { onConflict: "user_id" });
  accountNotice(error ? "सेव नहीं हुआ: " + error.message : "प्रोफ़ाइल सेव हो गई।", !!error);
  if (!error) {
    if ($("customerName")) $("customerName").value = full_name;
    if ($("customerAddress")) $("customerAddress").value = address;
  }
}
async function initCustomerAuth() {
  const { data } = await supabaseClient.auth.getSession();
  signedInUser = data.session?.user || null;
  setAccountButtons(signedInUser);
  if (signedInUser) {
    const { data: profile } = await supabaseClient.from("customer_profiles")
      .select("full_name, phone, address").eq("user_id", signedInUser.id).maybeSingle();
    if (profile) {
      if ($("customerName") && !$("customerName").value) $("customerName").value = profile.full_name || "";
      if ($("customerAddress") && !$("customerAddress").value) $("customerAddress").value = profile.address || "";
    }
  }
  supabaseClient.auth.onAuthStateChange((_event, session) => {
    signedInUser = session?.user || null;
    setAccountButtons(signedInUser);
  });
}
if ($("googleLoginBtn")) $("googleLoginBtn").addEventListener("click", startGoogleLogin);
if ($("profileBtn")) $("profileBtn").addEventListener("click", openAccountModal);
function closeProfilePage() {
  const profilePage = $("profilePage");
  if (profilePage) profilePage.hidden = true;
  document.querySelectorAll("[data-profile-hidden]").forEach(el => {
    el.hidden = el.dataset.profileHidden === "1";
    delete el.dataset.profileHidden;
  });
  if (location.hash === "#profile") history.replaceState({}, "", location.pathname + location.search);
}
if ($("profileBackBtn")) $("profileBackBtn").addEventListener("click", closeProfilePage);
window.addEventListener("popstate", () => {
  if (location.search.includes("page=cart")) {
    openCartFromHistory();
  } else {
    if (document.getElementById("cartFullPage")) closeCart();
    if (location.hash !== "#profile") closeProfilePage();
  }
});
function openCartFromHistory() {
  if (!document.getElementById("cartFullPage")) {
    document.querySelectorAll("body > header, body > main, body > section, body > footer, body > nav").forEach(el => {
      if (el.id !== "cartFullPage" && el.id !== "profilePage" && !el.dataset.cartHidden) {
        el.dataset.cartHidden = el.hidden ? "1" : "0";
        el.hidden = true;
      }
    });
    renderCartPage();
  }
}

if ($("saveProfileBtn")) $("saveProfileBtn").addEventListener("click", saveCustomerProfile);
const openOrdersBtn = $("openMyOrdersBtn");

if (openOrdersBtn) {
  openOrdersBtn.addEventListener("click", openMyOrdersPage);
}

const ordersBackBtn = $("ordersBackBtn");

if (ordersBackBtn) {
  ordersBackBtn.addEventListener("click", closeMyOrdersPage);
}
if ($("googleLogoutBtn")) $("googleLogoutBtn").addEventListener("click", async () => {
  const { error } = await supabaseClient.auth.signOut();
  if (error) return accountNotice(error.message, true);
  signedInUser = null; setAccountButtons(null); closeProfilePage();
});

/* Coupon support: coupons are managed in Supabase; discount is rechecked at checkout. */
async function validateStoreCoupon(code, subtotal) {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return { ok: false, message: "कूपन कोड लिखें।" };
  if (!signedInUser) { appliedCoupon = null; return { ok: false, message: "कूपन लगाने के लिए पहले Sign In करें।" }; }
  const { data, error } = await supabaseClient.from("coupons")
    .select("code, discount_percent, discount_amount, min_order, is_active, expires_at")
    .eq("code", normalized).eq("is_active", true).maybeSingle();
  if (error || !data) return { ok: false, message: "कूपन सही नहीं है।" };
  if (data.expires_at && new Date(data.expires_at) < new Date()) return { ok: false, message: "कूपन की अवधि समाप्त हो गई।" };
  if (subtotal < Number(data.min_order || 0)) return { ok: false, message: `न्यूनतम ऑर्डर ₹${data.min_order} होना चाहिए।` };
  const discount = Math.min(subtotal, data.discount_amount ? Number(data.discount_amount) : subtotal * Number(data.discount_percent || 0) / 100);
  appliedCoupon = { code: normalized, discount };
  return { ok: true, discount, message: `कूपन लागू: ₹${discount.toFixed(2)} की छूट` };
}

/* Dynamic UPI payment link builder. Payment is not automatically verified; admin must verify UTR. */
function buildDynamicUpiLink(amount, orderNote="Aashapura order") {
  const params = new URLSearchParams({
    pa: UPI_ID, pn: UPI_NAME, am: Number(amount).toFixed(2),
    cu: "INR", tn: orderNote
  });
  return "upi://pay?" + params.toString();
}
function showDynamicPayment(amount) {
  const link = buildDynamicUpiLink(amount);
  const box = document.createElement("div");
  box.className = "payment-prompt";
  box.innerHTML = `<h3>UPI पेमेंट</h3><p>देय राशि: <strong>₹${Number(amount).toFixed(2)}</strong></p>
    <a class="primary-btn" href="${link.replace(/&/g, "&amp;")}">UPI ऐप से पेमेंट करें</a>
    <label for="paymentUtr">पेमेंट UTR / Transaction ID</label>
    <input id="paymentUtr" placeholder="पेमेंट करने के बाद UTR भरें">
    <p class="small-note">पेमेंट की पुष्टि अपने-आप नहीं होती। UTR एडमिन द्वारा जाँचा जाएगा।</p>`;
  document.body.appendChild(box);
  const close = document.createElement("button"); close.textContent = "बंद करें"; close.className = "secondary-btn";
  close.onclick = () => box.remove(); box.appendChild(close);
}

/* Admin controls are only rendered on the private admin route (?page=admin).
   Customers visiting the normal store never see the admin login or controls. */
function secureAdminVisibility() {
  const panel = $("adminPanel");
  if (!panel) return;
  const params = new URLSearchParams(window.location.search);
  const isAdminRoute = params.get("page") === "admin";
  panel.style.display = isAdminRoute ? "block" : "none";
  if (isAdminRoute) {
    document.querySelectorAll("body > header, body > main, body > section, body > footer").forEach(el => {
      if (el.id !== "adminPanel") el.hidden = true;
    });
    panel.style.maxWidth = "760px";
    panel.style.margin = "24px auto";
    panel.style.display = "block";
  }
}
initCustomerAuth();
secureAdminVisibility();


/* Premium in-page feedback and checkout; avoids Chrome's native alert popup. */
function showStoreToast(message, type="success") {
  let host = document.getElementById("storeToastHost");
  if (!host) {
    host = document.createElement("div");
    host.id = "storeToastHost";
    host.setAttribute("aria-live", "polite");
    document.body.appendChild(host);
  }
  const toast = document.createElement("div");
  toast.className = `store-toast ${type === "error" ? "is-error" : "is-success"}`;
  toast.textContent = message;
  host.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("show"));
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function openPremiumCheckout() {
  const items = cartItems();
  if (!items.length) {
    showStoreToast("पहले कार्ट में उत्पाद जोड़ें।", "error");
    return;
  }
  document.getElementById("premiumCheckoutModal")?.remove();
  const total = items.reduce((sum, item) => sum + Number(item.price) * Number(item.qty), 0);
  const profileName = $("profileName")?.value || $("customerName")?.value || signedInUser?.user_metadata?.full_name || "";
  const profilePhone = $("profilePhone")?.value || "";
  const profileAddress = $("profileAddress")?.value || $("customerAddress")?.value || "";
  const modal = document.createElement("main");
  modal.id = "premiumCheckoutModal";
  modal.className = "premium-checkout-page";
  modal.style.cssText = "position:fixed;inset:0;z-index:100010;overflow-y:auto;background:#f7faf6;padding:22px;box-sizing:border-box;color:#173d2e;font-family:inherit";
  modal.innerHTML = `
    <section class="premium-modal" role="region" aria-labelledby="checkoutTitle" style="margin:20px auto;max-height:none;width:min(100%,560px);box-sizing:border-box">
      <button type="button" class="premium-modal-close" aria-label="वापस जाएँ">×</button>
      <span class="premium-eyebrow">AASHAPURA • CHECKOUT</span>
      <h2 id="checkoutTitle">डिलीवरी जानकारी</h2>
      <p class="checkout-total">ऑर्डर कुल <strong>₹${total.toFixed(2)}</strong></p>
      <label>पूरा नाम<input id="checkoutFullName" autocomplete="name" value="${escapeHTML(profileName)}" placeholder="आपका नाम"></label>
      <label>मोबाइल नंबर<input id="checkoutPhone" inputmode="tel" autocomplete="tel" value="${escapeHTML(profilePhone)}" placeholder="10 अंकों का मोबाइल नंबर"></label>
      <label>डिलीवरी का पता<textarea id="checkoutAddress" autocomplete="street-address" placeholder="मकान, गाँव/शहर, पिन कोड">${escapeHTML(profileAddress)}</textarea></label>
      <button type="button" id="confirmPremiumOrder" class="premium-checkout-submit">WhatsApp पर ऑर्डर भेजें</button>
      <p class="premium-help">ऑर्डर भेजने से पहले अपना पता और मोबाइल नंबर जाँच लें।</p>
    </section>`;
  document.body.appendChild(modal);
  const close = () => modal.remove();
  modal.querySelector(".premium-modal-close").onclick = close;
  modal.addEventListener("click", e => { if (e.target === modal) close(); });
  modal.querySelector("#confirmPremiumOrder").onclick = () => {
    const name = modal.querySelector("#checkoutFullName").value.trim();
    const phone = modal.querySelector("#checkoutPhone").value.trim();
    const address = modal.querySelector("#checkoutAddress").value.trim();
    if (!name || !phone || !address) {
      showStoreToast("नाम, मोबाइल और पूरा पता भरें।", "error");
      return;
    }
    const lines = items.map(item => `• ${item.name} (${item.weight || "standard"}) × ${item.qty} = ₹${(Number(item.price) * Number(item.qty)).toFixed(2)}`).join("\n");
    const message = `नमस्ते Aashapura Ayurveda,\nमुझे यह ऑर्डर करना है:\n${lines}\nकुल: ₹${total.toFixed(2)}\nनाम: ${name}\nमोबाइल: ${phone}\nपता: ${address}\nकृपया उपलब्धता और डिलीवरी चार्ज की पुष्टि करें।`;
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    const opened = window.open(url, "_blank", "noopener");
    if (!opened) {
      window.location.href = url;
      return;
    }
    closeCart();
    close();
    showStoreToast("ऑर्डर WhatsApp में तैयार है।", "success");
  };
}
async function loadMyOrders() {
  const list = document.getElementById("myOrdersList");
  const message = document.getElementById("myOrdersMessage");

  if (!list || !message) return;

  list.replaceChildren();
  message.textContent = "";

  if (!signedInUser) {
    list.textContent = "अपने ऑर्डर देखने के लिए Sign In करें।";
    return;
  }

  list.textContent = "आपके ऑर्डर लोड हो रहे हैं...";

  const { data: orders, error } = await supabaseClient
    .from("store_orders")
    .select(
      "id, user_id, customer_name, items, subtotal, discount, total, payment_status, order_status, created_at"
    )
    .eq("user_id", signedInUser.id)
    .order("created_at", { ascending: false });

  if (error) {
    list.textContent = "ऑर्डर लोड नहीं हो सके।";
    message.textContent = error.message;
    return;
  }

  list.replaceChildren();

  if (!orders || orders.length === 0) {
    list.textContent = "अभी आपका कोई ऑर्डर नहीं है।";
    return;
  }

  orders.forEach(order => {
    const card = document.createElement("article");
    card.className = "profile-card";

    const title = document.createElement("h3");
    title.textContent = `ऑर्डर #${order.id}`;

    const date = document.createElement("p");
    date.textContent = order.created_at
      ? "तारीख: " +
        new Date(order.created_at).toLocaleDateString("hi-IN")
      : "";

    const status = document.createElement("p");
    status.textContent = "ऑर्डर स्टेटस: " + (order.order_status || "Pending");

    const payment = document.createElement("p");
    payment.textContent =
      "पेमेंट स्टेटस: " + (order.payment_status || "Pending");

    const amount = document.createElement("p");
    amount.textContent = "कुल राशि: ₹" + Number(order.total || 0).toFixed(2);

    const productsHeading = document.createElement("h4");
    productsHeading.textContent = "ऑर्डर के प्रोडक्ट";

    const productsList = document.createElement("ul");
    const items = Array.isArray(order.items) ? order.items : [];

    if (items.length) {
      items.forEach(item => {
        const li = document.createElement("li");
        const name = item.name || item.product_name || "Product";
        const qty = Number(item.quantity || item.qty || 1);
        const price = Number(item.price || 0);

        li.textContent = `${name} × ${qty} — ₹${(price * qty).toFixed(2)}`;
        productsList.appendChild(li);
      });
    } else {
      const li = document.createElement("li");
      li.textContent = "प्रोडक्ट की जानकारी उपलब्ध नहीं है।";
      productsList.appendChild(li);
    }

    card.append(
      title,
      date,
      status,
      payment,
      amount,
      productsHeading,
      productsList
    );

    list.appendChild(card);
  });
}
function openMyOrdersPage() {
  if (!signedInUser) {
    startGoogleLogin();
    return;
  }

  const page = $("myOrdersPage");
  if (!page) return;

  $("profilePage").hidden = true;
  page.hidden = false;

  document.querySelectorAll(
    "body > header, body > main, body > section, body > footer"
  ).forEach(el => {
    if (el.id !== "myOrdersPage") {
      el.dataset.ordersHidden = el.hidden ? "1" : "0";
      el.hidden = true;
    }
  });

  history.pushState({ page: "my-orders" }, "", "#my-orders");

  loadMyOrders();
}

function closeMyOrdersPage() {
  const page = $("myOrdersPage");
  if (page) page.hidden = true;

  document.querySelectorAll("[data-orders-hidden]").forEach(el => {
    el.hidden = el.dataset.ordersHidden === "1";
    delete el.dataset.ordersHidden;
  });

  history.pushState({}, "", location.pathname + location.search);
}
