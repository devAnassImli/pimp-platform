// Implémentation SQL Server du dépôt produit.
// Toutes les requêtes sont PARAMÉTRÉES (request.input) -> aucune
// concaténation de chaîne, donc pas d'injection SQL possible.

import sql from "mssql";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let pool;

function baseConfig() {
  return {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER || "localhost",
    port: Number(process.env.DB_PORT || 1433),
    options: { encrypt: false, trustServerCertificate: true },
    pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
  };
}

async function ensureDatabase() {
  // On se connecte à 'master' pour créer la base si besoin
  const master = await sql.connect({ ...baseConfig(), database: "master" });
  const dbName = process.env.DB_NAME || "PIMP";
  await master
    .request()
    .query(
      `IF DB_ID('${dbName}') IS NULL CREATE DATABASE [${dbName}];`
    );
  await master.close();
}

export const sqlServerRepo = {
  async init() {
    await ensureDatabase();
    pool = await sql.connect({
      ...baseConfig(),
      database: process.env.DB_NAME || "PIMP",
    });
    const schema = fs.readFileSync(path.join(__dirname, "..", "schema.sql"), "utf8");
    // Les batches SQL Server se séparent par GO ; ici on n'en a pas, on exécute tel quel
    await pool.request().batch(schema);
  },

  async saveProduct(data) {
    const { composition = [], ...f } = data;
    const tx = new sql.Transaction(pool);
    await tx.begin();
    try {
      const req = new sql.Request(tx);
      req.input("ean", sql.VarChar(20), f.ean || null);
      req.input("nom_produit", sql.NVarChar(255), f.nom_produit);
      req.input("marque", sql.NVarChar(120), f.marque || null);
      req.input("fabricant", sql.NVarChar(200), f.fabricant || null);
      req.input("categorie", sql.NVarChar(100), f.categorie || null);
      req.input("contenance", sql.NVarChar(60), f.contenance || null);
      req.input("pays_origine", sql.NVarChar(80), f.pays_origine || null);
      req.input("description", sql.NVarChar(sql.MAX), f.description || null);
      req.input("etiquette", sql.NVarChar(255), f.etiquette || null);

      // MERGE = upsert : met à jour si l'EAN existe, insère sinon.
      const result = await req.query(`
        MERGE produit AS cible
        USING (SELECT @ean AS ean) AS source
          ON cible.ean = source.ean AND source.ean IS NOT NULL
        WHEN MATCHED THEN UPDATE SET
          nom_produit = @nom_produit, marque = @marque, fabricant = @fabricant,
          categorie = @categorie, contenance = @contenance, pays_origine = @pays_origine,
          description = @description, etiquette = @etiquette
        WHEN NOT MATCHED THEN INSERT
          (ean, nom_produit, marque, fabricant, categorie, contenance, pays_origine, description, etiquette)
          VALUES
          (@ean, @nom_produit, @marque, @fabricant, @categorie, @contenance, @pays_origine, @description, @etiquette)
        OUTPUT inserted.id_produit;
      `);

      const id = result.recordset[0].id_produit;

      // Composition : on remplace les lignes existantes
      await new sql.Request(tx)
        .input("id", sql.Int, id)
        .query("DELETE FROM composition WHERE id_produit = @id");

      for (const ligne of composition) {
        if (!ligne || !ligne.libelle) continue;
        await new sql.Request(tx)
          .input("id_produit", sql.Int, id)
          .input("libelle", sql.NVarChar(120), ligne.libelle)
          .input("valeur", sql.NVarChar(80), ligne.valeur ?? null)
          .query(
            "INSERT INTO composition (id_produit, libelle, valeur) VALUES (@id_produit, @libelle, @valeur)"
          );
      }

      await tx.commit();
      return this.getProduct(id);
    } catch (e) {
      await tx.rollback();
      throw e;
    }
  },

  async listProducts({ search = "", categorie = "" } = {}) {
    const r = await pool
      .request()
      .input("search", sql.NVarChar(255), search ? `%${search}%` : null)
      .input("categorie", sql.NVarChar(100), categorie || null).query(`
        SELECT * FROM produit
        WHERE (@search IS NULL OR nom_produit LIKE @search OR marque LIKE @search
               OR fabricant LIKE @search OR ean LIKE @search)
          AND (@categorie IS NULL OR categorie = @categorie)
        ORDER BY id_produit DESC
      `);
    return r.recordset;
  },

  async getProduct(id) {
    const p = await pool
      .request()
      .input("id", sql.Int, id)
      .query("SELECT * FROM produit WHERE id_produit = @id");
    if (!p.recordset.length) return null;
    const c = await pool
      .request()
      .input("id", sql.Int, id)
      .query("SELECT libelle, valeur FROM composition WHERE id_produit = @id");
    return { ...p.recordset[0], composition: c.recordset };
  },

  async deleteProduct(id) {
    const r = await pool
      .request()
      .input("id", sql.Int, id)
      .query("DELETE FROM produit WHERE id_produit = @id");
    return r.rowsAffected[0] > 0;
  },

  async stats() {
    const total = await pool
      .request()
      .query("SELECT COUNT(*) AS total FROM produit");
    const parCat = await pool.request().query(`
      SELECT ISNULL(categorie, 'non classé') AS categorie, COUNT(*) AS total
      FROM produit GROUP BY categorie ORDER BY total DESC
    `);
    return {
      total: total.recordset[0].total,
      parCategorie: parCat.recordset,
    };
  },
};
