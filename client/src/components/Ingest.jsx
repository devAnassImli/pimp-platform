import React, { useState, useRef, useCallback } from "react";
import { api } from "../api.js";
import { IconUpload, IconCheck } from "../icons.jsx";

const CATS = ["Eau", "Boisson", "Épicerie", "Frais", "Hygiène", "Autre"];
const empty = {
  nom_produit: "", marque: "", fabricant: "", ean: "",
  categorie: "", contenance: "", pays_origine: "", description: "", etiquette: "", composition: [],
};

export default function Ingest({ onSaved, notify }) {
  const [drag, setDrag] = useState(false);
  const [preview, setPreview] = useState(null);
  const [phase, setPhase] = useState("idle"); // idle | reading | review | saving
  const [form, setForm] = useState(empty);
  const [aiFields, setAiFields] = useState(new Set());
  const inputRef = useRef(null);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return notify("Format accepté : image (JPG, PNG, WEBP).", true);
    setPreview(URL.createObjectURL(file));
    setPhase("reading");
    try {
      const data = await api.extract(file);
      const filled = { ...empty, ...data };
      filled.composition = Array.isArray(data.composition) ? data.composition : [];
      setAiFields(new Set(Object.keys(data).filter((k) => data[k] != null && data[k] !== "" && (!Array.isArray(data[k]) || data[k].length))));
      setForm(filled);
      setPhase("review");
    } catch (e) {
      notify(e.message, true);
      setPhase("idle"); setPreview(null);
    }
  }, [notify]);

  const save = async () => {
    if (!form.nom_produit.trim()) return notify("Le nom du produit est obligatoire.", true);
    setPhase("saving");
    try {
      const saved = await api.save(form);
      notify(`« ${saved.nom_produit} » enregistré.`);
      onSaved?.();
      reset();
    } catch (e) { notify(e.message, true); setPhase("review"); }
  };
  const reset = () => { setForm(empty); setPreview(null); setPhase("idle"); setAiFields(new Set()); };

  const Field = ({ k, label, type = "input", options }) => (
    <div className="field">
      <label>{label} {aiFields.has(k) && <span className="pill ai">extrait</span>}</label>
      {type === "select" ? (
        <select value={form[k] || ""} onChange={(e) => set(k, e.target.value)}>
          <option value="">—</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : type === "textarea" ? (
        <textarea value={form[k] || ""} onChange={(e) => set(k, e.target.value)} />
      ) : (
        <input value={form[k] || ""} onChange={(e) => set(k, e.target.value)} placeholder="—" />
      )}
    </div>
  );

  return (
    <div className="grid-2">
      {/* Uploader */}
      <div>
        <div
          className={`drop ${drag ? "active" : ""}`}
          tabIndex={0} role="button"
          onClick={() => phase !== "reading" && inputRef.current?.click()}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && phase !== "reading" && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]); }}
        >
          {phase === "reading" && preview ? (
            <>
              <div className="scan-wrap">
                <img className="preview" src={preview} alt="Étiquette en cours d'analyse" />
                <div className="scan-line" />
              </div>
              <div className="scan-badge"><span className="spinner brand" /> Analyse de l'étiquette…</div>
            </>
          ) : preview ? (
            <img className="preview" src={preview} alt="Aperçu de l'étiquette" />
          ) : (
            <>
              <div className="drop-icon"><IconUpload /></div>
              <h3>Déposez une étiquette</h3>
              <div className="hint">ou cliquez pour parcourir vos fichiers</div>
              <div className="formats">JPG · PNG · WEBP</div>
            </>
          )}
          <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleFile(e.target.files[0])} />
        </div>
        {phase === "review" && (
          <button className="btn ghost block" style={{ marginTop: 12 }} onClick={reset}>Recommencer</button>
        )}
      </div>

      {/* Review */}
      <div className="card">
        <div className="card-head">
          <span className="card-title">Fiche produit</span>
          {phase === "review" ? <span className="pill pending">à valider</span>
            : phase === "saving" ? <span className="pill pending">enregistrement…</span>
            : <span className="muted" style={{ fontSize: 13 }}>en attente</span>}
        </div>
        <div style={{ padding: 20 }}>
          {phase === "idle" || phase === "reading" ? (
            <div className="empty" style={{ padding: "40px 10px" }}>
              <h3>{phase === "reading" ? "Lecture en cours…" : "Aucune étiquette"}</h3>
              <p>Déposez une étiquette : les champs se remplissent tout seuls, vous les corrigez puis vous enregistrez.</p>
            </div>
          ) : (
            <>
              <Field k="nom_produit" label="Nom du produit *" />
              <div className="field-row">
                <Field k="marque" label="Marque" />
                <Field k="ean" label="EAN (code-barres)" />
              </div>
              <Field k="fabricant" label="Fabricant" />
              <div className="field-row">
                <Field k="categorie" label="Catégorie" type="select" options={CATS} />
                <Field k="contenance" label="Contenance" />
              </div>
              <Field k="pays_origine" label="Pays d'origine" />
              <Field k="description" label="Description" type="textarea" />
              {form.composition?.length > 0 && (
                <div className="field">
                  <label>Composition <span className="pill ai">extraite</span></label>
                  <div className="chips">
                    {form.composition.map((c, i) => <span key={i} className="chip">{c.libelle}: {c.valeur}</span>)}
                  </div>
                </div>
              )}
              <button className="btn primary block" style={{ marginTop: 8 }} onClick={save} disabled={phase === "saving"}>
                {phase === "saving" ? <span className="spinner" /> : <IconCheck width={17} height={17} />}
                Enregistrer en base
              </button>
              <p className="muted" style={{ fontSize: 12, marginTop: 12, textAlign: "center" }}>
                Si l'EAN existe déjà, la fiche est mise à jour — jamais dupliquée.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
