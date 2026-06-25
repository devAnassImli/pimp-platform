// Jeu d'icônes (SVG inline, style "ligne"). Aucune dépendance externe.
import React from "react";

const S = ({ children, ...p }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
       strokeLinecap="round" strokeLinejoin="round" {...p}>{children}</svg>
);

export const IconScan = (p) => (
  <S {...p}><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" /><path d="M3 12h18" /></S>
);
export const IconCatalog = (p) => (
  <S {...p}><path d="M3 5h18M3 12h18M3 19h18" /><circle cx="6" cy="5" r="0.5" fill="currentColor" /></S>
);
export const IconChart = (p) => (
  <S {...p}><path d="M3 3v18h18" /><rect x="7" y="11" width="3" height="6" rx="0.6" /><rect x="12" y="7" width="3" height="10" rx="0.6" /><rect x="17" y="13" width="3" height="4" rx="0.6" /></S>
);
export const IconSearch = (p) => (
  <S {...p}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></S>
);
export const IconUpload = (p) => (
  <S {...p}><path d="M12 16V4M12 4l-4 4M12 4l4 4" /><path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" /></S>
);
export const IconClose = (p) => (
  <S {...p}><path d="M18 6 6 18M6 6l12 12" /></S>
);
export const IconTrash = (p) => (
  <S {...p}><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></S>
);
export const IconBox = (p) => (
  <S {...p}><path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" /><path d="m3 8 9 5 9-5M12 13v8" /></S>
);
export const IconLayers = (p) => (
  <S {...p}><path d="m12 2 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5M3 17l9 5 9-5" /></S>
);
export const IconCheck = (p) => (
  <S {...p}><path d="M20 6 9 17l-5-5" /></S>
);
export const IconBarcode = (p) => (
  <S {...p}><path d="M4 5v14M8 5v14M11 5v14M14 5v14M17 5v14M20 5v14" /></S>
);
