-- ============================================================
-- PORTAIL CERTIFICATIONS BU SALESFORCE — Schéma Supabase
-- Migration depuis Salesforce (Certification__c, Voucher__c,
-- RessourceCertification__c, Contact, Account, Mission__c)
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLE : consultants (= Contact Salesforce)
-- Actif__c, Type__c, VouchersAnneeCivile__c, HideForCommunity__c,
-- Manager__c, Pays__c
-- ============================================================
create table if not exists consultants (
  id                     uuid primary key default gen_random_uuid(),
  prenom                 text not null,
  nom                    text not null,
  email                  text unique,           -- lié au compte auth si present
  actif                  boolean not null default true,
  hide_for_community     boolean not null default false,  -- masqué du classement
  manager_id             uuid references consultants(id) on delete set null,
  vouchers_annee_civile  integer not null default 0,      -- compteur annuel (reset 1er janv.)
  photo_url              text,                             -- Supabase Storage URL
  pays                   text not null default 'France',
  created_at             timestamptz default now(),
  updated_at             timestamptz default now()
);

-- Index
create index if not exists idx_consultants_actif on consultants(actif, hide_for_community);
create index if not exists idx_consultants_manager on consultants(manager_id);

-- ============================================================
-- TABLE : certifications (= Certification__c)
-- Enfant de consultant
-- ============================================================
create type cert_type   as enum ('Certification', 'Accreditation');
create type cert_statut as enum ('Planifiée', 'Obtenue', 'À retenter');

create table if not exists certifications (
  id                   uuid primary key default gen_random_uuid(),
  consultant_id        uuid not null references consultants(id) on delete cascade,
  type                 cert_type not null default 'Certification',
  nom_certification    text not null,           -- valeur du Global Value Set
  statut               cert_statut not null default 'Planifiée',
  date_previsionnelle  date,                    -- obligatoire si Planifiée
  date_obtention       date,                    -- obligatoire si Obtenue
  voucher_id           uuid,                    -- FK vers vouchers, settée après
  notes                text,
  created_at           timestamptz default now(),
  updated_at           timestamptz default now(),

  -- Règles métier (équivalent Validation Rules Salesforce)
  constraint chk_date_prev check (
    statut != 'Planifiée' or date_previsionnelle is not null
  ),
  constraint chk_date_obtention check (
    statut != 'Obtenue' or date_obtention is not null
  ),
  constraint chk_pas_voucher_accred check (
    type != 'Accreditation' or voucher_id is null
  )
);

create index if not exists idx_certif_consultant on certifications(consultant_id);
create index if not exists idx_certif_statut     on certifications(statut);
create index if not exists idx_certif_nom        on certifications(nom_certification);

-- ============================================================
-- TABLE : vouchers (= Voucher__c)
-- ============================================================
create type voucher_statut as enum ('Disponible', 'Attribué', 'Utilisé');

