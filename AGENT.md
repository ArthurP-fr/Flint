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
- `src/modules/`
  - `help/`: module help (service + commande).
  - `presence/`: point d'entree module presence (services et contrats).
  - `memberMessages/`: point d'entree module member messages (services et contrats).
- `src/features/`
  - Implementation interne des modules (detail technique derriere `src/modules/*`).
- `src/core/`
  - `commands/`: parser, registry, slash builder, usage.
  - `execution/`: pipeline d'execution des commandes (dispatch local/worker, cooldown/rate-limit stores).
  - `runtime/`: coordination multi-instance (leader election / startup locks).
  - `logging/`: logger structure JSON (`pino`).
  - `discord/`: helpers partages (resolveReplyMessage, session registry).
- `src/database/`
  - `stores/`: implementations PostgreSQL concretes.
  - `migrations/`: fichiers SQL versionnes appliques via `npm run migrate`.
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
- Modules own business logic:
  - Toute logique metier testable va dans `src/modules/*` (les wrappers `src/commands/*` restent minces).
- Core is shared infra:
  - Helpers communs Discord, execution pipeline, parser, registry.
- Execution pipeline is decoupled:
  - Parsing reste dans `src/handlers/*`.
  - Dispatch est route par `src/core/execution/dispatch.ts` (`local` ou `worker`).
  - Execution metier passe par `CommandExecutor` avec stores abstraits (memory/Redis).
- Contexts are split for low coupling:
  - `ExecutionContext` (core), `TransportContext` (Discord), `I18nContext` (localization).
  - `CommandExecutionContext` conserve des alias legacy pour ne pas casser les commandes existantes.
- Validators isolate rules:
  - Les regles de validation/sanitation ne vont pas dans `src/types`.
- Database via repository contracts:
  - Les modules dependent d'interfaces, pas de singletons globaux.
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
3. Deleguer `execute` vers un module `src/modules/...`.
4. Ajouter la commande dans `createCommandList` (`src/commands/index.ts`).
5. Ajouter les cles i18n dans `src/i18n/*.json`.
6. Ajouter les tests cibles (`tests/`) selon la logique introduite.

Procedure: ajouter une feature
------------------------------
1. Creer `src/modules/<feature>/`.
2. Definir les contrats repository dans la feature.
3. Implementer le service metier independant de Discord quand possible.
4. Ajouter/adapter le store PostgreSQL sous `src/database/stores/`.
5. Ajouter une migration SQL versionnee dans `database/migrations/`.
6. Cablage d'injection dans `src/app/bootstrap.ts`.
7. Ajouter tests unitaires et, si necessaire, integration.

Tests et verification
---------------------
- Verification minimale avant PR:
  - `npm run migrate`
  - `npm run typecheck`
  - `npm test`
- En cas de refactor de structure:
  - verifier README + AGENT.md + i18n + imports.

Securite
--------
- Ne jamais committer de secrets.
- `.env*` (sauf `.env.example`) doit rester ignore.
- Eviter d'exposer des credentials dans logs/scripts de debug.
