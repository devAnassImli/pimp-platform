import React, { useEffect, useState } from "react";
import { api } from "../api.js";
import { IconClose, IconTrash, IconBarcode } from "../icons.jsx";

const ROWS = [
  ["marque", "Marque"], ["fabricant", "Fabricant"], ["ean", "EAN"],
  ["categorie", "Catégorie"], ["contenance", "Contenance"], ["pays_origine", "Pays d'origine"],
  ["etiquette", "Étiquette"],
];

export default function ProductDetail({ id, onClose, onDeleted, notify }) {
  const [p, setP] = useState(null);
  useEffect(() => { api.get(id).then(setP).catch((e) => { notify(e.message, true); onClose(); }); }, [id]);

  const del = async () => {
    if (!confirm("Supprimer définitivement ce produit ?")) return;
    try { await api.remove(id); notify("Produit supprimé."); onDeleted(); onClose(); }
    catch (e) { notify(e.message, true); }
  };

  return (
    <>
      <div className="drawer-bg" onClick={onClose} />
      <aside className="drawer">
        {!p ? (
          <div style={{ padding: 24 }}><div className="skeleton" style={{ width: "60%", marginBottom: 12 }} /><div className="skeleton" style={{ width: "90%" }} /></div>
        ) : (
          <>
            <div className="drawer-head">
              <div>
                <h2>{p.nom_produit}</h2>
                <span className="pill ok">{p.categorie || "non classé"}</span>
              </div>
              <button className="icon-btn" onClick={onClose} aria-label="Fermer"><IconClose width={18} height={18} /></button>
            </div>
            <div className="drawer-body">
              {ROWS.map(([k, label]) => (
                <div className="kv" key={k}><span className="k">{label}</span><span className={`v ${k === "ean" ? "mono" : ""}`}>{p[k] || "—"}</span></div>
              ))}
              {p.description && <div className="kv"><span className="k">Description</span><span className="v">{p.description}</span></div>}

              {p.composition?.length > 0 && (
                <div style={{ marginTop: 20 }}>
                  <div className="card-title" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <IconBarcode width={16} height={16} /> Composition
                  </div>
                  <div className="chips">
                    {p.composition.map((c, i) => <span key={i} className="chip">{c.libelle}: {c.valeur}</span>)}
                  </div>
                </div>
              )}

              <button className="btn danger block" style={{ marginTop: 28 }} onClick={del}>
                <IconTrash width={16} height={16} /> Supprimer le produit
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
