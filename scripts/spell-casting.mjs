const BINDS = ["Change", "Conjure", "Control", "Destroy", "Witness"];
const STRANDS = ["Air", "Beasts", "Body", "Earth", "Fire", "Plants", "Spheres", "Spirit", "Thought", "Water"];
const MAGNITUDES = { Discreet: 0, Subtle: 2, Offensive: 5, Vulgar: 10 };
const TARGETS = { Self: 0, Individual: 2, Zone: 3, "Two zones": 5, "Three zones": 7, Structure: 9, "Bounded area": 10 };
const RANGES = { Self: 0, "Touch/Engaged": 1, "Close/Short": 2, "Medium/Long": 3, "Very Long": 4, Sight: 5, "Arcane Tether": 6 };
const DURATIONS = { Instant: 0, "One Round": 1, Concentration: 2, "One Minute": 3, "One Hour": 4, Sun: 5, Week: 6, Fortnight: 7, Month: 8, Year: 9, Permanent: 10 };
const RITUAL = new Set(["Week", "Fortnight", "Month", "Year", "Permanent"]);
const THREAD_DICE = ["d12", "d10", "d8", "d6", "depleted"];
const escape = value => foundry.utils.escapeHTML(String(value ?? ""));
const choice = (name, values) => `<label>${escape(name)} <select name="${escape(name)}">${Object.entries(values).map(([label, cost]) => `<option value="${escape(label)}">${escape(label)} (${cost ? `+${cost}` : "free"} TC)</option>`).join("")}</select></label>`;
const integer = (value, min = 0, max = Infinity) => { const n = Number(value); return Number.isInteger(n) && n >= min && n <= max ? n : null; };
const listChecks = (names, prefix, data) => `<fieldset><legend>${prefix === "bind" ? "Binds" : "Strands"} (tick all requisites)</legend><div class="tbe-casting-checks">${names.map(name => `<label><input type="checkbox" name="${prefix}_${name}" ${data(name) > 0 ? "" : "disabled"}> ${escape(name)} <small>${data(name)}</small></label>`).join("")}</div></fieldset>`;
const threadOptions = (threads, label) => `<label>${label} Thread <select name="${label.toLowerCase()}Thread"><option value="">None</option>${threads.map(item => `<option value="${item.id}">${escape(item.name)} — ${escape(item.system.bindsAndStrands || "applicability unspecified")}${item.system.useMode === "points" ? ` (${item.system.points} points)` : ` (${item.system.die})`}</option>`).join("")}</select></label>`;

