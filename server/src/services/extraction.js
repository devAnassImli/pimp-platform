// Service d'extraction — VISION (Google Gemini, tier gratuit).
// Un modèle de vision "regarde" l'image comme un humain et en sort des
// données structurées, même sur de vraies étiquettes (bouteilles, photos, logos).
// L'extraction tourne côté serveur : la clé reste secrète.

import sharp from "sharp";

// Modèle gratuit (sans carte). Modifiable si besoin (ex. "gemini-flash-latest").
const GEMINI_MODEL = "gemini-2.5-flash";

const PROMPT = `Tu es le moteur d'extraction d'une plateforme PIM (Product Information Management).
Analyse cette étiquette de produit et renvoie UNIQUEMENT un objet JSON, sans texte autour, avec ces clés :
- nom_produit (string)
- marque (string)
- fabricant (string)
- ean (string : uniquement les chiffres du code-barres)
- categorie (string, l'une de : "Eau", "Boisson", "Épicerie", "Frais", "Hygiène", "Autre")
- contenance (string, ex. "1,5 L")
- pays_origine (string)
- description (string courte)
- composition (tableau d'objets {"libelle": string, "valeur": string} pour chaque ligne nutritionnelle/minérale lisible)
Mets null si une information est absente, et un tableau vide pour composition si rien n'est lisible.`;

export async function extractFromLabel(buffer /*, mimetype */) {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key.trim() === "" || key.includes("colle_ta_cle")) {
    throw new Error("GEMINI_API_KEY manquante : ajoute ta clé dans le fichier server/.env");
  }

  // Normalise n'importe quel format (GIF, WEBP, PNG, JPG…) en JPEG pour l'envoi.
  const jpeg = await sharp(buffer).flatten({ background: "#ffffff" }).jpeg({ quality: 90 }).toBuffer();
  const base64 = jpeg.toString("base64");

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inline_data: { mime_type: "image/jpeg", data: base64 } },
            { text: PROMPT },
          ],
        }],
        generationConfig: { responseMimeType: "application/json", temperature: 0 },
      }),
    }
  );

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Gemini ${res.status} : ${detail.slice(0, 200)}`);
  }

  const data = await res.json();
  const text = (data?.candidates?.[0]?.content?.parts || [])
    .map((p) => p.text || "")
    .join("")
    .replace(/```json|```/g, "")
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Réponse Gemini illisible (JSON invalide).");
  }

  if (parsed.composition && !Array.isArray(parsed.composition) && typeof parsed.composition === "object") {
    parsed.composition = Object.entries(parsed.composition).map(([libelle, valeur]) => ({
      libelle,
      valeur: valeur == null ? null : String(valeur),
    }));
  }
  if (!Array.isArray(parsed.composition)) parsed.composition = [];

  return parsed;
}