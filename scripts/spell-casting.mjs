import { rollCard } from "./roll-card.mjs";
const BINDS = ["Change", "Conjure", "Control", "Destroy", "Witness"];
const STRANDS = ["Air", "Beasts", "Body", "Earth", "Fire", "Plants", "Spheres", "Spirit", "Thought", "Water"];
const BIND_TOOLTIPS = {
  Change: "To alter, to change the basic properties of. An individual—either living being or object—may be made of component parts, but its Essential Pattern is its truest use or most honest expression. A sword has a metal blade (Earth), wooden handle (Plant), and leather wrappings (Beast), but in the end, its true function is about the blade—so its Essential Pattern is Earth. Therefore, casting a spell that Changes a sword would require the Earth Strand.",
  Conjure: "To bring forth into being, to create matter from nothing. Individual beings, living or otherwise, cannot be Conjured into existence, but such beings may be healed by this Bind; extra-planar beings may be Summoned. Conjured items last only as long as the spell’s Duration, but their effects may last beyond that.",
  Control: "To manipulate or protect, to take active control. Once a thing is under your control, it remains so until the Duration ends (or until the circumstances change to grant it a new opposed roll). Generally, it takes an action to actively control something or to issue a specific command.",
  Destroy: "To cause harm, to bring an end to. Things destroyed by magic stay destroyed after the spell’s Duration ends; hence, most Destroy spells that do direct or permanent damage have a Duration of Instant, but also have a higher Magnitude to reflect the spell’s destabilizing nature.",
  Witness: "To perceive, to know, to divine, to detect, to scry. Witness spells are often based on what Senses they employ."
};
const STRAND_TOOLTIPS = {
  Air: "Sound, electricity, cold, and light that does not produce heat. Includes invisibility.",
  Beasts: "Properties of all creatures, animals, and monsters native to the Broken Empires, and their products (hides, scales, teeth, etc.). Extra-planar creatures like demons fall under Spheres.",
  Body: "Life, healing, properties of the humanoid physical form. Wounds healed by magic remain healed after the Duration expires.",
  Earth: "Terrestrial materials, minerals, soil, metal, rock, the bones of the earth. Includes gravity.",
  Fire: "Light that produces heat, that which burns. Fire created by magic is normal fire, and burns until it runs out of fuel, the Duration ends, it is put out, or the spell is countered.",
  Plants: "All living plants and materials derived from them.",
  Spheres: "The planes of existence, summoning and binding otherworldly creatures, divining through the constellations, magical transport, the minutiae and esoterica of magic itself.",
  Spirit: "Ghosts and the undead, but also the immortal soul, and spiritual conviction and resistance.",
  Thought: "Minds, dreams, imagination, illusion, knowledge, reason, emotions. When Thought magic’s Duration expires, or if successfully resisted, the target may become aware of the magical manipulation.",
  Water: "Includes precipitation, snow, ice, oceans, rivers, and non-biological liquid."
};
const MAGNITUDES = { Discreet: 0, Subtle: 2, Offensive: 5, Vulgar: 10 };
const TARGETS = { Self: 0, Individual: 2, Zone: 3, "Two zones": 5, "Three zones": 7, Structure: 9, "Bounded area": 10 };
const RANGES = { Self: 0, "Touch/Engaged": 1, "Close/Short": 2, "Medium/Long": 3, "Very Long": 4, Sight: 5, "Arcane Tether": 6 };
const DURATIONS = { Instant: 0, "One Round": 1, Concentration: 2, "One Minute": 3, "One Hour": 4, Sun: 5, Week: 6, Fortnight: 7, Month: 8, Year: 9, Permanent: 10 };
const RITUAL = new Set(["Week", "Fortnight", "Month", "Year", "Permanent"]);
const THREAD_DICE = ["d12", "d10", "d8", "d6", "depleted"];
const spellDrafts = new Map();
const escape = value => foundry.utils.escapeHTML(String(value ?? ""));
const choice = (name, values) => `<label>${escape(name)} <select name="${escape(name)}">${Object.entries(values).map(([label, cost]) => `<option value="${escape(label)}">${escape(label)} (${cost ? `+${cost}` : "free"} TC)</option>`).join("")}</select></label>`;
const integer = (value, min = 0, max = Infinity) => { const n = Number(value); return Number.isInteger(n) && n >= min && n <= max ? n : null; };
function totalCost(values) {
  const count = integer(values.individuals, 1);
  const effect = integer(values.effect);
  const trigger = integer(values.triggered, 0, 9);
  const adjustment = integer(values.otherCost, -Infinity);
  const armour = integer(values.armour);
  const base = [MAGNITUDES[values.Magnitude], TARGETS[values.Target], RANGES[values.Range], DURATIONS[values.Duration]];
  if ([count, effect, trigger, adjustment, armour].includes(null) || base.some(value => value === undefined)) return null;
  return Math.max(0, base.reduce((sum, value) => sum + value, 0) + (values.Target === "Individual" ? 2 * (count - 1) + (values.chooseLocation ? 2 : 0) : 0) + effect + trigger + adjustment + armour);
}
const listChecks = (names, prefix, data) => `<fieldset><legend>${prefix === "bind" ? "Binds" : "Strands"} (tick all requisites)</legend><div class="tbe-casting-checks">${names.map(name => `<label><input type="checkbox" name="${prefix}_${name}" ${data(name) > 0 ? "" : "disabled"}> <span class="tbe-cast-tip" tabindex="0" data-tbe-tip="${escape((prefix === "bind" ? BIND_TOOLTIPS : STRAND_TOOLTIPS)[name])}">${escape(name)}</span> <small>${data(name)}</small></label>`).join("")}</div></fieldset>`;
const threadApplies = (item, label, selected) => {
  const attunement = String(item.system.bindsAndStrands || "").match(/^(Bind|Strand):\s*([^.;\n]+)/i);
  // Custom Threads without this prefix remain available for GM adjudication.
  return !attunement || (attunement[1].toLowerCase() === label.toLowerCase() && selected.some(name => attunement[2].split(/,|\bor\b/i).some(part => part.trim().toLowerCase() === name.toLowerCase())));
};
const threadOptions = (threads, label, selected) => `<label>${label} Thread <select name="${label.toLowerCase()}Thread"><option value="">None</option>${threads.filter(item => threadApplies(item, label, selected)).map(item => `<option value="${item.id}">${escape(item.name)} — ${escape(item.system.bindsAndStrands || "applicability unspecified")}${item.system.useMode === "points" ? ` (${item.system.points} points)` : ` (${item.system.die})`}</option>`).join("")}</select></label>`;

