const products = [
  {id:1,name:"Moringa Leaf Powder",category:"powder",price:199,description:"डेमो उत्पाद • पैक साइज और असली विवरण अपडेट करें"},
  {id:2,name:"Amla Herbal Powder",category:"powder",price:149,description:"डेमो उत्पाद • असली सामग्री और लेबल जोड़ें"},
  {id:3,name:"Tulsi Herbal Blend",category:"herbal",price:129,description:"डेमो उत्पाद • उत्पाद की सही जानकारी लिखें"},
  {id:4,name:"Daily Wellness Mix",category:"wellness",price:249,description:"डेमो उत्पाद • कीमत और दावे जाँचकर बदलें"}
];
let cart = [];
const grid = document.getElementById("productGrid");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const sortFilter = document.getElementById("sortFilter");
const cartDrawer = document.getElementById("cartDrawer");
const cartBackdrop = document.getElementById("cartBackdrop");

function renderProducts(){
  let list = products.filter(p => (p.name + " " + p.description).toLowerCase().includes(searchInput.value.toLowerCase()) && (categoryFilter.value === "all" || p.category === categoryFilter.value));
  if(sortFilter.value === "low") list.sort((a,b)=>a.price-b.price);
  if(sortFilter.value === "high") list.sort((a,b)=>b.price-a.price);
  grid.innerHTML = list.length ? list.map(p=>`<article class="product-card"><div class="product-art ${p.category}"></div><div class="product-info"><span class="category-label">${p.category}</span><h3>${p.name}</h3><p>${p.description}</p><div class="product-bottom"><span class="product-price">₹${p.price}</span><button class="add-btn" onclick="addToCart(${p.id})">कार्ट में जोड़ें +</button></div></div></article>`).join("") : "<p>कोई उत्पाद नहीं मिला।</p>";
}
function addToCart(id){const found=cart.find(x=>x.id===id);if(found)found.qty++;else cart.push({id,qty:1});renderCart();openCart();}
function changeQty(id,delta){const item=cart.find(x=>x.id===id);if(!item)return;item.qty+=delta;if(item.qty<=0)cart=cart.filter(x=>x.id!==id);renderCart();}
function renderCart(){
  document.getElementById("cartCount").textContent=cart.reduce((s,x)=>s+x.qty,0);
  document.getElementById("cartTotal").textContent="₹"+cart.reduce((s,x)=>s+x.qty*products.find(p=>p.id===x.id).price,0);
  document.getElementById("cartItems").innerHTML=cart.length?cart.map(x=>{const p=products.find(y=>y.id===x.id);return `<div class="cart-item"><div><strong>${p.name}</strong><small>₹${p.price} × ${x.qty}</small><div class="qty-controls"><button onclick="changeQty(${p.id},-1)">−</button><span>${x.qty}</span><button onclick="changeQty(${p.id},1)">+</button></div></div><strong>₹${p.price*x.qty}</strong></div>`}).join(""):'<p class="empty-cart">आपका कार्ट अभी खाली है।</p>';
}
function openCart(){cartDrawer.classList.add("open");cartBackdrop.classList.add("show");}
function closeCart(){cartDrawer.classList.remove("open");cartBackdrop.classList.remove("show");}
searchInput.addEventListener("input",renderProducts);categoryFilter.addEventListener("change",renderProducts);sortFilter.addEventListener("change",renderProducts);
document.getElementById("cartOpen").addEventListener("click",openCart);document.getElementById("cartClose").addEventListener("click",closeCart);cartBackdrop.addEventListener("click",closeCart);
document.getElementById("menuToggle").addEventListener("click",()=>document.getElementById("nav").classList.toggle("show"));
document.querySelectorAll("#nav a").forEach(a=>a.addEventListener("click",()=>document.getElementById("nav").classList.remove("show")));
document.getElementById("checkoutBtn").addEventListener("click",()=>alert("यह अभी डेमो वेबसाइट है। वास्तविक ऑर्डर के लिए सुरक्षित checkout और backend जोड़ना होगा।"));
document.getElementById("year").textContent=new Date().getFullYear();
renderProducts();renderCart();
