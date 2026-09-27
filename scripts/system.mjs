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
  return { ability, other, total: (Number(data?.value) || 0) + ability + other };
}
const key = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/_$/, "");
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
      customSkills: list({ name: string(), category: string(), description: string(), value: number(), race: number(), culture: number(), lifeEvents: number(), career: number(), rounding: number(), xp: number(), other: number(), expertise: number(), savvy: new BooleanField({ initial: false }) }, { name: "", category: "Other", description: "", value: 0, expertise: 0, savvy: false }),
      resources: list({ name: string(), value: number(), max: number() }, { name: "", value: 0, max: 0 }),
      equipment: list({ name: string(), quantity: number(1), encumbrance: number(), notes: string() }),
      armor: list({ location: string(), name: string(), protection: number(), bulk: number(), notes: string() }),
      supply: entry({ gear: new StringField({ initial: "d12" }), ammo: new StringField({ initial: "d12" }), rations: new StringField({ initial: "d12" }), medical: new StringField({ initial: "d12" }) }),
      encumbranceMax: number(6), weaponEncumbranceMax: number(6), equipmentLocations: new ArrayField(entry({ id: string(), name: string(), countsEncumbrance: new BooleanField({ initial: false }) }), { initial: [] }), droppedZone: string(), fraying: number(), trueName: string(), threads: string()
    };
  }
}
class TalentData extends foundry.abstract.TypeDataModel {
  static defineSchema() { return { source: string(), effect: string(), requirements: string(), category: string(), reference: string() }; }
}
class RaceData extends foundry.abstract.TypeDataModel {
  static defineSchema() { return { traits: new ArrayField(entry({ name: string(), effect: string() }), { initial: [] }), notes: string() }; }
}
class WeaponData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return { price: number(), category: string(), attackSkill: string(), reach: string(), damage: string(), chooseLocation: string(), circumventShield: string(), disarm: string(), trip: string(), encumbrance: number(), range: string(), notes: string(),
      // Keep prototype values in existing worlds, even though they are not weapon statistics.
      attack: string(), parry: string(), clash: string(), counterstrike: string(), disruption: string(), threat: string(),
      freeAtHand: new BooleanField({ initial: false }), placement: new StringField({ required: true, initial: "atHand" }) };
  }
}
class ArmorData extends foundry.abstract.TypeDataModel {
  static defineSchema() { return { price: number(), category: string(), protection: number(), bulk: decimal(), training: new BooleanField({ initial: false }), canSunder: new BooleanField({ initial: false }), sundered: new BooleanField({ initial: false }), placement: new StringField({ required: true, initial: "inventory" }), location: string(), penalties: string(), notes: string() }; }
}
class ShieldData extends foundry.abstract.TypeDataModel {
  static defineSchema() { return { price: number(), size: string(), protection: number(), shieldBash: string(), encumbrance: number(), split: new BooleanField({ initial: false }), placement: new StringField({ required: true, initial: "atHand" }), notes: string() }; }
}
class GearData extends foundry.abstract.TypeDataModel {
  static defineSchema() { return { price: number(), category: string(), encumbrance: decimal(), quantity: number(1), placement: new StringField({ required: true, initial: "inventory" }), notes: string() }; }
}
const BODY_LOCATIONS = ["Head", "Body", "Right Arm", "Left Arm", "Right Leg", "Left Leg"];
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
const itemPlacement = item => item.system.placement || (item.type === "armor" || item.type === "gear" ? "inventory" : "atHand");
const COMBAT_MANEUVERS = [
  ["Unbalance", "1 rolled SL", "Target takes −20 on its next skill roll; repeated uses do not stack."],
  ["Drive Back", "3 rolled SLs; melee", "Move an Engaged foe and follow; at 4 SLs you can push without following."],
  ["Lock", "3 rolled SLs; melee", "Target cannot make a Fighting Withdrawal while you hold the engagement."],
  ["Pierce Armor", "4 rolled SLs; rigid armour", "Gain Piercing 3 against Reinforced Leather or better."],
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
function generalHitLocation(value) {
  const digit = value % 10;
  return digit === 0 ? "Head" : digit <= 5 ? "Body" : digit <= 7 ? (digit === 6 ? "Right Arm" : "Left Arm") : (digit === 8 ? "Right Leg" : "Left Leg");
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
    context.maneuvers = COMBAT_MANEUVERS;
    context.combatModifiers = COMBAT_MODIFIERS;
    context.skillGroups = Object.entries(SKILLS).map(([category, names]) => ({
      category, rows: names.map(name => ({ name, description: SKILL_DESCRIPTIONS[name] || "", path: `system.skills.${key(category)}.${key(name)}`, strand: category === "Strands", data: this.actor.system.skills[key(category)][key(name)], ...skillTotals(this.actor, name, this.actor.system.skills[key(category)][key(name)]) }))
    }));
    const customSkills = this.actor.system.customSkills.map((row, index) => ({ ...row, index, ...skillTotals(this.actor, row.name, row) }));
    context.customSkillGroups = Object.fromEntries(Object.keys(SKILLS).map(category => [category, customSkills.filter(row => row.category === category)]));
    context.otherCustomSkills = customSkills.filter(row => !Object.keys(SKILLS).includes(row.category));
    context.talents = this.actor.items.filter(i => i.type === "talent");
    context.weapons = this.actor.items.filter(i => i.type === "weapon");
    context.shields = this.actor.items.filter(i => i.type === "shield");
    context.armorItems = this.actor.items.filter(i => i.type === "armor");
    context.gearItems = this.actor.items.filter(i => i.type === "gear");
    const customLocations = this.actor.system.equipmentLocations ?? [];
    context.placementOptions = Object.fromEntries(Object.keys(PLACEMENTS).map(type => [type, [
      ...LOCATION_OPTIONS, ...customLocations.filter(location => location.id && location.name).map(location => ({ value: location.id, label: location.name }))
    ]]));
    const equipment = this.actor.items.filter(i => ["weapon", "armor", "shield", "gear"].includes(i.type));
    context.itemPlacements = Object.fromEntries(equipment.map(i => [i.id, itemPlacement(i)]));
    context.equipmentAreas = [
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
    const worn = context.armorItems.filter(i => itemPlacement(i) === "worn");
    context.armorSlots = BODY_LOCATIONS.map(location => {
      const pieces = worn.filter(i => i.system.location === location);
      return { location, items: pieces, conflict: pieces.length > 1, protection: pieces.length === 1 ? (pieces[0].system.sundered ? 0 : pieces[0].system.protection) : 0 };
    });
    context.unassignedArmor = worn.filter(i => !BODY_LOCATIONS.includes(i.system.location));
    const carried = this.actor.items.filter(i => ["weapon", "shield"].includes(i.type) && ["ready", "atHand"].includes(itemPlacement(i)));
    const inventory = equipment.filter(i => itemPlacement(i) === "inventory" || (itemPlacement(i) === "worn" && i.type !== "armor") || (["ready", "atHand"].includes(itemPlacement(i)) && ["gear", "armor"].includes(i.type)) || customLocations.some(location => location.id === itemPlacement(i) && location.countsEncumbrance));
    const freeAtHandWeapon = carried.find(i => i.type === "weapon" && i.system.freeAtHand && itemPlacement(i) === "atHand");
    context.weaponENC = carried.reduce((sum, i) => sum + (i === freeAtHandWeapon ? 0 : itemENC(i)), 0);
    context.inventoryENC = inventory.reduce((sum, i) => sum + (i.type === "armor" ? 1 : itemENC(i) * (i.type === "gear" ? Math.max(0, Number(i.system.quantity) || 0) : 1)), 0) + Math.max(0, Math.ceil((Number(this.actor.system.silver) || 0) / 500));
    context.wornBulk = worn.reduce((sum, i) => sum + (Number(i.system.bulk) || 0), 0);
    context.armorInitiativePenalty = Math.ceil(context.wornBulk / 3);
    context.inventoryMax = this.actor.system.encumbranceMax || 6;
    context.weaponMax = this.actor.system.weaponEncumbranceMax ?? 6;
    context.weaponOver = context.weaponENC > context.weaponMax;
    context.inventoryOver = context.inventoryENC > context.inventoryMax;
    context.carriedBurden = context.weaponENC + context.inventoryENC + context.wornBulk;
    const resolve = this.actor.system.resolve;
    const max = Math.max(0, Math.floor(Number(resolve.max) || 0));
    const permanent = Math.min(max, Math.max(0, Math.floor(Number(resolve.permanentFatigue) || 0)));
    const temporary = Math.min(max - permanent, Math.max(0, Math.floor(Number(resolve.fatigue) || 0)));
    const current = Math.max(0, Math.min(max - permanent - temporary, Math.floor(Number(resolve.value) || 0)));
    context.resolveTrack = Array.from({ length: max }, (_, index) => {
      const state = index >= max - permanent ? "permanent" : index >= max - permanent - temporary ? "fatigue" : index < max - permanent - temporary - current ? "spent" : "available";
      return { index, state, permanent: state === "permanent", fatigue: state === "fatigue", available: state === "available" };
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
    this.element.querySelectorAll("[data-resolve-box]").forEach(button => button.addEventListener("click", async event => {
      event.preventDefault();
      if (!this.actor.isOwner) return;
      const state = button.classList;
      const resolve = this.actor.system.resolve;
      if (state.contains("tbe-resolve-permanent")) return;
      if (state.contains("tbe-resolve-fatigue")) {
        await this.actor.update({ "system.resolve.fatigue": Math.max(0, Number(resolve.fatigue) - 1) });
      } else {
        const maxAvailable = Math.max(0, Number(resolve.max) - Number(resolve.fatigue) - Number(resolve.permanentFatigue));
        await this.actor.update({ "system.resolve.value": Math.max(0, Math.min(maxAvailable, Number(resolve.value) + (state.contains("tbe-resolve-spent") ? 1 : -1))) });
      }
    }));
    this.element.querySelector("[data-add-fatigue]")?.addEventListener("click", async event => {
      event.preventDefault();
      const r = this.actor.system.resolve;
      if (Number(r.value) <= 0 || Number(r.fatigue) + Number(r.permanentFatigue) >= Number(r.max)) { ui.notifications.warn("The Resolve track is full; further Fatigue may cause a Fatigue-based wound."); return; }
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
    if (scroller) {
      scroller.scrollTop = this._savedScrollTop ?? 0;
      scroller.addEventListener("scroll", () => { this._savedScrollTop = scroller.scrollTop; }, { passive: true });
    }
    // Keep prose fields as short as their content, growing them as the user types.
    this.element.querySelectorAll("textarea.tbe-grow").forEach(field => {
      const size = () => { field.style.height = "auto"; field.style.height = `${Math.max(field.scrollHeight, 34)}px`; };
      size(); field.addEventListener("input", size);
    });
    this.element.querySelectorAll("[data-section]").forEach(button => button.addEventListener("click", event => {
      event.preventDefault();
      const target = this.element.querySelector(`#tbe-${button.dataset.section}`);
      if (!scroller || !target) return;
      scroller.scrollTop += target.getBoundingClientRect().top - scroller.getBoundingClientRect().top - 44;
      this._savedScrollTop = scroller.scrollTop;
    }));
    this.element.querySelectorAll("[data-attack-item]").forEach(button => button.addEventListener("click", async event => {
      event.preventDefault();
      const weapon = this.actor.items.get(button.dataset.attackItem);
      if (!weapon || weapon.type !== "weapon" || !this.actor.isOwner) return;
      const placement = itemPlacement(weapon);
      if (!["ready", "atHand"].includes(placement)) return;
      const legacySkills = { Dagger: "Melee: Light", Cutlass: "Melee: Light", Broadsword: "Melee: Medium", Spear: "Melee: Medium", Staff: "Melee: Medium", "Fists/Kicks": "Might" };
      const preferred = weapon.system.attackSkill || legacySkills[weapon.name] || "Melee: Medium";
      const options = ATTACK_SKILLS.map(name => '<option value="' + name + '"' + (name === preferred ? ' selected' : '') + '>' + name + '</option>').join("");
      const presets = [
        ["charge", 20, "Charge +20"], ["aim", 20, "Aim +20"],
        ["cover", -20, "Target in cover −20"], ["intoMelee", -20, "Ranged into melee −20"],
        ["beyondRange", -20, "One zone beyond range −20"],
        ["highGround", 10, "Higher elevation +10"], ["proneMelee", 20, "Melee vs Prone +20"],
        ["proneRanged", -20, "Ranged vs Prone −20"], ["offHand", -20, "Off hand −20"],
        ["nonlethal", -10, "Lethal weapon for nonlethal injury −10"]
      ];
      const presetFields = presets.map(([key, , label]) => '<label><input type="checkbox" name="mod_' + key + '"> ' + label + '</label>').join("");
      const details = await foundry.applications.api.DialogV2.input({
        window: { title: "Attack with " + weapon.name },
        content: '<div class="tbe-attack-dialog"><label>Skill <select name="skill">' + options +
          '</select></label><label>Other modifier <input type="number" name="modifier" value="0" step="1"></label>' +
          '<label><input type="checkbox" name="draw"' + (placement === "atHand" && weapon.name !== "Fists/Kicks" ? ' checked' : '') +
          '> Draw and attack (−20; uncheck if already drawn)</label><details><summary>Common modifiers</summary>' +
          presetFields + '</details><p>Use Other modifier for reach, talents and situational rulings. No token is required.</p></div>',
        ok: { label: "Roll attack" }
      });
      if (!details || !ATTACK_SKILLS.includes(details.skill)) return;
      const skillData = this.actor.system.skills.combat[key(details.skill)];
      const base = skillTotals(this.actor, details.skill, skillData).total;
      const other = Number(details.modifier);
      if (!Number.isFinite(other)) return;
      const draw = Boolean(details.draw) && placement === "atHand" && weapon.name !== "Fists/Kicks" && !/throwing knives/i.test(weapon.name);
      const presetTotal = presets.reduce((sum, [name, amount]) => sum + (details["mod_" + name] ? amount : 0), 0);
      const modifier = other + presetTotal - (draw ? 20 : 0);
      const target = base + modifier;
      const roll = await new Roll("1d100").evaluate();
      const value = roll.total;
      const outcome = attackOutcome(value, target, Number(skillData?.expertise) || 0);
      const result = outcome.critical ? "Critical success" : outcome.criticalFailure ? "Critical failure" : outcome.success ? "Success" : "Failure";
      const escape = foundry.utils.escapeHTML;
      const content = '<div class="tbe-attack-card"><h3>' + escape(this.actor.name) + ' — ' + escape(weapon.name) +
        '</h3><p>' + escape(details.skill) + ' ' + base + ' ' + (modifier < 0 ? '−' : '+') + ' ' + Math.abs(modifier) +
        ' = <strong>' + target + '</strong></p><p>Roll <strong>' + (value === 100 ? '00' : String(value).padStart(2, '0')) +
        '</strong> — <strong>' + result + '</strong>; ' + outcome.sl + ' rolled SLs.</p>' +
        (outcome.success ? '<p>General hit location from attacker’s ones die: <strong>' + generalHitLocation(value) + '</strong>.</p>' : '') +
        '<div class="tbe-attack-stats">' + [
          ["RCH", weapon.system.reach], ["DMG", weapon.system.damage], ["CL", weapon.system.chooseLocation],
          ["CS", weapon.system.circumventShield], ["DIS", weapon.system.disarm], ["T", weapon.system.trip],
          ["ENC", weapon.system.encumbrance], ["RNG", weapon.system.range]
        ].map(([label, stat]) => `<span><b>${label}</b> ${escape(String(stat ?? ""))}</span>`).join("") + '</div>' +
        (weapon.system.notes ? '<p><b>Notes:</b> ' + escape(weapon.system.notes) + '</p>' : '') + '</div>';
      if (draw) await weapon.update({ "system.placement": "ready" });
      await roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor: this.actor }), flavor: content });
    }));
    this.element.querySelectorAll("[data-add]").forEach(button => button.addEventListener("click", async event => {
      event.preventDefault();
      this._savedScrollTop = scroller?.scrollTop ?? 0;
      const collection = button.dataset.add;
      if (["item", "talent", "weapon", "armor", "shield", "gear"].includes(collection)) {
        const typeOptions = ["weapon", "armor", "shield", "gear", "talent"];
        const area = button.dataset.area;
        const allowedTypes = area ? typeOptions.filter(type => type !== "talent") : typeOptions;
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
        const defaults = { customSkills: { name: "", category: button.dataset.category || "Other", description: "", value: 0, expertise: 0, savvy: false }, resources: { name: "", value: 0, max: 0 }, abilityScores: { name: "", descriptor: "" }, racialTraits: { name: "", effect: "" }, personalityTraits: { name: "", description: "" }, goals: { text: "", shared: false }, sharedHistories: { character: "", event: "", skill: "", story: "" }, relationships: { name: "", type: "", notes: "" }, wounds: { generalLocation: "", location: "", detail: "", points: 0, lethal: true, ritual: false, infection: false, septic: false }, equipment: { name: "", quantity: 1, encumbrance: 0, notes: "" }, armor: { location: "", name: "", protection: 0, bulk: 0, notes: "" } };
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
    if (item && ["talent", "weapon", "armor", "shield", "gear"].includes(item.type)) {
      const area = event.target.closest("[data-drop-area]")?.dataset.dropArea;
      if (item.parent?.documentName === "Actor" && item.parent.id === this.actor.id) {
        if (area && item.type !== "talent") await item.update({ "system.placement": area });
        return;
      }
      const copy = item.toObject();
      delete copy._id;
      if (area && item.type !== "talent") copy.system.placement = area;
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
    context.owned = this.item.parent?.documentName === "Actor";
    return context;
  }
  _onRender(context, options) {
    super._onRender(context, options);
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
  CONFIG.Item.dataModels.weapon = WeaponData;
  CONFIG.Item.dataModels.armor = ArmorData;
  CONFIG.Item.dataModels.shield = ShieldData;
  CONFIG.Item.dataModels.gear = GearData;
  foundry.documents.collections.Actors.registerSheet("broken-empires-foundry", CharacterSheet, { types: ["character"], makeDefault: true, label: "TBE Character" });
  foundry.documents.collections.Items.registerSheet("broken-empires-foundry", TBEItemSheet, { types: ["talent", "race", "weapon", "armor", "shield", "gear"], makeDefault: true, label: "TBE Item" });
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
    } catch (error) { console.error("TBE: failed to initialise the equipment compendium", error); }
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
      if (!existing.some(i => i.type === "talent" && i.name === "New Talent")) additions.push(STARTING_ITEMS[2]);
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
