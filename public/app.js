const panel = document.getElementById("panel");
const result = document.getElementById("result");
const authChip = document.getElementById("auth-chip");
const authEmail = document.getElementById("auth-email");
const logoutBtn = document.getElementById("logout-btn");

(async function bootstrapAuth() {
  try {
    const res = await fetch("/api/auth/me", { credentials: "include" });
    const data = await res.json();
    if (!data.authenticated) {
      window.location.replace("/login.html");
      return;
    }
    authEmail.textContent = data.email;
    authChip.classList.remove("hidden");
    authChip.classList.add("flex");
  } catch {
    window.location.replace("/login.html");
  }
})();

logoutBtn?.addEventListener("click", async () => {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
  } finally {
    window.location.replace("/login.html");
  }
});

const actions = {
  "audit-gbp": {
    title: "Audit GBP Listing",
    description:
      "Scorecard of your Google Business Profile across hours, categories, photos, posts, reviews, and NAP.",
    fields: [
      { name: "businessName", label: "Business name", default: "Acme Dental" },
      { name: "category", label: "Primary category", default: "Dentist" },
      {
        name: "address",
        label: "Address",
        default: "123 Main St, Austin, TX 78701",
      },
      { name: "phone", label: "Phone", type: "tel", default: "+1 512-555-0134" },
      { name: "website", label: "Website", default: "https://acmedental.com" },
      {
        name: "photosCount",
        label: "Photos count",
        type: "number",
        default: "18",
      },
      {
        name: "reviewCount",
        label: "Review count",
        type: "number",
        default: "72",
      },
      {
        name: "reviewResponseRate",
        label: "Review response rate (0-1)",
        type: "number",
        step: "0.01",
        default: "0.35",
      },
      {
        name: "lastPostAt",
        label: "Last GBP post (ISO date)",
        default: "2026-02-14",
      },
    ],
    shape(v) {
      return {
        businessName: v.businessName,
        category: v.category,
        address: v.address,
        phone: v.phone,
        website: v.website,
        photosCount: Number(v.photosCount),
        reviewCount: Number(v.reviewCount),
        reviewResponseRate: Number(v.reviewResponseRate),
        lastPostAt: v.lastPostAt,
      };
    },
  },
  "check-citations": {
    title: "Check Citations",
    description:
      "NAP (Name/Address/Phone) consistency check across directory listings.",
    fields: [
      { name: "name", label: "Canonical name", default: "Acme Dental" },
      {
        name: "address",
        label: "Canonical address",
        default: "123 Main St, Austin, TX 78701",
      },
      { name: "phone", label: "Canonical phone", type: "tel", default: "+1 512-555-0134" },
      {
        name: "citations",
        label: "Citations (JSON array)",
        type: "textarea",
        default: JSON.stringify(
          [
            {
              source: "Yelp",
              name: "Acme Dental",
              address: "123 Main Street, Austin, TX 78701",
              phone: "(512) 555-0134",
            },
            {
              source: "Facebook",
              name: "Acme Dental Co.",
              address: "123 Main St., Austin, TX",
              phone: "+1-512-555-0134",
            },
            {
              source: "BBB",
              name: "Acme Dental",
              address: "123 Main St, Austin TX 78702",
              phone: "512.555.0134",
            },
          ],
          null,
          2,
        ),
      },
    ],
    shape(v) {
      let citations;
      try {
        citations = JSON.parse(v.citations);
      } catch (e) {
        throw new Error(`citations is not valid JSON: ${e.message}`);
      }
      return {
        name: v.name,
        address: v.address,
        phone: v.phone,
        citations,
      };
    },
  },
  "review-generation": {
    title: "Review Generation",
    description:
      "Draft a brand-safe reply to a customer review (2–4 sentences).",
    fields: [
      {
        name: "businessName",
        label: "Business name",
        default: "Acme Dental",
      },
      { name: "reviewerName", label: "Reviewer first name", default: "Priya" },
      {
        name: "stars",
        label: "Stars",
        type: "select",
        options: ["1", "2", "3", "4", "5"],
        default: "2",
      },
      {
        name: "reviewText",
        label: "Review text",
        type: "textarea",
        default:
          "Wait time was over an hour even though I had an appointment. Staff was polite but the scheduling is clearly a mess.",
      },
      {
        name: "voice",
        label: "Brand voice",
        type: "select",
        options: ["warm", "professional", "playful"],
        default: "warm",
      },
      {
        name: "businessContact",
        label: "Contact for offline resolution",
        default: "hello@acmedental.com",
      },
    ],
    shape(v) {
      return {
        businessName: v.businessName,
        voice: v.voice,
        businessContact: v.businessContact,
        review: {
          reviewerName: v.reviewerName,
          stars: Number(v.stars),
          text: v.reviewText,
        },
      };
    },
  },
  "competitor-scan": {
    title: "Competitor Scan",
    description:
      "Compare your profile against up to 3 competitors and get an action plan.",
    fields: [
      {
        name: "businessName",
        label: "Your business",
        default: "Acme Dental",
      },
      { name: "category", label: "Category", default: "Dentist" },
      { name: "location", label: "City", default: "Austin, TX" },
      {
        name: "competitors",
        label: "Competitors (JSON array, max 3)",
        type: "textarea",
        default: JSON.stringify(
          [
            {
              name: "Downtown Smiles",
              website: "https://downtownsmiles.example",
              details:
                "4.9★ (420 reviews), weekend hours, live chat, Invisalign focus.",
            },
            {
              name: "Austin Family Dental",
              website: "https://austinfamilydental.example",
              details:
                "4.7★ (310 reviews), bilingual staff, Spanish homepage, free consults.",
            },
          ],
          null,
          2,
        ),
      },
    ],
    shape(v) {
      let competitors;
      try {
        competitors = JSON.parse(v.competitors);
      } catch (e) {
        throw new Error(`competitors is not valid JSON: ${e.message}`);
      }
      return {
        businessName: v.businessName,
        category: v.category,
        location: v.location,
        competitors,
      };
    },
  },
};

