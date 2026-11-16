# Query Settings browser tests

Run `npm run test:e2e:query-settings` from the repository root. The suite starts an isolated frontend on `127.0.0.1:3109` and runs in Chromium and Safari with retries disabled.

The fixture uses the real SQL Editor, Redux store, local storage and MetaSettings client. HTTP APIs are mocked, including ordinary and multipart query responses. No YDB instance, authentication or production settings are used. The suite covers dialog controls, saved Snapshot Read-Write, local and remote persistence, Apply analytics, outgoing query parameters, keyboard help and a narrow viewport.

Screenshots are written to the ignored `playwright-artifacts` directory. The existing `tests/suites/tenant/queryEditor/querySettings.test.ts` remains the live local-YDB integration suite.
