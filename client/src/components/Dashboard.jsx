import React, { useEffect, useState } from "react";
import { api } from "../api.js";
import { IconBox, IconLayers } from "../icons.jsx";

export default function Dashboard({ refreshKey }) {
  const [stats, setStats] = useState(null);
  useEffect(() => { api.stats().then(setStats).catch(() => setStats({ total: 0, parCategorie: [] })); }, [refreshKey]);
  if (!stats) return <div className="empty"><div className="skeleton" style={{ width: 200, margin: "0 auto" }} /></div>;
  const max = Math.max(1, ...stats.parCategorie.map((c) => c.total));

  return (
    <div>
      <div className="stat-grid">
        <div className="stat">
          <div className="ico"><IconBox /></div>
          <div className="num">{stats.total}</div>
          <div className="lbl">produits en base</div>
        </div>
        <div className="stat">
          <div className="ico"><IconLayers /></div>
          <div className="num">{stats.parCategorie.length}</div>
          <div className="lbl">catégories distinctes</div>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><span className="card-title">Répartition par catégorie</span></div>
        <div style={{ padding: 22 }}>
          {stats.parCategorie.length === 0 ? (
            <div className="empty" style={{ padding: "30px 10px" }}>
              <p style={{ margin: 0 }}>Aucune donnée — importez des produits pour voir la répartition.</p>
            </div>
          ) : stats.parCategorie.map((c) => (
            <div className="bar-row" key={c.categorie}>
              <div className="top"><span>{c.categorie}</span><span className="mono muted">{c.total}</span></div>
              <div className="bar-track"><div className="bar-fill" style={{ width: `${(c.total / max) * 100}%` }} /></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
