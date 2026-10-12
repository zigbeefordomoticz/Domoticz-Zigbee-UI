# CLAUDE.md

Technical reference for working in this repository.

**`AGENTS.md` holds the mandatory rules — read it first.** This file is the
detail behind them: how the app is wired, where things live, and how to carry
out the tasks that come up most often.

---

## Project Overview

`Domoticz-Zigbee-UI` is the Angular 17 web interface for the
[Zigbee for Domoticz](https://github.com/zigbeefordomoticz/Domoticz-Zigbee)
plugin. It is a pure client: every piece of data comes from the plugin's REST
API, and the repository contains no Zigbee, Domoticz or device logic.

- Served by the plugin at `/z4d/` (hence `--base-href /z4d/` in the build).
- Built to `dist/`, published to the `gh-pages` branch by CI.
- Default branch: `beta`. **Merging to `beta` deploys.**

---

## Architecture Overview

```
src/
├── app/
│   ├── core/
│   │   ├── http/
│   │   │   ├── api-prefix.interceptor.ts   prepends environment.api_url
│   │   │   ├── cache.interceptor.ts        opt-in GET caching
│   │   │   ├── error-handler.interceptor.ts
│   │   │   ├── http-cache.service.ts
│   │   │   └── http.service.ts             extends HttpClient with
│   │   │                                   disableApiPrefix() / cache()
│   │   ├── i18n.service.ts                 registers all six languages
│   │   ├── language.ts
│   │   ├── logger.service.ts               Logger('Context')
│   │   ├── route-reusable-strategy.ts
│   │   └── until-destroyed.ts
│   ├── shell/                              frame (nav/header) wrapping routes
│   ├── services/
│   │   ├── api.service.ts                  routes map + one method per endpoint
│   │   ├── header-service.ts               cross-component header state
│   │   └── version-service.ts
│   ├── shared/
│   │   ├── models/                         response/request interfaces
│   │   └── shared.module.ts
│   └── <feature>/                          lazy-loaded NgModule per area
├── translations/                           en-US, fr-FR, de-DE, it-IT, nl-NL, es-ES
└── environments/                           environment.ts, environment.prod.ts, .env.ts
```

### Key Design Patterns

- **Module-based, not standalone.** Every feature is an `NgModule` with its own
  routing module, lazy-loaded through `Shell.childRoutes()` in
  `app-routing.module.ts`, with `PreloadAllModules`. Keep to this; do not
  convert parts of the app to standalone components piecemeal.
- **One API surface.** Components inject `ApiService`; they never touch
  `HttpClient`. The `routes` constant at the top of `api.service.ts` is the
  single list of endpoints (57).
- **Interceptor-applied base path.** `environment.api_url` is `/rest-z4d/1`.
  `api-prefix.interceptor.ts` prepends it to every request. Absolute URLs (for
  example log downloads) opt out with `httpClient.disableApiPrefix()`.
- **Compiled-in translations.** See the translations section; this is not the
  usual ngx-translate HTTP loader setup.

### Feature areas

| Route | Module | Purpose |
| --- | --- | --- |
| `/` | `dashboard` | Traffic, health, battery, optimisation summary |
| `/device` | `device` | Device list, detail, per-device parameters |
| `/group` | `group` | Zigbee group creation and membership |
| `/network` | `network` | Topology and interference reports |
| `/admin` | `admin` | Coordinator administration, OTA firmware |
| `/settings` | `settings` | Plugin settings editor |
| `/manufacturer` | `manufacturer` | Vendor panels: CASA.iA, ZLinky, TICmeter, Chameleon |
| `/tools` | `tools` | Diagnostics, raw commands, binding, debug settings |
| `/about` | `about` | About pages |

---

## Development Workflow

### Initial setup

```bash
npm install
```

**Node.js 20.** Angular 17 does not support newer majors; CI builds on 20, and
Node 22/24 may fail locally.

### Point the dev proxy at a plugin

`npm start` will not return useful data until `proxy.conf.js` targets a running
plugin. Both contexts must point at the plugin's web server (default port
9440):

```js
const proxyConfig = [
  { context: '/rest-z4d/', target: 'http://<host>:9440', secure: false },
  { context: '/download/', target: 'http://<host>:9440', secure: false }
];
```

The committed value is someone's LAN address. Change it locally and **do not
commit yours back**.

### Everyday commands

```bash
npm start                # dev server on :4200 with the proxy
npm run lint             # ng lint + stylelint over src/**/*.scss
npm run build            # production build to dist/ with --base-href /z4d/
npm run prettier         # format src/**/*.{ts,js,html,scss}
npm run prettier:check   # list files that would change
npm run serve:sw         # build, then serve dist/ statically on :4200
```

