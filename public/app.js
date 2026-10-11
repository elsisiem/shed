const beforeEl = document.getElementById("before");
const afterEl = document.getElementById("after");
const go = document.getElementById("go");
const speakBtn = document.getElementById("speak");
const status = document.getElementById("status");
const log = document.getElementById("log");
const beforeMeter = document.getElementById("before-meter");
const afterMeter = document.getElementById("after-meter");

let lastLine = "";

function li(organ, dead) {
  const el = document.createElement("li");
  el.textContent = `${organ.kind}: ${organ.title} · ${organ.tokens} tok`;
  if (organ.spine) el.classList.add("spine");
  if (dead) el.classList.add("dead");
  return el;
}

async function paintFat() {
  const res = await fetch("/v1/harness/rook/github.security.triage");
  const data = await res.json();
  beforeEl.replaceChildren(...data.harness.organs.map((o) => li(o, false)));
  beforeMeter.textContent = `${data.tokens} tokens every run`;
}

go.addEventListener("click", async () => {
  go.disabled = true;
  status.textContent = "watching which organs fire…";
  try {
    const res = await fetch("/v1/demo", { method: "POST" });
    const data = await res.json();
    const dropped = new Set(data.dropped.map((o) => o.id));
    beforeEl.replaceChildren(...data.before.organs.map((o) => li(o, dropped.has(o.id))));
    afterEl.replaceChildren(...data.after.organs.map((o) => li(o, false)));
    beforeMeter.textContent = `${data.run.tokensIn} tokens · ${data.run.quality}`;
    afterMeter.textContent = `${data.nextRun.tokensIn} tokens · ${data.nextRun.quality} · −${data.savedPct}%`;
    document.querySelectorAll(".facet.fat").forEach((f) => f.classList.add("gone"));
    lastLine = data.line;
    status.textContent = lastLine;
    log.hidden = false;
    log.textContent = JSON.stringify(
      {
        dropped: data.dropped.map((o) => o.title),
        savedTokens: data.savedTokens,
        savedUsd: data.savedUsd,
        exa: data.exa?.sources?.slice(0, 3),
        mail: data.mail,
        warnings: data.warnings,
        outcome: data.nextRun.outcome,
      },
      null,
      2,
    );
    speakBtn.disabled = false;
  } catch (err) {
    status.textContent = String(err);
  } finally {
    go.disabled = false;
  }
});

speakBtn.addEventListener("click", async () => {
  speakBtn.disabled = true;
  const res = await fetch("/v1/speak", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: lastLine }),
  });
  if (!res.ok) {
    status.textContent = "Rook is mute until you add ELEVENLABS_API_KEY";
    speakBtn.disabled = false;
    return;
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  await audio.play();
  speakBtn.disabled = false;
});

paintFat();
