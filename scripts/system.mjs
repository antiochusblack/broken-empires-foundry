import { castSpell } from "./spell-casting.mjs";
const { ArrayField, BooleanField, NumberField, SchemaField, StringField } = foundry.data.fields;
const string = () => new StringField({ required: true, blank: true, initial: "" });
const number = (initial = 0) => new NumberField({ required: true, integer: true, initial });
const decimal = () => new NumberField({ required: true, min: 0, initial: 0 });
const entry = (fields) => new SchemaField(fields);
const list = (fields, first = null) => new ArrayField(entry(fields), { initial: first ? [first] : [] });

const SKILLS = {
  Combat: ["Dodge", "Melee: Light", "Melee: Medium", "Melee: Heavy", "Might", "Missile", "Thrown Weapons"],
  Adventuring: ["Athletics", "Endurance", "Locks & Traps", "Perception", "Ride", "Sail/Boat", "Sleight of Hand", "Stealth", "Survival", "Track", "Willpower"],
  Social: ["Deceive", "Insight", "Inspire", "Intimidate", "Perform", "Persuade", "Protocol", "Seduce", "Wit"],
  Lore: ["Ancient Lore", "Arcana", "Commerce", "Common Lore", "Craft: Practical", "Craft: Artistic", "Divinity", "Heal", "Naturewise", "Streetwise"],
  Binds: ["Change", "Conjure", "Control", "Destroy", "Witness"],
  Magic: ["Piety"],
  Strands: ["Air", "Beasts", "Body", "Earth", "Fire", "Plants", "Spheres", "Spirit", "Thought", "Water"]
};
const SKILL_DESCRIPTIONS = {
  Dodge: "Avoid incoming damage and oppose certain magical effects; requires room to move.",
  "Melee: Light": "Fight with light, fast, one-handed weapons.", "Melee: Medium": "Fight with standard swords, maces and axes.", "Melee: Heavy": "Fight with two-handed weapons, often with Reach.",
  Might: "Unarmed fighting, grappling and feats of strength; −20 against armed foes.", Missile: "Use bows, crossbows and slings.", "Thrown Weapons": "Throw spears, knives and improvised objects.",
  Athletics: "Climb, swim, jump and rise from Prone.", Endurance: "Withstand suffering; affects wound recovery and physical stamina.", "Locks & Traps": "Pick locks and build or disarm traps; use Perception to spot traps.",
  Perception: "Notice changes, hidden creatures and ambushes; used when scouting journeys.", Ride: "Ride mounts, avoid falls, and defend against ranged attacks while mounted.", "Sail/Boat": "Navigate waterways and captain vessels.",
  "Sleight of Hand": "Pick pockets, palm small objects and cheat at games.", Stealth: "Move quietly and unseen; requires concealment and limits movement to one zone per round.",
  Survival: "Find food, water and shelter; avoid wilderness hazards.", Track: "Follow trails and navigate by landmarks or stars.", Willpower: "Mental and spiritual fortitude; oppose certain magical effects.",
  Deceive: "Lie, disguise yourself and use guile.", Insight: "Sense intentions and see through Deceive.", Inspire: "Rouse and motivate others with emotion or speeches.",
  Intimidate: "Threaten, shame or pressure others.", Perform: "Sing, dance, act, tell stories or play an instrument.", Persuade: "Use reason, bargaining and a friendly approach.",
  Protocol: "Know etiquette, rank, status and diplomacy.", Seduce: "Use flirtation and understand romantic cues.", Wit: "Use charm, humour, flattery and quick observation.",
  "Ancient Lore": "Recall history, old legends and forgotten myths.", Arcana: "Know the Weave, esoteric theory and summoning circles.", Commerce: "Trade, haggle, gamble and manage wealth.",
  "Common Lore": "Know the geography, customs, plants, animals and people of a region.", "Craft: Practical": "Build or repair mundane objects, often as an extended roll.",
  "Craft: Artistic": "Make art, poetry, sculpture or disguises, often as an extended roll.", Divinity: "Know gods, religions and doctrine; oppose divine miracles.",
  Heal: "Treat wounds, poison and infection; roll Medical Supply after each attempt.", Naturewise: "Know nature, animals, weather and natural healing ingredients.",
  Streetwise: "Know local underworld contacts and urban suppliers; can support Social rolls."
};
Object.assign(SKILL_DESCRIPTIONS, {
  Piety: "Divine favour available to a Godbound. Piety rises and falls through play and is rolled to invoke divine power.",
  Change: "A Bind for altering an existing subject.", Conjure: "A Bind for bringing a subject into being.",
  Control: "A Bind for directing a subject.", Destroy: "A Bind for damaging or ending a subject.",
  Witness: "A Bind for perceiving or learning about a subject.",
  Air: "The Strand governing air.", Beasts: "The Strand governing beasts.", Body: "The Strand governing bodies.",
  Earth: "The Strand governing earth.", Fire: "The Strand governing fire.", Plants: "The Strand governing plants.",
  Spheres: "The Strand governing spheres.", Spirit: "The Strand governing spirits.",
  Thought: "The Strand governing thoughts.", Water: "The Strand governing water."
});
const ABILITY_SKILLS = {
  Strength: ["Melee: Medium", "Melee: Heavy", "Thrown Weapons", "Athletics", "Sail/Boat", "Intimidate"],
  Dexterity: ["Dodge", "Melee: Light", "Missile", "Ride", "Sleight of Hand", "Stealth"],
  Constitution: ["Might", "Endurance", "Survival", "Track", "Craft: Practical"],
  Intelligence: ["Locks & Traps", "Protocol", "Wit", "Ancient Lore", "Arcana", "Commerce", "Common Lore"],
  Wisdom: ["Perception", "Willpower", "Insight", "Craft: Artistic", "Divinity", "Heal", "Naturewise"],
  Charisma: ["Deceive", "Inspire", "Perform", "Persuade", "Seduce", "Streetwise"]
};
const ABILITY_ALIASES = { str: "Strength", dex: "Dexterity", con: "Constitution", int: "Intelligence", wis: "Wisdom", cha: "Charisma" };
function abilityBonus(actor, skillName) {
  return (actor.system.abilityScores ?? []).reduce((sum, row) => {
    const typed = String(row.name ?? "").trim().toLowerCase();
    const ability = ABILITY_ALIASES[typed] || Object.keys(ABILITY_SKILLS).find(name => name.toLowerCase() === typed);
    return sum + (ABILITY_SKILLS[ability]?.includes(skillName) ? 5 : 0);
  }, 0);
}
const BREAKDOWN_FIELDS = ["race", "culture", "lifeEvents", "career", "rounding", "xp", "other"];
function skillTotals(actor, skillName, data) {
  const ability = abilityBonus(actor, skillName);
  const other = BREAKDOWN_FIELDS.reduce((sum, field) => sum + (Number(data?.[field]) || 0), 0);
  return { ability, other, increases: ability + other, total: (Number(data?.value) || 0) + ability + other };
}
const key = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/_$/, "");
const DEFAULT_SECTION_TABS = [
  { id: "identity", label: "Identity" }, { id: "skills", label: "Skills" },
  { id: "magic", label: "Magic" }, { id: "combat", label: "Combat" },
  { id: "gear", label: "Gear" }, { id: "story", label: "Story" },
  { id: "reference", label: "Reference" }
];
function orderedSectionTabs(order) {
  const saved = Array.isArray(order) ? order : [];
  const ids = [...new Set(saved.filter(id => DEFAULT_SECTION_TABS.some(tab => tab.id === id)))];
  return [...ids, ...DEFAULT_SECTION_TABS.map(tab => tab.id).filter(id => !ids.includes(id))]
    .map(id => DEFAULT_SECTION_TABS.find(tab => tab.id === id));
}
const skill = () => entry({ value: number(20), race: number(), culture: number(), lifeEvents: number(), career: number(), rounding: number(), xp: number(), other: number(), expertise: number(), savvy: new BooleanField({ initial: false }) });
const strand = () => entry({ level: number(), thin: new BooleanField({ initial: false }) });

