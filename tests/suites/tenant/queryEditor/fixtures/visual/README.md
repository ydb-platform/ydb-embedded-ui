# Query editor visual fixtures

The query response and execution-plan SVG come from the literal-only query in
`queryEditorVisual.test.ts`, rendered by the [designer-approved PR #4506](https://github.com/ydb-platform/ydb-embedded-ui/pull/4506)
at `a44dfd1d4d5e2cb81af9264102e268372961d936` ([acceptance](https://github.com/ydb-platform/ydb-embedded-ui/issues/4556)).

The plan structure and AST are retained. Per-node runtime statistics are omitted,
and the response statistics are fixed to exercise the result summary and rows/s
badge. The SVG retains the backend geometry and styling; its interactive script
is removed because the UI renders it as an image. The test fixes `Date.now()` so
the execution label needs no screenshot mask.

Both themes cover the editor toolbar, Run result and all plan representations,
statistics, Explain navigation and AST tooltip, Explain Analyze results and
fullscreen SVG, and disabled-statistics/plan empty states. Screenshots include
the entire editor; fullscreen has its own complete-region snapshot.

Run the spec with the repository's pinned Playwright Docker command to compare
the Linux Chromium and WebKit baselines:

```sh
PLAYWRIGHT_APP_BACKEND=http://localhost:8765 npm run test:e2e:docker -- tests/suites/tenant/queryEditor/queryEditorVisual.test.ts --retries=0
```

Review visual changes before updating these baselines; a passing functional test
alone does not approve a new design.
