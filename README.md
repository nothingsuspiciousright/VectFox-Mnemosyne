# Sola VectFox — Mnemosyne Edition

A complete source distribution of a community fork of [KritBlade/VectFox](https://github.com/KritBlade/VectFox), itself derived from [timwu/VectHare](https://github.com/timwu/VectHare). Fork modifications by **nothingsuspiciousright**. Upstream attribution, assets, tests and [AGPL-3.0 license](LICENSE) are retained. Upstream base: `2a5e61f825d43c9c5860cbbb914667b3a8be4127` (3.6.17). Fork version 3.6.18, development preview, 2026-11-26.

## What's different

- **Configuration Guard**: per-user independent server-side preference file, validated snapshots, atomic writes, revision checks, previous-copy fallback, startup recovery and save status. The native settings section remains for compatibility.
- **Separate vLLM keys**: embeddings write only to SillyTavern's native VLLM slot; summarization and AgentMode write to CUSTOM. These are still shared with other ST features using those slots. OpenRouter remains shared. Legacy plaintext key migration remains upstream behavior.
- **Scoped mobile CSS**: mobile form styles no longer deliberately target generic controls outside VectFox.
- **Mnemosyne extraction preset**: optional public narrative memory prompt ([text](Doc/Sola-Mnemosyne-EventBase.txt)). Copy into EventBase > Extraction Prompt. It preserves the upstream EventBase schema and does not replace existing settings automatically. Knowledge labels and continuity rules are prompt instructions, not access control.

## Installation (separate test instance first)

This repository is assembled, not an overlay. Its root is the SillyTavern third-party extension; `manifest.json` and `index.js` are at the root. Do not install it beside the original VectFox: both use the same settings namespace and generation interceptor. Back up your ST profile and existing vector collections before switching. No database schema changes are intended.

1. Install the root as a third-party extension using its published Git URL, or place the repository under the test profile's `extensions/Sola-VectFox` directory. The repository has not been published by this build.
2. Install the upstream Similharity plugin if your chosen backend requires it. See [original installation instructions](README-UPSTREAM.md#installation). The original Similharity server plugin is a separate branch/repository component and is not included in this archive.
3. For Configuration Guard, copy the **entire** `server-plugin/` directory into `SillyTavern/plugins/sola-vectfox-config/` (three `.mjs` files). Enable `enableServerPlugins: true` in the test ST configuration, restart ST and reload the browser. The frontend is integrated already; no source patching is needed. Example from the root of a disposable test SillyTavern installation:

   ```sh
   mkdir -p plugins/sola-vectfox-config
   cp data/default-user/extensions/Sola-VectFox/server-plugin/*.mjs plugins/sola-vectfox-config/
   ```

   Adjust the extension path for your test profile. The companion plugin uses built-in Node modules only. It expects authenticated ST requests with `req.user.directories.root`; if absent, it refuses access. It does not expose a credential-management or remote-fetch API.
4. Configure the providers and endpoints normally. Wait for the Guard status **Protected settings saved** before reloading. Existing complete native preferences seed the first snapshot; incomplete or unconfigured profiles are not snapshotted. The optional `Save protected settings` button retries an unsuccessful write.

## How configuration recovery works

The plugin stores `sola-vectfox-config.json` and `.previous` in the authenticated user's ST data root (not in this Git repository). It writes with mode 0600, fsync and atomic replacement. A revision token rejects stale writes. On launch the frontend requests the protected snapshot **before** the upstream settings merge and migration; it overlays only the protected preference keys. The allowlist is derived from the pinned upstream defaults plus text cleaning settings. Collection state, chat locks, chunk metadata, vectorization progress, caches and the privileged `superadmin` flag are excluded. API keys stay in ST's secret system. Never embed credentials in URLs or custom prompts or share the local sidecar: it can contain private endpoints and prompt text.

Validation rejects grossly incomplete snapshots, missing summary model or provider, invalid chat vLLM URL, missing override embedding URL/model, and missing Qdrant cloud URL. It is not a full schema validator or connectivity check. Intentionally clearing an optional prompt is supported; intentionally leaving the summary model blank is not protected by this preview. A native config change that is not successfully written to the independent snapshot may be overwritten at the next startup. If the companion is missing or unavailable, native settings continue to operate, but the guard cannot protect changes until reconnected (reload). If the primary is corrupt the previous snapshot is loaded and a repair is attempted. If both copies are corrupt the plugin refuses to silently overwrite them. A previously valid snapshot can still contain an obsolete proxy URL. The original cause of upstream settings loss remains unconfirmed. Guard is not a fix for API authentication, outages, or ingestion retry.

The upstream full-purge action is destructive for vector data; protected preferences are deliberately retained independently. Do not use purge to remove the protected configuration. For an intentional protected reset, stop the test ST server, back up and remove both local sidecar files and reset the native preferences explicitly before restarting. Never remove `secrets.json` as part of this procedure.

## Development and test status

```sh
npm run test:sola
```

This dependency-free Node 22+ test suite runs mocked client/server tests and source integration checks. See [TEST-RESULTS.txt](TEST-RESULTS.txt). Upstream tests remain under `tests/`; they require upstream npm dependencies (`npm ci`, `npm test`). The fork was assembled against the actual supplied upstream archive. A live ST server, browser, Android/Termux, real API requests and the Similharity plugin were not exercised in this build. Therefore this is a complete **development preview**, not a production-verified release. Fully independent API credentials, additional deduplication, retrieval injection and swipe reconciliation beyond upstream behavior remain future work.

## Upstream documentation

[English](README-UPSTREAM.md) · [Japanese](README_JP.md) · [Korean](README_KR.md) · [Chinese](README_ZH.md). These files describe original VectFox and may refer to upstream installation or update URLs rather than this fork.
