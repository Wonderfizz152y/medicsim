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

## Version notes
### 2.10.2-naloxone
- **Naloxone on any call.** It's available by voice and by tap on every call where the patient is altered and hypoventilating, not only the opioid scenario.
  - **All actions › Meds:** Naloxone 2 mg IN, Naloxone 2 mg IM and Naloxone 1 mg IV.
  - **Next-step treatment slots:** naloxone is shuffled in with the other options whenever the patient is altered (not seizing) with RR < 12. A "Repeat naloxone" chip appears while RR stays under 12.
  - **BMV first:** on an apneic/hypoxic patient (RR < 8 or SpO₂ < 90), the BVM chip comes before naloxone. The naloxone chip shows only once ventilations are ordered (TP 1241 ❶).
- **Grading** (TP 1241 rev 07-01-26 #4/#6/#10 ❶; MCG 1317.29 rev 01-01-26):
  - **BMV first:** giving naloxone to an apneic/hypoxic patient without BMV is a deviation (1241 ❶). It's a caution if BMV was ordered but hadn't started yet.
  - **Not indicated:** a dose when the patient is alert with normal RR is a deviation (1241 #4). A dose when the patient is altered but breathing adequately is a caution: titrate to respiratory rate and tidal volume, not to consciousness.
  - **Adult dosing:** 2-4 mg IN, 2 mg IM, or 0.8-2 mg IV in small increments, with a maximum of 8 mg by all routes.
    - A dose outside these ranges gets a note; going over 8 mg is a deviation.
    - Dose checks are adult only; pediatric calls are skipped.
  - **Partial response:** if the patient responds only partly and opioid OD is strongly suspected, a note says to contact Base for more doses (1241 #6).
  - **Cardiac arrest:** naloxone is not indicated (MCG 1317.29).
- **Response by cause:**
  - **True opioid calls:** RR, SpO₂ and mentation improve dose by dose.
    - Overshooting precipitates withdrawal (vomiting, agitation, tachycardia) and adds an MCG 1317.29 note.
    - Long-acting agents (oxycodone ER, fentanyl patches) re-sedate as naloxone wears off.
  - **Non-opioid causes** (hypoglycemia, stroke, head injury, postictal, etc.): naloxone has no effect and is never a critical error. After 3 minutes the call shows "No change…" and the debrief nudges you to keep working AEIOU-TIPS (1241 #10 / MCG 1320).
- **AEIOU-TIPS 'O'** is now credited by pupils, SpO₂, med bottles, patches, track marks or a naloxone trial.
- **New calls (TOXICOLOGY):**
  - **fent_found_down:** a 27-year-old found down in a library restroom after injecting fentanyl.
    - Findings: syringe, burnt spoon, cotton and a belt tourniquet; fresh and old track marks; pinpoint pupils; RR 4.
    - A titrated dose holds. Over-reversal precipitates withdrawal.
  - **oxy_elder:** an 81-year-old with early dementia and an accidental double dose of oxycodone ER.
    - Findings: two empty pill-organizer slots and a short OxyContin count.
    - He wakes with naloxone, then re-sedates about 8 minutes later. Repeat the dose and contact Base.
### 2.10.1-vitaltaps
- **Separate vitals taps:** Blood pressure, Resp rate and Pulse ox are now their own tap actions. They do exactly what the voice command does: the partner takes the reading, and the findings, grading credit and monitor/vitals display are the same.
  - **Next-step bar:** they sit in the vitals step (after pulses and skin), next to the combined "BP, SpO₂, RR" chip. That chip shows only until the first vital is taken.
  - **Drop-off:** each chip disappears once that vital is done or the partner is already on it.
  - **All actions:** all three stay under Partner so you can recheck and trend after treatment.
- **Serial BP trend:** a BP recheck reports the previous reading and the pulse-pressure trend, e.g. "Last was 159/84 at 00:23; pulse pressure 75 → 99." It shows numbers only; recognizing Cushing's is still the medic's job.
- **Push-dose epinephrine** (voice, the All actions "Push-dose epi 10 mcg" chip, and shuffled into the treatment slots for 1204/1207/1210/1212/1214/1219/1237):
  - **Dose:** 1 mL (10 mcg) of 0.01 mg/mL (9 mL NS + 1 mL epi 0.1 mg/mL) IV/IO every 1-5 min to keep SBP > 90.
  - **Physiology:** BP rise is transient (onset < 2 min, wears off within a few minutes), so repeats are needed.
  - **Grading:**
    - Hypertensive patient: critical.
    - Not hypotensive / adequate perfusion: deviation.
    - No fluids first: deviation (exceptions: pulmonary edema; post-ROSC worsening hypotension/bradycardia).
    - Traumatic shock: deviation.
    - Bradycardia without TCP or a Base order: deviation.
    - During arrest: deviation.
    - Adult dose ≥ 10× (e.g. "1 mg"): critical.
    - Base contact concurrent: note.
  - **IM-formulation or arrest epi given IV to a patient with a pulse:** critical, with a hypertensive surge.
  - **Parsing:** "push dose epi", "push-dose pressor", "dirty epi" and mishears like "pushed/post dose epi" map to push-dose. Plain "epi" in arrest stays arrest epi 1 mg, and "epi 0.5 IM" stays IM epi.
  - **Refs:** TP 1207 #8/#11/❺ (07-01-24), TP 1219 #7 (07-01-24), TP 1210 #19/⓰ (07-01-26), TP 1212 #11/❺ (07-01-24), MCG 1317.17 (01-01-26), MCG 1309. No maximum dose is stated (1207 ❺: prepare more than 10 mL for long transports).
### 2.10-combo
- **Next-step chips in call order:** assessment chips follow the call flow. Treatment chips follow the protocol's step order, with the correct item and alternatives shuffled within each step.
- **Albuterol delivery modes:**
  - In-line with CPAP: TP 1237 #12/❺.
  - Handheld neb, neb mask/NRB, MDI.
  - In-line BVM: standard practice*, not addressed in TP 1237 / MCG 1317.3.
