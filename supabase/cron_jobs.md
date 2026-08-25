# Jobs planifiés — équivalents des Flows/Schedulable Salesforce

Ces jobs remplacent les automatismes Apex Scheduled et les Flows planifiés.
Ils s'exécutent via **Vercel Cron** (fichier `vercel.json`) qui appelle des
API Routes dans `/api/`.

## Jobs configurés

| Job Salesforce | Équivalent | Fréquence | Route API |
|---|---|---|---|
| `SCHFL_Certif_Rappel_ARetenter` | Certifications Planifiées dépassées → À retenter | Quotidien 07:00 | `POST /api/cron/rappel-certification` |
| `SCHFL_Certif_Repasse_Planifiee` | Certifications À retenter avec date future → Planifiée | Quotidien 07:05 | `POST /api/cron/repasse-planifiee` |
| `SCHFL_Voucher_Utilise` | Vouchers Attribués expirés → Utilisé | Quotidien 07:10 | `POST /api/cron/voucher-expire` |
| `SCHFL_Certif_BonneChance_Jour` | Email bonne chance le jour du passage | Quotidien 06:00 | `POST /api/cron/bonne-chance` |
| `VoucherExpirationSchedulerJob` | Email récap vouchers expirant bientôt | 1er du mois 06:00 | `POST /api/cron/voucher-expiration-recap` |
| `BenchAssignmentSchedulerJob` | Consultants sans mission → BENCH | Quotidien 02:00 | `POST /api/cron/bench-assignment` (appelle `bench_assignment()` SQL) |
| Reset vouchers annuel | Reset `vouchers_annee_civile = 0` | 1er jan 00:00 | `POST /api/cron/reset-vouchers` |

## Emails transactionnels (Resend)

Remplacent `CertificationEmailService` Apex.
Provider : **Resend** (https://resend.com, gratuit jusqu'à 3 000 emails/mois).

Configuration dans Supabase : table `email_settings` (enregistrement id=1).

## vercel.json (à créer à la racine)

```json
{
  "crons": [
    { "path": "/api/cron/bench-assignment",       "schedule": "0 2 * * *"   },
    { "path": "/api/cron/bonne-chance",           "schedule": "0 6 * * *"   },
    { "path": "/api/cron/rappel-certification",   "schedule": "0 7 * * *"   },
    { "path": "/api/cron/repasse-planifiee",      "schedule": "5 7 * * *"   },
    { "path": "/api/cron/voucher-expire",         "schedule": "10 7 * * *"  },
    { "path": "/api/cron/voucher-expiration-recap","schedule": "0 6 1 * *"  },
    { "path": "/api/cron/reset-vouchers",         "schedule": "0 0 1 1 *"   }
  ]
}
```

## Note sur les emails

Les routes `/api/cron/*` appellent Supabase pour requêter les données,
puis Resend pour envoyer les emails. La logique métier est identique
à `CertificationEmailService.java` — seul le runtime change (Node.js/Vercel
au lieu d'Apex/Salesforce).

À implémenter avec Claude Code lors de la phase suivante.
