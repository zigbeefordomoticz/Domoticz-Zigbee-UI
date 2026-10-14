# CLAUDE.md

Technical reference for working in this repository.

**`AGENTS.md` holds the mandatory rules — read it first.** This file is the
detail behind them: how the app is wired, where things live, and how to carry
out the tasks that come up most often.

---

## Project Overview

`Domoticz-Zigbee-UI` is the Angular 21 web interface for the
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
  single list of endpoints (58).
- **Interceptor-applied base path.** `environment.api_url` is `/rest-z4d/1`.
  `api-prefix.interceptor.ts` prepends it to every request. Absolute URLs (for
  example log downloads) opt out with `httpClient.disableApiPrefix()`.
- **Compiled-in translations.** See the translations section; this is not the
  usual ngx-translate HTTP loader setup.

### Feature areas

| Route           | Module         | Purpose                                             |
| --------------- | -------------- | --------------------------------------------------- |
| `/`             | `dashboard`    | Traffic, health, battery, optimisation summary      |
| `/device`       | `device`       | Device list, detail, per-device parameters          |
| `/group`        | `group`        | Zigbee group creation and membership                |
| `/network`      | `network`      | Topology, mesh graph, interference reports          |
| `/admin`        | `admin`        | Coordinator administration, OTA firmware            |
| `/settings`     | `settings`     | Plugin settings editor                              |
| `/manufacturer` | `manufacturer` | Vendor panels: CASA.iA, ZLinky, TICmeter, Chameleon |
| `/tools`        | `tools`        | Diagnostics, raw commands, binding, debug settings  |
| `/about`        | `about`        | About pages                                         |

---

## Development Workflow

### Initial setup

```bash
npm install
```

**Node.js 22.** Angular 21 requires `^20.19.0 || ^22.12.0 || >=24.0.0`, and CI
builds on 22. Node 20 reached end of life on 2026-04-30; do not use it.

> **A local build's output is not comparable to CI's.** On a newer Node the
> toolchain still builds, but it emits different `main.js` and `runtime.js` than
> CI does. Lint and compile errors are reproduced faithfully; the emitted
> bundle is not.
>
> So never answer a question about _deployed_ output by diffing a local `dist/`
> against the `gh-pages` branch — the Node version alone will make the hashes
> differ, and it looks exactly like a real change. This mistake was made in
> #246: a Node 24 local build was compared against the live CI output, the
> differing `main.js`/`runtime.js` hashes were attributed to the dependency
> bump, and the pull request shipped a confident warning that the change was
> "not deployment-neutral". The deploy then reported `There is nothing to
commit` — CI's output was byte-identical and nothing reached users. See the
> correction comment on #246.
>
> The authoritative check is the `Deploy` step's own log on a push to `beta`:
> `There is nothing to commit` means the bundle did not change, and a new
> `gh-pages` commit means it did.

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

`.github/workflows/build.yml`, Node 22:

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

So translations are **compiled into the bundle**. Adding a _language_ means
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