/** One sheet action; staged prompts preserve the rulebook's post-roll decisions. */
export async function castSpell(actor, { skillTotals, attackOutcome, wornArmorPenalty = 0 }) {
  if (!actor.isOwner) return;
  const resolve = Math.max(0, Number(actor.system.resolve.value) || 0);
  if (!resolve) { ui.notifications.warn("A Spellweaver needs at least 1 available Resolve to attempt a spell."); return; }
  const bindScore = name => skillTotals(actor, name, actor.system.skills.binds[name.toLowerCase()] ?? {}).total;
  const strandScore = name => Number(actor.system.skills.strands[name.toLowerCase()]?.level) || 0;
  const draft = spellDrafts.get(actor.id) ?? { ...(actor.getFlag("broken-empires-foundry", "spellDraft") ?? {}) };
  spellDrafts.set(actor.id, draft);
  let pendingDraftSave = Promise.resolve();
  let resetDraft = false;
  const capture = form => {
    for (const field of form.querySelectorAll("[name]")) {
      if (field.type === "checkbox") draft[field.name] = field.checked;
      else draft[field.name] = field.value;
    }
  };
  const initial = await foundry.applications.api.DialogV2.input({
    window: { title: "Cast a spell — shape and roll", resizable: true }, position: { width: 690 },
    content: `<div class="tbe-casting-dialog"><button type="button" data-reset-spell>Reset spell</button><label>Intent <textarea name="intent" rows="2" placeholder="What does the spell do?" required></textarea></label>
      ${listChecks(BINDS, "bind", bindScore)}
      <fieldset><legend>Bind roll modifiers (not TC)</legend><div class="tbe-casting-grid">
        <label>Resolve as Favor (+10 each, 0–3) <input name="favor" type="number" min="0" max="3" step="1" value="0"></label>
        <label>Other Bind roll modifier <input name="modifier" type="number" step="1" value="0"></label>
      </div></fieldset>
      ${listChecks(STRANDS, "strand", strandScore)}
      <label>Strand modifier (applies to the lowest selected Strand; positive or negative) <input name="strandModifier" type="number" step="1" value="0"></label>
      <div class="tbe-casting-grid">${choice("Magnitude", MAGNITUDES)}${choice("Target", TARGETS)}${choice("Range", RANGES)}${choice("Duration", DURATIONS)}
      <label>Individuals (if chosen) <input name="individuals" type="number" min="1" step="1" value="1"></label>
      <label><input name="chooseLocation" type="checkbox"> Choose Location / object part (+2 TC)</label>
      <label>Effect cost (GM) <input name="effect" type="number" min="0" step="1" value="0"></label>
      <label>Triggered Effect cost (0–9) <input name="triggered" type="number" min="0" max="9" step="1" value="0"></label>
      <label>Other TC modifier (GM ruling; negative reduces cost) <input name="otherCost" type="number" step="1" value="0"></label>
      <label>Worn armour Initiative penalty (positive TC) <input name="armour" type="number" min="0" step="1" value="${Math.max(0, wornArmorPenalty)}"></label></div>
      <label class="tbe-casting-total">Total Cost (TC) <output data-casting-total>0</output></label>
      <p>Week or longer and structure or bounded area require a ritual. Year and permanent durations also cause Fraying. The GM sets Magnitude, Effect and any requisites.</p></div>`,
    ok: { label: "Roll Bind" },
    render: (_event, dialog) => {
      const form = dialog.element.querySelector("form");
      if (!form) return;
      for (const field of form.querySelectorAll("[name]")) {
        if (!Object.hasOwn(draft, field.name)) continue;
        if (field.type === "checkbox") field.checked = Boolean(draft[field.name]);
        else field.value = draft[field.name];
      }
      const refreshTotal = () => {
        const values = Object.fromEntries([...form.querySelectorAll("[name]")].map(field => [field.name, field.type === "checkbox" ? field.checked : field.value]));
        form.querySelector("[data-casting-total]").textContent = totalCost(values) ?? "Check costs";
      };
      refreshTotal();
      const onEdit = () => { resetDraft = false; capture(form); refreshTotal(); };
      form.addEventListener("input", onEdit);
      form.addEventListener("change", onEdit);
      form.querySelector("[data-reset-spell]")?.addEventListener("click", async event => {
        event.preventDefault();
        form.reset();
        for (const field of form.querySelectorAll("[name]")) if (field.type === "checkbox") field.checked = false;
        for (const key of Object.keys(draft)) delete draft[key];
        resetDraft = true;
        refreshTotal();
        await pendingDraftSave;
        await actor.unsetFlag("broken-empires-foundry", "spellDraft");
      });
    },
    close: (_event, dialog) => {
      if (resetDraft) return;
      const form = dialog.element?.querySelector("form");
      if (form) capture(form);
      pendingDraftSave = actor.setFlag("broken-empires-foundry", "spellDraft", { ...draft });
    }
  });
  await pendingDraftSave;
  if (!initial) return;
  const binds = BINDS.filter(name => initial[`bind_${name}`]);
  const strands = STRANDS.filter(name => initial[`strand_${name}`]);
  const favor = integer(initial.favor, 0, Math.min(3, resolve));
  const individuals = integer(initial.individuals, 1);
  const fields = ["effect", "triggered", "otherCost", "armour"].map(name => integer(initial[name], name === "otherCost" ? -Infinity : 0, name === "triggered" ? 9 : Infinity));
  const modifier = Number(initial.modifier);
  const strandModifier = integer(initial.strandModifier, -Infinity);
  if (!binds.length || !strands.length || !String(initial.intent || "").trim() || favor === null || individuals === null || fields.some(v => v === null) || !Number.isInteger(modifier) || strandModifier === null) {
    ui.notifications.warn("Enter an intent, at least one trained Bind and Strand, and valid costs and modifiers."); return;
  }
  const [effect, triggered, otherCost, armour] = fields;
  const magnitude = MAGNITUDES[initial.Magnitude], targetCost = TARGETS[initial.Target];
  const rangeCost = RANGES[initial.Range], durationCost = DURATIONS[initial.Duration];
  if ([magnitude, targetCost, rangeCost, durationCost].some(v => v === undefined)) return;
  const ritual = RITUAL.has(initial.Duration) || ["Structure", "Bounded area"].includes(initial.Target);
  const tc = totalCost(initial);
  if (tc === null) return;
  const castingTime = ritual ? `${tc} hour${tc === 1 ? "" : "s"} (ritual)` : ["One Hour", "Sun"].includes(initial.Duration) ? "1 minute" : "1 action";
  const bind = binds.reduce((lowest, name) => bindScore(name) < bindScore(lowest) ? name : lowest);
  const strand = strands.reduce((lowest, name) => strandScore(name) < strandScore(lowest) ? name : lowest);
  const effectiveStrand = strandScore(strand) + strandModifier;
  if (effectiveStrand < 1) { ui.notifications.warn("The adjusted Strand must be at least 1 to cast this spell."); return; }
  const data = actor.system.skills.binds[bind.toLowerCase()];
  const target = bindScore(bind) + favor * 10 + modifier;
  await actor.update({ "system.resolve.value": resolve - favor });
  const roll = await new Roll("1d100").evaluate();
  spellDrafts.delete(actor.id);
  await actor.unsetFlag("broken-empires-foundry", "spellDraft");
  const result = attackOutcome(roll.total, target, Number(data.expertise) || 0);
  const ones = roll.total % 10 || 10;
  const spellCard = (status, tone, extra = "", mastery = null) => rollCard({
    kind: "Spell", title: `${actor.name} casts: ${initial.intent}`,
    subtitle: `${binds.join(" + ")} / ${strands.join(" + ")}`,
    dieLabel: "Bind d100", die: roll.total, resultLabel: "Bind target", result: target,
    rows: [["Bind used", bind], ["Bind Favor", `+${favor * 10}`], ["Other Bind modifier", modifier >= 0 ? `+${modifier}` : String(modifier)],
      ["Bind result", `${result.criticalFailure ? "Critical failure" : result.critical ? "Critical success" : result.success ? "Success" : "Failure"}${result.success ? ` · ${result.sl} SL` : ""}`]],
    status, tone,
    details: `<div class="tbe-card-spell-totals"><div><small>Total Cost (TC)</small><strong>${tc}</strong></div><div><small>Final Mastery</small><strong>${mastery === null ? "—" : mastery}</strong></div></div>
      <div class="tbe-card-breakdown"><b>Spell construction</b>
      ${[["Magnitude", `${initial.Magnitude} +${magnitude}`], ["Target", `${initial.Target} +${targetCost}${initial.Target === "Individual" ? `; extra targets +${2 * (individuals - 1)}${initial.chooseLocation ? "; Choose Location +2" : ""}` : ""}`],
      ["Range", `${initial.Range} +${rangeCost}`], ["Duration", `${initial.Duration} +${durationCost}`], ["Effect / Trigger / Other / Armour", `${effect} / ${triggered} / ${otherCost} / ${armour}`],
      ["Adjusted Strand", `${strand} ${strandScore(strand)} ${strandModifier >= 0 ? "+" : "−"} ${Math.abs(strandModifier)} = ${effectiveStrand}`], ["Casting time", castingTime]]
      .map(([label, value]) => `<div class="tbe-card-row"><span>${escape(label)}</span><strong>${escape(value)}</strong></div>`).join("")}</div>${extra}`
  });
  const speaker = ChatMessage.getSpeaker({ actor });
  if (!result.success) {
    const available = Math.max(0, Number(actor.system.resolve.value) || 0);
    if (available) await actor.update({ "system.resolve.value": available - 1 });
    let extra = `<p>Spell fails. ${available ? "1 Resolve spent." : "No Resolve remained for the failure cost."}</p>`;
    if (result.criticalFailure) {
      const reaction = await new Roll(`1d20 + ${magnitude}`).evaluate();
      extra += `<p><b>Critical failure:</b> Weave Reaction roll ${reaction.total} (including Magnitude +${magnitude}). Consult the Weave Reaction Table. If the caster is a Fade, gain 1 Fraying.</p>`;
    }
    await ChatMessage.create({ speaker, content: spellCard("Spell fails", "failure", extra) });
    return;
  }

  const threads = actor.items.filter(item => item.type === "thread" && (item.system.useMode === "points" ? Number(item.system.points) > 0 : THREAD_DICE.includes(item.system.die) && item.system.die !== "depleted"));
  const available = Math.max(0, Number(actor.system.resolve.value) || 0);
  const support = await foundry.applications.api.DialogV2.input({
    window: { title: "Cast a spell — choose Threads", resizable: true }, position: { width: 600 },
    content: `<div class="tbe-casting-dialog"><p>Bind succeeded: ${roll.total}, ${result.sl} SL. Base Mastery: ones die ${ones} + adjusted Strand ${effectiveStrand} = <b>${ones + effectiveStrand}</b>. Spell TC: <b>${tc}</b>. Available Resolve: ${available}.</p>
      <p>Select at most one Bind Thread and one Strand Thread. Check their description and applicable Binds/Strands on the Item sheet; you must be in physical contact with them.</p>
      <div class="tbe-casting-grid">${threadOptions(threads, "Bind", binds)}${threadOptions(threads, "Strand", strands)}
      <label>Bind consumable points to spend <input name="bindPoints" type="number" min="0" step="1" value="0"></label>
      <label>Strand consumable points to spend <input name="strandPoints" type="number" min="0" step="1" value="0"></label></div>
      <p>Thread dice are rolled now; a result of 1 or 2 steps the die down. If this casting remains uncontrolled, the remaining gap modifies a Weave Reaction roll.</p></div>`,
    ok: { label: "Use Threads" }
  });
  if (!support) { await ChatMessage.create({ speaker, content: spellCard("Casting incomplete — finish manually", "warning", "<p>Threads and mitigation were not resolved. Do not reroll the Bind.</p>") }); return; }
  const bindThread = threads.find(item => item.id === support.bindThread), strandThread = threads.find(item => item.id === support.strandThread);
  const bp = integer(support.bindPoints), sp = integer(support.strandPoints);
  if ((bindThread && strandThread && bindThread.id === strandThread.id) || [bp, sp].includes(null)
      || (!bindThread && bp) || (!strandThread && sp)
      || (bindThread && bindThread.system.useMode === "points" && bp > Number(bindThread.system.points))
      || (strandThread && strandThread.system.useMode === "points" && sp > Number(strandThread.system.points))) {
    ui.notifications.warn("Choose two different applicable Threads and valid amounts. The Bind roll has already happened; resolve the casting manually.");
    await ChatMessage.create({ speaker, content: spellCard("Casting incomplete — finish manually", "warning", "<p>Resolve Threads and mitigation manually (invalid input).</p>") }); return;
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
  const beforeMitigation = ones + effectiveStrand + threadMastery;
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
      await ChatMessage.create({ speaker, content: spellCard("Casting incomplete — finish manually", "warning", `<p>Thread Mastery ${threadMastery}; mitigation and Weave Reaction unresolved. Finish manually without rerolling the Bind.</p>`) }); return;
    }
    mitigation = integer(decision.mitigate, 0, available);
    if (mitigation === null) { ui.notifications.warn("Resolve amount invalid; finish this casting manually."); return; }
    if (mitigation) await actor.update({ "system.resolve.value": Math.max(0, Number(actor.system.resolve.value) - mitigation) });
  }
  const mastery = ones + effectiveStrand + threadMastery + mitigation;
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
  await ChatMessage.create({ speaker, content: spellCard(gap ? `Uncontrolled spell · Weave Reaction +${gap}` : `Controlled spell · Mastery ${mastery} meets TC ${tc}`, gap ? "warning" : "success", `<div class="tbe-card-breakdown"><b>Mastery</b>${[["Ones die", ones], ["Adjusted Strand", effectiveStrand], ["Threads", threadMastery], ["Resolve spent", mitigation]].map(([label, value]) => `<div class="tbe-card-row"><span>${label}</span><strong>+${value}</strong></div>`).join("")}</div>${threadDetails.length ? `<p>${threadDetails.join("; ")}</p>` : ""}${reaction}${durationFraying}<p>Targets resist with an opposed roll against this Bind result. Apply the spell and any reaction together.</p>`, mastery) });
}
