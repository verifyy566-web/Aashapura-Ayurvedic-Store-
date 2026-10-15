/* v65: "Recently viewed" strip on the home page (above the shop grid). Saved in localStorage `aashapura_rv` (max 12 product ids). */
(function () {
  const L = (en, hi) => (window.AASHAPURA_LANG === "hi" ? hi : en);
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const KEY = "aashapura_rv", MAX = 12;
  const P = () => { try { return Array.isArray(products) ? products : []; } catch (e) { return []; } };
  const read = () => { try { const a = JSON.parse(localStorage.getItem(KEY) || "[]"); return Array.isArray(a) ? a.map(Number).filter(Boolean) : []; } catch (e) { return []; } };
  const write = a => { try { localStorage.setItem(KEY, JSON.stringify(a.slice(0, MAX))); } catch (e) {} };
  const nameKey = p => String(p.name || "").trim().toLowerCase();

  const css = document.createElement("style");
  css.textContent = `
  #rvHome{padding:6px 0 4px;margin:0 0 8px}
  #rvHome .rv-h{display:flex;align-items:center;justify-content:space-between;margin:0 4px 8px}
  #rvHome h3{margin:0;font-size:17px;color:#14301f}
  #rvHome .rv-x{border:0;background:none;color:#5d7266;font:inherit;font-size:13px;font-weight:700;cursor:pointer;padding:4px 6px}
  #rvHome .rv-row{display:flex;gap:10px;overflow-x:auto;padding:2px 4px 8px;scrollbar-width:none;-webkit-overflow-scrolling:touch}
  #rvHome .rv-row::-webkit-scrollbar{display:none}
  #rvHome .rv-c{flex:none;width:118px;background:#fff;border:1px solid #e1e9de;border-radius:14px;padding:8px;cursor:pointer}
  #rvHome .rv-c .im{height:86px;border-radius:10px;background:#eef4ea;display:flex;align-items:center;justify-content:center;font-size:34px;overflow:hidden}
  #rvHome .rv-c .im img{width:100%;height:100%;object-fit:contain}
  #rvHome .rv-c b{display:block;margin:6px 0 2px;font-size:12.5px;line-height:1.25;color:#14301f;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:31px}
  #rvHome .rv-c span{font-weight:800;font-size:14px;color:#14301f}
  #rvHome .rv-c em{display:block;font-style:normal;font-size:11px;color:#b42318;font-weight:700}`;
  document.head.appendChild(css);

  function record(id) {
    id = Number(id); if (!id) return;
    const p = P().find(x => x.id === id), key = p ? nameKey(p) : null;
    // same product in another size counts as the same product
    const rest = read().filter(x => { if (x === id) return false; const q = P().find(y => y.id === x); return !(q && key && nameKey(q) === key); });
    write([id, ...rest]);
    paint(true);
  }

  let sig = "";
  function paint(force) {
    const shop = $("shop"); if (!shop) return;
    const ids = read();
    const list = ids.map(id => P().find(p => p.id === id)).filter(Boolean);
    const s = list.map(p => [p.id, p.price, p.stock, p.image_url].join(":")).join("|");
    let box = $("rvHome");
    if (!list.length) { if (box) box.remove(); sig = ""; return; }
    if (box && s === sig && !force) return;
    sig = s;
    if (!box) { box = document.createElement("section"); box.id = "rvHome"; shop.before(box); }
    box.innerHTML = `<div class="rv-h"><h3>🕘 ${L("Recently viewed", "हाल ही में देखे")}</h3><button type="button" class="rv-x">${L("Clear", "हटाएँ")}</button></div>
      <div class="rv-row">${list.map(p => `<div class="rv-c" data-id="${p.id}"><div class="im">${p.image_url ? `<img src="${esc(p.image_url)}" alt="" loading="lazy">` : esc(p.emoji || "🌿")}</div><b>${esc(p.name)}</b><span>₹${p.price}</span>${p.stock <= 0 ? `<em>${L("Out of stock", "स्टॉक खत्म")}</em>` : ""}</div>`).join("")}</div>`;
    box.querySelector(".rv-x").onclick = () => { write([]); paint(true); };
    box.querySelector(".rv-row").onclick = e => { const c = e.target.closest(".rv-c"); if (c && window.showProduct) window.showProduct(Number(c.dataset.id)); };
  }

  const orig = window.showProduct;
  if (typeof orig === "function") {
    window.showProduct = function (id) { try { record(id); } catch (e) {} return orig.apply(this, arguments); };
  }
  paint(true);
  setInterval(() => paint(false), 1500);   // products load after page start; also keeps price/stock fresh
})();
