# AGENTS.md — Zigbee for Domoticz Web UI (Domoticz-Zigbee-UI)

## 🎯 Purpose of this File

This file provides **mandatory guidance for AI coding agents** working on the
**Domoticz-Zigbee-UI** repository, the Angular front end for the
[Zigbee for Domoticz](https://github.com/zigbeefordomoticz/Domoticz-Zigbee)
plugin.

Its goals:
- Provide architecture and runtime context
- Prevent changes that cannot build or that break the published UI
- Keep the front end aligned with the plugin's REST API
- Preserve the translation contract across six languages

Agents **must read and follow this file before proposing changes**.

Its sibling in the plugin repository is
[`AGENTS.md` in Domoticz-Zigbee](https://github.com/zigbeefordomoticz/Domoticz-Zigbee/blob/stable9/AGENTS.md).
`CLAUDE.md` in this repository is the deeper technical reference; this file is
the set of rules.

---

## ✅ Agent Quick Checklist (Read First)

Before writing or proposing any code change, verify ALL of the following:

### Environment
- [ ] Node.js **20** (Angular 17 does not support newer majors; CI builds on 20)
- [ ] Target branch is `beta`
- [ ] `npm run lint` passes
- [ ] `npm run build` passes

### Architecture
- [ ] Feature areas stay lazy-loaded `NgModule`s registered via `Shell.childRoutes()`
- [ ] All REST calls go through `src/app/services/api.service.ts` — never
      `HttpClient` directly from a component
- [ ] No back-end or Zigbee logic here; that belongs in the plugin repository

### Translations
- [ ] Every new user-visible string has a key in **all six** translation files
- [ ] Plugin settings use the **raw parameter name** as the key
- [ ] No key added to only `en-US.json`

### Dependencies
- [ ] No Angular major upgrade as a side effect of another change
- [ ] `package.json` and `package-lock.json` stay consistent
- [ ] No new runtime dependency without a clear need

### Deployment awareness
- [ ] You understand that **merging to `beta` publishes to `gh-pages`**

---

## 📌 Project Overview

- **What it is:** an Angular 17 single-page application, served by the plugin at
  `/z4d/`.
- **What it is not:** it contains no Zigbee logic, no Domoticz integration and
  no device handling. It is a client of the plugin's REST API.
- **Published artefact:** `dist/`, pushed to the `gh-pages` branch by CI.

The UI is useless without a running plugin. Any feature that needs data the
plugin does not already expose is a **two-repository change**.

---

## 🧠 High-Level Architecture (Actual Layout)

```
src/app/
├── core/          HTTP interceptors, i18n service, logger, route reuse strategy
├── shell/         Application frame wrapping all routes
├── services/      api.service.ts (every endpoint), header-service, version-service
├── shared/        Shared components, directives, models/
└── <feature>/     dashboard, device, group, network, admin, settings,
                   manufacturer, tools, about — each a lazy-loaded NgModule
```

- Routing: `src/app/app-routing.module.ts`, `PreloadAllModules`.
- API base path `/rest-z4d/1` comes from `environment.api_url` and is prepended
  by `core/http/api-prefix.interceptor.ts`. Opt out with
  `httpClient.disableApiPrefix()`.
- This is a **module-based** Angular app, not standalone components. Follow the
  existing pattern; do not convert parts of it to standalone piecemeal.

---

## 🌐 Relationship to the Plugin

The REST contract is defined by the plugin, in
`Classes/WebServer/WebServer.py`. The UI must follow it, not the other way
round.

- Endpoints are listed in the `routes` constant at the top of `api.service.ts`.
- If a response shape changes in the plugin, the model in
  `src/app/shared/models/` must change with it.
- **Do not invent endpoints.** If the data is not exposed, say so and propose
  the plugin-side change explicitly, rather than writing UI against an API that
  does not exist.
- When a change spans both repositories, state the ordering: the plugin side
  must ship first, or the UI will call a 404.

---

## 🗣️ Translation Discipline

Six languages ship: `en-US`, `fr-FR`, `de-DE`, `it-IT`, `nl-NL`, `es-ES`.

Rules:

1. **All six files or none.** A key added to `en-US.json` alone is a bug. ngx-translate
   falls back to printing the key itself, so the UI shows a raw identifier.
2. **Translations are compiled in, not loaded at runtime.** They are imported in
   `core/i18n.service.ts` and registered with `setTranslation`. Adding a
   *language* requires editing `i18n.service.ts`, `environment.ts` and
   `environment.prod.ts`.
3. **Plugin settings are keyed by their raw parameter name.** The settings
   screens pass the parameter name from the plugin's `Classes/PluginConf.py`
   straight to `translate`, so a parameter `enablegroupmanagement` needs a
   top-level `"enablegroupmanagement"` key. Theme cards use
   `setting.header.<Theme>` and `setting.subtitle.<Theme>`.
4. **The key namespace is flat and shared.** A parameter name appearing in two
   plugin themes shares one label across both screens. Check for collisions
   before wording a label.
5. Keys are added by **appending**; do not reorder or reformat the existing
   files. `fr-FR.json` in particular contains blank lines and trailing
   whitespace that a naive JSON round-trip will silently rewrite, producing a
   large unreviewable diff. Insert text; do not re-serialise.

---

## 📦 Dependency Discipline

The dependency state is **knowingly behind** and must be treated carefully.

- Angular is pinned at **17.3**, which is out of LTS. There are open
  runtime-scope advisories against `@angular/core`, `common`, `compiler` and
  `router`.
- `.github/dependabot.yml` **pins the Angular major and everything
  peer-dependent on it** with `versions:` ranges, because Dependabot otherwise
  proposes partial upgrades that cannot install. Those entries are deliberate
  and documented in the file.
- **Do not try to fix Dependabot's npm security pull request.** It cannot be made
  mergeable at Angular 17: `@angular-devkit/build-angular@17.3.17` exact-pins the
  advisory targets, so hoisting Angular to 22 is Dependabot's only resolution path
  and `npm ci` then fails with `ERESOLVE`. Four configuration approaches have been
  tried and all failed. Close the pull request; do not rebase it or edit
  `.github/dependabot.yml`. See *Why the development-scope advisories are stuck
  too* in `CLAUDE.md`.
- **Never bump an Angular package on its own.** Angular, `@angular-devkit`,
  `@angular-eslint`, `primeng`, `ng-bootstrap`, `ng-select`, `ngx-*` and
  `zone.js` move together or not at all. A PR that moves part of the set fails
  `npm ci` with `ERESOLVE`.
- The Angular upgrade is a **dedicated project**, done with `ng update`, one
  major at a time. There is an abandoned `angular19` branch (March 2025) that
  reached Angular 19 coherently and may be a useful starting point.
- When the upgrade happens, the `ignore` entries in `.github/dependabot.yml`
  must be removed as part of it.

---

## 🌿 `beta` Branch Discipline

- `beta` is the default and integration branch.
- **A push to `beta` deploys to `gh-pages`.** There is no staging step. Treat a
  merge as a release.
- Never commit directly to `beta`; always use a branch and a pull request.
- CI runs `npm ci`, `npm run lint` and `npm run build` on every pull request.
  A red pull request does not get merged.

---

## 🔀 Pull Request Discipline — One PR, One Change

- One logical change per pull request.
- A dependency bump, a refactor and a feature are three pull requests.
- Translation additions for one feature belong with that feature; a sweeping
  translation audit is its own pull request.
- Describe the change, the reasoning, and anything you did **not** do.
- If you discover an unrelated defect while working, report it; do not fold a
  silent drive-by fix into an unrelated pull request. The one exception is a
  pre-existing lint error that your change makes CI fail on — fix it and say so.

---

## 🧪 Testing Reality

There is **no test suite**. There are zero `.spec.ts` files and `angular.json`
defines no `test` target, so the `test` and `test:ci` scripts in `package.json`
cannot run.

Consequences for agents:
- Do not claim a change is "tested" because scripts exist.
- `npm run lint` and `npm run build` are the only automated signals.
- For anything behavioural, say plainly that it needs manual verification
  against a running plugin, and say how.
- Adding real tests is welcome, but as its own pull request, including the
  `angular.json` `test` target and the dev dependencies it needs.

---

## 🚨 What NOT To Do (Summary)

- ❌ Do not bump Angular, or any Angular-coupled package, outside a dedicated
  upgrade pull request
- ❌ Do not add a translation key to only one language file
- ❌ Do not re-serialise the translation JSON files; append text instead
- ❌ Do not call `HttpClient` from a component; go through `api.service.ts`
- ❌ Do not invent REST endpoints the plugin does not expose
- ❌ Do not add Zigbee, Domoticz or device logic to this repository
- ❌ Do not commit your local `proxy.conf.js` target address
- ❌ Do not commit directly to `beta` — it publishes
- ❌ Do not claim tests pass; there are none
- ❌ Do not bundle unrelated changes into one pull request
- ❌ Do not try to make Dependabot's npm security pull request mergeable; close it
