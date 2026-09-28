import { currentPiety, recordPiety } from "./piety.mjs";
const escape = value => foundry.utils.escapeHTML(String(value ?? ""));
const SYMBOL_DICE = ["d12", "d10", "d8", "d6", "depleted"];
const RESISTANCE = {
  "Uninvolved, ignorant or unclear": 1,
  "Directly threatening the Godbound": 2,
  "Blasphemous or offensive to the faith": 3,
  "Active threat to the deity’s works": 4,
  "Profane defiance": 5
};

export async function requestMiracle(actor, { attackOutcome }) {
  if (!actor.isOwner) return;
  const current = currentPiety(actor);
  if (current <= 0) { ui.notifications.warn("Current Piety is zero; the Godbound is Cast Out until atonement."); return; }
  const die = SYMBOL_DICE.includes(actor.system.holySymbolDie) ? actor.system.holySymbolDie : "d12";
  const details = await foundry.applications.api.DialogV2.input({
    window: { title: "Request a divine miracle", resizable: true }, position: { width: 600 },
    content: `<div class="tbe-casting-dialog"><p>Current Piety: <b>${current}</b>. Ask for help within a Domain of your deity; the GM decides how the god responds. No Resolve may be spent on this roll.</p>
      <label>Deity <input name="deity" placeholder="Your god or celestial servant"></label>
      <label>Domain <input name="domain" placeholder="Which of their Domains applies?" required></label>
      <label>What help are you asking for? <textarea name="request" rows="3" required></textarea></label>
      <div class="tbe-casting-grid"><label>Piety modifier (GM; positive or negative) <input name="modifier" type="number" step="1" value="0"></label>
      <label>Prayer time / bonus on success <select name="prayer"><option value="0">One action (+0 SL)</option><option value="1">One minute (+1 SL)</option><option value="2">Ten minutes (+2 SL)</option><option value="3">One hour or longer (+3 SL)</option></select></label></div>
      <p>Modifier examples: advancing the deity’s aims +10 to +30; aiding the faithful +10; personal gain −10 or worse; violating a Core Stricture −30.</p>
      <label><input type="checkbox" name="symbol" ${die === "depleted" ? "disabled" : ""}> Use holy symbol after a successful Piety roll (+2 SL; currently ${escape(die)} Supply Die)</label>
      <label><input type="checkbox" name="servant"> Petition a celestial servant (no Greater Miracle)</label>
      <label>Target’s relationship to the deity (if resistance applies) <select name="resistance"><option value="">No hostile target / decide later</option>${Object.entries(RESISTANCE).map(([label, value]) => `<option value="${value}">${escape(label)} — fixed ${value}</option>`).join("")}</select></label>
      <p>Living, sentient targets oppose adverse miracles with an appropriate skill (or Divinity). The GM interprets the miracle’s form and duration.</p></div>`,
    ok: { label: "Roll Piety" }
  });
  if (!details) return;
  const modifier = Number(details.modifier), prayer = Number(details.prayer);
  if (!String(details.domain ?? "").trim() || !String(details.request ?? "").trim() || !Number.isInteger(modifier) || !Number.isInteger(prayer) || prayer < 0 || prayer > 3) {
    ui.notifications.warn("Enter the Domain, request, and valid roll modifier and prayer time."); return;
  }
  const target = current + modifier;
  const roll = await new Roll("1d100").evaluate();
  const outcome = attackOutcome(roll.total, target, 0);
  const success = outcome.success;
  let symbolMessage = "";
  let symbolSL = 0;
  if (success && details.symbol && die !== "depleted") {
    const symbolRoll = await new Roll(`1${die}`).evaluate();
    const next = symbolRoll.total <= 2 ? SYMBOL_DICE[SYMBOL_DICE.indexOf(die) + 1] : die;
    if (next !== die) await actor.update({ "system.holySymbolDie": next });
    symbolSL = 2;
    symbolMessage = ` Holy symbol ${die} rolled ${symbolRoll.total}${next !== die ? `; now ${next}` : ""}, adding 2 SL.`;
  }
  const sl = success ? outcome.sl + prayer + symbolSL : 0;
  const miracle = !success ? "No miracle" : sl >= 9 ? details.servant ? "Middle Miracle (celestial servants cannot grant Greater Miracles)" : "Greater Miracle" : sl >= 5 ? "Middle Miracle" : "Lesser Miracle";
  let cost = 0, costRoll = "none";
  if (!outcome.critical) {
    const depletion = await new Roll("1d10").evaluate();
    cost = depletion.total + (success ? sl : outcome.criticalFailure ? 10 : 0);
    costRoll = `${depletion.total}${success ? ` + ${sl} SL` : outcome.criticalFailure ? " + 10 critical failure" : ""}`;
    await recordPiety(actor, -cost, `Miracle: ${String(details.domain).trim()} — ${String(details.request).trim()}`);
  }
  const remaining = Math.max(0, current - cost);
  const note = remaining === 0 ? "Piety has reached zero: Cast Out; resolve the miracle first if it succeeded." : "";
  const resistance = details.resistance ? `Hostile target: GM chooses an appropriate resistance skill; fixed number ${escape(details.resistance)}. Divinity may be used instead. ` : "";
  await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content: `<div class="tbe-casting-card"><h3>${escape(actor.name)} asks ${escape(details.deity || "their deity")} for a miracle</h3>
    <p><b>${escape(details.domain)}:</b> ${escape(details.request)}</p>
    <p>Current Piety ${current} ${modifier >= 0 ? "+" : "−"} ${Math.abs(modifier)} modifier = target ${target}; d100 <b>${roll.total}</b> — ${outcome.criticalFailure ? "critical failure" : outcome.critical ? "critical success" : success ? "success" : "failure"}.</p>
    <p>${escape(miracle)}${success ? `: ${outcome.sl} roll SL + ${prayer} prayer SL + ${symbolSL} holy symbol SL = <b>${sl} SL</b>.` : "."}${symbolMessage}</p>
    <p>Piety cost ${costRoll} = <b>${cost}</b>; current Piety now <b>${remaining}</b>. ${note}</p>
    <p>${resistance}The GM decides the miracle’s actual effect within the Domain. Resolve cannot modify a Piety roll; miracles cause no Weave Reaction.</p></div>` });
}
