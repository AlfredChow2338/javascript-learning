# CI 裡 npx 為什麼會 ENOTEMPTY

Frontend CI 在 prebuild 用 `npx @bms/bigtix-tms-cli@latest load admin ...` 拉翻譯時，間歇性報 `ENOTEMPTY: directory not empty, rmdir`。這不是翻譯邏輯 bug，而是 **同一 Jenkins agent 上多 job 共用 npx 快取目錄，並發安裝時互相踩檔**。

### 本質一：npx 不是「臨時跑一下」，而是「寫共享快取」

- npx 流程：resolve package spec → 裝進 `~/.npm/_npx/<hash>/node_modules/` → 從那裡執行 CLI → 下次 run 可能清掉或重建部分 tree。
- `<hash>` 由 package spec 決定（例如 `@bms/bigtix-tms-cli@latest`），**同一 spec 永遠指向同一資料夾**。
- 快取不在專案 `node_modules`，而在 agent 全域 `~/.npm/_npx/` — 本機開發通常只有一個 process，問題不明顯；CI 多 build 同 user 同路徑才暴露。

### 本質二：race 怎麼發生

- Jenkins 常見：Build A / B / C 同時跑在同一 agent，都是 `jenkins` user → 都寫 `~/.npm/_npx/<hash>/...`。
- 並發時各 job 可能同時：建 `node_modules` 子目錄、寫 `readable-stream/lib/internal/streams/...`、刪整棵 `_npx/<hash>` 再重裝、對「以為已空」的目錄 `rmdir`。
- 典型碰撞：A 正在 `rmdir .../streams`，B 同時 `write .../streams/buffer_list.js` → **ENOTEMPTY**。
- 症狀是 flaky（同一 script 有時過、有時掛），容易誤判成網路或 `@latest` 版本問題。

### 本質三：錯在哪一層

- **表象**：`npm error syscall rmdir`、`exit code 217`、路徑在 `_npx/.../readable-stream/...`。
- **根因**：共享 mutable cache + 並發 install/cleanup，不是 TMS CLI 或 locale 路徑寫錯。
- **教訓**：CI 裡把 `npx @scope/pkg@latest` 當「無狀態 one-liner」是錯的 — 它有 **跨 job 的 side effect**。

### 解法取捨

**Fix 1：devDependency + 本地 binary（推薦）**

- 把 `@bms/bigtix-tms-cli` 加進 devDependency；script 改跑 `tms-load load admin ...`，不再每次 `npx`。
- **為什麼更好**：`pnpm install` 裝一次即可；無共享 `_npx` 競爭；版本由 lockfile 管，不靠 `@latest`；build 更快、少打 registry。
- **代價**：要改 repo（加 dep + 改 script）；CLI init / 文件可預設生成這種 script。

**Fix 2：每 build 隔離 npm cache**

- 在 npx 前加 `npm_config_cache=/tmp/npm-cache-$BUILD_NUMBER`（Jenkins）或 `$$`（shell PID）。
- **為什麼有效**：各 job 的 `_npx` 路徑不同，race 機率大降。
- **代價**：仍用 npx + `@latest`，每 build 可能重拉；只 **緩解症狀**，沒從架構上拿掉 npx 的 mutable 行為；改動最小（一個 env var）。

| | Fix 1 devDep | Fix 2 隔離 cache |
|---|---|---|
| 可靠性 | 高 — 不再依賴 npx | 中 — 仍用 npx |
| 速度 | 快 — install 時裝一次 | 慢 — 可能每 build 重 fetch |
| 改動面 | dep + script | 一行 env |
| 根因 | 移除共享 _npx | 避開碰撞 |

### 小結

- **問題**：Jenkins 並發 build 共用 `~/.npm/_npx/<hash>`，npx 安裝/清理與寫檔交錯 → `ENOTEMPTY`。
- **手段**：優先用 devDependency 固定 CLI；次選 per-build `npm_config_cache` 隔離。
- **結果**：CI 從 flaky 變可預期；也提醒 — **在 shared agent 上，任何寫全域 cache 的工具都要當成並發資源來設計**。
