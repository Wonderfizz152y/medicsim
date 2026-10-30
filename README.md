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
### 2.13.0
- **L-HABBO stroke screen** (TP 1232 #7, mLAPSS criteria), walked in this order: **L** last known well → **H** history of epilepsy/seizure → **A** age ≥ 40 → **B** bed-bound/wheelchair-bound → **B** blood glucose 60–400 → **O** obvious asymmetry. Scenario-specific answers; voice per item or "run L-HABBO"; tap panel (L-HABBO button in the Next bar plus All actions > L-HABBO); graded on stroke calls, with missed letters listed in the debrief. LAMS and stroke-center logic unchanged.
- **Reassess on condition change**: a clear ↻ cue when the patient changes. The expected order is HABBO (the H, A, B, B, O items of L-HABBO) → ABCs → BP, SpO₂, RR → the rest of the vitals. "Reassess" / "I'm going to reassess" (voice or tap) returns updated values. Graded per change in the debrief.
- **Unconscious + wheezing**: the first medication must be IM epinephrine (adult 0.5 mg of 1 mg/mL; peds by color code). Anything else first (e.g. albuterol) is flagged critical. The med quiz is unchanged. New scenario `anaph_unresp` (109 total).
- Tests: `tests/sim_v2130.js`.

### 2.12.0-100calls
- Expanded the call bank to **108** playable scenarios (was 76): 32 new distinct calls in `src/scx_70_expand.js` covering trauma (GSW, evisceration, amputation/TQ, burns, crush, fall/spine, facial airway, ped vs auto, open femur, blunt abd), cardiac (epigastric ACS, symptomatic sinus brady), respiratory (spontaneous PTX, croup, smoke inhalation, hyperventilation), tox/neuro (meningitis, organophosphate, TCA OD, cocaine CP, ETOH DTs, CO, anticholinergic, agitation), metabolic/GI (upper GI bleed, heat stroke, hypothermia, dialysis hyperK), and OB/peds (shoulder dystocia, prolapsed cord, peds FB airway, peds dehydration).
- Radio report CC/FIND patterns extended for SMOK, COMO, HOTN, ALOC, CHOK provider impressions.
- Confused-orientation place string always includes "?" for in-character wrong answers.
- Tests: `tests/sim_v2120.js` (count ≥100, unique new ids, smoke-start sample); full `tests/run_all.sh` green.

### 2.11.4-protocolaudit
- Audited every `MED_QUIZ` entry against LA County MCG 1317.* drug-reference text: dose / repeat / max-prior-to-Base / contraindications now match protocol wording only (no invented package-insert contraindications).
- **Diphenhydramine (MCG 1317.15):** Contraindications corrected to **None** (was hypersensitivity / neonates / nursing mothers).
- Also corrected contras for aspirin, nitro (tamponade; dropped RV/hypersensitivity), albuterol, epi (None), push-dose epi (None), amiodarone (None in cardiac arrest), adenosine, atropine (tachycardia / thyrotoxicosis), midazolam, naloxone, D10 (None), glucagon (insulinoma), ondansetron (allergy / pregnancy / <6 mo), fentanyl, morphine, ketorolac, TXA, calcium (hypercalcemia only), bicarb, magnesium.
- Fixed several wrong MCG reference numbers (naloxone 1317.29, glucagon 1317.20, ondansetron 1317.34, TXA 1317.41, calcium 1317.11, bicarb 1317.39).
- Oral glucose: no MCG 1317 sheet — TP 1203 only (15 g PO if awake and alert).
- Tests: `tests/sim_v2114.js`, `tests/browser/v2114_ui.mjs`.

### 2.11.3-maxbase
- Max Dose quiz question now asks for **maximum dose prior to Base contact** (LA County MCG 1317.* wording).
- Corrected Midazolam max to **10 mg prior to Base** (20 mg only WITH Base — used as distractor).
- Corrected Adenosine to current MCG 1317.1: **12 mg × 2 (24 mg) prior to Base**.
- Corrected Ondansetron max to **8 mg (may repeat ×1)**; Calcium to **2 g (may repeat ×1)**; Epi arrest to **3 mg prior to Base**.
- Fentanyl/Morphine distractors now include the WITH-Base absolute max (250 mcg / 20 mg).

### 2.11.2-medquiz
- **Pre-Administration Multiple-Choice Medication Check (MCG 1317.1–1317.41):**
  - Before administering a medication (by voice, typed text, or chip tap), an interactive 4-question multiple-choice knowledge check modal (`#medQuizModal`) prompts for **Dose & Route**, **Repeat Interval**, **Maximum Dose**, and **Contraindications** across all 23 LA County formulary medications (`aspirin`, `nitro`, `albuterol`, `epi_im`, `epi_arrest`, `pushepi`, `amio`, `adenosine`, `atropine`, `midaz`, `naloxone`, `diphen`, `d10`, `oralglucose`, `glucagon`, `ondansetron`, `fentanyl`, `morphine`, `ketorolac`, `txa`, `calcium`, `bicarb`, `magnesium`).
  - Simulation clock and hands-free mic automatically pause while the modal is open. Options are shuffled on each check, with immediate visual feedback and official LA County `MCG 1317.*` / `TP 12xx` reference explanations.
  - On pediatric calls (`MCG 1309`), Question 1 (Dose) is automatically credited with the length-based color-zone note so pediatric dosing is never penalized.
  - Once a medication's quiz is completed on a call, subsequent repeat doses of that medication administer immediately without re-prompting, and generic medication orders (`"give aspirin"`, `"give nitro"`) automatically apply the verified protocol dose and route.
  - Debrief includes a **Medication knowledge check (MCG 1317)** summary table and logs coaching notes for any missed items. Can be toggled in Settings (`#setMedQuiz`).
- **Alert Sepsis with Tachycardia & Tactile Fever (TP 1204 Fever / Sepsis, Rev. 07-01-26):**
  - **Sepsis without Altered Mental Status (`sepsis_alert`):** Added a dedicated Alert Sepsis scenario (*46F — Chills, Flank Pain & Fast Heart Rate*, acute pyelonephritis / early normotensive sepsis) where the patient is completely **Alert & Oriented × 4 (`A&O×4`, `mental: "alert"`)** with **tachycardia (`HR 118–122`)**, **tactile fever (`102.4°F`, forehead hot to the touch)**, tachypnea (`RR 22–24`), hypocapnia (`EtCO2 24 mmHg`), and normotension (`BP 114/72`).
  - **Forehead / Skin Tactile Fever & NLU:** Checking the forehead or skin (`"feel the forehead"`, `"skin signs"`, `"does she feel warm/hot"`, `"check for a fever"`, `"is she febrile"`, `"tactile fever"`) on any febrile patient (`temp ≥ 100.4°F`) explicitly reports `"tactile fever — forehead hot to the touch"`, records `a:tactile_fever`, and satisfies the TP 1204 temperature/fever assessment.
  - **TP 1204 #6 Normal Saline & Assessment Flow:** Normal Saline 1 L IV/IO rapid infusion is recognized as indicated for suspected sepsis with tactile fever or tachycardia even when normotensive (`SBP ≥ 100`), and assessment flow / debrief do not require `AEIOU-TIPS` when a sepsis patient is `A&O×4`.
  - Tests: `tests/sim_v2112.js` and `tests/browser/v2112_ui.mjs`.

### 2.11.1-medscreen
- **Aspirin & Nitroglycerin Pre-Administration Screening Questions (TP 1211 / TP 1214 / MCG 1317.3 / MCG 1317.29):**
  - **Aspirin screening (`q:asa_q`):** Recognizes any spoken or tapped aspirin screening question (*"Before I give you aspirin, are you allergic to aspirin, do you have any stomach ulcers or GI bleeding, or have you taken any aspirin today?"*, *"Can you take aspirin?"*, *"Have you taken any aspirin today?"*, *"Any stomach ulcers or GI bleeding?"*) as a question intent without triggering premature aspirin administration. Patient or bystander answers accurately per scenario (including ASA allergy on `stemi_asa_allergy`, active GI bleeding on `gi_bleed`, and prior self-administered ASA). Giving aspirin before screening logs a protocol deviation (`MCG 1317.3 / TP 1211`).
  - **Nitroglycerin screening (`q:ntg_q` / `q:pde5`):** Recognizes any spoken or tapped nitroglycerin / PDE5 inhibitor screening question (*"Before I give you nitro, have you taken Viagra, Cialis, Levitra, or any erectile dysfunction or pulmonary hypertension medications in the last 48 hours, or taken any nitro today?"*, *"Can you take nitro?"*, *"Any ED meds in the last 48 hours?"*, *"24 hours"*, *"two days"*, etc.) without triggering premature nitroglycerin administration. Uses **48 hours** as the standard phrasing across buttons, prefill text, and instructor/debrief notes. Giving nitroglycerin before screening logs a protocol deviation (`TP 1211 / MCG 1317.29`).
  - **UI Chips, Checklist & Debrief:** Added `"Ask aspirin questions"` and `"Ask nitro questions (ED meds)"` to `All actions ▾ → Talk to patient` and to the `History / OPQRST` and `Treatment (protocol order)` next-step bars before ASA/NTG on cardiac chest pain (`1211`) and CHF/pulmonary edema (`1214`) calls, with dynamic checklist items and debrief `Key Findings` reporting.
  - Tests: `tests/sim_v2111.js` (44 checks) and `tests/browser/v2111_ui.mjs` (8 UI checks).

### 2.11.0-lungs
- **Offline Stethoscope Lung Sound Audio Engine (`src/lungs.js`):** Whenever lung sounds are auscultated—by voice (`"listen to lung sounds"`, `"check lung sounds"`, `"auscultate the chest"`, `"listen to the bases/apices"`, etc.), by tapping the `Lung sounds` chip in `#nextChips`, the `🩺 Lungs` quick button in `#assessRow`, the `#btnSteth` stethoscope icon on the monitor, or the `LUNG SOUNDS` box in the findings strip—MedicSim synthesizes and plays realistic offline stethoscope breath sounds through Web Audio.
- **24 Clinical Acoustic Profiles Across All 75 Scenarios:** Covers clear vesicular (3:1 I:E Chest-Wall low-pass resonance), Kussmaul, Cheyne–Stokes, diminished, polyphonic expiratory wheezes, mild wheeze, severe tight end-expiratory wheezes, silent chest, harsh inspiratory stridor, stridor + wheeze, wheeze + rhonchi, low-pitched snoring/gurgling rhonchi, fine & coarse inspiratory crackles/rales (clustered 3–8 ms explosive impulses), wheezes + rales, unilateral crackles/diminished, upper-airway snoring/gurgling, BVM-ventilated breaths (including faint pre-shoulder-roll vs full post-shoulder-roll infant ventilation), agonal gasps, and unilateral/bilateral absent breath sounds.
- **Clean Stethoscope-First Audio Sequencing (No TTS Talking Over Breath Sounds):** When `a:lungs` triggers, stethoscope breath cycles play first while instructor/partner TTS is queued until the breath sample finishes (or is skipped), so voice readouts never drown out the lung sounds.
- **Unilateral Right vs Left Comparison & Inline Replay Controls:** Every lung auscultation renders an inline `.lung-player` card in the transcript (and buttons in the `LUNG SOUNDS` status box) with `🔊 Replay · Listen again` and, on unilateral scenarios (tension pneumothorax, flail chest / hemothorax, lobar pneumonia, RVR with unilateral dullness), sequential Right → Left playback plus individual `🔊 Right` and `🔊 Left` buttons.
- **Dynamic Post-Treatment Reassessment:** Re-listening after needle thoracostomy, bronchodilators/CPAP/epinephrine, CPAP + nitroglycerin, or infant shoulder roll plays the updated acoustic profile matching the patient's current physiology.
- Tests: `tests/sim_v2110.js` (388 checks across all 76 scenarios and 24 acoustic profiles) and `tests/browser/v2110_ui.mjs` (21 UI/audio/layout checks).

### 2.10.9-dest
- **Post-Transport Destination & Trauma Triage (Ref. 506) Selector:** Interactive destination card (`MAR`, `TC`, `SRC`, `CSC`, `PSC`, `PTC`, `PMC`, `BURN`, `PERI`) and all 20 LA County Ref. 506 trauma triage criteria, plus full voice/NLU support and debrief grading.

### 2.10.8-v4r
- **Right-Sided (`V4R`) & Posterior (`V7–V9`) 12-Lead Views + Explicit Age Question:** Full NLU, partner workflow, 12-lead modal rendering, and debrief credit for `V4R` and `V7–V9`, plus explicit `"How old are you?"` chip in the A&O slot.

### 2.10.7-peds
- **Arm drift (TP 1232 #8 LAMS):** "raise/hold your arms up", "arms out palms up", "close your eyes and hold them there for ten seconds", "arm/pronator drift", "check for drift" plus mishears and multi-sentence instructions. The patient complies, a non-blocking 10 s countdown chip runs, then the finding is given with LAMS arm 0/1/2. Aphasic or confused patients get a pantomime (TP 1232 ❸); GCS <9 gets passive movement. Feeds mLAPSS/LAMS, the debrief key findings and the radio report; droop, grip and drift sides are consistent. Stroke chips are ordered smile → grip → drift (also in All actions).
- **Pertinent negatives:** the quick yes/no script ("I'm going to ask you a few quick questions… headache? blurred vision? ringing in your ears? dizziness? weaker than normal? nausea? diarrhea? vomiting? chest pain? shortness of breath?") gets "Okay", then ordered answers true to the scenario. Altered or aphasic patients nod or shake their head, or a bystander answers. Credited in the checklist and debrief, and available to the radio report. New chip "Pertinent negatives (quick yes/no)" plus symptom chips.
- **Peds arrest (TP 1210-P / MCG 1302):** shoulder roll (improves BVM chest rise and capnography; critical under 3 y; neutral alignment with trauma) and trauma assessment (none on medical arrests; NAT signs → mandated reporter; drowning signs). Both have partner variants and chips. Trauma assessment is a required item during CPR and appears in the debrief and radio report.
- **Partner IV setup:** "can you set up my IV and spike a bag?" works without the wake word. The partner says "Setting up your IV, spiking a liter of NS", runs a 30–60 s queued task, then says "IV setup ready, line primed". The next IV/NS uses the prepped bag.
- **Broselow on every peds call (MCG 1309):** handles brozlo/broslow/brose low/bro slow, "what color are they", "weigh in kilos" and the partner variant. The instructor line reads "Patient measures in the White zone, 15 kg". It is a required checklist item, and the color and kg appear in the header, debrief and radio report. A parent's weight is supplementary only.
- **Peds dosing:** pediatric patients always receive the correct dose, narrated by color code (e.g. "Midazolam IN, Blue color-code dose"). There is no dose grading, no dose-error deviations and no over/underdose effects; indication, route and timing are still graded.
- Tests: tests/sim_v2107.js (416), intent_v2107_blind.js, ros_v2107_blind.js, browser v2107_ui.mjs (36) and v2107_hf.mjs (fake mic, Moonshine), plus tests/speech/phrases_v2107.json (Piper → Moonshine).

### 2.10.6-dysim
- Dystonic reaction calls (TP 1239 / MCG 1317.15): diphenhydramine 50 mg **deep IM** (lateral thigh / gluteus) is now the expected, fully correct route (instructor standard); 50 mg slow IV push is still accepted (IV without access still gets the caution). Plain "IM" gets credit with a small note to say "deep"; the deltoid gets credit with a large-muscle tip; no route stated is treated as deep IM with a tip to state the route. Voice accepts "deep IM", "IM", "intramuscular", "in the thigh/deltoid/glute", "deep I am", "deep eye em", "deep in". The Base-contact caution (1239 #4) is unchanged. IM onset is slower than IV (easing ~6 min vs ~2 min).
- Chip label "Benadryl 50 mg deep IM", listed first; ondansetron/Zofran no longer offered as a distractor chip on dystonic calls (giving it gets a note: not part of TP 1239).
- New question "when did you start it / that medication / how long have you been taking it" answers the drug's start date and time (patient and bystander); "when did this start" stays symptom onset. Other calls fall back to the medications answer.
- Drug start is 1–2 days ago on every dystonic call: Reglan yesterday afternoon (ED), Haldol 2 days ago (Tuesday), Compazine yesterday in the ED (IV dose, then pills). Consistent across the meds answer, start-date answer, bottle/discharge papers, scene text and debrief.
- Tests: tests/sim_v2106.js (146 checks), tests/browser/v2106_ui.mjs.

### 2.10.5-szdys
- Seizure calls: midazolam **10 mg IN** (atomizer, split between nostrils) is accepted and graded correct by voice or chip; so are 10 mg IM and 5 mg IV/IO with existing access (TP 1231 #6, MCG 1317.25). Mishears handled: "medazolam", "midaz", "versed", "mid as a lamb", "in the nose". Chips show 10 mg IN / 10 mg IM / 5 mg IV in shuffled order; peds calls show "Midazolam IN (color code)" and skip adult dose checks.
- Midazolam grading: wrong dose = deviation, 10× error = critical, not seizing = "not indicated", IV with no line = caution, repeat x1 (IV after 2 min; further IM/IN or > 10 mg needs Base; 20 mg max). Holds and negations ("hold the versed", "no midaz") give nothing and aren't graded.
- Midazolam onset: IV about 1.5 min, IN about 3.5 min, IM about 4.5 min (sim time; MCG 1317.25 lists IV 3–5, IN 6–14, IM 15–20 min). Then a postictal state with respiratory depression (RR falls, EtCO2 rises), which needs airway care and BVM.
- Seizure SpO2 on every seizure call (status seizure, focal seizure, postictal ETOH, eclampsia, peds febrile): high 70s–80s while actively seizing. Postictal or after midazolam it stays low and keeps sliding until the airway is managed (recovery position, suction, NPA, NRB; BVM if RR is inadequate), then recovers. Airway management and high-flow O2 are now critical checklist items on all of them, with deviations for 2 min of hypoxia without airway care and for midazolam respiratory depression without BVM.
- New: **Dystonic Reaction (TP 1239)** calls: Reglan (24M), Haldol with oculogyric crisis (31F) and Compazine after an ED visit (19F). Torticollis, jaw/tongue protrusion, garbled speech, anxiety; airway intact, A&O, SpO2 mid-to-high 90s throughout. The meds history and pill bottles show the new drug and its start date. Treatment is diphenhydramine 50 mg slow IV push, or 50 mg deep IM with no access, after Base contact (MCG 1317.15); improvement over minutes. Midazolam and naloxone are graded "not indicated"; history, pertinent negatives and the stroke/seizure rule-out are graded. Included in Random, the PI drill, the primary-survey drill and the debrief citations.
- Magnesium chip now reads "Magnesium 4 g IV" (over 20 min, TP 1217 #17).

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
