// Portage de CertificationEmailService.cls (org Salesforce d'origine) — mêmes textes, tutoiement, mêmes 9 emails.

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('fr-FR')
}

function ligneValiditeVoucher(voucher) {
  if (!voucher.date_debut_validite && !voucher.date_fin_validite) return ''
  const debut = voucher.date_debut_validite ? formatDate(voucher.date_debut_validite) : '(non précisée)'
  const fin = voucher.date_fin_validite ? formatDate(voucher.date_fin_validite) : '(non précisée)'
  return `Ce voucher est valable du ${debut} au ${fin}.\n`
}

const SIGNATURE = "L'équipe BU Salesforce Inetum"

// Email 1 – Voucher attribué
export function voucherAttribue({ consultant, cert, voucher, settings }) {
  return {
    to: consultant.email,
    cc: settings.responsableEmail,
    subject: '✅ Ton voucher Salesforce est disponible',
    text: `Bonjour ${consultant.prenom},\n\n`
      + `Ta demande de voucher pour la certification ${cert.nom_certification} a bien été prise en compte.\n\n`
      + `Ton code voucher : ${voucher.code}\n`
      + `Date de passage prévue : ${formatDate(cert.date_previsionnelle)}\n`
      + ligneValiditeVoucher(voucher) + '\n'
      + `Bonne chance pour ta certification !\n${SIGNATURE}`,
  }
}

// Email 2 – Aucun voucher disponible
export function pasDeVoucher({ consultant, cert, settings }) {
  return {
    to: consultant.email,
    cc: settings.responsableEmail,
    subject: '⚠️ Demande de voucher – Aucun code disponible',
    text: `Bonjour ${consultant.prenom},\n\n`
      + `Ta demande de voucher pour ${cert.nom_certification} a bien été reçue.\n`
      + `Malheureusement, aucun voucher n'est disponible pour le moment.\n\n`
      + `${settings.responsablePrenom} reviendra vers toi dès qu'un code sera disponible. Tu pourras ensuite ré-initier ta demande depuis l'outil.\n\n${SIGNATURE}`,
  }
}

// Email 3 – Accréditation (note de frais)
export function accreditation({ consultant, cert, settings }) {
  return {
    to: consultant.email,
    cc: settings.responsableEmail,
    subject: 'ℹ️ Accréditation – Remboursement via Note de frais',
    text: `Bonjour ${consultant.prenom},\n\n`
      + `Pour les accréditations Partner Learning Camp, le passage se fait via une Note de frais (sauf accord contraire d'${settings.responsablePrenom}).\n\n`
      + `Accréditation concernée : ${cert.nom_certification}\n\n`
      + `N'hésite pas à contacter ${settings.responsablePrenom} pour toute question.\n\n${SIGNATURE}`,
  }
}

// Email 9 – Repassage d'une certification "À retenter" (même traitement qu'une accréditation)
export function repassage({ consultant, cert, settings }) {
  return {
    to: consultant.email,
    cc: settings.responsableEmail,
    subject: 'ℹ️ Repassage de certification – Remboursement via Note de frais',
    text: `Bonjour ${consultant.prenom},\n\n`
      + `Pour repasser une certification déjà marquée "À retenter", le passage se fait via une Note de frais (sauf accord contraire d'${settings.responsablePrenom}), au même titre qu'une accréditation Partner Learning Camp.\n\n`
      + `Certification concernée : ${cert.nom_certification}\n\n`
      + `N'hésite pas à contacter ${settings.responsablePrenom} pour toute question.\n\n${SIGNATURE}`,
  }
}

// Email 4 – Dépassement de 4 vouchers/an (envoyé au responsable, CC consultant)
export function depassementLimite({ consultant, cert, nbVouchers, settings }) {
  return {
    to: settings.responsableEmail,
    cc: consultant.email,
    subject: `⚡ Demande de voucher supplémentaire – ${consultant.prenom} ${consultant.nom}`,
    text: `Bonjour ${settings.responsablePrenom},\n\n`
      + `${consultant.prenom} ${consultant.nom} demande un voucher pour ${cert.nom_certification} (date prévue : ${formatDate(cert.date_previsionnelle)}).\n\n`
      + `Il/elle a déjà utilisé ${nbVouchers} vouchers cette année civile (limite : 4).\n\n`
      + `Merci de confirmer si tu souhaites autoriser cette demande supplémentaire et d'attribuer manuellement un voucher depuis l'outil.\n\n${SIGNATURE}`,
  }
}

// Email 5 – Rappel mise à jour après passage (date prévisionnelle dépassée)
export function rappelMiseAJour({ consultant, cert, settings, appUrl }) {
  return {
    to: consultant.email,
    cc: settings.responsableEmail,
    subject: '🎓 Retour de certification – Merci de mettre à jour ton profil',
    text: `Bonjour ${consultant.prenom},\n\n`
      + `Ta date de passage pour la certification ${cert.nom_certification} est dépassée (${formatDate(cert.date_previsionnelle)}).\n\n`
      + `Merci de te connecter à l'outil et de mettre à jour :\n`
      + `- ✅ Si certifié(e) : renseigner la date d'obtention\n`
      + `- 🔄 Si à repasser : reprogrammer une nouvelle date\n\n`
      + `Lien : ${appUrl}\n\n${SIGNATURE}`,
  }
}

// Email 7 – Bonne chance le jour du passage (consultant uniquement, pas de CC)
export function bonneChance({ consultant, cert }) {
  return {
    to: consultant.email,
    subject: "🍀 Bonne chance pour ta certification aujourd'hui !",
    text: `Bonjour ${consultant.prenom},\n\n`
      + `C'est aujourd'hui que tu passes ta certification ${cert.nom_certification} !\n\n`
      + `Toute l'équipe BU Salesforce Inetum te souhaite une excellente certification. Tu vas y arriver ! 🍀\n\n${SIGNATURE}`,
  }
}

// Email 6 – Valeur de certification personnalisée ajoutée manuellement (envoyé à l'admin technique)
export function nomCertManuel({ consultantNom, valeur, settings }) {
  return {
    to: settings.adminEmail,
    subject: '[BU Certifications] Nouvelle valeur personnalisée ajoutée',
    text: `Bonjour,\n\n`
      + `${consultantNom} a ajouté une valeur personnalisée dans le formulaire de certification :\n\n`
      + `  → ${valeur}\n\n`
      + `Si cette certification/accréditation doit être intégrée à la liste officielle, merci de l'ajouter depuis l'onglet Admin du portail.\n\n${SIGNATURE}`,
  }
}

// Email 8 – Rappel mensuel des vouchers arrivant à expiration (Responsable Certif uniquement)
export function vouchersExpiration({ nbCeMois, nbMoisProchain, nbDisponibles, nbAttribues, settings }) {
  return {
    to: settings.responsableEmail,
    subject: '📅 Vouchers arrivant à expiration',
    text: `Bonjour ${settings.responsablePrenom},\n\n`
      + `Point mensuel sur les vouchers disponibles arrivant à expiration :\n\n`
      + `  → ${nbCeMois} voucher(s) expire(nt) ce mois-ci\n`
      + `  → ${nbMoisProchain} voucher(s) expire(nt) le mois prochain\n\n`
      + `État global du stock de vouchers :\n\n`
      + `  → ${nbDisponibles} voucher(s) encore disponible(s)\n`
      + `  → ${nbAttribues} voucher(s) attribué(s)\n\n`
      + `Merci de vérifier s'il faut renouveler ou réattribuer ces codes avant leur expiration.\n\n${SIGNATURE}`,
  }
}
