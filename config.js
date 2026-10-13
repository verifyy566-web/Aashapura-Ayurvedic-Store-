/* Default store number. Asli number ab ADMIN MENU > "Contact & Store Info" se badalta hai (Supabase table store_info).
   Ye file sirf backup/default hai. Last saved admin values yahan cache se turant mil jaati hain. */
window.AASHAPURA_CONFIG = { support: "916367561630" };
try {
  var c = JSON.parse(localStorage.getItem("aashapura_info") || "null");
  if (c && typeof c === "object") Object.keys(c).forEach(function (k) { if (c[k] !== null && c[k] !== undefined && c[k] !== "") window.AASHAPURA_CONFIG[k] = c[k]; });
} catch (e) {}
