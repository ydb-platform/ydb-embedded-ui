# ydb-embedded-ui

Local viewer for YDB clusters

* [Docs for users](https://ydb.tech/en/docs/maintenance/embedded_monitoring/ydb_monitoring)
* [Project Roadmap](ROADMAP.md)

## Preview

You can preview working UI using YDB docker image. It will be UI with the latest stable ydb version.

Run on a machine with Docker installed:
```
docker pull cr.yandex/yc/yandex-docker-local-ydb
docker run -dp 8765:8765 cr.yandex/yc/yandex-docker-local-ydb
```

Open http://localhost:8765 to view it in the browser.

## Development

1. Run on a machine with Docker installed:
   ```
   docker pull cr.yandex/yc/yandex-docker-local-ydb
   docker run --hostname localhost -e YDB_ALLOW_ORIGIN="http://localhost:3000" -dp 2135:2135 -dp 8765:8765 cr.yandex/yc/yandex-docker-local-ydb
   ```
2. Run the frontend app in the development mode, via invoking `npm run dev`
3. Open [http://localhost:3000](http://localhost:3000) to view it in the browser. The page will reload if you make edits.\
   You will also see any lint errors in the console.

For API reference, open Swagger UI on http://localhost:8765/viewer/api/.

### YDB docker images

[Docs on YDB docker images](https://ydb.tech/en/docs/getting_started/self_hosted/ydb_docker)

Image `cr.yandex/yc/yandex-docker-local-ydb` corresponds to `:latest` tag. It's the latest stable ydb version.

To test new features, you can use ydb version that is currently in testing mode with `cr.yandex/yc/yandex-docker-local-ydb:edge` image. Also you can set specific version like `cr.yandex/yc/yandex-docker-local-ydb:23.1`

### Custom backend in dev mode

YDB docker represents a single node cluster with only one version, small amount of storage groups, PDisks and VDisks. It may be not enough for development purposes. If you have your own development cluster with sufficient amount of entities, you can run the app in the dev mode with this cluster as backend. To do it, set you host to `REACT_APP_BACKEND` variable in `dev` script. For example: 
```
"dev": "DISABLE_ESLINT_PLUGIN=true TSC_COMPILE_ON_ERROR=true REACT_APP_BACKEND=http://your-cluster-host:8765 npm start"
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

E2E tests are run in CI in `e2e_tests` job. Tests run on Playwright `webServer` (it is started with `npm run dev`), `webServer` uses docker container `cr.yandex/yc/yandex-docker-local-ydb` as backend.

## Making a production bundle.

Base command `npm run build` builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.

To test production bundle with latest YDB backend release, do the following:

1. Build a production bundle with a few tweaks for embedded version: `npm run build:embedded`.
2. Invoke `docker run -it --hostname localhost -dp 2135:2135 -p 8765:8765 -v ~/projects/ydb-embedded-ui/build:/ydb_data/node_1/contentmonitoring cr.yandex/yc/yandex-docker-local-ydb:latest`
3. Open [embedded YDB UI](http://localhost:8765/monitoring) to view it in the browser.

### Testing production bundle with specific cluster host

If you want to test embedded version in production mode, but YDB docker is not enough and you have your own ydb development cluster, you can manually update UI for the specific cluster host.

It also could be usefull for development purposes, because some operations, that are not 'read-only', like some update queries or tablets restart could be allowed by CORS only for the same origin and so could not be executed in dev mode.

1. Create production bundle with `npm run build:embedded`
2. Copy your build files from `build` folder to `/contentmonitoring` folder on desired cluster host
3. Open `http://your-cluster-host:8765/monitoring` to see updated UI

It's assumed, that you have all the necessary access rights to update files on the host.