[![Build](https://github.com/zigbeefordomoticz/Domoticz-Zigbee-UI/actions/workflows/build.yml/badge.svg?branch=beta)](https://github.com/zigbeefordomoticz/Domoticz-Zigbee-UI/actions/workflows/build.yml)

# Zigbee for Domoticz — Web UI

The web user interface for the [Zigbee for Domoticz](https://github.com/zigbeefordomoticz/Domoticz-Zigbee)
plugin: an Angular 21 single-page application for managing a Zigbee network from
Domoticz — devices, groups, topology, firmware updates over the air, plugin
settings and diagnostics.

This repository contains **only the front end**. All data comes from the REST
API exposed by the plugin, which lives in a separate repository.

- Plugin (back end): <https://github.com/zigbeefordomoticz/Domoticz-Zigbee>
- Documentation / wiki: <https://zigbeefordomoticz.github.io/wiki/>

## How it fits together

```
Domoticz  ──►  Domoticz-Zigbee plugin  ──►  Zigbee coordinator
                       │
                       │  REST API on /rest-z4d/1  (plugin web server, default port 9440)
                       ▼
               Domoticz-Zigbee-UI  (this repo)
                       │
                       │  built to dist/, published to the gh-pages branch
                       ▼
               served by the plugin at /z4d/
```

The production build is emitted with `--base-href /z4d/`, which is the path the
plugin serves the UI from.

## Requirements

- **Node.js 22** — the version CI builds with. Angular 21 requires
  `^20.19.0 || ^22.12.0 || >=24.0.0`; Node 20 reached end of life in April 2026.
- npm 10 or later.

## Getting started

```bash
npm install
npm start
```

`npm start` serves the app on <http://localhost:4200> with a dev proxy.

**Before `npm start` works you must point the proxy at a running plugin.** Edit
`proxy.conf.js` and set `target` to your plugin's address for both `/rest-z4d/`
and `/download/`:

```js
const proxyConfig = [
  { context: '/rest-z4d/', target: 'http://<your-domoticz-host>:9440', secure: false },
  { context: '/download/', target: 'http://<your-domoticz-host>:9440', secure: false }
];
```

The checked-in value is a hard-coded LAN address and is almost certainly not
yours. Please avoid committing your own address back.

## Scripts

| Command                  | What it does                                             |
| ------------------------ | -------------------------------------------------------- |
| `npm start`              | Dev server on port 4200 with the API proxy               |
| `npm run build`          | Production build to `dist/` with `--base-href /z4d/`     |
| `npm run lint`           | `ng lint` (ESLint) plus `stylelint` over `src/**/*.scss` |
| `npm run prettier`       | Format `src/**/*.{ts,js,html,scss}`                      |
| `npm run prettier:check` | List files that would be reformatted                     |
| `npm run serve:sw`       | Production build served statically on port 4200          |

`npm test` and `npm run test:ci` are declared in `package.json` but **do not
work**: there are no `.spec.ts` files and `angular.json` defines no `test`
target. Treat the project as having no automated tests today.

A Husky `pre-commit` hook runs `npm run lint` and `pretty-quick --staged`.

## Project layout

```
src/
├── app/
│   ├── core/          HTTP interceptors, i18n service, logger, route strategy
│   ├── shell/         Application frame (nav, header) wrapping all routes
│   ├── services/      api.service.ts — every REST call lives here
│   ├── shared/        Shared components, directives and models/
│   ├── dashboard/     Landing page: traffic, health, battery, topology summary
│   ├── device/        Device list, detail, parameters
│   ├── group/         Zigbee group management
│   ├── network/       Topology and interference reports
│   ├── admin/         Coordinator admin, firmware / OTA
│   ├── settings/      Plugin settings editor
│   ├── manufacturer/  Vendor-specific panels (CASA.iA, ZLinky, TICmeter, …)
│   ├── tools/         Diagnostics, raw commands, binding, debug settings
│   └── about/         About pages
├── translations/      en-US, fr-FR, de-DE, it-IT, nl-NL, es-ES
└── environments/      environment.ts / environment.prod.ts
```

Feature areas are lazy-loaded `NgModule`s registered in
`src/app/app-routing.module.ts` through `Shell.childRoutes()`.

## Talking to the plugin

`src/app/services/api.service.ts` holds a `routes` map of every endpoint
(57 of them) and one method per call. The base path
`/rest-z4d/1` comes from `environment.api_url` and is prepended automatically by
`src/app/core/http/api-prefix.interceptor.ts`; a request can opt out with
`httpClient.disableApiPrefix()`.

Adding a UI feature that needs new data therefore usually means a change in
**both** repositories: a new REST handler in the plugin's
`Classes/WebServer/WebServer.py`, and a new entry in `routes` plus a method here.

## Translations

Six languages ship today: `en-US`, `fr-FR`, `de-DE`, `it-IT`, `nl-NL`, `es-ES`.

Translations are **compiled into the bundle**, not fetched at runtime. Each file
is imported by `src/app/core/i18n.service.ts` and registered with
`translateService.setTranslation(...)`. Adding a language means editing three
places: `i18n.service.ts`, `environment.ts` and `environment.prod.ts`.

One convention is easy to get wrong: **plugin settings are translated by their
raw parameter name**. The settings screens use the parameter name from the
plugin's `Classes/PluginConf.py` directly as the translation key, so a setting
called `enablegroupmanagement` needs a top-level `"enablegroupmanagement"` key.
Theme cards use `setting.header.<Theme>` and `setting.subtitle.<Theme>`. A
missing key renders as the raw parameter name rather than failing.

See `CLAUDE.md` for the full details.

## Branches and CI

`beta` is the default and integration branch. Work happens on a feature branch
and lands through a pull request.

`.github/workflows/build.yml` runs on every pull request against `beta`
(`npm ci`, `npm run lint`, `npm run build`) and additionally **deploys to the
`gh-pages` branch on a push to `beta`**. Merging to `beta` therefore publishes.

## Contributing

Pull requests are welcome. Please keep one change per pull request, and run
`npm run lint` before pushing.

**We are still looking for help with the CSS.** If you have CSS or SCSS skills
and would like to contribute, that would be very kindly appreciated.

If you use an AI coding agent on this repository, read `AGENTS.md` first.

## Licence

See the [Zigbee for Domoticz plugin](https://github.com/zigbeefordomoticz/Domoticz-Zigbee)
repository for licensing.