- **Angular 21.2, on Node 22.** The 17 → 21 upgrade landed in October 2026 as
  five pull requests (#259, #260, #261, #262 and the merge to `beta`).
- **There are no open advisories against `@angular/core`, `common`, `compiler`
  or `router`.** That was the point of the upgrade, and it worked. Before it
  there were 23.
- **The remaining advisories are development-scope and currently unfixable by
  anyone.** They all trace back to `braces`, whose latest release (3.0.3) is
  itself the vulnerable one, so there is no version to upgrade to. The chain is
  `braces` → `micromatch` → `fast-glob` → `globby` → `@typescript-eslint/*`,
  `stylelint`, `lint-staged`, `chokidar` → `webpack-dev-server` →
  `@angular-devkit/build-angular`. `npm audit fix` reshuffles the lockfile and
  clears nothing. Do not go hunting for a fix; there is not one yet.
- **`.github/dependabot.yml` no longer pins anything.** The `ignore` block and
  the group's `exclude-patterns` both existed only because Angular was stuck at
  17.3, and both were removed with the upgrade. Do not reintroduce them without
  a reason that will still be true in six months; the history of why they were
  a trap is in the closing comments on #247, #250 and #255.
- **Security updates are grouped** into one pull request via the `npm-security`
  group rather than one per advisory.
- **Never move an Angular-coupled package on its own.** Angular,
  `@angular-devkit`, `@angular-eslint`, `primeng`, `ng-bootstrap`, `ng-select`,
  `ngx-*` and `zone.js` move together or not at all.

### Angular 22 is the next step, and it is blocked

Angular 22 is current. This project is deliberately one major behind, for one
reason: **`ngx-toastr` has no Angular 22 release.** Its latest (20.0.5) peers
`@angular/core: ^21.0.0`.

Expect Dependabot to raise a red Angular 22 version-update pull request in the
`angular` group. **That is not a bug and should not be suppressed** — it is the
reminder that this is the next piece of work. Close it, or leave it, but do not
add an `ignore` entry for it.

The rest of the ecosystem has already moved, which is worth knowing:

- `@ng-select/ng-select` is pinned to **exactly `23.0.0`**, with no range.
  That is the only release in its 23.x line that peers Angular 21; 23.0.1
  through 23.11.0 all peer `^22.0.0`. A caret range resolves to 23.11.0 and
  fails `npm ci` with `ERESOLVE`.
- `primeng`, `@ng-bootstrap/ng-bootstrap` and `@angular/cdk` all have Angular 22
  releases ready.

So the Angular 22 step should be small — one `ng update`, the coupled set moved
together, and `ng-select` freed from its exact pin. It waits on `ngx-toastr`.

### What the 17 → 21 upgrade taught, for next time

Worth reading before attempting 22:

- **Pin every `@angular/*` package to an exact version** on the `ng update`
  command line. Pinning only `core` and `cli` let the others resolve to the
  newest major and aborted the migration in a wall of peer conflicts; pinning by
  major still picked odd older patches for `animations` and
  `platform-browser-dynamic`.
- **`@angular-eslint` must move in the same command.** It pins `@angular/cli` to
  a version range, and the whole migration aborts before doing anything if it is
  left behind.
- **Check which dependencies actually block the target** rather than moving
  everything. At each step only three did, and `primeng` was able to skip
  Angular 18 entirely because its 17.x peers `^17 || ^18`.
- **PrimeNG theming moved twice.** `primeng/resources` (prebuilt CSS, gone in 18) → `@primeng/themes` (19) → `@primeuix/themes` (20+). The repository now
  uses styled mode: the `Lara` preset via `providePrimeNG()` in
  `app.module.ts`, with `cssLayer` set to `{ name: 'primeng', order: 'bootstrap,
primeng' }` so the `@layer bootstrap, primeng` declaration in `main.scss`
  keeps working. Bootstrap will start winning cascade fights if that is lost.
- **Check how a migration interacts with anything this repository overrides.**
  The v18 migration replaced `HttpClientModule` with
  `provideHttpClient(withInterceptorsFromDi())` and appended it to the
  `providers` arrays of `AppModule` and `CoreModule`. That shipped a build in
  which **every REST call lost its `/rest-z4d/1` prefix**, hit the plugin's SPA
  fallback and failed with `Http failure during parsing` on a status 200 that
  was really `index.html`. Nothing rendered any data. See #265.

  The cause was provider ordering. `HttpClientModule` used to sit in `imports`,
  and an NgModule's imported providers are flattened **before** its own
  `providers`, so `CoreModule`'s `{ provide: HttpClient, useClass: HttpService }`
  came last and won. Moved into `providers` _after_ that override,
  `provideHttpClient` supplies its own `HttpClient` and wins instead —
  bypassing `HttpService`, which is what chains `ApiPrefixInterceptor`.

  **So: `provideHttpClient()` must be listed before the `HttpClient` override in
  `core.module.ts`, and `app.module.ts` must not call it at all.** Nothing in
  the type system or the build enforces this and the failure is silent, so both
  files carry a comment saying so. If you are ever debugging requests that 200
  with HTML, check this first.

- **`npm install` triggers the `postinstall` prettier script**, which reformats
  unrelated files that have drifted — `src/app/about/*.html` and
  `.eslintrc.json` in particular. Use `npm install --ignore-scripts`, as CI
  does, or the diff fills with noise. Reverting a whole directory to clean it up
  will also throw away that directory's legitimate migration, which happened
  twice during this upgrade.

### Two angular-eslint rules are switched off on purpose

Both are recorded with their reasons in `.eslintrc.json`. Do not run
`eslint --fix` expecting them to be harmless:

- **`prefer-standalone`** (arrived in angular-eslint 19) reports all 59
  `standalone: false` flags. `--fix` would strip them and break the build. This
  application is module-based by design; see `AGENTS.md`.
- **`prefer-inject`** (arrived in angular-eslint 20) reports 181 constructor
  injection sites across 52 files. Converting them is a codebase-wide style
  refactor, not a version bump. The schematic is
  `ng generate @angular/core:inject` if it is ever taken on deliberately.

ESLint itself is still **8.57 with `.eslintrc.json`**. `angular-eslint` 21 peers
`eslint ^8.57.0 || ^9.0.0 || ^10.0.0`, so the flat-config migration was never
forced and remains available as its own change.

### Deprecated packages still in use

Neither blocks anything; both are their own small change:

- **`@angular/platform-browser-dynamic`** — deprecated in favour of
  `@angular/platform-browser`. `src/main.ts` calls `platformBrowserDynamic()`;
  the replacement is `platformBrowser()`, a two-line change.
- **`@angular/animations`** — deprecated in favour of `animate.enter` /
  `animate.leave`. Still required by `BrowserAnimationsModule`, which
  `app.module.ts` imports, so this one waits for an Angular release that does
  not need it.

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
- Angular: 21.2
- Node: 22
- Languages: en-US, fr-FR, de-DE, it-IT, nl-NL, es-ES