A Husky `pre-commit` hook runs `npm run lint` and `pretty-quick --staged`.

### Testing

**There is no test suite.** Zero `.spec.ts` files exist and `angular.json`
defines no `test` target, so `npm test` and `npm run test:ci` fail. The only
automated signals are `npm run lint` and `npm run build`.

Never describe a change as tested on the strength of those scripts existing.
For behavioural changes, state what needs manual verification against a running
plugin and how to do it.

### CI/CD

`.github/workflows/build.yml`, Node 20:

- **On `pull_request` against `beta`:** `npm ci --ignore-scripts`,
  `npm run lint`, `npm run build`. The `Deploy` step is skipped.
- **On `push` to `beta`:** the same, then `Deploy` publishes `dist/` to the
  `gh-pages` branch via `JamesIves/github-pages-deploy-action` with
  `clean: true`.

The `Deploy` step is gated on
`github.event_name == 'push' && github.ref == 'refs/heads/beta'`, so a pull
request cannot publish. **A merge to `beta` is a release.**

The deploy action rsyncs `dist/` over the branch and excludes `CNAME`,
`.nojekyll`, `.ssh`, `.git` and `.github`, so those survive a deploy. If the
build output is byte-identical to what is live, the action reports
`There is nothing to commit` and exits early — that is success, not a failure.

---

## Talking to the Plugin

The contract is owned by the plugin, in `Classes/WebServer/WebServer.py`. The
UI follows it.

To add a call:

1. Add the path to the `routes` constant in `api.service.ts`.
2. Add a model under `src/app/shared/models/` matching the response.
3. Add a method returning `Observable<T>`, with
   `.pipe(map(...), catchError(error => this.handleError(error)))` as the
   existing methods do.

If the plugin does not expose the data, that is a **two-repository change**: the
plugin side ships first, or the UI calls a 404. Say so explicitly rather than
writing speculative client code.

---

## Translations

Six languages: `en-US`, `fr-FR`, `de-DE`, `it-IT`, `nl-NL`, `es-ES`, in
`src/translations/`.

### How they load

Not over HTTP. Each file is a static import in `core/i18n.service.ts`:

```ts
import enUS from '../../translations/en-US.json';
...
translateService.setTranslation('en-US', enUS);
```

So translations are **compiled into the bundle**. Adding a *language* means
editing three files: `core/i18n.service.ts`, `environment.ts` and
`environment.prod.ts` (the `supportedLanguages` array, which also names the flag
image under `src/assets/`).

### Adding keys

- Add to **all six** files. ngx-translate prints the key itself on a miss, so a
  key present only in `en-US.json` shows users a raw identifier.
- **Append**; do not reorder or reformat. `fr-FR.json` contains blank lines and
  trailing whitespace in its `manufacturer.*` region; a `json.load` →
  `json.dump` round-trip silently rewrites roughly a dozen unrelated lines. Edit
  as text.
- The files are not covered by the prettier script, which only matches
  `*.{ts,js,html,scss}`, so nothing will reformat them for you.

### The plugin-settings convention

This is the easiest thing to get wrong.

The settings screens use **the raw plugin parameter name as the translation
key**. `settings/setting/setting.component.html` and
`tools/debug-settings/debug-setting/debug-setting.component.html` both do:

```html
<label translate="{{ setting.Name }}"></label>
```

where `setting.Name` is the parameter name from the plugin's
`Classes/PluginConf.py` `SETTINGS` dictionary. So a parameter
`enablegroupmanagement` needs a top-level `"enablegroupmanagement"` key. Theme
cards use `setting.header.<Theme>` and `setting.subtitle.<Theme>`.

Which parameters reach the UI is decided by the plugin in
`WebServer.rest_Settings`: the `Reserved` and `PluginTransport` themes are never
sent, `VerboseLogging` goes only to the Tools debug page, everything else to the
Settings page, and any parameter marked `hidden: True` is dropped.

Two consequences:

- **The key namespace is flat and shared.** A parameter name used by two themes
  shares one label across both screens. `Livolo` and `Orvibo`, for example,
  exist in both the `Zigpy` theme and `VerboseLogging`, so one string serves a
  Zigpy endpoint toggle and a logging toggle. Check for collisions before
  wording a label.
- **A missing key is invisible in CI.** It renders as the parameter name. Audit
  by comparing `PluginConf.py` against the translation files, not by reading the
  diff.

### `.lingua`

`.lingua` configures the `chr33z.lingua-vscode` editor extension (recommended in
`.devcontainer/devcontainer.json`, configured in `.vscode/settings.json`). It is
not read by the build or by CI.