class CharacterData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const skills = {};
    for (const [category, names] of Object.entries(SKILLS)) {
      skills[key(category)] = new SchemaField(Object.fromEntries(names.map(name => [key(name), category === "Strands" ? strand() : skill()])));
    }
    return {
      description: string(), notes: string(), race: string(), sex: string(), size: string(), age: string(),
      sectionOrder: new ArrayField(string(), { initial: DEFAULT_SECTION_TABS.map(tab => tab.id) }),
      equipmentAreaOrder: new ArrayField(string(), { initial: [] }),
      culture: string(), career: string(), status: number(), silver: number(), xp: number(),
      abilityScores: new ArrayField(entry({ name: string(), descriptor: string() }), { initial: [{ name: "", descriptor: "" }, { name: "", descriptor: "" }] }),
      racialTraits: list({ name: string(), effect: string(), source: string() }, { name: "", effect: "", source: "" }),
      personalityTraits: list({ name: string(), description: string() }, { name: "", description: "" }),
      goals: list({ text: string(), shared: new BooleanField({ initial: false }) }, { text: "", shared: false }),
      events: new SchemaField(Object.fromEntries(["origin", "youth", "recent"].map(x => [x, entry({ name: string(), benefit: string(), story: string() })]))),
      sharedHistories: list({ character: string(), event: string(), skill: string(), story: string() }, { character: "", event: "", skill: "", story: "" }),
      relationships: list({ name: string(), type: string(), notes: string() }, { name: "", type: "", notes: "" }),
      resolve: entry({ value: number(10), max: number(10), fatigue: number(), permanentFatigue: number() }),
      attributes: entry({ initiative: number(10), initiativePenalty: number(), toughness: number(), deathThreshold: number(), lethalityLevel: number() }),
      sepsisDeadline: string(),
      wounds: list({ generalLocation: string(), location: string(), detail: string(), points: number(), lethal: new BooleanField({ initial: true }), ritual: new BooleanField({ initial: false }), infection: new BooleanField({ initial: false }), septic: new BooleanField({ initial: false }) }, { generalLocation: "", location: "", detail: "", points: 0, lethal: true, ritual: false, infection: false, septic: false }),
      skills: new SchemaField(skills),
      customSkills: list({ name: string(), category: string(), description: string(), value: number(), race: number(), culture: number(), lifeEvents: number(), career: number(), rounding: number(), xp: number(), other: number(), expertise: number(), savvy: new BooleanField({ initial: false }) }, { name: "", category: "Other", description: "", value: 0, race: 0, culture: 0, lifeEvents: 0, career: 0, rounding: 0, xp: 0, other: 0, expertise: 0, savvy: false }),
      resources: list({ name: string(), value: number(), max: number() }, { name: "", value: 0, max: 0 }),
      equipment: list({ name: string(), quantity: number(1), encumbrance: number(), notes: string() }),
      armor: list({ location: string(), name: string(), protection: number(), bulk: number(), notes: string() }),
      supply: entry({ gear: new StringField({ initial: "d12" }), ammo: new StringField({ initial: "d12" }), rations: new StringField({ initial: "d12" }), medical: new StringField({ initial: "d12" }) }),
      encumbranceMax: number(6), weaponEncumbranceMax: number(6), defensiveItemId: string(), applyDefensiveAP: new BooleanField({ initial: false }), equipmentLocations: new ArrayField(entry({ id: string(), name: string(), countsEncumbrance: new BooleanField({ initial: false }) }), { initial: [] }), droppedZone: string(), fraying: number(), trueName: string(), threads: string()
    };
  }
}
class TalentData extends foundry.abstract.TypeDataModel {
  static defineSchema() { return { source: string(), effect: string(), requirements: string(), category: string(), reference: string(), riseSkill: string() }; }
}
class RaceData extends foundry.abstract.TypeDataModel {
  static defineSchema() { return { traits: new ArrayField(entry({ name: string(), effect: string() }), { initial: [] }), notes: string() }; }
}
class ThreadData extends foundry.abstract.TypeDataModel {
  static defineSchema() { return { description: string(), useMode: new StringField({ required: true, initial: "die", choices: ["die", "points"] }), die: new StringField({ required: true, initial: "d6", choices: ["d6", "d8", "d10", "d12", "depleted"] }), points: number(), bindsAndStrands: string() }; }
}
class WeaponData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return { price: number(), category: string(), attackSkill: string(), reach: string(), damage: string(), chooseLocation: string(), circumventShield: string(), disarm: string(), trip: string(), encumbrance: number(), range: string(), notes: string(), size: string(), quantity: number(1),
      // Keep prototype values in existing worlds, even though they are not weapon statistics.
      attack: string(), parry: string(), clash: string(), counterstrike: string(), disruption: string(), threat: string(),
      freeAtHand: new BooleanField({ initial: false }), placement: new StringField({ required: true, initial: "atHand" }), zone: string(),
      useMode: new StringField({ initial: "melee" }), thrown: entry({ attackSkill: string(), reach: string(), damage: string(), chooseLocation: string(), circumventShield: string(), disarm: string(), trip: string(), range: string(), notes: string() }) };
  }
}
class ArmorData extends foundry.abstract.TypeDataModel {
  static defineSchema() { return { price: number(), category: string(), protection: number(), bulk: decimal(), size: string(), quantity: number(1), training: new BooleanField({ initial: false }), canSunder: new BooleanField({ initial: false }), sundered: new BooleanField({ initial: false }), placement: new StringField({ required: true, initial: "inventory" }), zone: string(), location: string(), penalties: string(), stealthPenalty: number(), dodgePenalty: number(), athleticsPenalty: number(), perceptionPenalty: number(), riseFromPronePenalty: number(), notes: string() }; }
}
class ShieldData extends foundry.abstract.TypeDataModel {
  static defineSchema() { return { price: number(), size: string(), quantity: number(1), protection: number(), shieldBash: string(), encumbrance: number(), split: new BooleanField({ initial: false }), pinned: new BooleanField({ initial: false }), placement: new StringField({ required: true, initial: "atHand" }), zone: string(), notes: string() }; }
}
class GearData extends foundry.abstract.TypeDataModel {
  static defineSchema() { return { price: number(), category: string(), size: string(), encumbrance: decimal(), quantity: number(1), placement: new StringField({ required: true, initial: "inventory" }), zone: string(), notes: string() }; }
}
const BODY_LOCATIONS = ["Head", "Body", "Right Arm", "Left Arm", "Right Leg", "Left Leg"];
const canPinShield = item => ["small", "medium", "large"].includes(String(item.system.size || "").trim().toLowerCase());
const shieldAP = item => item.system.split ? 0 : Math.max(0, Number(item.system.protection || 0) - (canPinShield(item) && item.system.pinned ? 2 : 0));
const LOCATION_OPTIONS = [
  { value: "ready", label: "Held and Ready" }, { value: "atHand", label: "At Hand" },
  { value: "worn", label: "Worn" }, { value: "inventory", label: "Inventory (Stored)" },
  { value: "dropped", label: "Dropped in Zone" }, { value: "away", label: "At Home / Elsewhere" }
];
const PLACEMENTS = Object.fromEntries(["weapon", "shield", "armor", "gear"].map(type => [type, LOCATION_OPTIONS]));
const inferWoundLocation = wound => {
  if (BODY_LOCATIONS.includes(wound.generalLocation)) return wound.generalLocation;
  const value = String(wound.location ?? "").toLowerCase();
  if (/head|skull|\beye\b|\bear\b|face|nose|neck/.test(value)) return "Head";
  if (/arm|shoulder|bicep|elbow|forearm|hand/.test(value)) return value.includes("left") ? "Left Arm" : value.includes("right") ? "Right Arm" : "";
  if (/leg|hip|thigh|knee|shin|foot/.test(value)) return value.includes("left") ? "Left Leg" : value.includes("right") ? "Right Leg" : "";
  if (/body|chest|stomach|groin/.test(value)) return "Body";
  return "";
};
const itemENC = item => Math.max(0, Number(item.system.encumbrance) || 0);
const itemQuantity = item => Math.max(0, Number(item.system.quantity ?? 1) || 0);
const ITEM_SIZES = ["Tiny", "Small", "Medium", "Large", "Very Large"];
const PHYSICAL_SKILLS = new Set(["Athletics", "Endurance", "Ride", "Sail/Boat", "Sleight of Hand", "Stealth", "Survival", "Track"]);
const inventoryOverflowPenalty = (used, maximum) => {
  const excess = Math.max(0, used - maximum);
  return excess === 0 ? 0 : excess <= 3 ? -10 : excess <= 6 ? -20 : -30;
};
const physicalSkill = (name, category) => category === "Combat" || PHYSICAL_SKILLS.has(name);
// Book thrown profiles also apply to older owned copies made before dual-use items existed.
const LEGACY_THROWN = {
  Dagger: { damage: "1", range: "0", trip: "6", notes: "One dagger At Hand is free of ENC; Piercing 5 against Prone/Grappled." },
  "Hand Axe": { damage: "2", range: "0" },
  Spear: { damage: "3", range: "1", notes: "Piercing 1; Pierce Through 4 SL (thrown only)." },
  Javelin: { damage: "2", range: "2", notes: "Piercing 1; Pierce Through 4 SL (thrown only)." }
};
function thrownProfile(item) {
  const own = item.system.thrown;
  if (own?.attackSkill) return own;
  const legacy = LEGACY_THROWN[item.name];
  return legacy ? { attackSkill: "Thrown Weapons", reach: "-", chooseLocation: "5", circumventShield: "5", disarm: "5", trip: "5", ...legacy } : null;
}
function weaponUse(item) {
  const thrown = thrownProfile(item);
  const active = item.system.useMode === "thrown" && thrown;
  return { stats: active ? { ...item.system, ...Object.fromEntries(Object.entries(thrown).filter(([, value]) => value !== "")) } : item.system, thrown: Boolean(thrown), isThrown: Boolean(active) };
}
const EQUIPMENT_NOTE_TIPS = {
  "1H": "Used in one hand.", "2H": "Requires both hands; cannot equip a shield while wielding it.",
  ClSh: "Can attempt the Cleave Shield manoeuvre.",
  NL: "Non-lethal Wound Points do not count against Death Threshold or Lethality Level.",
  Defensive: "Gain +10 to defence rolls when parrying with this weapon.",
  Unwieldy: "Suffer −20 to defence rolls when parrying with this weapon.",
  Overbearing: "Drive Back costs one fewer Success Level with this weapon.",
  Thrown: "Can use the Thrown Weapons skill and its thrown profile when thrown.",
  "Ammo Die": "Track ammunition by rolling the Ammo Supply Die after use.",
  "Mounted Charge": "This weapon's attack requires a mounted charge."
};
function equipmentNoteSegments(notes) {
  const pattern = /\b(?:Pierce Through\s+4\s+SL|Piercing\s+\d+|Reload\s+\d+|Defensive|Unwieldy|Overbearing|Thrown|ClSh|Ammo Die|Mounted Charge|2H|1H|NL)\b/gi;
  const text = String(notes || "");
  const parts = [];
  let end = 0;
  for (const match of text.matchAll(pattern)) {
    if (match.index > end) parts.push({ text: text.slice(end, match.index) });
    const value = match[0];
    let tooltip = EQUIPMENT_NOTE_TIPS[Object.keys(EQUIPMENT_NOTE_TIPS).find(k => k.toLowerCase() === value.toLowerCase())];
    if (/^Piercing\s+\d+$/i.test(value)) tooltip = `Bypasses ${value.match(/\d+/)[0]} points of worn Armour Points; does not reduce shield AP.`;
    if (/^Pierce Through\s+4\s+SL$/i.test(value)) tooltip = "Thrown spear or javelin only: spend 4 SL when shield AP stops or reduces the attack; reduce a pierced shield's AP by 2 until the weapon is removed with a Minor Action.";
    if (/^Reload\s+\d+$/i.test(value)) tooltip = `Requires ${value.match(/\d+/)[0]} action(s) to reload.`;
    parts.push({ text: value, tooltip });
    end = match.index + value.length;
  }
  if (end < text.length) parts.push({ text: text.slice(end) });
  return parts;
}
function pierceThroughNoteUpdate(item) {
  if (item.type !== "weapon" || !["Spear", "Javelin", "Spear (thrown)", "Javelin (thrown)"].includes(item.name)) return null;
  const original = item.system.notes;
  const standard = item.name === "Spear" ? "Piercing 1; Unwieldy; Thrown." : "Piercing 1; Thrown.";
  const legacyThrown = "Piercing 1. Legacy separate entry; the standard weapon now switches between melee and thrown use.";
  const valid = item.name.endsWith("(thrown)") ? ["Piercing 1.", legacyThrown] : [standard];
  const updates = { _id: item.id };
  if (valid.includes(original)) updates["system.notes"] = original.replace(/\.$/, "") + "; Pierce Through 4 SL (thrown only).";
  if (["Spear", "Javelin"].includes(item.name) && item.system.thrown?.attackSkill && item.system.thrown.notes === "Piercing 1.") {
    updates["system.thrown.notes"] = "Piercing 1; Pierce Through 4 SL (thrown only).";
  }
  return Object.keys(updates).length > 1 ? updates : null;
}
const itemPlacement = item => item.system.placement || (item.type === "armor" || item.type === "gear" ? "inventory" : "atHand");
const ARMOR_PENALTIES = [
  ["Stealth", "stealthPenalty", ["Body"]], ["Dodge", "dodgePenalty", ["Body"]],
  ["Athletics", "athleticsPenalty", ["Right Leg", "Left Leg"]],
  ["Perception", "perceptionPenalty", ["Head"]], ["Rise from Prone", "riseFromPronePenalty", ["Body"]]
];
// Rulebook armour table, pp. 141–142: values apply only at the listed piece's location.
const ARMOR_BOOK_PENALTIES = {
  "Reinforced Leather": { body: -5, leg: -5 },
  Mail: { body: -10, leg: -10, rise: -10 },
  Bone: { body: -15, leg: -15, head: -10, rise: -20 },
  Scale: { body: -15, leg: -15, head: -10, rise: -20 },
  Plate: { body: -20, leg: -20, head: -20, rise: -30 }
};
function bookArmorPenalty(item, field) {
  const type = Object.keys(ARMOR_BOOK_PENALTIES).find(name => item.name === name || item.name.startsWith(name + " "));
  if (!type) return null;
  const row = ARMOR_BOOK_PENALTIES[type];
  const location = item.system.location;
  if (!BODY_LOCATIONS.includes(location)) return null;
  return location === "Body" ? (field === "riseFromPronePenalty" ? row.rise ?? 0 : ["stealthPenalty", "dodgePenalty"].includes(field) ? row.body : 0) :
    ["Left Leg", "Right Leg"].includes(location) ? (field === "athleticsPenalty" ? row.leg : 0) :
    location === "Head" ? (field === "perceptionPenalty" ? row.head ?? 0 : 0) : 0;
}
function missingArmorPenaltyFields(item) {
  if (item.type !== "armor") return {};
  const updates = {};
  for (const [label, field, locations] of ARMOR_PENALTIES) {
    if (Object.hasOwn(item._source.system, field)) continue;
    const preset = bookArmorPenalty(item, field);
    if (preset !== null) updates[`system.${field}`] = preset;
    else if (locations.includes(item.system.location)) {
      const match = (item.system.penalties || "").match(new RegExp(label + "[^−-]*[−-](\\d+)", "i"));
      if (match) updates[`system.${field}`] = -Number(match[1]);
    }
  }
  return updates;
}
function armorPenalty(item, label, field) {
  if (Object.hasOwn(item._source.system, field)) return Number(item.system[field]) || 0;
  const preset = bookArmorPenalty(item, field);
  if (preset !== null) return preset;
  if (!ARMOR_PENALTIES.find(([, currentField, locations]) => currentField === field && locations.includes(item.system.location))) return 0;
  // Older armour items stored a category-wide description; use its matching location until edited.
  const text = item.system.penalties || "";
  const part = text.match(new RegExp(label + "[^−-]*[−-](\\d+)", "i"));
  return part ? -Number(part[1]) : 0;
}
function wornArmorPenalties(actor) {
  const worn = actor.items.filter(item => item.type === "armor" && itemPlacement(item) === "worn");
  return ARMOR_PENALTIES.map(([label, field, locations]) => {
    const pieces = worn.filter(item => locations.includes(item.system.location) && itemQuantity(item) > 0);
    const values = pieces.map(item => ({ name: item.name, value: armorPenalty(item, label, field) })).filter(row => row.value !== 0);
    return { label, value: Math.min(0, ...values.map(row => row.value)), sources: values.map(row => `${row.name} (${row.value})`).join(", ") };
  });
}
function armorPenaltyForSkill(actor, name) {
  return wornArmorPenalties(actor).find(row => row.label === name)?.value ?? 0;
}
function swimmingArmorPenalty(actor) {
  return actor.items.some(item => item.type === "armor" && itemPlacement(item) === "worn" && itemQuantity(item) > 0 &&
    ["Body", "Right Arm", "Left Arm", "Right Leg", "Left Leg"].includes(item.system.location) &&
    (item.system.training || /^(Reinforced Leather|Mail|Bone|Scale|Plate)/i.test(item.name))) ? -30 : 0;
}
function inventoryUsed(actor) {
  const locations = actor.system.equipmentLocations ?? [];
  const items = actor.items.filter(item => ["weapon", "armor", "shield", "gear"].includes(item.type) &&
    (itemPlacement(item) === "inventory" || (itemPlacement(item) === "worn" && item.type !== "armor") ||
      (["ready", "atHand"].includes(itemPlacement(item)) && ["gear", "armor"].includes(item.type)) ||
      locations.some(location => location.id === itemPlacement(item) && location.countsEncumbrance)));
  return items.reduce((sum, item) => sum + (item.type === "armor" ? 1 : itemENC(item)) * itemQuantity(item), 0) +
    Math.max(0, Math.ceil((Number(actor.system.silver) || 0) / 500));
}
const COMBAT_MANEUVERS = [
  ["Unbalance", "1 rolled SL", "Target takes −20 on its next skill roll; repeated uses do not stack."],
  ["Drive Back", "3 rolled SLs; melee", "Move an Engaged foe and follow; at 4 SLs you can push without following."],
  ["Lock", "3 rolled SLs; melee", "Target cannot make a Fighting Withdrawal while you hold the engagement."],
  ["Pierce Armor", "4 rolled SLs; rigid armour", "Gain Piercing 3 against Reinforced Leather or better."],
  ["Pierce Through", "4 rolled SLs; thrown spear or javelin only", "If shield AP stops or reduces the attack, the weapon lodges in a Small, Medium or Large shield. Shield AP −2 until removed with a Minor Action; the AP reduction does not stack."],
  ["Choose Location", "Weapon CL rolled SLs", "Choose another hit location."],
  ["Circumvent Shield", "Weapon CS rolled SLs", "Ignore shield AP for this hit."],
  ["Disarm", "Weapon DIS rolled SLs; Arm hit", "Knock away a held weapon; extra SLs affect distance, two-handed weapons and shields."],
  ["Trip", "Weapon T rolled SLs; Leg hit", "Knock the foe Prone; four or more legs cost 3 extra SLs."],
  ["Shield Bash", "Shield ShB rolled SLs", "A Small or larger shield knocks a same-size or smaller foe Prone."],
  ["Cleave Shield", "DoS; melee, 2H, ClSh", "Forgo damage; roll d20 + DoS against the shield-size threshold."],
  ["Compel Surrender", "3 rolled SLs; disadvantaged foe", "Forgo damage; the foe rolls Willpower, penalised according to the attack DoS."],
  ["Grapple", "3 rolled SLs; Might; hands free", "Restrain a foe and deal unarmed nonlethal damage; size alters the cost."]
].map(([name, cost, effect]) => ({ name, cost, effect }));
const COMBAT_MODIFIERS = [
  ["Charge", "+20", "Melee attack, with movement restrictions"],
  ["Draw and attack", "−20", "At Hand weapon; sheathed throwing knives exempt"],
  ["Aim", "+20", "Ranged shot after aiming the prior turn"],
  ["Ranged into melee", "−20", "Shot into an ongoing melee"],
  ["Cover", "−20", "Ranged; stacks with obscurement"],
  ["Beyond range", "−20", "One zone beyond the weapon range"],
  ["Prone target", "+20 melee / −20 ranged", "Melee attacks and defences against a Prone foe"],
  ["Higher elevation", "+10", "Melee against a lower foe"],
  ["Unarmed against armed", "−20", "Might attacks, defence and Grapple"],
  ["Off hand", "−20", "Parrying Dagger exempt"],
  ["Nonlethal with lethal weapon", "−10", "Declare before attacking"],
  ["Environment", "−10 to −30", "GM adjudicates"]
].map(([name, value, note]) => ({ name, value, note }));
const ATTACK_SKILLS = SKILLS.Combat.filter(name => name !== "Dodge");
function attackOutcome(value, target, expertise) {
  const success = (value <= target || value <= 5) && value < 99;
  const doubles = value === 100 || Math.floor(value / 10) === value % 10;
  const critical = success && (value === target || doubles || (target <= 0 && value === 5));
  const criticalFailure = !success && doubles && value > target;
  const bonus = target > 100 ? Math.max(1, Math.floor((target - 100) / 10)) : 0;
  return { success, critical, criticalFailure,
    sl: success ? Math.max(1, Math.floor(value / 10), expertise) + bonus + (critical ? 3 : 0) : 0 };
}
const rollFlourish = outcome => outcome.criticalFailure ? "Oh fuck-a-doodle! Fumble!" : outcome.critical ? "You owe the Weave a pint! Critical!" : "";
function generalHitLocation(value) {
  const digit = value % 10;
  return digit === 0 ? "Head" : digit <= 5 ? "Body" : digit <= 7 ? (digit === 6 ? "Right Arm" : "Left Arm") : (digit === 8 ? "Right Leg" : "Left Leg");
}
const DETAILED_HIT_LOCATIONS = {
  Body: [["1–5", "Chest"], ["6–8", "Stomach"], ["9–0", "Groin"]],
  Arm: [["1–2", "Shoulder"], ["3–4", "Bicep"], ["5", "Elbow"], ["6–8", "Forearm"], ["9–0", "Hand"]],
  Leg: [["1–2", "Hip"], ["3–6", "Thigh"], ["7", "Knee"], ["8–9", "Shin"], ["0", "Foot"]],
  Head: [["1–2", "Skull"], ["3–4", "Eye*"], ["5–6", "Face"], ["7", "Nose"], ["8–9", "Ear*"], ["0", "Neck"]]
};
function detailedHitLocationHtml(location) {
  const group = location.endsWith("Arm") ? "Arm" : location.endsWith("Leg") ? "Leg" : location;
  const rows = DETAILED_HIT_LOCATIONS[group];
  return '<details class="tbe-hit-details"><summary>Detailed ' + location + ' location (defender’s ones die)</summary>' +
    '<div class="tbe-hit-detail-grid">' + rows.map(([range, name]) => '<span>' + range + '</span><span>' + name + '</span>').join("") + '</div>' +
    (group === "Head" ? '<small>* For Eye and Ear, an even defender’s ones die means right; odd means left.</small>' : '') +
    '</details>';
}
async function importRulebookJournals() {
      if (!game.user.isGM) return;
      const picker = document.createElement("input");
      picker.type = "file"; picker.accept = ".json,application/json";
      picker.addEventListener("change", async () => {
        const file = picker.files?.[0];
        if (!file) return;
        try {
          const data = JSON.parse(await file.text());
          if (data.format !== "tbe-journals-v1" || typeof data.source !== "string" || !Array.isArray(data.chapters) || !data.chapters.length) throw new Error("This is not a TBE Journal import file.");
          if (data.chapters.some(ch => typeof ch.name !== "string" || !Array.isArray(ch.pages) || ch.pages.some(page => typeof page.name !== "string" || typeof page.html !== "string"))) throw new Error("The Journal file contains invalid chapters or pages.");
          const existing = game.journal.contents.filter(j => j.getFlag("broken-empires-foundry", "rulebookImport") === data.source);
          const revision = Number(data.revision) || 1;
          const pending = data.chapters.map(chapter => ({
            chapter, journal: existing.find(j => j.getFlag("broken-empires-foundry", "chapterName") === chapter.name)
          })).filter(({ journal }) => !journal || Number(journal.getFlag("broken-empires-foundry", "rulebookRevision")) < revision);
          if (!pending.length) { ui.notifications.info("These rulebook Journals are already up to date."); return; }
          const updating = pending.filter(({ journal }) => journal).length;
          const creating = pending.length - updating;
          const confirmed = await foundry.applications.api.DialogV2.confirm({
            window: { title: "Import private rulebook?" },
            content: `Update the imported text in ${updating} existing Journals and create ${creating} new Journals from ${foundry.utils.escapeHTML(file.name)}? Existing matching PDF pages will be replaced; other pages and Journal permissions will be kept.`,
            yes: { label: "Import / Update" }, no: { label: "Cancel" }
          });
          if (!confirmed) return;
          ui.notifications.info(`Updating ${pending.length} TBE rulebook chapters…`);
          let folder = game.folders.find(f => f.type === "JournalEntry" && f.name === "TBE Rulebook");
          if (!folder) folder = await Folder.create({ name: "TBE Rulebook", type: "JournalEntry" });
          for (const { chapter, journal } of pending) {
            if (journal) {
              const oldPages = new Map(journal.pages.contents.map(page => [page.name, page]));
              const updates = chapter.pages.filter(page => oldPages.has(page.name)).map(page => ({
                _id: oldPages.get(page.name).id, "text.format": 1, "text.content": page.html
              }));
              const additions = chapter.pages.filter(page => !oldPages.has(page.name)).map(page => ({ name: page.name, type: "text", text: { format: 1, content: page.html } }));
              if (updates.length) await journal.updateEmbeddedDocuments("JournalEntryPage", updates);
              if (additions.length) await journal.createEmbeddedDocuments("JournalEntryPage", additions);
              await journal.setFlag("broken-empires-foundry", "rulebookRevision", revision);
            } else {
              await JournalEntry.create({
                name: chapter.name, folder: folder.id,
                flags: { "broken-empires-foundry": { rulebookImport: data.source, chapterName: chapter.name, rulebookRevision: revision } },
                pages: chapter.pages.map(page => ({ name: page.name, type: "text", text: { format: 1, content: page.html } }))
              });
            }
          }
          ui.notifications.info(`Updated ${updating} and created ${creating} TBE rulebook Journals.`);
        } catch (error) {
          console.error("TBE: Journal import failed", error);
          ui.notifications.error(`Journal import failed: ${error.message}`);
        }
      }, { once: true });
      picker.click();
 }

