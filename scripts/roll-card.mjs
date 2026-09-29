const escape = value => foundry.utils.escapeHTML(String(value ?? ""));

export function rollCard({ kind, title, subtitle = "", dieLabel = "Roll", die, resultLabel, result, rows = [], status = "", tone = "neutral", details = "" }) {
  const rowHtml = rows.map(([label, value]) => `<div class="tbe-card-row"><span>${escape(label)}</span><strong>${escape(value)}</strong></div>`).join("");
  return `<div class="tbe-roll-card tbe-roll-card-${escape(kind.toLowerCase().replace(/[^a-z0-9]+/g, "-"))}">
    <div class="tbe-card-header"><small>${escape(kind)}</small><h3>${escape(title)}</h3>${subtitle ? `<p>${escape(subtitle)}</p>` : ""}</div>
    <div class="tbe-card-hero"><div><small>${escape(dieLabel)}</small><strong>${escape(die)}</strong></div><div><small>${escape(resultLabel)}</small><strong>${escape(result)}</strong></div></div>
    ${rowHtml ? `<div class="tbe-card-breakdown"><b>Breakdown</b>${rowHtml}</div>` : ""}
    ${status ? `<div class="tbe-card-status tbe-card-${escape(tone)}">${escape(status)}</div>` : ""}
    ${details ? `<div class="tbe-card-details">${details}</div>` : ""}
    <div class="tbe-card-actions"><button type="button" class="tbe-copy-roll" title="Copy this roll as text" aria-label="Copy this roll as text"><i class="fa-regular fa-copy" aria-hidden="true"></i> Copy Roll</button></div>
  </div>`;
}

export function copyRollText(card) {
  const copy = card.cloneNode(true);
  copy.querySelectorAll(".tbe-card-actions, script, style").forEach(node => node.remove());
  copy.querySelectorAll("br").forEach(node => node.replaceWith("\n"));
  copy.querySelectorAll(".tbe-card-row > span").forEach(node => node.append(": "));
  copy.querySelectorAll(".tbe-attack-stats b").forEach(node => node.append(" "));
  copy.querySelectorAll("h3, p, small, strong, .tbe-card-breakdown > b, .tbe-card-row, .tbe-card-status, .tbe-hit-location, .tbe-hit-details, .tbe-attack-stats span").forEach(node => node.append("\n"));
  return (copy.textContent ?? "").split("\n").map(line => line.replace(/\s+/g, " ").trim()).filter(Boolean).join("\n");
}

export { escape as escapeCard };
