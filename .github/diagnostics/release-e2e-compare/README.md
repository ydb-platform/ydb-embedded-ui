# Temporary release E2E trace comparison

This branch is an experiment, not a proposed change to the normal release workflow.
Do not merge it into main. Dispatch `release-e2e.yml` from this diagnostic branch
with `ydb_tag=26.2.1.14`. No production sources, tests, snapshots or lockfiles change.

The workflow executes the original shard6/8 (114Safari cases) six times in order
trace-on, off, off, on, on, off. It uses the native comparison pins in `pins.json`,
two workers, no retries, unchanged test timeouts and video retain-on-failure.
Only the trace CLI option changes. Each trial starts fresh Docker containers/data.
The selected UI sources run through the unchanged controller at71b800f; source
hashes are checked against the prior native comparison. Real Rubik loading is
required in both Chromium and WebKit before the trials start.

Each completed trial is merged into HTML/JSON and uploaded immediately for30days.
Scenario failures do not prevent the remaining trials, but the final job is red.
Preparation errors, missing results, unsafe artifacts or cleanup errors stop the
series and cannot become green. Runtime tokens never enter the test container.

`compare.py` and `docker-wrapper.py` reuse the native diagnostic harness. The
GitHub adaptation removes the host-specific egress tunnel and runs each trial as
a separate workflow step so its report survives later failures. Product runner
and source code remain pinned and unchanged. Existing release/report workflows
on main are unaffected. This branch requires no PR or merge to execute.
