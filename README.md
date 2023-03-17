# ydb-embedded-ui

Local viewer for YDB clusters

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
