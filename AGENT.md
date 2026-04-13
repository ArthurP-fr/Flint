# AGENT.md - Guide du projet template_discordjs

Version: 2.0

But
---
Ce fichier decrit la structure actuelle du projet, les conventions d'architecture et le workflow recommande pour contribuer sans introduire de dette technique.

Vue d'ensemble
--------------
- Stack: TypeScript + Discord.js 14.
- Build: esbuild + typecheck TypeScript strict.
- Localisation: `src/i18n/en.json`, `src/i18n/fr.json`, `src/i18n/es.json`.
- Base de donnees: PostgreSQL, stores injectes via lifecycle centralise.

Organisation des dossiers
-------------------------
- Racine:
  - `package.json`, `tsconfig.json`, `Dockerfile`, `docker-compose.yml`.
- `src/app/`
  - `bootstrap.ts`: wiring des dependances, init DB, handlers, shutdown.
  - `container.ts`: contrats de services injectes.
- `src/commands/`
  - Wrappers de commandes uniquement.
  - Chaque fichier retourne une commande via `defineCommand(...)`.
  - Aucune logique metier lourde dans cette couche.
- `src/features/`
  - `presence/`: orchestration panel, runtime, service, repository contract.
  - `memberMessages/`: orchestration panel, dispatch, image rendering, repository contract.
- `src/core/`
  - `commands/`: parser, registry, slash builder, usage.
  - `execution/`: pipeline d'execution des commandes.
  - `discord/`: helpers partages (resolveReplyMessage, session registry).
- `src/database/`
  - `stores/`: implementations PostgreSQL concretes.
  - `dbLifecycle.ts`: init/shutdown centralise.
- `src/validators/`
  - Validation et sanitation metier (presence, member messages).
- `src/types/`
  - Types purs partages (pas de logique metier).
- `src/events/`
  - Enregistrement des listeners Discord, relies aux services injectes.
- `src/handlers/`
  - Entrees prefix/slash et adaptation du contexte d'execution.
- `src/utils/`
  - Utilitaires generiques transverses.

Principes d'architecture
------------------------
- Commands UI only:
  - Une commande ne fait que declarer `meta/args/examples` et deleguer `execute`.
- Features own business logic:
  - Toute logique metier testable va dans `src/features/*`.
- Core is shared infra:
  - Helpers communs Discord, execution pipeline, parser, registry.
- Validators isolate rules:
  - Les regles de validation/sanitation ne vont pas dans `src/types`.
- Database via repository contracts:
  - Les features dependent d'interfaces, pas de singletons globaux.
- Bootstrap owns lifecycle:
  - Init/shutdown DB et services centralises dans `src/app/bootstrap.ts`.

Conventions de code
-------------------
- TypeScript strict obligatoire.
- Exports nommes preferes.
- Fichiers en lowerCamelCase.
- Commentaires courts uniquement pour clarifier un bloc non trivial.
- Eviter tout couplage direct d'une feature vers une autre sans passer par contrats explicites.

Procedure: ajouter une commande
--------------------------------
1. Creer un wrapper dans `src/commands/`.
2. Declarer la commande avec `defineCommand({ ... })`.
3. Deleguer `execute` vers un module `src/features/...`.
4. Ajouter la commande dans `createCommandList` (`src/commands/index.ts`).
5. Ajouter les cles i18n dans `src/i18n/*.json`.
6. Ajouter les tests cibles (`tests/`) selon la logique introduite.

Procedure: ajouter une feature
------------------------------
1. Creer `src/features/<feature>/`.
2. Definir les contrats repository dans la feature.
3. Implementer le service metier independant de Discord quand possible.
4. Ajouter/adapter le store PostgreSQL sous `src/database/stores/`.
5. Cablage d'injection dans `src/app/bootstrap.ts`.
6. Ajouter tests unitaires et, si necessaire, integration.

Tests et verification
---------------------
- Verification minimale avant PR:
  - `npm run typecheck`
  - `npm test`
- En cas de refactor de structure:
  - verifier README + AGENT.md + i18n + imports.

Securite
--------
- Ne jamais committer de secrets.
- `.env*` (sauf `.env.example`) doit rester ignore.
- Eviter d'exposer des credentials dans logs/scripts de debug.
