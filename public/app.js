const beforeEl = document.getElementById("before");
const afterEl = document.getElementById("after");
const go = document.getElementById("go");
const reset = document.getElementById("reset");
const speakBtn = document.getElementById("speak");
const statusEl = document.getElementById("status");
const statusDot = document.getElementById("status-dot");
const storageNotice = document.getElementById("storage-notice");
const storageMessage = document.getElementById("storage-message");
const traceDetails = document.getElementById("trace-details");
const log = document.getElementById("log");
const beforeMeter = document.getElementById("before-meter");
const afterMeter = document.getElementById("after-meter");
const beforeGeneration = document.getElementById("before-generation");
const qualityBadge = document.getElementById("quality-badge");
const rookStage = document.querySelector(".rook-stage");

let lastLine = "";
let demoSessionId = getSessionId();
let isRunning = false;
let audioUrl;

function getSessionId() {
  const stored = sessionStorage.getItem("shed-demo-session");
  if (stored && /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(stored)) return stored;
  const id = crypto.randomUUID();
  sessionStorage.setItem("shed-demo-session", id);
  return id;
}

function demoTask() {
  return `github.security.triage.demo-${demoSessionId}`;
}

function setStatus(message, state = "idle") {
  statusEl.textContent = message;
  statusDot.classList.toggle("is-working", state === "working");
  statusDot.classList.toggle("is-success", state === "success");
  statusDot.classList.toggle("is-error", state === "error");
}

async function requestJson(url, options) {
  const response = await fetch(url, options);
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(`The server returned an unreadable response (${response.status}).`);
  }
  if (!response.ok) throw new Error(data?.error || `Request failed (${response.status}).`);
  return data;
}

function li(organ, dead = false, index = 0) {
  const el = document.createElement("li");
  el.style.setProperty("--i", index);
  const title = document.createElement("span");
  title.className = "organ-title";
  title.textContent = organ.title;
  const kind = document.createElement("span");
  kind.className = `organ-kind kind-${organ.kind}`;
  kind.textContent = organ.kind;
  const tok = document.createElement("span");
  tok.className = "organ-tok";
  tok.textContent = `${organ.tokens} tok`;
  el.append(title, kind, tok);
  if (organ.spine) el.classList.add("spine");
  if (dead) el.classList.add("dead");
  return el;
}

function renderOrgans(el, organs, dropped = new Set()) {
  el.replaceChildren(...organs.map((organ, i) => li(organ, dropped.has(organ.id), i)));
}

