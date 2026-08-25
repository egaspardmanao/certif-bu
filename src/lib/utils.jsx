import { format, isThisMonth, isSameMonth, subMonths } from 'date-fns'
import { fr } from 'date-fns/locale'

export function getInitiales(prenom, nom) {
  return `${prenom?.[0] ?? ''}${nom?.[0] ?? ''}`.toUpperCase()
}

export function formatDate(date, fmt = 'd MMM yyyy') {
  if (!date) return ''
  return format(new Date(date), fmt, { locale: fr })
}

export function isAccreditation(nomCertification) {
  return nomCertification?.endsWith('Accredited Professional')
}

export function getCertifiedThisMonth(certifications) {
  const now = new Date()
  return certifications.filter(c =>
    c.statut === 'Obtenue' && c.date_obtention && isThisMonth(new Date(c.date_obtention))
  )
}

export function getCertifiedLastMonth(certifications) {
  const lastMonth = subMonths(new Date(), 1)
  return certifications.filter(c =>
    c.statut === 'Obtenue' && c.date_obtention &&
    isSameMonth(new Date(c.date_obtention), lastMonth)
  )
}

export function getEnPreparation(certifications) {
  return certifications.filter(c => ['Planifiée', 'À retenter'].includes(c.statut))
}

// Grouper par certification : { nomCert: [{ consultant, date_obtention }] }
export function groupByCertification(consultantsAvecCertifs) {
  const groups = {}
  consultantsAvecCertifs.forEach(consultant => {
    (consultant.certifications ?? []).forEach(cert => {
      if (cert.statut !== 'Obtenue') return
      if (!groups[cert.nom_certification]) groups[cert.nom_certification] = []
      groups[cert.nom_certification].push({
        consultant,
        date_obtention: cert.date_obtention,
        type: cert.type,
      })
    })
  })
  // Tri par date décroissante dans chaque groupe
  Object.values(groups).forEach(arr =>
    arr.sort((a, b) => (b.date_obtention ?? '').localeCompare(a.date_obtention ?? ''))
  )
  return groups
}

// Cartes cliquables "titulaires d'une certification/accréditation" (équivalent buildCertGroups() du LWC).
// Regroupe par nom, trie chaque groupe par date d'obtention décroissante, puis les groupes
// par nombre de titulaires décroissant (à égalité, ordre alphabétique).
export function buildCertGroups(consultantsAvecCertifs, type) {
  const groups = groupByCertification(consultantsAvecCertifs)
  return Object.entries(groups)
    .filter(([, holders]) => holders[0]?.type === type)
    .map(([nom, holders]) => ({
      nom,
      count: holders.length,
      countLabel: `${holders.length} certifié${holders.length > 1 ? 's' : ''}`,
      holders,
    }))
    .sort((a, b) => b.count - a.count || a.nom.localeCompare(b.nom, 'fr'))
}
