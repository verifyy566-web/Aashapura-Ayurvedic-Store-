const SUPABASE_URL = "https://rvygarzpdacnhxwxsgxo.supabase.co";
const SUPABASE_KEY = "sb_publishable_KF9seUu_5VZWQVhhR27dYw_kyB_ewVY";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const WHATSAPP_NUMBER = "916367561630";
const UPI_ID = "6367561630@fam";
const products = [
  {id:1,name:"Moringa Leaf Powder",price:199,category:"powder",weight:"100 g",desc:"उदाहरण प्रोडक्ट — बिक्री से पहले विवरण जाँचें।",emoji:"🌿"},
  {id:2,name:"Herbal Care Powder",price:149,category:"herbal",weight:"100 g",desc:"डेमो प्रोडक्ट; वास्तविक उत्पाद से बदलें।",emoji:"🍃"},
  {id:3,name:"Daily Wellness Mix",price:249,category:"wellness",weight:"200 g",desc:"डेमो प्रोडक्ट; वास्तविक उत्पाद से बदलें।",emoji:"🌱"}
];
let cart = {};
const $ = id => document.getElementById(id);
$("year").textContent = new Date().getFullYear();

function renderProducts(){
  const q = $("searchInput").value.trim().toLowerCase();
  const cat = $("categoryFilter").value;
  let list = products.filter(p => (cat==="all" || p.category===cat) && (p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q)));
  if($("sortFilter").value==="low") list.sort((a,b)=>a.price-b.price);
  if($("sortFilter").value==="high") list.sort((a,b)=>b.price-a.price);
  $("productGrid").innerHTML = list.map(p=>`<article class="product-card"><div class="product-art">${p.emoji}</div><div class="product-info"><span class="product-tag">${p.weight}</span><h3>${p.name}</h3><p>${p.desc}</p><div class="product-buy"><strong>₹${p.price}</strong><button class="add-btn" data-add="${p.id}">कार्ट में जोड़ें +</button></div></div></article>`).join("") || "<p>कोई उत्पाद नहीं मिला।</p>";
}
function cartItems(){
  return Object.entries(cart).filter(([,qty])=>qty>0).map(([id,qty])=>({product:products.find(p=>p.id===Number(id)),qty})).filter(x=>x.product);
}
function renderCart(){
  const items=cartItems();
  $("cartCount").textContent=items.reduce((n,x)=>n+x.qty,0);
  $("cartItems").innerHTML=items.length?items.map(({product:p,qty})=>`<div class="cart-item"><div><strong>${p.name}</strong><p>₹${p.price} × ${qty}</p></div><div class="qty"><button data-dec="${p.id}">−</button><span>${qty}</span><button data-inc="${p.id}">+</button></div></div>`).join(""):'<p class="empty-cart">आपका कार्ट अभी खाली है।</p>';
  $("cartTotal").textContent="₹"+items.reduce((n,x)=>n+x.product.price*x.qty,0);
}
function openCart(){ $("cartDrawer").classList.add("open"); $("cartBackdrop").classList.add("show"); }
function closeCart(){ $("cartDrawer").classList.remove("open"); $("cartBackdrop").classList.remove("show"); }
document.addEventListener("click",e=>{
  const add=e.target.closest("[data-add]"); if(add){const id=Number(add.dataset.add);cart[id]=(cart[id]||0)+1;renderCart();openCart();}
  const inc=e.target.closest("[data-inc]"); if(inc){const id=Number(inc.dataset.inc);cart[id]=(cart[id]||0)+1;renderCart();}
  const dec=e.target.closest("[data-dec]"); if(dec){const id=Number(dec.dataset.dec);cart[id]=Math.max(0,(cart[id]||0)-1);renderCart();}
});
$("cartOpen").addEventListener("click",openCart); $("cartClose").addEventListener("click",closeCart); $("cartBackdrop").addEventListener("click",closeCart);
$("searchInput").addEventListener("input",renderProducts); $("categoryFilter").addEventListener("change",renderProducts); $("sortFilter").addEventListener("change",renderProducts);
$("menuToggle").addEventListener("click",()=>$("nav").classList.toggle("nav-open"));
$("checkoutBtn").addEventListener("click",()=>{
  const items=cartItems(); if(!items.length){alert("पहले कार्ट में उत्पाद जोड़ें।");return;}
  const name=$("customerName").value.trim(), address=$("customerAddress").value.trim();
  if(!name || !address){alert("कृपया अपना नाम और डिलीवरी का पूरा पता भरें।");return;}
  const total=items.reduce((n,x)=>n+x.product.price*x.qty,0);
  const lines=items.map(({product:p,qty})=>`• ${p.name} (${p.weight}) × ${qty} = ₹${p.price*qty}`).join("\n");
  const msg=`नमस्ते Aashapura Ayurvedic Store,\nमुझे यह ऑर्डर करना है:\n${lines}\nकुल (डेमो कीमत): ₹${total}\nनाम: ${name}\nडिलीवरी पता: ${address}\n\nकृपया उपलब्धता, अंतिम कीमत और डिलीवरी चार्ज की पुष्टि करें।`;
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`,"_blank","noopener");
});
renderProducts(); renderCart();
// Admin login
async function adminLogin() {
  alert("Login button clicked");
  const email = document.getElementById("adminEmail").value;
  const password = document.getElementById("adminPassword").value;

  const { error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    alert("Login failed: " + error.message);
    return;
  }

  document.getElementById("adminLoginBox").style.display = "none";
  document.getElementById("adminProductBox").style.display = "block";
}

// Add product
async function addAdminProduct() {
  const { data: { user }, error: authError } =
    await supabaseClient.auth.getUser();

  if (authError || !user) {
    alert("Pehle Admin login karo.");
    return;
  }

  const product = {
    name: document.getElementById("pName").value.trim(),
    description: document.getElementById("pDescription").value.trim(),
    price: Number(document.getElementById("pPrice").value),
    category: document.getElementById("pCategory").value.trim(),
    weight: document.getElementById("pWeight").value.trim(),
    stock: Number(document.getElementById("pStock").value),
    video_url: document.getElementById("pVideo").value.trim()
  };

  if (!product.name || product.price < 0 || product.stock < 0) {
    alert("Product name, price aur stock check karo.");
    return;
  }

  const { error } = await supabaseClient
    .from("products")
    .insert(product);

  if (error) {
    alert("Product save nahi hua: " + error.message);
    return;
  }

  alert("Product add ho gaya!");
  location.reload();
}