/** One sheet action; staged prompts preserve the rulebook's post-roll decisions. */
export async function castSpell(actor, { skillTotals, attackOutcome, wornArmorPenalty = 0 }) {
  if (!actor.isOwner) return;
  const resolve = Math.max(0, Number(actor.system.resolve.value) || 0);
  if (!resolve) { ui.notifications.warn("A Spellweaver needs at least 1 available Resolve to attempt a spell."); return; }
  const bindScore = name => skillTotals(actor, name, actor.system.skills.binds[name.toLowerCase()] ?? {}).total;
  const strandScore = name => Number(actor.system.skills.strands[name.toLowerCase()]?.level) || 0;
  const initial = await foundry.applications.api.DialogV2.input({
    window: { title: "Cast a spell — shape and roll", resizable: true }, position: { width: 690 },
    content: `<div class="tbe-casting-dialog"><label>Intent <textarea name="intent" rows="2" placeholder="What does the spell do?" required></textarea></label>
      ${listChecks(BINDS, "bind", bindScore)}${listChecks(STRANDS, "strand", strandScore)}
      <div class="tbe-casting-grid">${choice("Magnitude", MAGNITUDES)}${choice("Target", TARGETS)}${choice("Range", RANGES)}${choice("Duration", DURATIONS)}
      <label>Individuals (if chosen) <input name="individuals" type="number" min="1" step="1" value="1"></label>
      <label><input name="chooseLocation" type="checkbox"> Choose Location / object part (+2 TC)</label>
      <label>Effect cost (GM) <input name="effect" type="number" min="0" step="1" value="0"></label>
      <label>Triggered Effect cost (0–9) <input name="triggered" type="number" min="0" max="9" step="1" value="0"></label>
      <label>Other TC (GM ruling) <input name="otherCost" type="number" min="0" step="1" value="0"></label>
      <label>Worn armour Initiative penalty (positive TC) <input name="armour" type="number" min="0" step="1" value="${Math.max(0, wornArmorPenalty)}"></label>
      <label>Resolve as Favor (+10 each, 0–3) <input name="favor" type="number" min="0" max="3" step="1" value="0"></label>
      <label>Other Bind roll modifier <input name="modifier" type="number" step="1" value="0"></label></div>
      <p>Week or longer and structure or bounded area require a ritual. Year and permanent durations also cause Fraying. The GM sets Magnitude, Effect and any requisites.</p></div>`,
    ok: { label: "Roll Bind" }
  });
  if (!initial) return;
  const binds = BINDS.filter(name => initial[`bind_${name}`]);
  const strands = STRANDS.filter(name => initial[`strand_${name}`]);
  const favor = integer(initial.favor, 0, Math.min(3, resolve));
  const individuals = integer(initial.individuals, 1);
  const fields = ["effect", "triggered", "otherCost", "armour"].map(name => integer(initial[name], 0, name === "triggered" ? 9 : Infinity));
  const modifier = Number(initial.modifier);
  if (!binds.length || !strands.length || !String(initial.intent || "").trim() || favor === null || individuals === null || fields.some(v => v === null) || !Number.isInteger(modifier)) {
    ui.notifications.warn("Enter an intent, at least one trained Bind and Strand, and valid costs and modifiers."); return;
  }
  const [effect, triggered, otherCost, armour] = fields;
  const magnitude = MAGNITUDES[initial.Magnitude], targetCost = TARGETS[initial.Target];
  const rangeCost = RANGES[initial.Range], durationCost = DURATIONS[initial.Duration];
  if ([magnitude, targetCost, rangeCost, durationCost].some(v => v === undefined)) return;
  const ritual = RITUAL.has(initial.Duration) || ["Structure", "Bounded area"].includes(initial.Target);
  const tc = magnitude + targetCost + (initial.Target === "Individual" ? 2 * (individuals - 1) + (initial.chooseLocation ? 2 : 0) : 0)
    + rangeCost + durationCost + effect + triggered + otherCost + armour;
  const castingTime = ritual ? `${tc} hour${tc === 1 ? "" : "s"} (ritual)` : ["One Hour", "Sun"].includes(initial.Duration) ? "1 minute" : "1 action";
  const bind = binds.reduce((lowest, name) => bindScore(name) < bindScore(lowest) ? name : lowest);
  const strand = strands.reduce((lowest, name) => strandScore(name) < strandScore(lowest) ? name : lowest);
  const data = actor.system.skills.binds[bind.toLowerCase()];
  const target = bindScore(bind) + favor * 10 + modifier;
  await actor.update({ "system.resolve.value": resolve - favor });
  const roll = await new Roll("1d100").evaluate();
  const result = attackOutcome(roll.total, target, Number(data.expertise) || 0);
  const ones = roll.total % 10 || 10;
  const header = `<h3>${escape(actor.name)} casts: ${escape(initial.intent)}</h3><p><b>${escape(binds.join(" + "))}</b> (roll with ${escape(bind)}) / <b>${escape(strands.join(" + "))}</b> (Mastery uses ${escape(strand)} ${strandScore(strand)}).</p>
    <p>Magnitude ${escape(initial.Magnitude)} ${magnitude}; Target ${escape(initial.Target)} ${targetCost}${initial.Target === "Individual" ? ` (+${2 * (individuals - 1)} more targets${initial.chooseLocation ? ", +2 Choose Location" : ""})` : ""}; Range ${escape(initial.Range)} ${rangeCost}; Duration ${escape(initial.Duration)} ${durationCost}; Effect ${effect}; Trigger ${triggered}; other ${otherCost}; armour ${armour}. <b>Total Cost ${tc}.</b> Casting time ${castingTime}.</p>
    <p>Bind ${escape(bind)} target ${target} (Favor ${favor}, modifier ${modifier}); d100 <b>${roll.total}</b> — ${result.criticalFailure ? "critical failure" : result.critical ? "critical success" : result.success ? "success" : "failure"}${result.success ? `, ${result.sl} SL to oppose` : ""}.</p>`;
  const speaker = ChatMessage.getSpeaker({ actor });
  if (!result.success) {
    const available = Math.max(0, Number(actor.system.resolve.value) || 0);
    if (available) await actor.update({ "system.resolve.value": available - 1 });
    let extra = `<p>Spell fails. ${available ? "1 Resolve spent." : "No Resolve remained for the failure cost."}</p>`;
    if (result.criticalFailure) {
      const reaction = await new Roll(`1d20 + ${magnitude}`).evaluate();
      extra += `<p><b>Critical failure:</b> Weave Reaction roll ${reaction.total} (including Magnitude +${magnitude}). Consult the Weave Reaction Table. If the caster is a Fade, gain 1 Fraying.</p>`;
    }
    await ChatMessage.create({ speaker, content: `<div class="tbe-casting-card">${header}${extra}</div>` });
    return;
  }

  const threads = actor.items.filter(item => item.type === "thread" && (item.system.useMode === "points" ? Number(item.system.points) > 0 : THREAD_DICE.includes(item.system.die) && item.system.die !== "depleted"));
  const available = Math.max(0, Number(actor.system.resolve.value) || 0);
  const support = await foundry.applications.api.DialogV2.input({
    window: { title: "Cast a spell — choose Threads", resizable: true }, position: { width: 600 },
    content: `<div class="tbe-casting-dialog"><p>Bind succeeded: ${roll.total}, ${result.sl} SL. Base Mastery: ones die ${ones} + lowest Strand ${strandScore(strand)} = <b>${ones + strandScore(strand)}</b>. Spell TC: <b>${tc}</b>. Available Resolve: ${available}.</p>
      <p>Select at most one Bind Thread and one Strand Thread. Check their description and applicable Binds/Strands on the Item sheet; you must be in physical contact with them.</p>
      <div class="tbe-casting-grid">${threadOptions(threads, "Bind")}${threadOptions(threads, "Strand")}
      <label>Bind consumable points to spend <input name="bindPoints" type="number" min="0" step="1" value="0"></label>
      <label>Strand consumable points to spend <input name="strandPoints" type="number" min="0" step="1" value="0"></label></div>
      <p>Thread dice are rolled now; a result of 1 or 2 steps the die down. If this casting remains uncontrolled, the remaining gap modifies a Weave Reaction roll.</p></div>`,
    ok: { label: "Use Threads" }
  });
  if (!support) { await ChatMessage.create({ speaker, content: `<div class="tbe-casting-card">${header}<p>Success; Threads and mitigation were not resolved. Do not reroll the Bind; finish this casting manually.</p></div>` }); return; }
  const bindThread = threads.find(item => item.id === support.bindThread), strandThread = threads.find(item => item.id === support.strandThread);
  const bp = integer(support.bindPoints), sp = integer(support.strandPoints);
  if ((bindThread && strandThread && bindThread.id === strandThread.id) || [bp, sp].includes(null)
      || (!bindThread && bp) || (!strandThread && sp)
      || (bindThread && bindThread.system.useMode === "points" && bp > Number(bindThread.system.points))
      || (strandThread && strandThread.system.useMode === "points" && sp > Number(strandThread.system.points))) {
    ui.notifications.warn("Choose two different applicable Threads and valid amounts. The Bind roll has already happened; resolve the casting manually.");
    await ChatMessage.create({ speaker, content: `<div class="tbe-casting-card">${header}<p>Resolve Threads and mitigation manually (invalid input).</p></div>` }); return;
  }
  let threadMastery = 0;
  const threadDetails = [];
  for (const [item, points, kind] of [[bindThread, bp, "Bind"], [strandThread, sp, "Strand"]]) {
    if (!item) continue;
    if (item.system.useMode === "points") {
      threadMastery += points;
      if (points) await item.update({ "system.points": Number(item.system.points) - points });
      threadDetails.push(`${kind}: ${escape(item.name)} +${points} points`);
    } else {
      const die = item.system.die;
      const threadRoll = await new Roll(`1${die}`).evaluate();
      threadMastery += threadRoll.total;
      const next = threadRoll.total <= 2 ? THREAD_DICE[THREAD_DICE.indexOf(die) + 1] : die;
      if (next !== die) await item.update({ "system.die": next });
      threadDetails.push(`${kind}: ${escape(item.name)} ${die} → ${threadRoll.total} Mastery${next !== die ? ` (now ${next})` : ""}`);
    }
  }
  const beforeMitigation = ones + strandScore(strand) + threadMastery;
  const shortfall = Math.max(0, tc - beforeMitigation);
  let mitigation = 0;
  if (shortfall) {
    const decision = await foundry.applications.api.DialogV2.input({
      window: { title: "Cast a spell — mitigate the Weave" },
      content: `<div class="tbe-casting-dialog"><p>Mastery ${beforeMitigation} versus TC ${tc}: short by <b>${shortfall}</b>. Spend Resolve now, before knowing whether the targets resist. ${available} Resolve available.</p>
        <label>Resolve to spend (0–${available}) <input type="number" name="mitigate" min="0" max="${available}" step="1" value="${Math.min(shortfall, available)}"></label><p>Any remaining shortfall adds to the Weave Reaction roll.</p></div>`,
      ok: { label: "Commit casting and post to chat" }
    });
    if (!decision) {
      await ChatMessage.create({ speaker, content: `<div class="tbe-casting-card">${header}<p>Thread Mastery ${threadMastery}; mitigation and Weave Reaction unresolved. Finish manually without rerolling the Bind.</p></div>` }); return;
    }
    mitigation = integer(decision.mitigate, 0, available);
    if (mitigation === null) { ui.notifications.warn("Resolve amount invalid; finish this casting manually."); return; }
    if (mitigation) await actor.update({ "system.resolve.value": Math.max(0, Number(actor.system.resolve.value) - mitigation) });
  }
  const mastery = ones + strandScore(strand) + threadMastery + mitigation;
  const gap = Math.max(0, tc - mastery);
  let durationFraying = "";
  if (initial.Duration === "Year" || initial.Duration === "Permanent") {
    const frayRoll = await new Roll(initial.Duration === "Year" ? "1d4" : "2d6").evaluate();
    await actor.update({ "system.fraying": (Number(actor.system.fraying) || 0) + frayRoll.total });
    durationFraying = `<p>${escape(initial.Duration)} duration: +${frayRoll.total} Fraying.</p>`;
  }
  let reaction = "";
  if (gap) {
    const reactionRoll = await new Roll(`1d20 + ${gap}`).evaluate();
    reaction = `<p><b>Uncontrolled:</b> Weave Reaction Modifier +${gap}; 1d20 + ${gap} = <b>${reactionRoll.total}</b>. Consult the Weave Reaction Table.</p>`;
  }
  await ChatMessage.create({ speaker, content: `<div class="tbe-casting-card">${header}<p>Mastery: ones die ${ones} + Strand ${strandScore(strand)} + Threads ${threadMastery} + mitigation Resolve ${mitigation} = <b>${mastery}</b> against TC ${tc}. ${gap ? "Uncontrolled." : "Controlled."}</p>${threadDetails.length ? `<p>${threadDetails.join("; ")}</p>` : ""}${reaction}${durationFraying}<p>Targets resist with an opposed roll against this Bind result. Apply the spell and any reaction together.</p></div>` });
}
