// Statuts certifications
export const CERT_STATUTS = {
  'Planifiée':   { label: 'Planifiée',   color: 'bg-blue-50 text-blue-600',    dot: 'bg-blue-400' },
  'Obtenue':     { label: 'Obtenue',     color: 'bg-emerald-50 text-emerald-600', dot: 'bg-emerald-400' },
  'À retenter':  { label: 'À retenter',  color: 'bg-orange-50 text-orange-600', dot: 'bg-orange-400' },
}

// Statuts vouchers
export const VOUCHER_STATUTS = {
  'Disponible': { color: 'bg-emerald-50 text-emerald-600' },
  'Attribué':   { color: 'bg-blue-50 text-blue-600' },
  'Utilisé':    { color: 'bg-slate-100 text-slate-500' },
}

// Types ressources
export const RESSOURCE_TYPES = ['Trailhead', 'PDF', 'Drive', 'Vidéo', 'Site', 'Autre']

// Pays disponibles
export const PAYS_OPTIONS = [
  'France', 'Espagne', 'Portugal', 'Maroc', 'Inde',
  'Belgique', 'Suisse', 'Luxembourg', 'Angleterre', 'Italie',
  'Allemagne', 'Pays-Bas',
]

// Nombre max de vouchers par an
export const MAX_VOUCHERS_AN = 4