function countUp(el, to, duration = 900) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) { el.textContent = to; return; }
  const start = performance.now();
  const tick = (now) => {
    const t = Math.min(1, (now - start) / duration);
    el.textContent = Math.round(to * (1 - Math.pow(1 - t, 3)));
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function showSavings(pct) {
  const box = document.getElementById("savings");
  box.hidden = false;
  const fill = document.getElementById("savings-fill");
  fill.style.width = "0%";
  countUp(document.getElementById("savings-pct"), pct);
  requestAnimationFrame(() => requestAnimationFrame(() => { fill.style.width = `${Math.min(100, Math.max(0, pct))}%`; }));
}

const revealer = new IntersectionObserver((entries) => {
  for (const entry of entries) if (entry.isIntersecting) { entry.target.classList.add("in"); revealer.unobserve(entry.target); }
}, { threshold: 0.12 });
document.querySelectorAll(".section-heading, .demo-console, .integration-copy, .code-card, .marquee").forEach((el) => {
  el.classList.add("reveal");
  revealer.observe(el);
});

function showStorageStatus(status) {
  if (status.mongo) {
    storageNotice.classList.add("is-atlas");
    storageNotice.classList.remove("is-error");
    storageMessage.textContent = "Atlas connected · harness generations and lineage are saved.";
  } else {
    storageNotice.classList.remove("is-atlas", "is-error");
    storageMessage.textContent = "Preview mode · no Atlas connection; this demo’s history is temporary.";
  }
}

async function loadInitialState() {
  setStatus("Preparing demo…", "working");
  const [data, integrationStatus] = await Promise.all([
    requestJson(`/v1/harness/rook/${encodeURIComponent(demoTask())}`),
    requestJson("/v1/status"),
  ]);
  showStorageStatus(integrationStatus);
  renderOrgans(beforeEl, data.harness.organs);
  beforeMeter.textContent = `${data.tokens.toLocaleString()} estimated tokens / run`;
  beforeGeneration.textContent = `GEN ${data.harness.generation}`;
  setStatus(
    data.harness.generation === 0
      ? "Fresh coat ready · run the molt"
      : `Generation ${data.harness.generation} loaded · reset for a fresh demo`,
  );
}

function traceFor(data) {
  return {
    generation: data.after.generation,
    dropped: data.dropped.map((organ) => organ.title),
    estimatedTokensSaved: data.savedTokens,
    estimatedUsdSavedPerRun: data.savedUsd,
    qualityGate: data.nextRun.quality,
    task: data.before.taskKey,
    sources: data.exa?.sources?.slice(0, 3),
    email: data.mail,
    warnings: data.warnings,
    outcome: data.nextRun.outcome,
  };
}

go.addEventListener("click", async () => {
  if (isRunning) return;
  isRunning = true;
  go.disabled = true;
  reset.disabled = true;
  speakBtn.disabled = true;
  setStatus("Watching which organs fire…", "working");

  try {
    const data = await requestJson("/v1/demo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: demoSessionId }),
    });
    if (!data.before?.organs || !data.after?.organs || !data.nextRun?.quality) {
      throw new Error("The server response is missing harness or quality-gate data.");
    }
    const dropped = new Set(data.dropped.map((organ) => organ.id));
    renderOrgans(beforeEl, data.before.organs, dropped);
    renderOrgans(afterEl, data.after.organs);
    showSavings(data.savedPct);
    beforeMeter.textContent = `${data.run.tokensIn.toLocaleString()} estimated tokens · ${data.run.quality}`;
    afterMeter.textContent = `${data.nextRun.tokensIn.toLocaleString()} estimated tokens · ${data.nextRun.quality} · −${data.savedPct}%`;
    beforeGeneration.textContent = `GEN ${data.before.generation}`;
    qualityBadge.hidden = false;
    qualityBadge.classList.toggle("is-fail", data.nextRun.quality !== "pass");
    qualityBadge.textContent = data.nextRun.quality === "pass" ? "QUALITY PASSED" : "QUALITY FAILED";
    rookStage.classList.add("molt-done");
    lastLine = data.line;
    setStatus(lastLine, data.nextRun.quality === "pass" ? "success" : "error");
    traceDetails.hidden = false;
    log.textContent = JSON.stringify(traceFor(data), null, 2);
    speakBtn.disabled = false;
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "Something went wrong while running the demo.", "error");
    storageNotice.classList.add("is-error");
  } finally {
    isRunning = false;
    go.disabled = false;
    reset.disabled = false;
  }
});

reset.addEventListener("click", async () => {
  demoSessionId = crypto.randomUUID();
  sessionStorage.setItem("shed-demo-session", demoSessionId);
  beforeEl.replaceChildren();
  const placeholder = document.createElement("li");
  placeholder.className = "empty-state";
  placeholder.textContent = "Unused tools, rules, and memories will shed here.";
  afterEl.replaceChildren(placeholder);
  afterMeter.textContent = "Your next generation appears here";
  beforeGeneration.textContent = "GEN 0";
  qualityBadge.hidden = true;
  document.getElementById("savings").hidden = true;
  traceDetails.hidden = true;
  traceDetails.open = false;
  log.textContent = "";
  rookStage.classList.remove("molt-done");
  lastLine = "";
  speakBtn.disabled = true;
  reset.disabled = true;
  setStatus("Preparing a fresh demo…", "working");
  try {
    await loadInitialState();
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "Could not reset the demo.", "error");
  } finally {
    reset.disabled = false;
  }
});

speakBtn.addEventListener("click", async () => {
  if (speakBtn.disabled) return;
  speakBtn.disabled = true;
  try {
    const response = await fetch("/v1/speak", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: lastLine }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || (response.status === 503
        ? "Rook is quiet in this preview; ElevenLabs is not configured."
        : `Voice request failed (${response.status}).`));
    }
    const blob = await response.blob();
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    audioUrl = URL.createObjectURL(blob);
    await new Audio(audioUrl).play();
    setStatus(lastLine, "success");
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "Could not play Rook's voice.", "error");
  } finally {
    speakBtn.disabled = false;
  }
});

loadInitialState().catch((error) => {
  setStatus(error instanceof Error ? error.message : "Could not load the demo.", "error");
});
