import React, { useState, useEffect, useCallback } from "react";
import { api } from "./api.js";
import Ingest from "./components/Ingest.jsx";
import Catalog from "./components/Catalog.jsx";
import ProductDetail from "./components/ProductDetail.jsx";
import Dashboard from "./components/Dashboard.jsx";
import { IconScan, IconCatalog, IconChart } from "./icons.jsx";

const NAV = [
  { id: "ingest", label: "Ingestion", icon: IconScan, title: "Ingestion d'étiquette", sub: "Déposez une étiquette, la fiche se remplit automatiquement." },
  { id: "catalog", label: "Catalogue", icon: IconCatalog, title: "Catalogue produits", sub: "Tous les produits enregistrés dans la base." },
  { id: "dashboard", label: "Tableau de bord", icon: IconChart, title: "Tableau de bord", sub: "Vue d'ensemble de votre catalogue." },
];

export default function App() {
  const [view, setView] = useState("ingest");
  const [refreshKey, setRefreshKey] = useState(0);
  const [openId, setOpenId] = useState(null);
  const [db, setDb] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => { api.health().then((h) => setDb(h.db)).catch(() => setDb(null)); }, []);

  const notify = useCallback((msg, error = false) => {
    setToast({ msg, error });
    setTimeout(() => setToast(null), 3200);
  }, []);
  const refresh = () => setRefreshKey((k) => k + 1);
  const current = NAV.find((n) => n.id === view);

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="logo">
          <div className="mark">P</div>
          <div>
            <div className="name">PIMP</div>
            <div className="tag">Product Information Mgmt</div>
          </div>
        </div>
        <nav className="nav">
          <div className="eyebrow">Espace de travail</div>
          {NAV.map((n) => {
            const Icon = n.icon;
            return (
              <button key={n.id} className={`nav-item ${view === n.id ? "active" : ""}`} onClick={() => setView(n.id)}>
                <Icon /> {n.label}
              </button>
            );
          })}
        </nav>
        <div className="side-foot">
          <div className="db-chip">
            <span className={`dot ${db === "sqlserver" ? "" : "amber"}`} />
            {db === "sqlserver" ? "SQL Server connecté" : "Stockage local"}
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <h1>{current.title}</h1>
            <div className="sub">{current.sub}</div>
          </div>
        </header>

        <div className="content">
          {view === "ingest" && <Ingest onSaved={refresh} notify={notify} />}
          {view === "catalog" && <Catalog refreshKey={refreshKey} onOpen={setOpenId} goIngest={() => setView("ingest")} />}
          {view === "dashboard" && <Dashboard refreshKey={refreshKey} />}
        </div>
      </main>

      {openId && (
        <ProductDetail id={openId} onClose={() => setOpenId(null)} onDeleted={refresh} notify={notify} />
      )}
      {toast && (
        <div className={`toast ${toast.error ? "err" : ""}`}>
          <span className="tdot" /> {toast.msg}
        </div>
      )}
    </div>
  );
}
