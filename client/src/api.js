// Petit client HTTP centralisé pour parler à l'API.

const json = async (res) => {
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
  return data;
};

export const api = {
  health: () => fetch("/api/health").then(json),
  stats: () => fetch("/api/stats").then(json),

  // Envoie l'étiquette, récupère le JSON extrait (sans sauvegarder)
  extract: (file) => {
    const fd = new FormData();
    fd.append("etiquette", file);
    return fetch("/api/produits/extract", { method: "POST", body: fd }).then(json);
  },

  // Enregistre (upsert)
  save: (produit) =>
    fetch("/api/produits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(produit),
    }).then(json),

  list: ({ search = "", categorie = "" } = {}) => {
    const qs = new URLSearchParams();
    if (search) qs.set("search", search);
    if (categorie) qs.set("categorie", categorie);
    return fetch(`/api/produits?${qs}`).then(json);
  },

  get: (id) => fetch(`/api/produits/${id}`).then(json),
  remove: (id) => fetch(`/api/produits/${id}`, { method: "DELETE" }).then(json),
};
