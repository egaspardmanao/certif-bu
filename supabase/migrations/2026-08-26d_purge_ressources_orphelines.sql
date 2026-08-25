-- Supprime les ressources rattachées à un nom de certification qui n'existe plus (ou plus
-- actif) dans le catalogue nom_certifications du panneau Admin. Ces ressources étaient déjà
-- invisibles dans l'onglet Ressources utiles (la sidebar ne liste que les noms actifs), donc
-- purement orphelines — mais elles polluaient encore la table.

delete from ressources
where nom_certification not in (
  select nom from nom_certifications where actif = true
);
