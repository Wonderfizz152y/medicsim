/* MedicSim speech worker: Moonshine-base (fp32, ONNX) via transformers.js, on-device, offline.
 * Model files are read straight from Cache Storage ("medicsim-models-v1"), where the app saved them
 * on first download, so recognition never needs the network. Runs off the main thread. */
let asr = null;
self.onmessage = async e => {
  const m = e.data;
  if (m.type === "load") {
    try {
      const t0 = performance.now();
      const T = await import(m.lib);
      const cache = await caches.open(m.cache);
      T.env.allowRemoteModels = false; T.env.allowLocalModels = true; T.env.localModelPath = m.models; T.env.useBrowserCache = false;
      T.env.useCustomCache = true; T.env.customCache = { match: k => cache.match(typeof k === "string" ? k : k.url), put: async () => {} };
      T.env.backends.onnx.wasm.wasmPaths = m.wasm; T.env.backends.onnx.wasm.numThreads = 1; T.env.backends.onnx.wasm.proxy = false;
      asr = await T.pipeline("automatic-speech-recognition", m.model, { dtype: m.dtype, device: "wasm" });
      await asr(new Float32Array(16000)); // warm-up so the first real utterance is fast
      self.postMessage({ type: "ready", ms: Math.round(performance.now() - t0) });
    } catch (err) { self.postMessage({ type: "error", message: String(err && err.message || err) }); }
  } else if (m.type === "tx") {
    try {
      const t0 = performance.now(), out = [];
      // Moonshine tends to drop the last word when audio stops right at it (e.g. a push-to-talk release).
      // A short low-level noise tail fixes that (dev speech set: WER 8.5% -> 6.3%).
      const TAIL = 12800, pcm = new Float32Array(m.pcm.length + TAIL); pcm.set(m.pcm, 0);
      for (let i = m.pcm.length; i < pcm.length; i++) pcm[i] = (Math.random() - 0.5) * 0.004;
      // long push-to-talk turns: transcribe in <=20 s pieces
      for (let i = 0; i < pcm.length; i += 320000) { const r = await asr(pcm.subarray(i, Math.min(pcm.length, i + 320000))); out.push((r.text || "").trim()); }
      self.postMessage({ type: "result", id: m.id, text: out.join(" ").trim(), ms: Math.round(performance.now() - t0) });
    } catch (err) { self.postMessage({ type: "result", id: m.id, error: String(err && err.message || err) }); }
  }
};
