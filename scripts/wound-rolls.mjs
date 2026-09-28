const LOCATIONS = ["Head", "Body", "Right Arm", "Left Arm", "Right Leg", "Left Leg"];
const escape = value => foundry.utils.escapeHTML(String(value ?? ""));
const face = total => total === 10 ? 10 : total;
const locationOf = wound => LOCATIONS.includes(wound.generalLocation) ? wound.generalLocation : LOCATIONS.find(location => String(wound.location || "").toLowerCase().includes(location.toLowerCase())) || "";
const impairmentKey = location => "impaired" + location.replace(/\s/g, "");
const woundTotal = (actor, location) => actor.system.wounds.filter(w => locationOf(w) === location).reduce((sum, w) => sum + Math.max(0, Number(w.points) || 0), 0);
const rollDie = async (actor, sides, title, lines) => {
  const roll = await new Roll(`1d${sides}`).evaluate();
  const die = face(roll.total), toughness = Number(actor.system.attributes.toughness) || 0;
  const content = `<div class="tbe-wound-roll-card"><h3>${escape(actor.name)} — ${escape(title)}</h3><p>Die ${die} + Toughness ${toughness} = <strong>${die + toughness}</strong>.</p>${lines(die, die + toughness)}</div>`;
  await roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor }), flavor: content });
  return { die, total: die + toughness };
};

export async function rollWoundDie(actor, index) {
  if (!actor.isOwner) return;
  const wound = actor.system.wounds[index];
  const location = wound && locationOf(wound);
  if (!location || Number(wound.points) <= 0) { ui.notifications.warn("Set a wound location and positive WP before rolling the Wound Die."); return; }
  const totalWP = woundTotal(actor, location), previous = Boolean(actor.system.conditions[impairmentKey(location)]);
  const lethalWP = actor.system.wounds.filter(w => w.lethal).reduce((sum, w) => sum + Math.max(0, Number(w.points) || 0), 0);
  const thresholdNotice = wound.lethal && lethalWP > Number(actor.system.attributes.deathThreshold)
    ? `<p><strong>Death Threshold exceeded:</strong> ${lethalWP} lethal WP exceeds DT ${escape(actor.system.attributes.deathThreshold)}. Death is immediate under the standard rule; mark Dead if applicable.</p>` : "";
  let updates = {};
  await rollDie(actor, 10, `Wound Die — ${location}`, (die, result) => {
    if (die === 10 || result > totalWP) return `<p>${totalWP} WP in ${escape(location)}: <strong>not impaired</strong>${die === 10 ? " (natural 10 always avoids impairment)" : ""}.</p>${thresholdNotice}`;
    const outcome = [`${totalWP} WP in ${escape(location)}: <strong>${previous ? "second impairment" : "impaired"}</strong>.`];
    updates[`system.conditions.${impairmentKey(location)}`] = true;
    if (previous) {
      updates["system.conditions.shock"] = true;
      updates["system.conditions.prone"] = true;
      if (location === "Head") updates["system.conditions.unconscious"] = true;
      outcome.push(`Shock for ${die} minutes${location === "Head" ? "; also unconscious" : ""}. A PC can spend 3 Resolve to avoid dropping in Shock; clear that condition if spent.`);
    } else if (location === "Body") outcome.push(`Roll Endurance or fall into Shock for ${die} minutes. Mark Shock and Prone if that roll fails.`);
    else if (location.endsWith("Arm")) {
      outcome.push(`Drop items held in that hand.${die % 2 === 0 ? " Even die: the arm is unusable until impairment is removed." : ""}`);
      if (die % 2 === 0) updates["system.conditions.armUseless"] = true;
    } else if (location.endsWith("Leg")) {
      outcome.push(die % 2 ? "Odd die: fall Prone." : "Even die: cannot Run or Charge until impairment is removed.");
      updates[die % 2 ? "system.conditions.prone" : "system.conditions.noRunCharge"] = true;
    } else if (die % 2) {
      outcome.push("Odd die: momentarily stunned; lose the next action, but can defend and move if possible.");
      updates["system.conditions.stunned"] = true;
    } else {
      outcome.push(`Even die: unconscious and in Shock for ${die} minutes.`);
      updates["system.conditions.shock"] = true;
      updates["system.conditions.unconscious"] = true;
      updates["system.conditions.prone"] = true;
    }
    if (updates["system.conditions.shock"] && lethalWP > Number(actor.system.attributes.lethalityLevel)) {
      updates["system.conditions.dying"] = true;
      outcome.push(`Lethal WP ${lethalWP} exceeds LL ${actor.system.attributes.lethalityLevel}: Dying while in Shock; follow the end-of-round Dying checks.`);
    }
    return outcome.map(line => `<p>${escape(line)}</p>`).join("") + thresholdNotice;
  });
  if (Object.keys(updates).length) await actor.update(updates);
}

