// Routes REST de la ressource "produit".

import { Router } from "express";
import multer from "multer";
import { repo } from "../db/index.js";
import { extractFromLabel } from "../services/extraction.js";

const router = Router();

// On garde le fichier en mémoire (buffer) le temps de le passer à l'OCR.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 Mo
  fileFilter: (_req, file, cb) => {
    // L'OCR local travaille sur des images. Pour un PDF, le convertir en image.
    const ok = file.mimetype.startsWith("image/");
    cb(ok ? null : new Error("Image uniquement (JPG, PNG). Pour un PDF, convertis-le en image."), ok);
  },
});

// POST /api/produits/extract  → lit l'étiquette, renvoie le JSON SANS sauvegarder
// (human-in-the-loop : le fournisseur valide avant enregistrement)
router.post("/extract", upload.single("etiquette"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Aucun fichier reçu." });
    const data = await extractFromLabel(req.file.buffer, req.file.mimetype);
    data.etiquette = req.file.originalname;
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/produits  → enregistre (upsert sur l'EAN)
router.post("/", async (req, res) => {
  try {
    const { nom_produit } = req.body;
    if (!nom_produit || !nom_produit.trim()) {
      return res.status(400).json({ error: "Le nom du produit est obligatoire." });
    }
    const saved = await repo.saveProduct(req.body);
    res.status(201).json(saved);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/produits?search=&categorie=
router.get("/", async (req, res) => {
  try {
    const list = await repo.listProducts({
      search: req.query.search || "",
      categorie: req.query.categorie || "",
    });
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/produits/:id
router.get("/:id", async (req, res) => {
  try {
    const p = await repo.getProduct(req.params.id);
    if (!p) return res.status(404).json({ error: "Produit introuvable." });
    res.json(p);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/produits/:id
router.delete("/:id", async (req, res) => {
  try {
    const ok = await repo.deleteProduct(req.params.id);
    if (!ok) return res.status(404).json({ error: "Produit introuvable." });
    res.status(204).end();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
