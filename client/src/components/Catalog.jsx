import React, { useEffect, useState } from "react";
import { api } from "../api.js";
import { IconSearch, IconBox } from "../icons.jsx";

const CATS = ["", "Eau", "Boisson", "Épicerie", "Frais", "Hygiène", "Autre"];

export default function Catalog({ refreshKey, onOpen, goIngest }) {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [categorie, setCategorie] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true; setLoading(true);
    const t = setTimeout(() => {
      api.list({ search, categorie }).then((d) => active && setItems(d)).finally(() => active && setLoading(false));
    }, 200);
    return () => { active = false; clearTimeout(t); };
  }, [search, categorie, refreshKey]);

  return (
    <div>
      <div className="toolbar">
        <div className="search">
          <IconSearch />
          <input placeholder="Rechercher un produit, une marque, un EAN…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select value={categorie} onChange={(e) => setCategorie(e.target.value)}>
          {CATS.map((c) => <option key={c} value={c}>{c || "Toutes catégories"}</option>)}
        </select>
        {!loading && <span className="count">{items.length} produit{items.length > 1 ? "s" : ""}</span>}
      </div>

      <div className="card table-wrap">
        {loading ? (
          <table><tbody>
            {[...Array(4)].map((_, i) => (
              <tr key={i}><td colSpan={5}><div className="skeleton" style={{ width: `${70 - i * 8}%` }} /></td></tr>
            ))}
          </tbody></table>
        ) : items.length === 0 ? (
          <div className="empty">
            <div className="ico"><IconBox /></div>
            <h3>Aucun produit pour l'instant</h3>
            <p>Importez une étiquette pour créer votre première fiche produit.</p>
            <button className="btn primary" onClick={goIngest}>Importer une étiquette</button>
          </div>
        ) : (
          <table>
            <thead><tr><th>Produit</th><th>Marque</th><th>EAN</th><th>Catégorie</th></tr></thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id_produit} onClick={() => onOpen(p.id_produit)}>
                  <td>
                    <div className="cell-flex">
                      <div className="avatar">{(p.nom_produit || "?").charAt(0).toUpperCase()}</div>
                      <div>
                        <div className="prod-name">{p.nom_produit}</div>
                        <div className="muted mono" style={{ fontSize: 12 }}>#{p.id_produit}</div>
                      </div>
                    </div>
                  </td>
                  <td>{p.marque || "—"}</td>
                  <td className="mono" style={{ fontSize: 13 }}>{p.ean || "—"}</td>
                  <td>{p.categorie ? <span className="badge">{p.categorie}</span> : <span className="muted">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