function fieldHtml(f) {
  const id = `f-${f.name}`;
  const label = `<label for="${id}">${f.label}</label>`;
  if (f.type === "textarea") {
    return `<div class="field mb-3">${label}<textarea id="${id}" name="${f.name}" rows="6">${escapeHtml(f.default ?? "")}</textarea></div>`;
  }
  if (f.type === "select") {
    const opts = f.options
      .map(
        (o) =>
          `<option value="${escapeHtml(o)}"${o === f.default ? " selected" : ""}>${escapeHtml(o)}</option>`,
      )
      .join("");
    return `<div class="field mb-3">${label}<select id="${id}" name="${f.name}">${opts}</select></div>`;
  }
  const type = f.type ?? "text";
  const step = f.step ? ` step="${f.step}"` : "";
  return `<div class="field mb-3">${label}<input id="${id}" name="${f.name}" type="${type}"${step} value="${escapeHtml(f.default ?? "")}" /></div>`;
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderPanel(actionId) {
  const cfg = actions[actionId];
  const fieldsHtml = cfg.fields.map(fieldHtml).join("");
  panel.innerHTML = `
    <div class="mb-4">
      <div class="flex items-start justify-between gap-3">
        <h2 class="text-lg font-semibold leading-tight min-w-0 flex-1">${escapeHtml(cfg.title)}</h2>
        <button type="button" id="panel-close" class="btn-secondary shrink-0" aria-label="Close">Close</button>
      </div>
      <p class="text-sm text-gray-500 mt-1">${escapeHtml(cfg.description)}</p>
    </div>
    <form id="panel-form">
      ${fieldsHtml}
      <div class="flex flex-col sm:flex-row sm:items-center sm:gap-3 mt-3">
        <button type="submit" class="btn-primary w-full sm:w-auto" id="run-btn">Run</button>
        <span class="hidden sm:inline text-xs text-gray-400 break-all">POST /api/quick-actions/${actionId}</span>
      </div>
    </form>
  `;
  result.classList.add("hidden");
  result.innerHTML = "";
  panel.classList.remove("hidden");
  panel.scrollIntoView({ behavior: "smooth", block: "start" });

  panel.querySelector("#panel-close").addEventListener("click", () => {
    panel.classList.add("hidden");
    result.classList.add("hidden");
  });
  panel.querySelector("#panel-form").addEventListener("submit", (e) => {
    e.preventDefault();
    runAction(actionId, new FormData(e.target));
  });
}

async function runAction(actionId, formData) {
  const cfg = actions[actionId];
  const values = Object.fromEntries(formData.entries());
  let payload;
  try {
    payload = cfg.shape(values);
  } catch (err) {
    return showError(err.message);
  }

  const btn = document.getElementById("run-btn");
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span>Running…`;
  showLoading();
  // Surface the loading state on small screens where the result section is
  // below the submit button — otherwise the tap feels like it did nothing.
  result.scrollIntoView({ behavior: "smooth", block: "nearest" });

  const started = performance.now();
  try {
    const res = await fetch(`/api/quick-actions/${actionId}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "include",
    });
    if (res.status === 401) {
      window.location.replace("/login.html");
      return;
    }
    const clientMs = Math.round(performance.now() - started);
    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      return showError(`${res.status} — non-JSON response:\n${text}`);
    }
    if (!res.ok) {
      return showError(
        `${res.status} — ${json.error ?? "request failed"}`,
        json,
      );
    }
    renderResult(actionId, json, clientMs);
  } catch (err) {
    showError(err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = "Run";
  }
}