create table if not exists vouchers (
  id                   uuid primary key default gen_random_uuid(),
  code                 text not null unique,    -- Code__c : le vrai code fonctionnel
  statut               voucher_statut not null default 'Disponible',
  consultant_id        uuid references consultants(id) on delete set null,
  certification_id     uuid references certifications(id) on delete set null,
  date_attribution     date,
  date_expiration      date,                    -- calculée depuis date_previsionnelle à l'attribution
  date_debut_validite  date,                    -- fenêtre d'éligibilité (saisie admin)
  date_fin_validite    date,                    -- fenêtre d'éligibilité (saisie admin)
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

-- FK retour certifications → vouchers (circulaire, ajoutée après)
alter table certifications
  add constraint fk_certif_voucher
  foreign key (voucher_id) references vouchers(id) on delete set null;

create index if not exists idx_vouchers_statut on vouchers(statut);
create index if not exists idx_vouchers_validite on vouchers(date_debut_validite, date_fin_validite);

-- ============================================================
-- TABLE : ressources (= RessourceCertification__c)
-- ============================================================
create type ressource_type as enum ('Trailhead', 'PDF', 'Drive', 'Vidéo', 'Site', 'Autre');

create table if not exists ressources (
  id                uuid primary key default gen_random_uuid(),
  nom               text not null,
  nom_certification text not null,             -- même référentiel que certifications.nom_certification
  type              ressource_type not null default 'Site',
  url               text,
  notes             text,
  fichier_url       text,                      -- Supabase Storage (type PDF)
  fichier_nom       text,                      -- nom original du fichier
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

create index if not exists idx_ressources_nom_certif on ressources(nom_certification);

-- ============================================================
-- TABLE : projets (= Account avec Active__c / Termine__c)
-- VERSION ALLÉGÉE : nom + responsable + consultants affectés
-- ============================================================
create table if not exists projets (
  id              uuid primary key default gen_random_uuid(),
  nom             text not null,
  responsable_id  uuid references consultants(id) on delete set null,
  actif           boolean not null default true,    -- Active__c = 'Yes'
  termine         boolean not null default false,   -- Termine__c (distinct d'actif)
  est_special     boolean not null default false,   -- BENCH / HOME : affichés en tête avec bordure rose
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index if not exists idx_projets_actif   on projets(actif);
create index if not exists idx_projets_termine on projets(termine);

-- Données initiales : BENCH et HOME (équivalents des comptes spéciaux Salesforce)
insert into projets (nom, actif, termine, est_special) values
  ('BENCH', true, false, true),
  ('HOME',  true, false, true)
on conflict do nothing;

-- ============================================================
-- TABLE : missions (= Mission__c)
-- Lien consultant ↔ projet (version allégée : sans rôle/dates/taux)
-- ============================================================
create type mission_statut as enum ('En mission', 'Bench', 'Home', 'Sortie');

create table if not exists missions (
  id            uuid primary key default gen_random_uuid(),
  projet_id     uuid not null references projets(id) on delete cascade,
  consultant_id uuid not null references consultants(id) on delete cascade,
  statut        mission_statut not null default 'En mission',
  created_at    timestamptz default now(),
  unique(projet_id, consultant_id)   -- un consultant = une seule mission par projet
);

create index if not exists idx_missions_projet     on missions(projet_id);
create index if not exists idx_missions_consultant on missions(consultant_id);

-- ============================================================
-- TABLE : nom_certifications (= Global Value Set NomCertification)
-- Source de vérité unique pour la liste des certifications/accréditations
-- ============================================================
create table if not exists nom_certifications (
  id         serial primary key,
  nom        text not null unique,
  categorie  text not null check (categorie in ('Certification', 'Accreditation')),
  actif      boolean not null default true,
  ordre      integer default 0
);

create index if not exists idx_nom_certif_actif on nom_certifications(actif, categorie);

-- ============================================================
-- TABLE : email_settings (= Certification_Email_Settings__mdt)
-- Configuration emails — modifiable sans redéploiement
-- ============================================================
create table if not exists email_settings (
  id                        serial primary key,
  responsable_email         text not null default 'responsable@yourcompany.com',
  responsable_prenom        text not null default 'Responsable',
  sender_email              text not null default 'noreply@yourcompany.com',
  admin_email               text not null default 'admin@yourcompany.com',
  updated_at                timestamptz default now()
);

-- Une seule ligne (pattern singleton)
insert into email_settings (id) values (1) on conflict do nothing;

-- ============================================================
-- VUE : classement (consultants visibles + nb certifs obtenues)
-- Équivalent de getConsultantsAvecCertifications()
-- ============================================================
create or replace view classement as
select
  c.id,
  c.prenom,
  c.nom,
  c.photo_url,
  c.manager_id,
  c.pays,
  count(cert.id) filter (where cert.statut = 'Obtenue')              as nb_certifications,
  count(cert.id) filter (where cert.type = 'Accreditation' and cert.statut = 'Obtenue') as nb_accreditations,
  max(cert.date_obtention) filter (where cert.statut = 'Obtenue')    as derniere_obtention,
  min(cert.date_previsionnelle) filter (where cert.statut = 'Planifiée') as prochaine_planifiee
from consultants c
left join certifications cert on cert.consultant_id = c.id
where c.actif = true and c.hide_for_community = false
group by c.id, c.prenom, c.nom, c.photo_url, c.manager_id, c.pays
order by nb_certifications desc, derniere_obtention desc nulls last;

-- ============================================================
-- VUE : certifies_du_mois
-- ============================================================
create or replace view certifies_du_mois as
select
  cert.id,
  cert.consultant_id,
  c.prenom,
  c.nom,
  c.photo_url,
  cert.nom_certification,
  cert.type,
  cert.statut,
  cert.date_obtention,
  cert.date_previsionnelle,
  date_trunc('month', cert.date_obtention) as mois_obtention
from certifications cert
join consultants c on c.id = cert.consultant_id
where c.actif = true and c.hide_for_community = false
  and (
    cert.statut = 'Obtenue'
    or cert.statut in ('Planifiée', 'À retenter')
  );

-- ============================================================
-- FONCTION : demander_voucher(certification_id)
-- Implémente la logique métier §1.4 de la doc Salesforce
-- Retourne un jsonb avec { statut, message, voucher_code? }
-- Statuts possibles : accreditation | repassage | multi-demande |
--                     limite | indisponible | attribue
-- ============================================================
create or replace function demander_voucher(p_certification_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_cert          certifications%rowtype;
  v_consultant    consultants%rowtype;
  v_voucher       vouchers%rowtype;
  v_autre_en_cours integer;
begin
  -- Charger la certification
  select * into v_cert from certifications where id = p_certification_id;
  if not found then
    return jsonb_build_object('statut', 'erreur', 'message', 'Certification introuvable.');
  end if;

  -- Charger le consultant
  select * into v_consultant from consultants where id = v_cert.consultant_id;

  -- Cas 1 : Accréditation → note de frais
  if v_cert.type = 'Accreditation' then
    return jsonb_build_object('statut', 'accreditation',
      'message', 'Les accréditations passent par une note de frais. Un email a été envoyé au responsable.');
  end if;

  -- Cas 2 : À retenter → repassage note de frais
  if v_cert.statut = 'À retenter' then
    return jsonb_build_object('statut', 'repassage',
      'message', 'Le repassage d''une certification ratée passe par une note de frais. Un email a été envoyé.');
  end if;

  -- Cas 3 : Multi-demande (une autre cert Planifiée ou À retenter)
  select count(*) into v_autre_en_cours
  from certifications
  where consultant_id = v_cert.consultant_id
    and id != p_certification_id
    and statut in ('Planifiée', 'À retenter');

  if v_autre_en_cours > 0 then
    return jsonb_build_object('statut', 'multi-demande',
      'message', 'Tu as déjà une certification en cours. Obtiens-la d''abord avant d''en démarrer une nouvelle.');
  end if;

  -- Cas 4 : Limite annuelle (4 vouchers/an)
  if v_consultant.vouchers_annee_civile >= 4 then
    return jsonb_build_object('statut', 'limite',
      'message', 'Tu as atteint la limite de 4 vouchers par an. Un email a été envoyé au responsable.');
  end if;

  -- Cas 5 : Chercher un voucher disponible dans la fenêtre de validité
  select * into v_voucher
  from vouchers
  where statut = 'Disponible'
    and (date_debut_validite is null or date_debut_validite <= v_cert.date_previsionnelle)
    and (date_fin_validite   is null or date_fin_validite   >= v_cert.date_previsionnelle)
  order by date_fin_validite asc nulls last
  limit 1;

  if not found then
    return jsonb_build_object('statut', 'indisponible',
      'message', 'Aucun voucher disponible pour ta date de passage. Un email a été envoyé au responsable.');
  end if;

  -- Cas 6 : Attribuer le voucher (transaction atomique)
  update vouchers set
    statut           = 'Attribué',
    consultant_id    = v_cert.consultant_id,
    certification_id = p_certification_id,
    date_attribution = current_date,
    date_expiration  = v_cert.date_previsionnelle,
    updated_at       = now()
  where id = v_voucher.id;

  update certifications set
    voucher_id = v_voucher.id,
    updated_at = now()
  where id = p_certification_id;

  -- Incrémenter le compteur annuel
  update consultants set
    vouchers_annee_civile = vouchers_annee_civile + 1,
    updated_at            = now()
  where id = v_cert.consultant_id;

  return jsonb_build_object(
    'statut',       'attribue',
    'voucher_code', v_voucher.code,
    'date_debut',   v_voucher.date_debut_validite,
    'date_fin',     v_voucher.date_fin_validite,
    'message',      'Voucher attribué ! Ton code : ' || v_voucher.code
  );
end;
$$;

-- ============================================================
-- FONCTION : bench_assignment()
-- Équivalent BenchAssignmentSchedulerJob (appelée par cron Vercel)
-- Affecte au BENCH tout consultant actif sans aucune mission
-- ============================================================
create or replace function bench_assignment()
returns integer   -- nombre de consultants affectés au bench
language plpgsql
security definer
as $$
declare
  v_bench_id  uuid;
  v_count     integer := 0;
  v_consultant_id uuid;
begin
  -- Récupérer le projet BENCH
  select id into v_bench_id from projets where nom = 'BENCH' and est_special = true limit 1;
  if v_bench_id is null then return 0; end if;

  -- Consultants actifs visibles sans aucune mission
  for v_consultant_id in
    select c.id from consultants c
    where c.actif = true and c.hide_for_community = false
      and not exists (
        select 1 from missions m where m.consultant_id = c.id
      )
  loop
    insert into missions (projet_id, consultant_id, statut)
    values (v_bench_id, v_consultant_id, 'Bench')
    on conflict (projet_id, consultant_id) do nothing;
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

-- ============================================================
-- FONCTION : reset_vouchers_annee_civile()
-- Appelée par cron Vercel le 1er janvier
-- ============================================================
create or replace function reset_vouchers_annee_civile()
returns void
language sql
security definer
as $$
  update consultants set vouchers_annee_civile = 0, updated_at = now();
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- Accès public en lecture, écriture authentifiée
-- (Supabase Auth : tout utilisateur connecté peut écrire)
-- ============================================================
alter table consultants         enable row level security;
alter table certifications      enable row level security;
alter table vouchers            enable row level security;
alter table ressources          enable row level security;
alter table projets             enable row level security;
alter table missions            enable row level security;
alter table nom_certifications  enable row level security;
alter table email_settings      enable row level security;

-- Lecture publique pour toutes les tables (portail authentifié côté app, pas Supabase Auth)
create policy "lecture publique consultants"        on consultants        for select using (true);
create policy "lecture publique certifications"     on certifications     for select using (true);
create policy "lecture publique vouchers"           on vouchers           for select using (true);
create policy "lecture publique ressources"         on ressources         for select using (true);
create policy "lecture publique projets"            on projets            for select using (true);
create policy "lecture publique missions"           on missions           for select using (true);
create policy "lecture publique nom_certifications" on nom_certifications for select using (true);
create policy "lecture publique email_settings"     on email_settings     for select using (true);

-- Écriture : authentifié Supabase (magic link email)
create policy "ecriture auth consultants"       on consultants        for all using (auth.role() = 'authenticated');
create policy "ecriture auth certifications"    on certifications     for all using (auth.role() = 'authenticated');
create policy "ecriture auth vouchers"          on vouchers           for all using (auth.role() = 'authenticated');
create policy "ecriture auth ressources"        on ressources         for all using (auth.role() = 'authenticated');
create policy "ecriture auth projets"           on projets            for all using (auth.role() = 'authenticated');
create policy "ecriture auth missions"          on missions           for all using (auth.role() = 'authenticated');
create policy "ecriture auth email_settings"    on email_settings     for all using (auth.role() = 'authenticated');

-- nom_certifications : lecture seule pour tous, modifiable uniquement via service role
create policy "no ecriture nom certifications"  on nom_certifications for all using (false);

-- ============================================================
-- DONNÉES INITIALES : liste des certifications (Global Value Set)
-- Source : NomCertification.globalValueSet-meta.xml
-- Certifications Salesforce officielles (préfixe "Salesforce Certified")
-- Accréditations (suffixe "Accredited Professional")
-- ============================================================
insert into nom_certifications (nom, categorie, ordre) values
-- Certifications Admin & Dev
('Salesforce Certified Administrator', 'Certification', 1),
('Salesforce Certified Advanced Administrator', 'Certification', 2),
('Salesforce Certified Platform App Builder', 'Certification', 3),
('Salesforce Certified Platform Developer I', 'Certification', 4),
('Salesforce Certified Platform Developer II', 'Certification', 5),
('Salesforce Certified JavaScript Developer I', 'Certification', 6),
-- Architect
('Salesforce Certified Application Architect', 'Certification', 10),
('Salesforce Certified System Architect', 'Certification', 11),
('Salesforce Certified Technical Architect', 'Certification', 12),
('Salesforce Certified Data Architecture & Management Designer', 'Certification', 13),
('Salesforce Certified Sharing and Visibility Designer', 'Certification', 14),
('Salesforce Certified Integration Architecture Designer', 'Certification', 15),
('Salesforce Certified Identity and Access Management Designer', 'Certification', 16),
('Salesforce Certified Development Lifecycle and Deployment Designer', 'Certification', 17),
-- Consultant
('Salesforce Certified Sales Cloud Consultant', 'Certification', 20),
('Salesforce Certified Service Cloud Consultant', 'Certification', 21),
('Salesforce Certified Experience Cloud Consultant', 'Certification', 22),
('Salesforce Certified Field Service Consultant', 'Certification', 23),
('Salesforce Certified Education Cloud Consultant', 'Certification', 24),
('Salesforce Certified Nonprofit Cloud Consultant', 'Certification', 25),
('Salesforce Certified Health Cloud Consultant', 'Certification', 26),
('Salesforce Certified Financial Services Cloud Consultant', 'Certification', 27),
('Salesforce Certified Marketing Cloud Consultant', 'Certification', 28),
('Salesforce Certified Pardot Consultant', 'Certification', 29),
('Salesforce Certified CPQ Specialist', 'Certification', 30),
('Salesforce Certified Data Cloud Consultant', 'Certification', 31),
('Salesforce Certified Business Analyst', 'Certification', 32),
-- Marketing & AI
('Salesforce Certified Marketing Cloud Email Specialist', 'Certification', 35),
('Salesforce Certified Marketing Cloud Administrator', 'Certification', 36),
('Salesforce Certified Marketing Cloud Developer', 'Certification', 37),
('Salesforce Certified Marketing Cloud Account Engagement Specialist', 'Certification', 38),
('Salesforce Certified AI Associate', 'Certification', 40),
('Salesforce Certified AI Specialist', 'Certification', 41),
('Salesforce Certified Agentforce Specialist', 'Certification', 42),
-- Analytics
('Salesforce Certified Associate', 'Certification', 45),
('Salesforce Certified Tableau CRM & Einstein Discovery Consultant', 'Certification', 46),
-- Accréditations
('Advanced Field Service Accredited Professional', 'Accreditation', 100),
('Advanced Billing Accredited Professional', 'Accreditation', 101),
('B2B Solution Architect Accredited Professional', 'Accreditation', 102),
('B2C Solution Architect Accredited Professional', 'Accreditation', 103),
('Consumer Goods Cloud Accredited Professional', 'Accreditation', 104),
('Energy & Utilities Cloud Accredited Professional', 'Accreditation', 105),
('Gonexa Doc Accredited Professional', 'Accreditation', 106),
('Industries CPQ Accredited Professional', 'Accreditation', 107),
('Manufacturing Cloud Accredited Professional', 'Accreditation', 108),
('MuleSoft Accredited Integration Architect', 'Accreditation', 109),
('Net Zero Cloud Accredited Professional', 'Accreditation', 110),
('OmniStudio Developer Accredited Professional', 'Accreditation', 111),
('Public Sector Solutions Accredited Professional', 'Accreditation', 112),
('Revenue Cloud Accredited Professional', 'Accreditation', 113),
('Salesforce Billing Accredited Professional', 'Accreditation', 114),
('Salesforce Connect Accredited Professional', 'Accreditation', 115),
('Salesforce for Slack Accredited Professional', 'Accreditation', 116),
('Slack Ambassador Accredited Professional', 'Accreditation', 117),
('Vlocity Insurance Accredited Professional', 'Accreditation', 118)
on conflict (nom) do nothing;