const HandlebarsSheet = foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.sheets.ActorSheetV2);
class CharacterSheet extends HandlebarsSheet {
  static DEFAULT_OPTIONS = {
    classes: ["tbe", "character-sheet"], tag: "form", position: { width: 850, height: 760 },
    window: { resizable: true }, form: { submitOnChange: true, closeOnSubmit: false },
    dragDrop: [{ dragSelector: "[data-item-id]", dropSelector: ".tbe-sheet-body" }]
  };
  static PARTS = { main: { template: "systems/broken-empires-foundry/templates/character.hbs" } };
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.system = this.actor.system;
    context.sectionTabs = orderedSectionTabs(this.actor.system.sectionOrder);
    context.canReorderTabs = this.actor.isOwner;
    context.maneuvers = COMBAT_MANEUVERS;
    context.combatModifiers = COMBAT_MODIFIERS;
    context.skillGroups = Object.entries(SKILLS).map(([category, names]) => ({
      category, rows: names.map(name => ({ name, description: SKILL_DESCRIPTIONS[name] || "", path: `system.skills.${key(category)}.${key(name)}`, strand: category === "Strands", data: this.actor.system.skills[key(category)][key(name)], ...skillTotals(this.actor, name, this.actor.system.skills[key(category)][key(name)]) }))
    }));
    const strandRows = context.skillGroups.find(group => group.category === "Strands").rows;
    context.strandColumns = [strandRows.slice(0, Math.ceil(strandRows.length / 2)), strandRows.slice(Math.ceil(strandRows.length / 2))];
    const customSkills = this.actor.system.customSkills.map((row, index) => ({ ...row, index, ...skillTotals(this.actor, row.name, row) }));
    context.customSkillGroups = Object.fromEntries(Object.keys(SKILLS).map(category => [category, customSkills.filter(row => row.category === category)]));
    context.otherCustomSkills = customSkills.filter(row => !Object.keys(SKILLS).includes(row.category));
    context.talents = this.actor.items.filter(i => i.type === "talent");
    context.threads = this.actor.items.filter(i => i.type === "thread");
    context.weapons = this.actor.items.filter(i => i.type === "weapon");
    context.weaponUses = Object.fromEntries(context.weapons.map(item => [item.id, weaponUse(item)]));
    context.shields = this.actor.items.filter(i => i.type === "shield");
    context.pinnableShields = Object.fromEntries(context.shields.map(item => [item.id, canPinShield(item)]));
    context.shieldAP = Object.fromEntries(context.shields.map(item => [item.id, shieldAP(item)]));
    const readyWeapons = context.weapons.filter(item => itemPlacement(item) === "ready" && itemQuantity(item) > 0);
    const twoWeaponFighter = context.talents.some(item => item.name.trim().toLowerCase() === "two-weapon fighter");
    const shields = context.shields.filter(item => itemPlacement(item) === "ready" && itemQuantity(item) > 0)
      .map(item => ({ id: item.id, name: item.name, ap: shieldAP(item), kind: "shield" }));
    const secondaryWeapons = twoWeaponFighter ? readyWeapons.filter(item => item.system.category === "Light Weapons" &&
      !/not secondary-hand compatible/i.test(item.system.notes || "") &&
      readyWeapons.some(primary => (primary.id !== item.id || itemQuantity(item) >= 2) && ["Light Weapons", "Medium Weapons"].includes(primary.system.category)))
      .map(item => ({ id: item.id, name: item.name, ap: item.name === "Parrying Dagger" ? 2 : 1, kind: "secondary weapon" })) : [];
    context.defensiveSources = [...shields, ...secondaryWeapons].map(source => ({ ...source, selected: source.id === this.actor.system.defensiveItemId }));
    context.defensiveSource = context.defensiveSources.find(source => source.selected) ?? null;
    context.applyDefensiveAP = Boolean(this.actor.system.applyDefensiveAP && context.defensiveSource);
    context.hasTwoWeaponFighter = twoWeaponFighter;
    context.armorItems = this.actor.items.filter(i => i.type === "armor");
    context.gearItems = this.actor.items.filter(i => i.type === "gear");
    const customLocations = this.actor.system.equipmentLocations ?? [];
    context.placementOptions = Object.fromEntries(Object.keys(PLACEMENTS).map(type => [type, [
      ...LOCATION_OPTIONS, ...customLocations.filter(location => location.id && location.name).map(location => ({ value: location.id, label: location.name }))
    ]]));
    const equipment = this.actor.items.filter(i => ["weapon", "armor", "shield", "gear"].includes(i.type));
    context.itemSizes = ITEM_SIZES;
    context.itemPlacements = Object.fromEntries(equipment.map(i => [i.id, itemPlacement(i)]));
    context.itemZones = Object.fromEntries(equipment.map(i => [i.id, i.system.zone]));
    context.itemNoteSegments = Object.fromEntries(equipment.map(i => [i.id, equipmentNoteSegments(i.system.notes)]));
    const equipmentAreas = [
      { key: "ready", title: "Held and Ready", items: equipment.filter(i => itemPlacement(i) === "ready") },
      { key: "atHand", title: "At Hand", items: equipment.filter(i => itemPlacement(i) === "atHand") },
      { key: "worn", title: "Worn", items: equipment.filter(i => itemPlacement(i) === "worn") },
      { key: "inventory", title: "Inventory (Stored)", items: equipment.filter(i => itemPlacement(i) === "inventory") },
      { key: "dropped", title: "Dropped in Zone", items: equipment.filter(i => itemPlacement(i) === "dropped") },
      { key: "away", title: "At Home / Elsewhere", items: equipment.filter(i => itemPlacement(i) === "away") },
      ...customLocations.filter(location => location.id && location.name).map(location => ({
        key: location.id, title: location.name, custom: true, locationIndex: customLocations.findIndex(entry => entry.id === location.id),
        countsEncumbrance: location.countsEncumbrance, items: equipment.filter(i => itemPlacement(i) === location.id)
      }))
    ];
    const savedAreaOrder = this.actor.system.equipmentAreaOrder ?? [];
    const defaultAreaOrder = equipmentAreas.map(area => area.key);
    context.equipmentAreas = equipmentAreas.sort((a, b) => {
      const aIndex = savedAreaOrder.indexOf(a.key), bIndex = savedAreaOrder.indexOf(b.key);
      return (aIndex < 0 ? defaultAreaOrder.indexOf(a.key) + savedAreaOrder.length : aIndex) - (bIndex < 0 ? defaultAreaOrder.indexOf(b.key) + savedAreaOrder.length : bIndex);
    });
    const worn = context.armorItems.filter(i => itemPlacement(i) === "worn");
    context.wornArmorPenalties = wornArmorPenalties(this.actor);
    context.armorSlots = BODY_LOCATIONS.map(location => {
      const pieces = worn.filter(i => i.system.location === location);
      const protection = pieces.length === 1 && itemQuantity(pieces[0]) === 1 ? (pieces[0].system.sundered ? 0 : pieces[0].system.protection) : 0;
      const defensive = context.applyDefensiveAP ? context.defensiveSource.ap : 0;
      return { location, items: pieces, conflict: pieces.reduce((sum, item) => sum + itemQuantity(item), 0) > 1, protection, defensive, totalProtection: protection + defensive };
    });
    context.unassignedArmor = worn.filter(i => !BODY_LOCATIONS.includes(i.system.location));
    const atHand = this.actor.items.filter(i => ["weapon", "shield"].includes(i.type) && itemPlacement(i) === "atHand");
    const heldReady = this.actor.items.filter(i => ["weapon", "shield"].includes(i.type) && itemPlacement(i) === "ready");
    const freeAtHandWeapon = atHand.find(i => i.type === "weapon" && i.system.freeAtHand && itemQuantity(i) > 0);
    context.weaponENC = atHand.reduce((sum, i) => sum + itemENC(i) * (itemQuantity(i) - (i === freeAtHandWeapon && itemQuantity(i) > 0 ? 1 : 0)), 0);
    context.heldReadyENC = heldReady.reduce((sum, i) => sum + itemENC(i) * itemQuantity(i), 0);
    context.inventoryENC = inventoryUsed(this.actor);
    context.wornBulk = worn.reduce((sum, i) => sum + (Number(i.system.bulk) || 0) * itemQuantity(i), 0);
    context.armorInitiativePenalty = Math.ceil(context.wornBulk / 3);
    context.inventoryMax = this.actor.system.encumbranceMax || 6;
    context.weaponMax = this.actor.system.weaponEncumbranceMax ?? 6;
    context.weaponOver = context.weaponENC > context.weaponMax;
    context.inventoryOver = context.inventoryENC > context.inventoryMax;
    context.inventoryExcess = Math.max(0, context.inventoryENC - context.inventoryMax);
    context.inventoryLimitExceeded = context.inventoryExcess >= 10;
    context.inventoryOverflowPenalty = inventoryOverflowPenalty(context.inventoryENC, context.inventoryMax);
    for (const group of context.skillGroups) for (const row of group.rows) row.overflowPenalty = physicalSkill(row.name, group.category) ? context.inventoryOverflowPenalty : 0;
    for (const row of customSkills) row.overflowPenalty = physicalSkill(row.name, row.category) ? context.inventoryOverflowPenalty : 0;
    const resolve = this.actor.system.resolve;
    const max = Math.max(0, Math.floor(Number(resolve.max) || 0));
    const permanent = Math.min(max, Math.max(0, Math.floor(Number(resolve.permanentFatigue) || 0)));
    const temporary = Math.min(max - permanent, Math.max(0, Math.floor(Number(resolve.fatigue) || 0)));
    const current = Math.max(0, Math.min(max - permanent - temporary, Math.floor(Number(resolve.value) || 0)));
    context.resolveTrack = Array.from({ length: max }, (_, index) => {
      const spent = max - permanent - temporary - current;
      const state = index >= max - permanent ? "permanent" : index >= max - permanent - temporary ? "fatigue" : index < spent ? "spent" : "available";
      return { index, state, permanent: state === "permanent", fatigue: state === "fatigue", spent: state === "spent" };
    });
    context.supplyDisplay = Object.fromEntries(["gear", "ammo", "rations", "medical"].map(type => [type, this.actor.system.supply[type] || "d12"]));
    const ll = Number(this.actor.system.attributes.lethalityLevel) || 0;
    context.woundSummary = BODY_LOCATIONS.map(location => {
      const wounds = this.actor.system.wounds.filter(w => inferWoundLocation(w) === location);
      const lethal = wounds.filter(w => w.lethal).reduce((sum, w) => sum + Math.max(0, Number(w.points) || 0), 0);
      const nonlethal = wounds.filter(w => !w.lethal).reduce((sum, w) => sum + Math.max(0, Number(w.points) || 0), 0);
      return { location, lethal, nonlethal, total: lethal + nonlethal };
    });
    context.unassignedWounds = this.actor.system.wounds.filter(w => Number(w.points) > 0 && !inferWoundLocation(w));
    context.totalLethalWP = this.actor.system.wounds.filter(w => w.lethal).reduce((sum, w) => sum + Math.max(0, Number(w.points) || 0), 0);
    context.totalNonlethalWP = this.actor.system.wounds.filter(w => !w.lethal).reduce((sum, w) => sum + Math.max(0, Number(w.points) || 0), 0);
    context.ll = ll;
    return context;
  }
  _onRender(context, options) {
    super._onRender(context, options);
    const scroller = this.element.querySelector(".tbe-sheet-body");
    this._collapsedSections ??= new Set();
    this._openSkillBreakdowns ??= new Set();
    this.element.querySelectorAll("[data-collapse-section]").forEach(button => {
      const section = button.closest("section");
      const id = button.dataset.collapseSection;
      const setCollapsed = collapsed => {
        section.classList.toggle("tbe-section-collapsed", collapsed);
        button.setAttribute("aria-expanded", String(!collapsed));
        if (collapsed) section.querySelectorAll("[data-skill-breakdown]").forEach(details => {
          details.open = false;
          this._openSkillBreakdowns.delete(details.dataset.skillBreakdown);
        });
      };
      setCollapsed(this._collapsedSections.has(id));
      button.addEventListener("click", event => {
        event.preventDefault();
        if (this._collapsedSections.has(id)) this._collapsedSections.delete(id);
        else this._collapsedSections.add(id);
        setCollapsed(this._collapsedSections.has(id));
      });
    });
    this.element.querySelectorAll("[data-skill-breakdown]").forEach(details => {
      const key = details.dataset.skillBreakdown;
      details.open = this._openSkillBreakdowns.has(key) && !details.closest("section")?.classList.contains("tbe-section-collapsed");
      details.addEventListener("toggle", () => {
        if (details.open) this._openSkillBreakdowns.add(key);
        else this._openSkillBreakdowns.delete(key);
      });
    });
    this.element.querySelectorAll('input[type="checkbox"][name$=".thin"], input[type="checkbox"][name$=".savvy"]').forEach(input => {
      input.addEventListener("change", async event => {
        if (input.checked) return;
        event.stopPropagation();
        input.checked = true;
        if (!this.actor.isOwner) return;
        const marker = input.name.endsWith(".thin") ? "Thin" : "Savvy";
        const confirmed = await foundry.applications.api.DialogV2.confirm({
          window: { title: `Remove ${marker}?` },
          content: `Remove ${marker} from this ${marker === "Thin" ? "Strand" : "skill"}?`,
          yes: { label: `Remove ${marker}` }, no: { label: "Keep it" }
        });
        if (!confirmed) return;
        this._savedScrollTop = scroller?.scrollTop ?? 0;
        await this.actor.update({ [input.name]: false });
      });
    });
    this.element.querySelectorAll("[data-resolve-box]").forEach(button => {
      button.addEventListener("click", async event => {
        event.preventDefault();
        if (!this.actor.isOwner) return;
        const resolve = this.actor.system.resolve;
        if (button.classList.contains("tbe-resolve-permanent")) return;
        if (button.classList.contains("tbe-resolve-fatigue")) {
          await this.actor.update({ "system.resolve.fatigue": Math.max(0, Number(resolve.fatigue) - 1), "system.resolve.value": Number(resolve.value) + 1 });
        } else if (button.classList.contains("tbe-resolve-spent")) {
          await this.actor.update({ "system.resolve.value": Number(resolve.value) + 1 });
        } else if (Number(resolve.value) > 0) {
          await this.actor.update({ "system.resolve.value": Number(resolve.value) - 1 });
        }
      });
      button.addEventListener("contextmenu", async event => {
        event.preventDefault(); event.stopPropagation();
        if (!this.actor.isOwner || button.classList.contains("tbe-resolve-permanent")) return;
        const r = this.actor.system.resolve;
        if (button.classList.contains("tbe-resolve-fatigue")) {
          await this.actor.update({ "system.resolve.fatigue": Math.max(0, Number(r.fatigue) - 1), "system.resolve.value": Number(r.value) + 1 });
        } else if (Number(r.value) > 0) {
          await this.actor.update({ "system.resolve.fatigue": Number(r.fatigue) + 1, "system.resolve.value": Number(r.value) - 1 });
        } else ui.notifications.warn("Resolve track full: additional Fatigue causes a Fatigue-based wound. Record the wound in the Wounds section.");
      });
    });
    this.element.querySelector("[data-resolve-max]")?.addEventListener("change", async event => {
      const input = event.currentTarget, r = this.actor.system.resolve;
      const next = Number(input.value), delta = next - Number(r.max);
      if (!this.actor.isOwner || !Number.isInteger(next) || next < 0 || Number(r.value) + delta < 0) {
        input.value = r.max;
        ui.notifications.warn("Recover spent Resolve or remove Fatigue before reducing the track further.");
        return;
      }
      await this.actor.update({ "system.resolve.max": next, "system.resolve.value": Number(r.value) + delta });
    });
    this.element.querySelector("[data-permanent-fatigue]")?.addEventListener("change", async event => {
      const input = event.currentTarget, r = this.actor.system.resolve;
      const next = Number(input.value), delta = next - Number(r.permanentFatigue);
      if (!this.actor.isOwner || !Number.isInteger(next) || next < 0 || Number(r.value) - delta < 0) {
        input.value = r.permanentFatigue;
        ui.notifications.warn("The track is full. Additional Fatigue causes a Fatigue-based wound.");
        return;
      }
      await this.actor.update({ "system.resolve.permanentFatigue": next, "system.resolve.value": Number(r.value) - delta });
    });
    this.element.querySelectorAll("[data-pin-shield]").forEach(input => input.addEventListener("change", async () => {
      const shield = this.actor.items.get(input.dataset.pinShield);
      if (!this.actor.isOwner || shield?.type !== "shield" || !canPinShield(shield)) return;
      await shield.update({ "system.pinned": input.checked });
    }));
    this.element.querySelector("[data-add-fatigue]")?.addEventListener("click", async event => {
      event.preventDefault();
      const r = this.actor.system.resolve;
      if (Number(r.value) <= 0) { ui.notifications.warn("Resolve track full: additional Fatigue causes a Fatigue-based wound. Record the wound in the Wounds section."); return; }
      const fatigue = Number(r.fatigue) + 1;
      await this.actor.update({ "system.resolve.fatigue": fatigue, "system.resolve.value": Math.max(0, Number(r.value) - 1) });
    });
    this.element.querySelector("[data-add-location]")?.addEventListener("click", async event => {
      event.preventDefault();
      const result = await foundry.applications.api.DialogV2.input({ window: { title: "New equipment location" },
        content: '<label>Location name <input name="locationName" required placeholder="Pack Animal"></label><label><input type="checkbox" name="countsEncumbrance"> Count towards character Inventory ENC</label>',
        ok: { label: "Add location" } });
      const name = String(result?.locationName ?? "").trim();
      if (!name || !this.actor.isOwner) return;
      const entry = { id: `custom-${foundry.utils.randomID()}`, name, countsEncumbrance: Boolean(result.countsEncumbrance) };
      await this.actor.update({ "system.equipmentLocations": [...this.actor.system.equipmentLocations, entry] });
    });
    this.element.querySelectorAll("[data-location-count]").forEach(input => input.addEventListener("change", async () => {
      const entries = this.actor.system.equipmentLocations.map((entry, index) => index === Number(input.dataset.locationCount) ? { ...entry, countsEncumbrance: input.checked } : entry);
      await this.actor.update({ "system.equipmentLocations": entries });
    }));
    this.element.querySelectorAll("[data-remove-location]").forEach(button => button.addEventListener("click", async event => {
      event.preventDefault();
      const index = Number(button.dataset.removeLocation), entry = this.actor.system.equipmentLocations[index];
      if (!entry) return;
      const confirmed = await foundry.applications.api.DialogV2.confirm({ window: { title: "Remove equipment location?" },
        content: `Move items in ${foundry.utils.escapeHTML(entry.name)} to At Home / Elsewhere and remove this location?`, yes: { label: "Move and remove" }, no: { label: "Cancel" } });
      if (!confirmed) return;
      const items = this.actor.items.filter(item => item.system.placement === entry.id);
      if (items.length) await this.actor.updateEmbeddedDocuments("Item", items.map(item => ({ _id: item.id, "system.placement": "away" })));
      await this.actor.update({ "system.equipmentLocations": this.actor.system.equipmentLocations.filter((_, i) => i !== index) });
    }));
    this.element.querySelector("[data-portrait]")?.addEventListener("click", event => {
      event.preventDefault();
      if (!this.actor.isOwner) return;
      new foundry.applications.apps.FilePicker({ type: "image", current: this.actor.img, callback: path => this.actor.update({ img: path }) }).browse();
    });
    this.element.querySelectorAll("[data-roll-supply]").forEach(button => button.addEventListener("click", async event => {
      event.preventDefault();
      if (!this.actor.isOwner) return;
      const category = button.dataset.rollSupply;
      if (!["gear", "ammo", "rations", "medical"].includes(category)) return;
      const die = this.actor.system.supply[category];
      if (!["d12", "d10", "d8", "d6"].includes(die)) { ui.notifications.warn(`${category} supply has run out.`); return; }
      const roll = await new Roll(`1${die}`).evaluate();
      const depleted = roll.total <= 2;
      const steps = ["d12", "d10", "d8", "d6", "depleted"];
      const next = depleted ? steps[steps.indexOf(die) + 1] : die;
      if (depleted) await this.actor.update({ [`system.supply.${category}`]: next });
      const name = category[0].toUpperCase() + category.slice(1);
      const flavor = depleted ? `Oh shit, ${name} decreased! ${die} → ${next}.` : `${name} Supply holds at ${die}.`;
      await roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor: this.actor }), flavor });
    }));
    this.element.querySelectorAll("[data-roll-thread]").forEach(button => button.addEventListener("click", async event => {
      event.preventDefault();
      if (!this.actor.isOwner) return;
      const item = this.actor.items.get(button.dataset.rollThread);
      if (item?.type !== "thread" || item.system.useMode !== "die") return;
      const die = item.system.die;
      const steps = ["d12", "d10", "d8", "d6", "depleted"];
      if (!steps.includes(die) || die === "depleted") { ui.notifications.warn(`${item.name} is depleted.`); return; }
      const roll = await new Roll(`1${die}`).evaluate();
      const next = roll.total <= 2 ? steps[steps.indexOf(die) + 1] : die;
      if (next !== die) await item.update({ "system.die": next });
      await roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor: this.actor }), flavor: `${foundry.utils.escapeHTML(item.name)} — Thread die (${die}), ${roll.total} Mastery${next !== die ? `; now ${next}` : ""}` });
    }));
    this.element.querySelector("[data-cast-spell]")?.addEventListener("click", async event => {
      event.preventDefault();
      if (this.actor.isOwner) await castSpell(this.actor, { skillTotals, attackOutcome, wornArmorPenalty: context.armorInitiativePenalty });
    });
    this.element.querySelectorAll("[data-thread-points]").forEach(input => input.addEventListener("change", async event => {
      if (!this.actor.isOwner) return;
      const item = this.actor.items.get(input.dataset.threadPoints);
      if (item?.type !== "thread" || item.system.useMode !== "points") return;
      const points = Number(input.value);
      if (Number.isInteger(points) && points >= 0) await item.update({ "system.points": points });
      else input.value = item.system.points;
    }));
    const rollCharacterSkill = async (name, data, category, rise = false) => {
      const base = skillTotals(this.actor, name, data).total;
      const inventory = physicalSkill(name, category) ? inventoryOverflowPenalty(inventoryUsed(this.actor), this.actor.system.encumbranceMax || 6) : 0;
      const armour = armorPenaltyForSkill(this.actor, rise ? "Rise from Prone" : name);
      const swim = name === "Athletics" && !rise ? swimmingArmorPenalty(this.actor) : 0;
      const talents = this.actor.items.filter(item => item.type === "talent").map(item => item.name.trim().toLowerCase());
      const riseReduction = rise ? (talents.includes("jump up") ? 20 : talents.includes("on your feet") ? 10 : 0) : 0;
      const reducedArmour = rise ? Math.min(0, armour + riseReduction) : armour;
      const details = await foundry.applications.api.DialogV2.input({
        window: { title: rise ? `Rise from Prone — ${name}` : `Roll ${name}` },
        content: `<div class="tbe-attack-dialog"><p>Base skill ${base}%. Adjust penalties for this attempt.</p>` +
          `<label>Inventory overflow penalty <input name="overflow" type="number" step="1" value="${inventory}"></label>` +
          (armour ? `<label class="tbe-check">Apply worn armour penalty (${reducedArmour}) <input name="useArmor" type="checkbox" checked></label>` : "") +
          (swim ? `<label class="tbe-check">Swimming in heavy armour (${swim}) <input name="swimming" type="checkbox"></label>` : "") +
          (rise ? `<label class="tbe-check">Engaged <input name="engaged" type="checkbox" checked></label><label>Additional Engaged foes beyond the first <input name="extraFoes" type="number" min="0" step="1" value="0"></label><p>Each additional foe: −10. If unengaged, success lets you move normally; failure lets you rise but prevents movement. If Engaged, failure leaves you Prone; success with 5+ SL costs no action.</p>` : "") +
          `<label>Other modifier <input name="modifier" type="number" step="1" value="0"></label></div>`,
        ok: { label: rise ? "Roll to rise" : "Roll skill" }
      });
      if (!details) return;
      const overflow = Number(details.overflow), other = Number(details.modifier), extraFoes = rise ? Number(details.extraFoes) : 0;
      if (![overflow, other, extraFoes].every(Number.isFinite) || extraFoes < 0) return;
      const appliedArmour = details.useArmor ? reducedArmour : 0;
      const appliedSwim = details.swimming ? swim : 0;
      const foePenalty = rise && details.engaged ? -10 * extraFoes : 0;
      const target = base + overflow + other + appliedArmour + appliedSwim + foePenalty;
      const roll = await new Roll("1d100").evaluate();
      const value = roll.total;
      const outcome = attackOutcome(value, target, Number(data.expertise) || 0);
      const result = outcome.critical ? "Critical success" : outcome.criticalFailure ? "Critical failure" : outcome.success ? "Success" : "Failure";
      const escape = foundry.utils.escapeHTML;
      const flourish = rollFlourish(outcome);
      const riseResult = rise ? (details.engaged ? (outcome.success ? (outcome.sl >= 5 ? "Rise without spending your action." : "You are no longer Prone.") : "You remain Prone.") : (outcome.success ? "Rise and move normally." : "Rise, but you cannot move this turn.")) : "";
      const content = '<div class="tbe-attack-card"><h3>' + escape(this.actor.name) + ' — ' + (rise ? 'Rise from Prone (' : '') + escape(name) + (rise ? ')' : '') + '</h3>' +
        (flourish ? '<p class="tbe-roll-flourish">' + flourish + '</p>' : '') +
        '<p>Base ' + base + '; Inventory overflow ' + overflow + '; Armour ' + appliedArmour + '; Swimming ' + appliedSwim +
        '; Additional foes ' + foePenalty + '; Other ' + other + '; target <strong>' + target + '</strong>.</p>' +
        '<p>Roll <strong>' + (value === 100 ? '00' : String(value).padStart(2, '0')) +
        '</strong> — <strong>' + result + '</strong>; ' + outcome.sl + ' rolled SLs.</p>' +
        (rise ? '<p>' + riseResult + '</p>' : '') + '</div>';
      await roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor: this.actor }), flavor: content });
    };
    this.element.querySelectorAll("[data-roll-skill]").forEach(button => button.addEventListener("click", async event => {
      event.preventDefault();
      if (!this.actor.isOwner) return;
      const path = button.dataset.rollSkill;
      if (!/^system\.(?:skills\.[a-z_]+\.[a-z_]+|customSkills\.\d+)$/.test(path)) return;
      const data = foundry.utils.getProperty(this.actor.system, path.slice("system.".length));
      if (!data) return;
      const name = button.dataset.skillName;
      const category = path.startsWith("system.customSkills.") ? data.category : Object.entries(SKILLS).find(([group, names]) => names.includes(name))?.[0];
      await rollCharacterSkill(name, data, category);
    }));
    this.element.querySelector("[data-rise-from-prone]")?.addEventListener("click", async event => {
      event.preventDefault();
      if (!this.actor.isOwner) return;
      const talent = this.actor.items.find(item => item.type === "talent" && item.name.trim().toLowerCase() === "rise a fighter");
      const choices = talent && ["Endurance", "Might", "Willpower"].includes(talent.system.riseSkill) ? ["Athletics", talent.system.riseSkill] : ["Athletics"];
      const choice = await foundry.applications.api.DialogV2.input({
        window: { title: "Rise from Prone" },
        content: `<label>Skill <select name="skill">${choices.map(name => `<option value="${name}">${name}</option>`).join("")}</select></label>${talent && choices.length === 1 ? '<p>Set the chosen alternative skill on your Rise a Fighter Talent item to use it here.</p>' : ''}`,
        ok: { label: "Choose skill" }
      });
      if (!choice || !choices.includes(choice.skill)) return;
      const name = choice.skill;
      const group = Object.entries(SKILLS).find(([, names]) => names.includes(name));
      await rollCharacterSkill(name, this.actor.system.skills[key(group[0])][key(name)], group[0], true);
    });
    if (scroller) {
      scroller.scrollTop = this._savedScrollTop ?? 0;
      scroller.addEventListener("scroll", () => { this._savedScrollTop = scroller.scrollTop; }, { passive: true });
      this.element.querySelectorAll("[data-tbe-tip]").forEach(tip => {
        const positionTip = () => {
          const bounds = scroller.getBoundingClientRect();
          const anchor = tip.getBoundingClientRect();
          const tipWidth = Math.min(384, bounds.width - 16);
          const rightSpace = bounds.right - anchor.left;
          const leftSpace = anchor.right - bounds.left;
          tip.classList.toggle("tbe-tip-left", rightSpace < tipWidth && leftSpace > rightSpace);
        };
        tip.addEventListener("mouseenter", positionTip);
        tip.addEventListener("focus", positionTip);
      });
    }
    // Keep prose fields as short as their content, growing them as the user types.
    this.element.querySelectorAll("textarea.tbe-grow").forEach(field => {
      const size = () => { field.style.height = "auto"; field.style.height = `${Math.max(field.scrollHeight, 34)}px`; };
      size(); field.addEventListener("input", size);
    });
    const nav = this.element.querySelector(".tbe-nav");
    const tabButtons = [...nav.querySelectorAll("[data-section]")];
    for (const button of tabButtons) {
      const section = this.element.querySelector(`#tbe-${button.dataset.section}`);
      if (section) scroller.append(section);
    }
    scroller.scrollTop = this._savedScrollTop ?? 0;
    if (this.actor.isOwner) {
      const clearTabDrag = () => {
        this._draggedSection = null;
        tabButtons.forEach(button => button.classList.remove("tbe-tab-dragging", "tbe-tab-drop-target"));
      };
      for (const button of tabButtons) {
        button.addEventListener("dragstart", event => {
          this._draggedSection = button.dataset.section;
          event.dataTransfer.setData("text/plain", `tbe-section:${this._draggedSection}`);
          event.dataTransfer.effectAllowed = "move";
          button.classList.add("tbe-tab-dragging");
          event.stopPropagation();
        });
        button.addEventListener("dragend", clearTabDrag);
      }
      nav.addEventListener("dragover", event => {
        if (!this._draggedSection) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        tabButtons.forEach(button => button.classList.toggle("tbe-tab-drop-target", button === event.target.closest("[data-section]") && button.dataset.section !== this._draggedSection));
      });
      nav.addEventListener("drop", async event => {
        if (!this._draggedSection) return;
        event.preventDefault();
        event.stopPropagation();
        const moving = this._draggedSection;
        const targetButton = event.target.closest("[data-section]");
        const target = targetButton?.dataset.section;
        clearTabDrag();
        if (!target || target === moving) return;
        const order = tabButtons.map(button => button.dataset.section).filter(id => id !== moving);
        const bounds = targetButton.getBoundingClientRect();
        const after = event.clientX > bounds.left + bounds.width / 2;
        order.splice(order.indexOf(target) + (after ? 1 : 0), 0, moving);
        this._savedScrollTop = scroller.scrollTop;
        await this.actor.update({ "system.sectionOrder": order });
      });
    }
    const areaElements = [...this.element.querySelectorAll(".tbe-inventory-area[data-drop-area]")];
    if (this.actor.isOwner) {
      const clearAreaDrag = () => {
        this._draggedArea = null;
        areaElements.forEach(area => area.classList.remove("tbe-area-dragging", "tbe-area-drop-target"));
      };
      for (const area of areaElements) {
        const handle = area.querySelector("[data-drag-area]");
        handle.addEventListener("dragstart", event => {
          this._draggedArea = area.dataset.dropArea;
          event.dataTransfer.setData("text/plain", `tbe-area:${this._draggedArea}`);
          event.dataTransfer.effectAllowed = "move";
          area.classList.add("tbe-area-dragging");
          event.stopPropagation();
        });
        handle.addEventListener("dragend", clearAreaDrag);
        area.addEventListener("dragover", event => {
          if (!this._draggedArea) return;
          event.preventDefault(); event.stopPropagation();
          event.dataTransfer.dropEffect = "move";
          areaElements.forEach(other => other.classList.toggle("tbe-area-drop-target", other === area && other.dataset.dropArea !== this._draggedArea));
        });
        area.addEventListener("drop", async event => {
          if (!this._draggedArea) return;
          event.preventDefault(); event.stopPropagation();
          const moving = this._draggedArea, target = area.dataset.dropArea;
          clearAreaDrag();
          if (target === moving) return;
          const order = areaElements.map(other => other.dataset.dropArea).filter(id => id !== moving);
          const bounds = area.getBoundingClientRect();
          order.splice(order.indexOf(target) + (event.clientY > bounds.top + bounds.height / 2 ? 1 : 0), 0, moving);
          this._savedScrollTop = scroller.scrollTop;
          await this.actor.update({ "system.equipmentAreaOrder": order });
        });
      }
    }
    tabButtons.forEach(button => button.addEventListener("click", event => {
      event.preventDefault();
      const target = this.element.querySelector(`#tbe-${button.dataset.section}`);
      if (!scroller || !target) return;
      if (this._collapsedSections.delete(button.dataset.section)) {
        target.classList.remove("tbe-section-collapsed");
        target.querySelector("[data-collapse-section]")?.setAttribute("aria-expanded", "true");
      }
      scroller.scrollTop += target.getBoundingClientRect().top - scroller.getBoundingClientRect().top - 44;
      this._savedScrollTop = scroller.scrollTop;
    }));
    this.element.querySelectorAll("[data-weapon-mode]").forEach(select => select.addEventListener("change", async event => {
      event.stopPropagation();
      const weapon = this.actor.items.get(select.dataset.weaponMode);
      if (this.actor.isOwner && weapon?.type === "weapon" && thrownProfile(weapon)) await weapon.update({ "system.useMode": select.value === "thrown" ? "thrown" : "melee" });
    }));
    this.element.querySelectorAll("[data-attack-item]").forEach(button => button.addEventListener("click", async event => {
      event.preventDefault();
      const weapon = this.actor.items.get(button.dataset.attackItem);
      if (!weapon || weapon.type !== "weapon" || !this.actor.isOwner) return;
      const placement = itemPlacement(weapon);
      if (!["ready", "atHand"].includes(placement)) return;
      const use = weaponUse(weapon);
      const stats = use.stats;
      const legacySkills = { Dagger: "Melee: Light", Cutlass: "Melee: Light", Broadsword: "Melee: Medium", Spear: "Melee: Medium", Staff: "Melee: Medium", "Fists/Kicks": "Might" };
      const preferred = stats.attackSkill || legacySkills[weapon.name] || "Melee: Medium";
      const defaultOverflow = inventoryOverflowPenalty(inventoryUsed(this.actor), this.actor.system.encumbranceMax || 6);
      const options = ATTACK_SKILLS.map(name => '<option value="' + name + '"' + (name === preferred ? ' selected' : '') + '>' + name + '</option>').join("");
      const presets = [
        ["charge", 20, "Charge +20"], ["aim", 20, "Aim +20"],
        ["cover", -20, "Target in cover −20"], ["intoMelee", -20, "Ranged into melee −20"],
        ["beyondRange", -20, "One zone beyond range −20"],
        ["highGround", 10, "Higher elevation +10"], ["proneMelee", 20, "Melee vs Prone +20"],
        ["proneRanged", -20, "Ranged vs Prone −20"], ["offHand", -20, "Off hand −20"],
        ["nonlethal", -10, "Lethal weapon for nonlethal injury −10"],
        ["lethalFromNonlethal", -10, "Non-lethal weapon for lethal injury −10"]
      ];
      const presetFields = presets.map(([key, , label]) => '<label><input type="checkbox" name="mod_' + key + '"> ' + label + '</label>').join("");
      const details = await foundry.applications.api.DialogV2.input({
        window: { title: "Attack with " + weapon.name },
        content: '<div class="tbe-attack-dialog"><label>Skill <select name="skill">' + options +
          '</select></label><label>Inventory overflow penalty <input type="number" name="overflow" value="' + defaultOverflow + '" step="1"></label>' +
          '<label>Other modifier <input type="number" name="modifier" value="0" step="1"></label>' +
          (use.isThrown ? '' : '<label><input type="checkbox" name="draw"' + (placement === "atHand" && weapon.name !== "Fists/Kicks" ? ' checked' : '') +
          '> Draw and attack (−20; uncheck if already drawn)</label>') + '<details><summary>Common modifiers</summary>' +
          presetFields + '</details><p>Use Other modifier for reach, talents and situational rulings. No token is required.</p></div>',
        ok: { label: "Roll attack" }
      });
      if (!details || !ATTACK_SKILLS.includes(details.skill)) return;
      const skillData = this.actor.system.skills.combat[key(details.skill)];
      const base = skillTotals(this.actor, details.skill, skillData).total;
      const other = Number(details.modifier), overflow = Number(details.overflow);
      if (!Number.isFinite(other) || !Number.isFinite(overflow)) return;
      const draw = Boolean(details.draw) && placement === "atHand" && weapon.name !== "Fists/Kicks" && !use.isThrown && !/throwing knives/i.test(weapon.name);
      const presetTotal = presets.reduce((sum, [name, amount]) => sum + (details["mod_" + name] ? amount : 0), 0);
      const modifier = other + overflow + presetTotal - (draw ? 20 : 0);
      const target = base + modifier;
      const roll = await new Roll("1d100").evaluate();
      const value = roll.total;
      const outcome = attackOutcome(value, target, Number(skillData?.expertise) || 0);
      const result = outcome.critical ? "Critical success" : outcome.criticalFailure ? "Critical failure" : outcome.success ? "Success" : "Failure";
      const escape = foundry.utils.escapeHTML;
      const flourish = rollFlourish(outcome);
      const content = '<div class="tbe-attack-card"><h3>' + escape(this.actor.name) + ' — ' + escape(weapon.name) + (use.isThrown ? ' (thrown)' : '') +
        '</h3>' + (flourish ? '<p class="tbe-roll-flourish">' + flourish + '</p>' : '') +
        '<p>' + escape(details.skill) + ' ' + base + '; Inventory overflow ' + overflow + '; other modifiers ' + (modifier - overflow) +
        ' = <strong>' + target + '</strong></p><p>Roll <strong>' + (value === 100 ? '00' : String(value).padStart(2, '0')) +
        '</strong> — <strong>' + result + '</strong>; ' + outcome.sl + ' rolled SLs.</p>' +
        (outcome.success ? '<div class="tbe-hit-location"><b>General hit location</b><strong>' + generalHitLocation(value) +
          '</strong><small>Attacker’s ones die: ' + (value % 10) + '. Choose Location can override this; the defender’s ones die supplies the detailed location.</small></div>' +
          detailedHitLocationHtml(generalHitLocation(value)) : '') +
        '<div class="tbe-attack-stats">' + [
          ["RCH", stats.reach], ["DMG", stats.damage], ["CL", stats.chooseLocation],
          ["CS", stats.circumventShield], ["DIS", stats.disarm], ["T", stats.trip],
          ["ENC", stats.encumbrance], ["RNG", stats.range]
        ].map(([label, stat]) => `<span><b>${label}</b> ${escape(String(stat ?? ""))}</span>`).join("") + '</div>' +
        (stats.notes ? '<p><b>Notes:</b> ' + escape(stats.notes) + '</p>' : '') + '</div>';
      if (draw) await weapon.update({ "system.placement": "ready" });
      await roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor: this.actor }), flavor: content });
    }));
    this.element.querySelectorAll("[data-add]").forEach(button => button.addEventListener("click", async event => {
      event.preventDefault();
      this._savedScrollTop = scroller?.scrollTop ?? 0;
      const collection = button.dataset.add;
      if (["item", "talent", "thread", "weapon", "armor", "shield", "gear"].includes(collection)) {
        const typeOptions = ["weapon", "armor", "shield", "gear", "talent", "thread"];
        const area = button.dataset.area;
        const allowedTypes = area ? typeOptions.filter(type => !["talent", "thread"].includes(type)) : typeOptions;
        const typeSelect = collection === "item" ? `<label>Type <select name="type">${allowedTypes.map(type => `<option value="${type}">${type === "armor" ? "Armour" : type[0].toUpperCase() + type.slice(1)}</option>`).join("")}</select></label>` : "";
        const details = await foundry.applications.api.DialogV2.input({
          window: { title: `Add ${collection === "item" ? "Item" : collection === "armor" ? "Armour" : collection}` },
          content: `${typeSelect}<label>Name <input name="itemName" required autofocus placeholder="Item name"></label>`,
          ok: { label: "Create on character" }
        });
        if (!details) return;
        const type = collection === "item" ? details.type : collection;
        const name = String(details.itemName ?? "").trim();
        if (!allowedTypes.includes(type) || !name || (area && !this.actor.system.equipmentLocations.some(p => p.id === area) && !LOCATION_OPTIONS.some(p => p.value === area))) return;
        const created = await this.actor.createEmbeddedDocuments("Item", [{ name, type, ...(area ? { system: { placement: area } } : {}) }]);
        created[0]?.sheet.render(true);
      } else {
        const defaults = { customSkills: { name: "", category: button.dataset.category || "Other", description: "", value: 0, race: 0, culture: 0, lifeEvents: 0, career: 0, rounding: 0, xp: 0, other: 0, expertise: 0, savvy: false }, resources: { name: "", value: 0, max: 0 }, abilityScores: { name: "", descriptor: "" }, racialTraits: { name: "", effect: "", source: "" }, personalityTraits: { name: "", description: "" }, goals: { text: "", shared: false }, sharedHistories: { character: "", event: "", skill: "", story: "" }, relationships: { name: "", type: "", notes: "" }, wounds: { generalLocation: "", location: "", detail: "", points: 0, lethal: true, ritual: false, infection: false, septic: false }, equipment: { name: "", quantity: 1, encumbrance: 0, notes: "" }, armor: { location: "", name: "", protection: 0, bulk: 0, notes: "" } };
        await this.actor.update({ [`system.${collection}`]: [...this.actor.system[collection], defaults[collection]] });
      }
    }));
    this.element.querySelectorAll("[data-remove]").forEach(button => button.addEventListener("click", async event => {
      event.preventDefault();
      this._savedScrollTop = scroller?.scrollTop ?? 0;
      const [collection, index] = button.dataset.remove.split(":");
      const entries = this.actor.system[collection];
      const entry = entries?.[Number(index)];
      if (!entry) return;
      const descriptions = { abilityScores: "ability score", racialTraits: "race trait", customSkills: "custom skill", resources: "resource", wounds: "wound", sharedHistories: "shared history", relationships: "NPC relationship", personalityTraits: "personality trait", goals: "goal" };
      const kind = descriptions[collection] ?? "entry";
      const label = entry.name || entry.character || entry.detail || entry.text || entry.location || kind;
      const confirmed = await foundry.applications.api.DialogV2.confirm({
        window: { title: `Delete ${kind}?` },
        content: `Are you sure you want to delete ${foundry.utils.escapeHTML(String(label))}?`,
        yes: { label: "Delete" }, no: { label: "Cancel" }
      });
      if (!confirmed) return;
      // A second click or another user may have changed this list while the dialogue was open.
      if (JSON.stringify(this.actor.system[collection]?.[Number(index)]) !== JSON.stringify(entry)) return;
      await this.actor.update({ [`system.${collection}`]: this.actor.system[collection].filter((_, i) => i !== Number(index)) });
    }));
    this.element.querySelectorAll("[data-item-placement]").forEach(select => select.addEventListener("change", async event => {
      this._savedScrollTop = scroller?.scrollTop ?? 0;
      const item = this.actor.items.get(select.dataset.itemPlacement);
      if (!item) return;
      const valid = this.actor.system.equipmentLocations.some(option => option.id === event.target.value) || PLACEMENTS[item.type]?.some(option => option.value === event.target.value);
      if (!valid) return;
      await item.update({ "system.placement": event.target.value });
    }));
    this.element.querySelectorAll("[data-item-zone]").forEach(input => input.addEventListener("change", async event => {
      event.stopPropagation();
      const item = this.actor.items.get(input.dataset.itemZone);
      if (this.actor.isOwner && item && itemPlacement(item) === "dropped") await item.update({ "system.zone": input.value });
    }));
    this.element.querySelectorAll("[data-toggle-defensive-ap]").forEach(button => button.addEventListener("click", async event => {
      event.preventDefault();
      if (!this.actor.isOwner) return;
      await this.actor.update({ "system.applyDefensiveAP": !this.actor.system.applyDefensiveAP });
    }));
    this.element.querySelectorAll("[data-item-quantity]").forEach(input => input.addEventListener("change", async event => {
      event.stopPropagation();
      const item = this.actor.items.get(input.dataset.itemQuantity);
      const quantity = Number(input.value);
      if (this.actor.isOwner && item && Number.isInteger(quantity) && quantity >= 0) await item.update({ "system.quantity": quantity });
      else if (item) input.value = itemQuantity(item);
    }));
    this.element.querySelectorAll("[data-delete-item]").forEach(button => button.addEventListener("click", async event => {
      event.preventDefault(); this._savedScrollTop = scroller?.scrollTop ?? 0;
      const item = this.actor.items.get(button.dataset.deleteItem);
      if (!item) return;
      const confirmed = await foundry.applications.api.DialogV2.confirm({ window: { title: "Delete Item?" }, content: `Are you sure you want to delete ${foundry.utils.escapeHTML(item.name)}?`, yes: { label: "Delete Item" }, no: { label: "Cancel" } });
      if (confirmed) await this.actor.deleteEmbeddedDocuments("Item", [item.id]);
    }));
    this.element.querySelectorAll("[data-open-item]").forEach(button => button.addEventListener("click", event => {
      event.preventDefault(); this.actor.items.get(button.dataset.openItem)?.sheet.render(true);
    }));
  }
  async _onDrop(event) {
    this._savedScrollTop = this.element.querySelector(".tbe-sheet-body")?.scrollTop ?? 0;
    const data = foundry.applications.ux.TextEditor.getDragEventData(event);
    if (data.type !== "Item" || !this.actor.isOwner) return;
    const item = await Item.implementation.fromDropData(data);
    if (item?.type === "race") {
      const current = String(this.actor.system.race || "").trim();
      if (current && current !== item.name) {
        const confirmed = await foundry.applications.api.DialogV2.confirm({ window: { title: "Change race?" },
          content: `Replace ${foundry.utils.escapeHTML(current)} with ${foundry.utils.escapeHTML(item.name)}? Existing manually added traits will stay.`, yes: { label: "Change race" }, no: { label: "Cancel" } });
        if (!confirmed) return;
      }
      const manual = this.actor.system.racialTraits.filter(trait => !trait.source && (trait.name || trait.effect));
      await this.actor.update({ "system.race": item.name,
        "system.racialTraits": [...manual, ...item.system.traits.map(trait => ({ name: trait.name, effect: trait.effect, source: item.name }))] });
      return;
    }
    if (item && ["talent", "thread", "weapon", "armor", "shield", "gear"].includes(item.type)) {
      const area = event.target.closest("[data-drop-area]")?.dataset.dropArea;
      if (item.parent?.documentName === "Actor" && item.parent.id === this.actor.id) {
        if (area && !["talent", "thread"].includes(item.type)) await item.update({ "system.placement": area });
        return;
      }
      const copy = item.toObject();
      delete copy._id;
      if (!["talent", "thread"].includes(item.type)) {
        copy.system.quantity = 1;
        if (area) copy.system.placement = area;
      }
      await this.actor.createEmbeddedDocuments("Item", [copy]);
    }
  }
}
const ItemSheet = foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.sheets.ItemSheetV2);
class TBEItemSheet extends ItemSheet {
  static DEFAULT_OPTIONS = { classes: ["tbe", "item-sheet"], tag: "form", position: { width: 540, height: 460 }, window: { resizable: true }, form: { submitOnChange: true, closeOnSubmit: false } };
  static PARTS = { main: { template: "systems/broken-empires-foundry/templates/item.hbs" } };
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.system = this.item.system;
    context.placements = this.item.parent?.documentName === "Actor" ? [
      ...(PLACEMENTS[this.item.type] ?? []), ...(this.item.parent.system.equipmentLocations ?? []).map(location => ({ value: location.id, label: location.name }))
    ] : PLACEMENTS[this.item.type] ?? [];
    context.locations = BODY_LOCATIONS;
    context.attackSkills = ATTACK_SKILLS;
    context.itemSizes = ITEM_SIZES;
    context.owned = this.item.parent?.documentName === "Actor";
    context.threadDice = ["d6", "d8", "d10", "d12", "depleted"];
    context.pinnableShield = this.item.type === "shield" && canPinShield(this.item);
    context.noteSegments = equipmentNoteSegments(this.item.system.notes);
    context.riseFighter = this.item.type === "talent" && this.item.name.trim().toLowerCase() === "rise a fighter";
    context.riseSkills = ["Endurance", "Might", "Willpower"];
    if (this.item.type === "armor") context.penaltyFields = Object.fromEntries(ARMOR_PENALTIES.map(([label, field]) => [field, armorPenalty(this.item, label, field)]));
    return context;
  }
  _onRender(context, options) {
    super._onRender(context, options);
    const scroller = this.element.querySelector(".tbe-sheet-body");
    this.element.querySelectorAll("[data-tbe-tip]").forEach(tip => {
      const positionTip = () => {
        const bounds = scroller?.getBoundingClientRect();
        if (!bounds) return;
        const anchor = tip.getBoundingClientRect();
        const width = Math.min(384, bounds.width - 16);
        tip.classList.toggle("tbe-tip-left", bounds.right - anchor.left < width && anchor.right - bounds.left > bounds.right - anchor.left);
      };
      tip.addEventListener("mouseenter", positionTip);
      tip.addEventListener("focus", positionTip);
    });
    this.element.querySelectorAll("textarea.tbe-grow").forEach(field => {
      const size = () => { field.style.height = "auto"; field.style.height = `${Math.max(field.scrollHeight, 50)}px`; };
      size(); field.addEventListener("input", size);
    });
  }
}
function addRulebookImportButton(application, element) {
  if (!game.user.isGM) return;
  const root = element instanceof HTMLElement ? element : element?.[0] ?? application.element;
  if (!root || root.querySelector("[data-tbe-import-journals]")) return;
  const header = root.querySelector(".directory-header") || root.querySelector(".directory-list")?.parentElement;
  if (!header) return;
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.tbeImportJournals = "";
  button.className = "tbe-journal-import-button";
  button.textContent = "Import TBE rulebook Journals";
  button.addEventListener("click", event => { event.preventDefault(); void importRulebookJournals(); });
  header.append(button);
}
Hooks.on("renderJournalDirectory", addRulebookImportButton);
function addTableImportButton(application, element) {
  if (!game.user.isGM) return;
  const root = element instanceof HTMLElement ? element : element?.[0] ?? application.element;
  if (!root || root.querySelector("[data-tbe-import-tables]")) return;
  const header = root.querySelector(".directory-header") || root.querySelector(".directory-list")?.parentElement;
  if (!header) return;
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.tbeImportTables = "";
  button.className = "tbe-journal-import-button";
  button.textContent = "Import TBE RollTables";
  button.addEventListener("click", event => {
    event.preventDefault();
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";
    input.addEventListener("change", async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const data = JSON.parse(await file.text());
        if (data.format !== "tbe-rolltables-v1" || !Array.isArray(data.tables)) throw new Error("Choose the TBE RollTables import file.");
        const folders = new Map();
        for (const name of [...new Set(data.tables.map(t => t.folder).filter(Boolean))]) {
          let folder = game.folders.find(f => f.type === "RollTable" && f.name === name && !f.folder);
          if (!folder) folder = await Folder.create({ name, type: "RollTable" });
          folders.set(name, folder.id);
        }
        let created = 0, updated = 0;
        for (const table of data.tables) {
          if (!table.name || !/^\d+d\d+(?:[+-]\d+)?$/.test(table.formula) || !Array.isArray(table.results) || !table.results.length) throw new Error(`Invalid table: ${table.name || "unnamed"}`);
          const results = table.results.map(result => ({ type: CONST.TABLE_RESULT_TYPES.TEXT, text: result.text, range: result.range, weight: result.range[1] - result.range[0] + 1, drawn: false }));
          const fields = { name: table.name, formula: table.formula, results, folder: folders.get(table.folder) || null, replacement: true,
            flags: { "broken-empires-foundry": { rulebookTable: true, tableKey: table.key } } };
          const existing = game.tables.find(t => t.getFlag("broken-empires-foundry", "tableKey") === table.key);
          if (existing) { await existing.update({ name: fields.name, formula: fields.formula, folder: fields.folder });
            await existing.deleteEmbeddedDocuments("TableResult", existing.results.map(r => r.id));
            await existing.createEmbeddedDocuments("TableResult", results); updated++; }
          else { await RollTable.create(fields); created++; }
        }
        ui.notifications.info(`TBE RollTables: ${created} created, ${updated} updated.`);
      } catch (error) { console.error("TBE: table import failed", error); ui.notifications.error(`TBE RollTables import failed: ${error.message}`); }
    }, { once: true });
    input.click();
  });
  header.append(button);
}
Hooks.on("renderRollTableDirectory", addTableImportButton);
Hooks.on("renderApplicationV2", (application, element) => {
  if (application instanceof foundry.applications.sidebar.tabs.JournalDirectory) addRulebookImportButton(application, element);
  if (application instanceof foundry.applications.sidebar.tabs.RollTableDirectory) addTableImportButton(application, element);
});
Hooks.once("init", () => {
  CONFIG.Actor.dataModels.character = CharacterData;
  CONFIG.Item.dataModels.talent = TalentData;
  CONFIG.Item.dataModels.race = RaceData;
  CONFIG.Item.dataModels.thread = ThreadData;
  CONFIG.Item.dataModels.weapon = WeaponData;
  CONFIG.Item.dataModels.armor = ArmorData;
  CONFIG.Item.dataModels.shield = ShieldData;
  CONFIG.Item.dataModels.gear = GearData;
  foundry.documents.collections.Actors.registerSheet("broken-empires-foundry", CharacterSheet, { types: ["character"], makeDefault: true, label: "TBE Character" });
  foundry.documents.collections.Items.registerSheet("broken-empires-foundry", TBEItemSheet, { types: ["talent", "race", "thread", "weapon", "armor", "shield", "gear"], makeDefault: true, label: "TBE Item" });
});