function showLoading() {
  result.classList.remove("hidden");
  result.innerHTML = `<div class="flex items-center text-gray-600"><span class="spinner"></span>Planning and dispatching…</div>`;
}

function showError(msg, detail) {
  result.classList.remove("hidden");
  const detailHtml = detail
    ? `<pre class="result-json mt-3">${escapeHtml(JSON.stringify(detail, null, 2))}</pre>`
    : "";
  result.innerHTML = `
    <div class="flex items-center gap-2 mb-1"><span class="pill pill-err">error</span></div>
    <p class="text-sm text-red-700 whitespace-pre-wrap">${escapeHtml(msg)}</p>
    ${detailHtml}
  `;
}

function renderResult(actionId, data, clientMs) {
  const plan = data.plan ?? {};
  const validation = data.validationNotes ?? [];
  const fellBack = data.fellBackToLocal;
  const latency = data.latencyMs;

  const headerPills = `
    <span class="pill pill-ok">${escapeHtml(plan.specialist ?? "?")}</span>
    <span class="pill" style="background:#e0e7ff;color:#3730a3;">${escapeHtml(plan.model ?? "?")}</span>
    ${fellBack ? `<span class="pill pill-warn">fell back to local</span>` : ""}
    ${validation.length ? `<span class="pill pill-warn">${validation.length} validation note${validation.length === 1 ? "" : "s"}</span>` : `<span class="pill pill-ok">valid</span>`}
  `;

  let outputHtml;
  if (actionId === "review-generation" && typeof data.output === "string") {
    outputHtml = `<div class="mt-4 p-4 rounded-xl bg-purple-50 border border-purple-100 text-purple-900 whitespace-pre-wrap">${escapeHtml(data.output)}</div>`;
  } else {
    outputHtml = `<pre class="result-json mt-4">${escapeHtml(JSON.stringify(data.output, null, 2))}</pre>`;
  }

  const validationHtml = validation.length
    ? `<ul class="mt-3 text-sm text-amber-700 list-disc list-inside">${validation.map((v) => `<li>${escapeHtml(v)}</li>`).join("")}</ul>`
    : "";

  result.innerHTML = `
    <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <h2 class="text-lg font-semibold leading-tight">Result · ${escapeHtml(actions[actionId].title)}</h2>
      <div class="flex items-center gap-2 flex-wrap">${headerPills}</div>
    </div>
    <p class="text-xs text-gray-500 mt-2 break-words">
      server: ${latency != null ? latency + "ms" : "—"} · client: ${clientMs}ms
      ${plan.reasoning ? ` · plan: ${escapeHtml(plan.reasoning)}` : ""}
    </p>
    ${validationHtml}
    ${outputHtml}
  `;
  result.scrollIntoView({ behavior: "smooth", block: "start" });
}

document.querySelectorAll("[data-action]").forEach((btn) => {
  btn.addEventListener("click", () => renderPanel(btn.dataset.action));
});