It lists only four languages (`fr`, `en`, `es`, `nl`) and predates the German
and Italian additions, so the extension's coverage view is incomplete. Adding
`de-DE` and `it-IT` entries would fix that; it has no effect on the application.

---

## Common Tasks

### Add a settings translation

1. Read the parameter out of the plugin's `Classes/PluginConf.py` `SETTINGS`.
2. Check it is actually reachable: not `hidden`, and not in a theme
   `rest_Settings` skips.
3. Work out what it does from the plugin call site, not from its name.
4. Append the key to all six translation files.
5. Check the name is not also a `VerboseLogging` parameter, or the label will
   appear on the debug page too.

### Add a feature screen

1. Create a lazy-loaded `NgModule` plus routing module under `src/app/<area>/`.
2. Register it in `app-routing.module.ts` inside `Shell.childRoutes()`.
3. Add the endpoint to `routes` and a method to `api.service.ts`.
4. Add a model under `shared/models/`.
5. Add every label to all six translation files.

### Debugging

- `Logger('Context')` from `@app/core` for scoped logging.
- `error-handler.interceptor.ts` centralises HTTP error handling; `ApiService`
  surfaces failures through `ToastrService`.
- The browser Network tab against `/rest-z4d/1/...` is usually the fastest way
  to tell a UI bug from a plugin bug.

---

## Dependency State

Read this before touching `package.json`.

- **Angular 17.3, out of LTS.** There are open runtime-scope advisories against
  `@angular/core`, `@angular/common`, `@angular/compiler` and `@angular/router`.
  They are real and are not fixable by a dependency bump in isolation.
- **Most open advisories are development-scope** — build toolchain packages that
  never reach a user of a statically built app. They matter far less than the
  runtime ones.
- **`.github/dependabot.yml` pins the Angular major** and everything
  peer-dependent on it (`primeng`, `ng-bootstrap`, `ng-select`, `ngx-*`,
  `zone.js`, `@angular-devkit/*`, `@angular-eslint/*`) using `versions:` ranges.

  The `versions:` form is deliberate and load-bearing: an `ignore` entry that
  specifies only `update-types` applies to version updates but **not** to
  security updates. An earlier attempt using `update-types` did not hold, and a
  grouped security PR bumped `@angular/core` from 17.3.12 to 22.2.2 while
  leaving `animations` at 20, `build-angular` at 21 and `angular-eslint` at 17 —
  four majors at once, failing `npm ci` with `ERESOLVE`.
- **Security updates are grouped** into a single pull request via the
  `npm-security` group, instead of one per advisory.
- **Never move an Angular-coupled package on its own.** The set moves together
  or not at all.

### The Angular upgrade

A dedicated project, not a dependency bump:

- Use `ng update`, **one major at a time** (17 → 18 → 19 → 20 → 21).
- Expect real code changes, not just version numbers: `primeng` 17 → 22,
  `ng-bootstrap` 16 → 21 and `ng-select` 12 → 24 all carry breaking API changes.
- There is an **abandoned `angular19` branch** (last commit March 2025, 10
  commits ahead of `beta` and well behind it) that reached Angular 19 coherently
  — `@angular/core` 19.2.3, `@angular/cli` 19.2.5, `primeng` 19.0.10,
  `zone.js` 0.15.0. Worth reading before starting from scratch.
- With no test suite, `npm run build` plus manual verification against a running
  plugin is the only safety net. Budget accordingly.
- **Remove the `ignore` entries from `.github/dependabot.yml` as part of the
  upgrade.** They suppress real Angular advisories and must not outlive their
  reason.

---

## Guidelines

- Read and follow `AGENTS.md` (mandatory).
- One logical change per pull request.
- `npm run lint` and `npm run build` must pass before you propose a change.
- Match the surrounding code: module-based Angular, `ApiService` for all calls,
  translations in all six files.
- Remember that merging to `beta` publishes to `gh-pages`.
- Be explicit about what you have verified and what you have not. With no tests
  in the repository, that distinction is the only thing a reviewer has.

---

## Useful References

- Plugin (REST API, settings): <https://github.com/zigbeefordomoticz/Domoticz-Zigbee>
- Plugin `AGENTS.md`: <https://github.com/zigbeefordomoticz/Domoticz-Zigbee/blob/stable9/AGENTS.md>
- Wiki: <https://zigbeefordomoticz.github.io/wiki/>
- Settings wiki page: <https://zigbeefordomoticz.github.io/wiki/en-eng/WebUI_Settings>

## Version & Branch Info

- Default / integration branch: `beta` (deploys on push)
- Published branch: `gh-pages`
- Angular: 17.3
- Node: 20
- Languages: en-US, fr-FR, de-DE, it-IT, nl-NL, es-ES