// Preserve the three values entered on the 0.1.x test sheet when opening an old world.
Hooks.once("ready", async () => {
  if (!game.user.isGM) return;
  // Populate a world compendium once so Forge installs do not need a bundled LevelDB database.
  if (!game.users.activeGM || game.users.activeGM.id === game.user.id) {
    try {
      let pack = game.packs.get("world.tbe-equipment");
      if (!pack) pack = await foundry.documents.collections.CompendiumCollection.createCompendium({ name: "tbe-equipment", label: "TBE Equipment", type: "Item" });
      const index = await pack.getIndex();
      const response = await fetch("systems/broken-empires-foundry/packs-src/example-items.json");
      if (!response.ok) throw new Error(`Equipment HTTP ${response.status}`);
      const items = await response.json();
      const missing = items.filter(item => !index.some(entry => entry.name === item.name && entry.type === item.type));
      if (missing.length) {
        const categories = [...new Set(missing.map(i => i.system.category || (i.type === "shield" ? "Shields" : "Miscellaneous Items")))];
        const existingFolders = pack.folders?.contents ?? [];
        const absent = categories.filter(name => !existingFolders.some(folder => folder.name === name));
        const created = absent.length ? await foundry.documents.Folder.createDocuments(absent.map(name => ({ name, type: "Item" })), { pack: pack.collection }) : [];
        const byName = new Map([...existingFolders, ...created].map(folder => [folder.name, folder.id]));
        await Item.implementation.createDocuments(missing.map(item => ({
          ...item, folder: byName.get(item.system.category || (item.type === "shield" ? "Shields" : "Miscellaneous Items")) ?? null
        })), { pack: pack.collection });
      }
      // Existing world compendiums keep their entries between releases.
      for (const entry of index.filter(entry => entry.type === "armor")) {
        const item = await pack.getDocument(entry._id);
        if (!item) continue;
        const fields = missingArmorPenaltyFields(item);
        if (Object.keys(fields).length) await item.update(fields);
      }
      const heavyEntry = index.find(entry => entry.name === "Heavy Crossbow" && entry.type === "weapon");
      if (heavyEntry) {
        const heavy = await pack.getDocument(heavyEntry._id);
        if (heavy?.system.notes === "2H; Piercing 3; Reload 1.") {
          await heavy.update({ "system.notes": "2H; Piercing 3; Reload 2 (two actions, normally two rounds)." });
        }
      }
      for (const entry of index.filter(entry => ["Spear", "Javelin", "Spear (thrown)", "Javelin (thrown)"].includes(entry.name) && entry.type === "weapon")) {
        const item = await pack.getDocument(entry._id);
        const update = item && pierceThroughNoteUpdate(item);
        if (update) { const { _id, ...fields } = update; await item.update(fields); }
      }
    } catch (error) { console.error("TBE: failed to initialise the equipment compendium", error); }
    try {
      const updates = game.items.contents.filter(item => item.type === "armor")
        .map(item => ({ _id: item.id, ...missingArmorPenaltyFields(item) })).filter(update => Object.keys(update).length > 1);
      if (updates.length) await Item.updateDocuments(updates);
    } catch (error) { console.error("TBE: could not populate world armour item penalties", error); }
    try {
      let pack = game.packs.get("world.tbe-talents");
      if (!pack) pack = await foundry.documents.collections.CompendiumCollection.createCompendium({ name: "tbe-talents", label: "TBE Talents", type: "Item" });
      const response = await fetch("systems/broken-empires-foundry/packs-src/talents.json");
      if (!response.ok) throw new Error(`Talents HTTP ${response.status}`);
      const talents = await response.json();
      const index = await pack.getIndex({ fields: ["type"] });
      const missing = talents.filter(talent => !index.some(entry => entry.name === talent.name && entry.type === "talent"));
      if (missing.length) {
        const categories = [...new Set(missing.map(item => item.system.category))];
        const existingFolders = pack.folders?.contents ?? [];
        const absent = categories.filter(name => !existingFolders.some(folder => folder.name === name));
        const created = absent.length ? await foundry.documents.Folder.createDocuments(absent.map(name => ({ name, type: "Item" })), { pack: pack.collection }) : [];
        const byName = new Map([...existingFolders, ...created].map(folder => [folder.name, folder.id]));
        await Item.implementation.createDocuments(missing.map(item => ({ ...item, folder: byName.get(item.system.category) ?? null })), { pack: pack.collection });
      }
    } catch (error) { console.error("TBE: failed to initialise the talents compendium", error); }
    try {
      let pack = game.packs.get("world.tbe-races");
      if (!pack) pack = await foundry.documents.collections.CompendiumCollection.createCompendium({ name: "tbe-races", label: "TBE Playable Races", type: "Item" });
      const response = await fetch("systems/broken-empires-foundry/packs-src/races.json");
      if (!response.ok) throw new Error(`Races HTTP ${response.status}`);
      const races = await response.json();
      const index = await pack.getIndex({ fields: ["type"] });
      const missing = races.filter(race => !index.some(entry => entry.name === race.name && entry.type === "race"));
      if (missing.length) await Item.implementation.createDocuments(missing, { pack: pack.collection });
    } catch (error) { console.error("TBE: failed to initialise the races compendium", error); }
  }
  for (const actor of game.actors.filter(a => a.type === "character")) {
    if (!actor.getFlag("broken-empires-foundry", "threadsMigrated")) {
      try {
        const oldThreads = String(actor._source.system?.threads ?? "").trim();
        if (oldThreads) await actor.createEmbeddedDocuments("Item", [{ name: "Legacy Threads", type: "thread", system: { description: oldThreads } }]);
        await actor.setFlag("broken-empires-foundry", "threadsMigrated", true);
      } catch (error) { console.error(`TBE: could not migrate Threads for ${actor.name}`, error); }
    }
    const weaponNoteUpdates = actor.items.map(pierceThroughNoteUpdate).filter(Boolean);
    if (weaponNoteUpdates.length) {
      try { await actor.updateEmbeddedDocuments("Item", weaponNoteUpdates); }
      catch (error) { console.error(`TBE: could not update spear and javelin notes for ${actor.name}`, error); }
    }
    if (!actor.getFlag("broken-empires-foundry", "itemZonesMigrated")) {
      try {
        const previousZone = String(actor.system.droppedZone || "").trim();
        const dropped = actor.items.filter(item => ["weapon", "armor", "shield", "gear"].includes(item.type) && itemPlacement(item) === "dropped" && !item._source.system?.zone);
        if (previousZone && dropped.length) await actor.updateEmbeddedDocuments("Item", dropped.map(item => ({ _id: item.id, "system.zone": previousZone })));
        await actor.setFlag("broken-empires-foundry", "itemZonesMigrated", true);
      } catch (error) { console.error(`TBE: could not migrate dropped item zones for ${actor.name}`, error); }
    }
    const oldCrossbows = actor.items.filter(item => item.type === "weapon" && item.name === "Heavy Crossbow" && item.system.notes === "2H; Piercing 3; Reload 1.");
    const armorUpdates = actor.items.filter(item => item.type === "armor").map(item => ({ _id: item.id, ...missingArmorPenaltyFields(item) }))
      .filter(update => Object.keys(update).length > 1);
    if (armorUpdates.length) {
      try { await actor.updateEmbeddedDocuments("Item", armorUpdates); }
      catch (error) { console.error(`TBE: could not populate armour penalties for ${actor.name}`, error); }
    }
    if (oldCrossbows.length) {
      try { await actor.updateEmbeddedDocuments("Item", oldCrossbows.map(item => ({ _id: item.id, "system.notes": "2H; Piercing 3; Reload 2 (two actions, normally two rounds)." }))); }
      catch (error) { console.error(`TBE: could not update heavy crossbows for ${actor.name}`, error); }
    }
    if ((actor.system.abilityScores?.length ?? 0) < 2) {
      try {
        await actor.update({ "system.abilityScores": [...(actor.system.abilityScores ?? []),
          ...Array.from({ length: 2 - (actor.system.abilityScores?.length ?? 0) }, () => ({ name: "", descriptor: "" }))] });
      } catch (error) { console.error(`TBE: could not add second ability slot for ${actor.name}`, error); }
    }
    if (!actor.getFlag("broken-empires-foundry", "skillBreakdownMigrated")) {
      const updates = {};
      for (const [category, names] of Object.entries(SKILLS)) {
        if (category === "Strands" || category === "Magic") continue;
        for (const name of names) {
          const source = actor._source.system?.skills?.[key(category)]?.[key(name)];
          if (!source || source.value === undefined) continue;
          const bonus = abilityBonus(actor, name);
          if (bonus) updates[`system.skills.${key(category)}.${key(name)}.value`] = Number(source.value) - bonus;
        }
      }
      for (const [index, row] of (actor._source.system?.customSkills ?? []).entries()) {
        const bonus = abilityBonus(actor, row.name);
        if (bonus) updates[`system.customSkills.${index}.value`] = Number(row.value ?? 0) - bonus;
      }
      try {
        if (Object.keys(updates).length) await actor.update(updates);
        await actor.setFlag("broken-empires-foundry", "skillBreakdownMigrated", true);
      } catch (error) { console.error(`TBE: could not preserve old skill totals for ${actor.name}`, error); }
    }
    if (!actor.getFlag("broken-empires-foundry", "startingItemsAdded")) {
      const existing = actor.items.contents;
      const additions = [];
      if (!existing.some(i => i.type === "weapon" && i.name === "Fists/Kicks")) additions.push(STARTING_ITEMS[0]);
      if (!existing.some(i => i.type === "talent" && i.name === "New Talent")) additions.push(STARTING_ITEMS[1]);
      try {
        if (additions.length) await actor.createEmbeddedDocuments("Item", additions);
        await actor.setFlag("broken-empires-foundry", "startingItemsAdded", true);
      } catch (error) { console.error(`TBE: failed to add starting items for ${actor.name}`, error); }
    }
    // Convert populated legacy sheet rows once. Keep the old arrays as a recoverable backup.
    if (!actor.getFlag("broken-empires-foundry", "equipmentItemsMigrated")) {
      const previous = actor._source.system ?? {};
      const converted = [
        ...(previous.armor ?? []).filter(row => row.name?.trim()).map(row => ({
          name: row.name, type: "armor", system: { placement: row.location ? "worn" : "inventory", location: BODY_LOCATIONS.find(location => location.toLowerCase() === row.location?.toLowerCase()) ?? "", protection: row.protection ?? 0, bulk: row.bulk ?? 0, notes: row.notes ?? "" }
        })),
        ...(previous.equipment ?? []).filter(row => row.name?.trim()).map(row => ({
          name: row.name, type: "gear", system: { placement: "inventory", quantity: row.quantity ?? 1, encumbrance: row.encumbrance ?? 0, notes: row.notes ?? "" }
        }))
      ];
      try {
        if (converted.length) await actor.createEmbeddedDocuments("Item", converted);
        await actor.setFlag("broken-empires-foundry", "equipmentItemsMigrated", true);
      } catch (error) { console.error(`TBE: failed to migrate equipment for ${actor.name}`, error); }
    }
    const original = actor._source.system?.skills ?? {};
    if (original.melee === undefined && original.ranged === undefined && original.dodge === undefined) continue;
    const updates = { "system.skills.-=melee": null, "system.skills.-=ranged": null, "system.skills.-=dodge": null };
    if (original.melee !== undefined) updates["system.skills.combat.melee_light.value"] = original.melee;
    if (original.ranged !== undefined) updates["system.skills.combat.missile.value"] = original.ranged;
    if (original.dodge !== undefined) updates["system.skills.combat.dodge.value"] = original.dodge;
    try { await actor.update(updates); }
    catch (error) { console.error(`TBE: failed to migrate skills for ${actor.name}`, error); }
  }
});

const STARTING_ITEMS = [
  { name: "Fists/Kicks", type: "weapon", system: { price: 0, category: "Might Weapons", attackSkill: "Might", placement: "ready", reach: "0", damage: "0 NL", chooseLocation: "1", circumventShield: "3", disarm: "2", trip: "4", encumbrance: 0, range: "-", notes: "Unarmed Might attacks; -20 vs armed foes" } },
  { name: "New Talent", type: "talent" }
];

// Only the client creating a new character adds these embedded Items.
Hooks.on("createActor", async (actor, options, userId) => {
  if (actor.type !== "character" || userId !== game.user.id) return;
  try {
    await actor.createEmbeddedDocuments("Item", STARTING_ITEMS);
    await actor.setFlag("broken-empires-foundry", "startingItemsAdded", true);
    await actor.setFlag("broken-empires-foundry", "skillBreakdownMigrated", true);
  } catch (error) { console.error(`TBE: failed to create starting items for ${actor.name}`, error); }
});
