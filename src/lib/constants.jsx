// Statuts certifications
export const CERT_STATUTS = {
  'Planifiée':   { label: 'Planifiée',   color: 'bg-blue-900/50 text-blue-300',    dot: 'bg-blue-400' },
  'Obtenue':     { label: 'Obtenue',     color: 'bg-emerald-900/50 text-emerald-300', dot: 'bg-emerald-400' },
  'À retenter':  { label: 'À retenter',  color: 'bg-orange-900/50 text-orange-300', dot: 'bg-orange-400' },
}

// Statuts vouchers
export const VOUCHER_STATUTS = {
  'Disponible': { color: 'bg-emerald-900/50 text-emerald-300' },
  'Attribué':   { color: 'bg-blue-900/50 text-blue-300' },
  'Utilisé':    { color: 'bg-slate-800 text-slate-400' },
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
