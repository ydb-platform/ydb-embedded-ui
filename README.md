# ydb-embedded-ui

Local viewer for YDB clusters

- [Docs for users](https://ydb.tech/en/docs/maintenance/embedded_monitoring/ydb_monitoring)
- [Project Roadmap](ROADMAP.md)

## Preview

You can preview working UI using YDB docker image. It will be UI with the latest stable ydb version.

Run on a machine with Docker installed:

```
docker pull ghcr.io/ydb-platform/local-ydb:nightly
docker run -dp 8765:8765 ghcr.io/ydb-platform/local-ydb:nightly
```

Open http://localhost:8765 to view it in the browser.

## Development

1. Run on a machine with Docker installed:
   ```
   docker run --rm -ti --name ydb-local -h localhost \
      -p 8765:8765 \
      -e MON_PORT=8765 \
      ghcr.io/ydb-platform/local-ydb:nightly
   ```
2. Install dependencies with `npm ci`
3. Run the frontend app in the development mode, via invoking `npm run dev`
4. Open [localhost:3000](http://localhost:3000) to view it in the browser. The page will reload if you make edits.\
   You will also see any lint errors in the console.

For API reference, open Swagger UI on http://localhost:8765/viewer/api/.

### YDB docker images

[Docs on YDB docker images](https://ydb.tech/en/docs/getting_started/self_hosted/ydb_docker)

To test new features, you can use ydb version built from `main` brunch with `ghcr.io/ydb-platform/local-ydb:nightly` image.
Also you can set specific version like `ghcr.io/ydb-platform/local-ydb:24.1`

### Custom configuration in dev mode with .env file

You can run the app with your own params by adding `.env` file to project root. There is an example in `.env.example`.

1. Add `.env` file to project root by copying example

```shell script
cp .env.example .env
```

2. Set your own set of params in `.env`
3. Run `npm run start`. Your custom params from `.env` file will be applied

#### Custom backend in dev mode

YDB docker represents a single node cluster with only one version, small amount of storage groups, PDisks and VDisks. It may be not enough for development purposes. If you have your own development cluster with sufficient amount of entities, you can run the app in the dev mode with this cluster as backend. To do it, alter `REACT_APP_BACKEND` param in your `.env` file:

```
REACT_APP_BACKEND=http://your-cluster-host:8765
REACT_APP_META_BACKEND=undefined
META_YDB_BACKEND=undefined
```

#### Meta backend in dev mode (multi cluster)

If you have meta backend for multi cluster version, you can run the app in dev mode with this backend by setting `REACT_APP_META_BACKEND` param in `.env`:

```
REACT_APP_BACKEND=undefined
REACT_APP_META_BACKEND=http://your-meta-host:8765
META_YDB_BACKEND=undefined
```

If you need to connect to the meta backend from a server, you need to set `META_YDB_BACKEND` param in `.env`:

```
REACT_APP_BACKEND=undefined
REACT_APP_META_BACKEND=undefined
META_YDB_BACKEND=http://your-meta-host:8765
```

## E2E Tests

For e2e tests we use `@playwright/tests`. Tests configuration is in `playwright.config.ts`. Tests are set up in `tests` dir.

### Commands

Install all Playwright dependencies and chromium to run tests.

```
npm run test:e2e:install
```

Run tests. If `PLAYWRIGHT_BASE_URL` is provided, tests run on this url, otherwise Playwright `webServer` is started with `npm run dev` on `http://localhost:3000` and all tests run there.

```
npm run test:e2e
```

### CI

E2E tests are run in CI in `e2e_tests` job. Tests run on Playwright `webServer` (it is started with `npm run dev`), `webServer` uses docker container `ghcr.io/ydb-platform/local-ydb:nightly` as backend.

## Making a production bundle.

Base command `npm run build` builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.

To test production bundle with latest YDB backend release, do the following:

1. Install dependencies with `npm ci`
2. Build a production bundle with a few tweaks for embedded version: `npm run build:embedded`.
3. Invoke `docker run -it --hostname localhost -dp 2135:2135 -p 8765:8765 -v ~/projects/ydb-embedded-ui/build:/ydb_data/node_1/content/monitoring ghcr.io/ydb-platform/local-ydb:nightly`
4. Open [embedded YDB UI](http://localhost:8765/monitoring) to view it in the browser.

### Testing production bundle with specific cluster host

If you want to test embedded version in production mode, but YDB docker is not enough and you have your own ydb development cluster, you can manually update UI for the specific cluster host.

It also could be usefull for development purposes, because some operations, that are not 'read-only', like some update queries or tablets restart could be allowed by CORS only for the same origin and so could not be executed in dev mode.

1. Install dependencies with `npm ci`
2. Create production bundle with `npm run build:embedded`
3. Copy your build files from `build` folder to `/content/monitoring` folder on desired cluster host
4. Open `http://your-cluster-host:8765/monitoring` to see updated UI

It's assumed, that you have all the necessary access rights to update files on the host.
