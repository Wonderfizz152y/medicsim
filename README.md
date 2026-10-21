# MedicSim LA: free hosting on GitHub Pages

This folder is the complete, ready-to-host app. It's static files only: no server, no API keys, nothing to pay for.

## Deploy (about 5 minutes)
1. Create a **public** GitHub repository (GitHub Free includes Pages for public repos), e.g. `medicsim`.
2. Upload **the contents of this folder** (not the folder itself) to the repo root, including the hidden `.nojekyll` file. Use the web UI ("Add file → Upload files") or:
   ```bash
   cd deploy
   git init && git add -A && git commit -m "MedicSim LA"
   git branch -M main
   git remote add origin https://github.com/<you>/medicsim.git
   git push -u origin main
   ```
   (Every file in this folder is under GitHub's 100 MB per-file limit; no Git LFS needed. The speech recognizer's two big model files, 81 MB and 166 MB, are fetched once from the Hugging Face CDN at a pinned revision and then kept on the phone.)
3. In the repo, go to **Settings → Pages → Build and deployment → Source: "Deploy from a branch" → Branch: `main` / `/ (root)` → Save**.
4. After about 1 minute the app is live at `https://<you>.github.io/medicsim/` (HTTPS, which the microphone requires).

## First run on a phone (one time, needs internet)
1. Open the URL. The app saves itself for offline use automatically.
2. Tap **Download speech recognizer (≈315 MB, one time)** on the start screen. This is offline voice input: Moonshine-base (on-device, in a background worker) with the small Vosk model kept as an automatic backup.
3. Optional: in Settings, turn on **Smart understanding** (46 MB).
4. Install it:
   - **iPhone/iPad (Safari):** Share → Add to Home Screen.
   - **Android (Chrome):** ⋮ → Install app.
   - **Desktop Chrome/Edge:** the install icon in the address bar.

After that, everything works in airplane mode: all scenarios, the monitor, offline speech recognition, spoken patient replies (on-device system voices), and the debrief.

## Test locally
```bash
cd deploy && python3 -m http.server 8000
# open http://localhost:8000  (localhost counts as secure, so mic + service worker work)
```
Opening `index.html` straight from disk (file://) works for typing, but browsers block the mic and service workers on file:// pages.

## Updating
Re-run `python3 src/build.py`, then commit the new `deploy/` contents. The service worker version changes with every build. Users get the update on their next visit, and downloaded models are kept.
