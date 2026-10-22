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
### 2.10.4-instrcap
- Arrest calls: the latest instructor line is pinned in a high-contrast banner under the code timers (white on navy, sky-blue bar; amber for instructor notes). It stays until a new instructor line replaces it, so partner bursts can't push it away. Tap (or Enter) for the last 12 instructor lines; the list drops over the transcript and never covers the timers, monitor or mic.
- Instructor lines in the transcript are now full-width navy cards with a blue bar (notes: amber bar), distinct from partner and patient bubbles.
- Phones: during a code the right column grows to fill the screen below the header, so the transcript has room again; the mic stays on screen when the code starts.
- Fixed a 360 px overflow where a long rhythm label widened the page and clipped the End button.
- Partner now says "Checking the capno." if capnography is already on.

### 2.10.3-holds
- When you refuse or negate a drug, the partner acknowledges it out loud and names the drug, e.g. "Copy, holding the push-dose epi." This used to get the patient's "Can you ask me that again?".
  - It covers every drug in the negation block: nitro, NTG, aspirin, ASA, fentanyl, morphine, fluids/bolus, epi, push-dose epi, pressors, naloxone and Narcan.
  - It works for these forms: "don't give", "hold (off on)", "no", "let's not", "skip", "without" and "not". Lists work too: "hold the nitro and the aspirin".
  - It works by voice, typed, hands-free and after "Partner".
- Nothing is given and nothing is graded. Each hold is logged in the transcript and in the debrief state.
- A positive order in the same breath is still carried out, e.g. "not push dose epi, just fluids" or "hold the nitro, give aspirin 325".
- Fixed: "Partner, hold off on nitro" no longer gets fuzzy-matched back into "give the nitro".
- Fixed: "no aspirin allergy" is no longer treated as a hold.

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
- **Fixes from the independent v2.10.1 audit:**
  - **H1 Negation:** "don't give / hold / no epi", "no push-dose epi", "not push dose epi, just fluids", "no pressors" and "no narcan / hold the naloxone" no longer give the drug.
  - **H2 Small-dose IV epi:** "epinephrine 10 micrograms IV", "epi 10 mcg IV" and "epinephrine 0.01 mg/mL 1 mL IV" are push-dose epi (MCG 1317.17). They're no longer graded as a critical 10-fold overdose with a hypertensive surge.
  - **H3 Anaphylaxis:** push-dose gives only a transient BP bump. It no longer reverses anaphylaxis, so a 10 mcg push can't outperform 0.5 mg IM. Push-dose before IM epi is a deviation (1219 #4, #7 ❶).
  - **M1 Trauma:** a trauma call means the TRAUMA tag or TP 1244. Injury text in the exam no longer counts, which removes false "non-traumatic shock" deviations and wrong CPAP blocks on mobitz2, orthostatic, etoh, syncope_lac, postictal_etoh and focal_sz.
  - **M2 Fluids first:** requires about 250 mL actually infused, at about 250 mL per 3 min (standard practice*), plus a BP reassessment. Ordering NS is no longer enough.
  - **M3 No BP:** push-dose with no BP ever taken is a deviation, mirroring nitro.
  - **M4 Duplicate orders and serial BPs:**
    - A duplicate order while the partner is already on it gets "Already on it", and no second reading is queued.
    - Serial BP credit needs readings at least 3 minutes apart.
  - **M5 Mobile layout:** the next-step bar wraps whenever vitals chips are present, including the not-tracking path. At 320 px the sim header no longer widens the page to 341 px.
  - **M6 Epi narration:** epi is narrated with the dose and route actually ordered.
  - **L1 Base contact:** Base is contacted concurrently with the first push-dose on every call, including post-ROSC (Ref. 1200.2 #7d).
  - **L2 bb_od:** bradycardia on this call is graded under 1212 #11.
  - **L3 Push-dose chip:** it shows only once a BP shows SBP < 90.
  - **L4 Busy partner:** a partner who is bagging or doing CPR says so instead of taking a BP.
  - **L5 Parsing:**
    - "push dose of atropine" gives atropine only.
    - Phenylephrine, norepinephrine, vasopressin and dopamine get a "not in LA County formulary" note.
    - "bolus of push dose epi" no longer adds NS.
    - "pushed those epi" maps to push-dose epi.
    - "mix 9 mL NS with 1 mL epi" doses 1 mL.
    - "epi 0.5 IM" in arrest gets a correction note.
  - **L6 Base report:** short drug orders are carried out consistently while a Base report is open.
  - **L7 Rapid repeats:** the 1-minute repeat check (MCG 1317.17, every 1-5 min) is kept. Stacked pushes now saturate.
  - **L8:**
    - The offline banner's scenario count is dynamic.
    - The README count is corrected.
    - The aspirin chip is 325 mg (MCG 1317.7).
  - **L9 Tests:**
    - SIM.start applies the scenario base exactly like the app.
    - tests/run_all.sh runs every intent set, including v27/v28.
    - Browser chip taps are robust under parallel load.
  - **Naloxone checked for the same classes of bug:**
    - Negation is covered.
    - Narration uses the dose and route actually ordered.
    - The chip shows only on an altered patient with RR < 12.
    - A rapid IN/IM repeat gets a caution (onset 2-10 min, MCG 1317.29).

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
