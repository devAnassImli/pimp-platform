// Dépôt "mémoire" AVEC persistance sur disque (server/data/store.json).
// Les produits survivent donc aux redémarrages du serveur (utile en démo,
// car `node --watch` redémarre à chaque changement de fichier).
// Pour une vraie prod : DB_DRIVER=sqlserver.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "..", "data");
const STORE = path.join(DATA_DIR, "store.json");

let produits = [];
let compositions = [];
let nextProduitId = 1;
let nextCompoId = 1;

function persist() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(STORE, JSON.stringify({ produits, compositions, nextProduitId, nextCompoId }, null, 2));
  } catch (e) {
    console.warn("⚠️  Sauvegarde locale impossible :", e.message);
  }
}

function load() {
  try {
    const raw = JSON.parse(fs.readFileSync(STORE, "utf8"));
    produits = raw.produits || [];
    compositions = raw.compositions || [];
    nextProduitId = raw.nextProduitId || 1;
    nextCompoId = raw.nextCompoId || 1;
  } catch {
    // pas de fichier encore : on démarre vide
  }
}

function attach(p) {
  return {
    ...p,
    composition: compositions
      .filter((c) => c.id_produit === p.id_produit)
      .map(({ libelle, valeur }) => ({ libelle, valeur })),
  };
}

export const memoryRepo = {
  async init() { load(); },

  async saveProduct(data) {
    const { composition = [], ...fields } = data;
    let produit;
    const existing = fields.ean ? produits.find((p) => p.ean === fields.ean) : null;

    if (existing) {
      Object.assign(existing, fields);
      produit = existing;
      compositions = compositions.filter((c) => c.id_produit !== produit.id_produit);
    } else {
      produit = { id_produit: nextProduitId++, statut: "valide", date_import: new Date().toISOString(), ...fields };
      produits.push(produit);
    }

    for (const ligne of composition) {
      if (!ligne || !ligne.libelle) continue;
      compositions.push({ id_composition: nextCompoId++, id_produit: produit.id_produit, libelle: ligne.libelle, valeur: ligne.valeur ?? null });
    }
    persist();
    return attach(produit);
  },

  async listProducts({ search = "", categorie = "" } = {}) {
    const q = search.trim().toLowerCase();
    return produits
      .filter((p) => {
        const ms = !q || [p.nom_produit, p.marque, p.fabricant, p.ean].filter(Boolean).some((v) => String(v).toLowerCase().includes(q));
        const mc = !categorie || p.categorie === categorie;
        return ms && mc;
      })
      .sort((a, b) => b.id_produit - a.id_produit);
  },

  async getProduct(id) {
    const p = produits.find((x) => x.id_produit === Number(id));
    return p ? attach(p) : null;
  },

  async deleteProduct(id) {
    const n = produits.length;
    produits = produits.filter((p) => p.id_produit !== Number(id));
    compositions = compositions.filter((c) => c.id_produit !== Number(id));
    persist();
    return produits.length < n;
  },

  async stats() {
    const parCategorie = {};
    for (const p of produits) {
      const c = p.categorie || "non classé";
      parCategorie[c] = (parCategorie[c] || 0) + 1;
    }
    return {
      total: produits.length,
      parCategorie: Object.entries(parCategorie).map(([categorie, total]) => ({ categorie, total })).sort((a,b)=>b.total-a.total),
    };
  },
};
