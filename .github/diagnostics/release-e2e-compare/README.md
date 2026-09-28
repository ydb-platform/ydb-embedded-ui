# Temporary memory-only release E2E comparison

Do not merge this diagnostic branch. It tests one hypothesis about the standard
release runner: does setting `--memory=8g` on the Playwright container affect
frontend readiness? All six runs use the original setup-local-ydb action with
root topology, auth false, monitoring8765 and fresh containers/data. The original
UI/test/lockfile/snapshot SHA and controller are frozen in pins.json.

The sequence is uncapped,8g,8g,uncapped,uncapped,8g. Each run executes the entire
original Safari shard6/8 with2workers, retries0, trace retain-on-failure and video
retain-on-failure. Test timeouts and sources are unchanged. Docker memory is the
only experimental option; no CPU limits, swap flag, extra browser warmup, custom
backend network or backend resource limit is introduced. The host's existing
swap and runtime behavior are recorded, not modified.

`memory-compare.py` reuses report validation from the preceding diagnostic
compare.py. `memory-docker.py` adds experiment names/labels and identical source
verification/resource observation to both variants; only theBtestcontainer gets
--memory=8g. Report containers remain uncapped. All artifacts are uploaded for30
days. Failures remain visible without retries; missing results or failed cleanup
cannot produce a green result. The action post steps also verify removed resources.

A passing run alone does not establish causality. Compare first attempts, Storage
assertion timing, whole-run timing and measuredCPU/RAM across allthree pairs.
If uncapped and8g do not separate, report the hypothesis as unconfirmed and do
not add a memory limit to the production runner.