export async function rollInfectionDie(actor, { mode, index = -1 } = {}) {
  if (!actor.isOwner) return;
  const wounds = actor.system.wounds;
  const eligible = wounds.map((w, i) => ({ w, i })).filter(({ w }) => w.lethal && !w.infection && Number(w.points) > 0);
  const infected = wounds.map((w, i) => ({ w, i })).filter(({ w }) => w.infection && Number(w.points) > 0);
  const targetWound = mode === "journey" || mode === "event" ? eligible.reduce((best, entry) => !best || Number(entry.w.points) > Number(best.w.points) ? entry : best, null) : eligible.find(entry => entry.i === index);
  if (mode === "sepsis" ? !infected.length : mode === "journey" ? !wounds.some(w => w.lethal && Number(w.points) > 0) : !targetWound) {
    ui.notifications.warn("No eligible wound for this Infection check."); return;
  }
  let difficulty = 0;
  if (mode === "journey") difficulty = wounds.filter(w => w.lethal).reduce((sum, w) => sum + Math.max(0, Number(w.points) || 0), 0);
  if (mode === "attack") difficulty = Number(targetWound.w.points);
  if (mode === "event") {
    const answer = await foundry.applications.api.DialogV2.input({ window: { title: "Infection Event" }, content: '<label>Opposing Difficulty <input name="difficulty" type="number" step="1" value="0"></label>', ok: { label: "Roll Infection Die" } });
    if (!answer) return;
    if (!Number.isInteger(Number(answer.difficulty))) return;
    difficulty = Number(targetWound.w.points) + Number(answer.difficulty);
  }
  if (mode === "sepsis") difficulty = infected.reduce((sum, { w }) => sum + Number(w.points), 0);
  const target = mode === "sepsis" ? infected.reduce((best, entry) => !best || Number(entry.w.points) > Number(best.w.points) ? entry : best, null) : targetWound;
  let worsened = false;
  await rollDie(actor, 20, `${{ journey: "Journey infection", event: "Infection Event", attack: "Infectious attack", sepsis: "Sepsis check" }[mode]}`, (_die, result) => {
    worsened = result <= difficulty;
    const label = mode === "sepsis" ? "total infected WP" : mode === "journey" ? "total lethal WP" : "wound WP + difficulty";
    const effect = mode === "sepsis" ? (worsened ? `Infection worsens: mark the highest infected wound Septic. Death within 48 hours unless treated or amputated; −30 to all skills.` : "Infection holds steady.") : (worsened ? `Infection: mark ${locationOf(target.w) || "the selected wound"} (${target.w.points} WP) Infected.` : "No new infection.");
    return `<p>Against ${escape(label)} ${difficulty}: <strong>${escape(effect)}</strong></p>${mode === "journey" ? "<p>If any lethal wounds are infected after this check, make one Sepsis check.</p>" : ""}`;
  });
  if (worsened && target) await actor.update({ [`system.wounds.${target.i}.${mode === "sepsis" ? "septic" : "infection"}`]: true });
}
