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
const key = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/_$/, "");
const skill = () => entry({ value: number(20), expertise: number(), savvy: new BooleanField({ initial: false }) });
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
      abilityScores: list({ name: string(), descriptor: string() }, { name: "", descriptor: "" }),
      racialTraits: list({ name: string(), effect: string() }, { name: "", effect: "" }),
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
      customSkills: list({ name: string(), category: string(), value: number(), expertise: number(), savvy: new BooleanField({ initial: false }) }, { name: "", category: "Other", value: 0, expertise: 0, savvy: false }),
      resources: list({ name: string(), value: number(), max: number() }, { name: "", value: 0, max: 0 }),
      equipment: list({ name: string(), quantity: number(1), encumbrance: number(), notes: string() }),
      armor: list({ location: string(), name: string(), protection: number(), bulk: number(), notes: string() }),
      supply: entry({ gear: new StringField({ initial: "d12" }), ammo: new StringField({ initial: "d12" }), rations: new StringField({ initial: "d12" }), medical: new StringField({ initial: "d12" }) }),
      encumbranceMax: number(6), fraying: number(), trueName: string(), threads: string()
    };
  }
}
class TalentData extends foundry.abstract.TypeDataModel {
  static defineSchema() { return { source: string(), effect: string(), requirements: string() }; }
}
class WeaponData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return { price: number(), reach: string(), damage: string(), chooseLocation: string(), circumventShield: string(), disarm: string(), trip: string(), encumbrance: number(), range: string(), notes: string(),
      // Keep prototype values in existing worlds, even though they are not weapon statistics.
      attack: string(), parry: string(), clash: string(), counterstrike: string(), disruption: string(), threat: string(),
      placement: new StringField({ required: true, initial: "atHand" }) };
  }
}
class ArmorData extends foundry.abstract.TypeDataModel {
  static defineSchema() { return { price: number(), protection: number(), bulk: decimal(), training: new BooleanField({ initial: false }), canSunder: new BooleanField({ initial: false }), sundered: new BooleanField({ initial: false }), placement: new StringField({ required: true, initial: "inventory" }), location: string(), penalties: string(), notes: string() }; }
}
class ShieldData extends foundry.abstract.TypeDataModel {
  static defineSchema() { return { price: number(), size: string(), protection: number(), shieldBash: string(), encumbrance: number(), split: new BooleanField({ initial: false }), placement: new StringField({ required: true, initial: "atHand" }), notes: string() }; }
}
class GearData extends foundry.abstract.TypeDataModel {
  static defineSchema() { return { price: number(), encumbrance: decimal(), quantity: number(1), placement: new StringField({ required: true, initial: "inventory" }), notes: string() }; }
}
const BODY_LOCATIONS = ["Head", "Body", "Right Arm", "Left Arm", "Right Leg", "Left Leg"];
const PLACEMENTS = {
  weapon: [{ value: "ready", label: "Held and Ready" }, { value: "atHand", label: "At Hand" }, { value: "inventory", label: "Inventory (Stored)" }, { value: "away", label: "At Home / Elsewhere" }],
  shield: [{ value: "ready", label: "Held and Ready" }, { value: "atHand", label: "At Hand" }, { value: "inventory", label: "Inventory (Stored)" }, { value: "away", label: "At Home / Elsewhere" }],
  armor: [{ value: "worn", label: "Worn" }, { value: "inventory", label: "Inventory" }, { value: "away", label: "At Home / Elsewhere" }],
  gear: [{ value: "inventory", label: "Inventory" }, { value: "away", label: "At Home / Elsewhere" }]
};
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
    context.skillGroups = Object.entries(SKILLS).map(([category, names]) => ({
      category, rows: names.map(name => ({ name, path: `system.skills.${key(category)}.${key(name)}`, strand: category === "Strands", data: this.actor.system.skills[key(category)][key(name)] }))
    }));
    context.talents = this.actor.items.filter(i => i.type === "talent");
    context.weapons = this.actor.items.filter(i => i.type === "weapon");
    context.shields = this.actor.items.filter(i => i.type === "shield");
    context.armorItems = this.actor.items.filter(i => i.type === "armor");
    context.gearItems = this.actor.items.filter(i => i.type === "gear");
    context.placementOptions = PLACEMENTS;
    const equipment = this.actor.items.filter(i => ["weapon", "armor", "shield", "gear"].includes(i.type));
    context.itemPlacements = Object.fromEntries(equipment.map(i => [i.id, itemPlacement(i)]));
    context.equipmentAreas = [
      { key: "ready", title: "Held and Ready", items: equipment.filter(i => itemPlacement(i) === "ready") },
      { key: "atHand", title: "At Hand", items: equipment.filter(i => itemPlacement(i) === "atHand") },
      { key: "inventory", title: "Inventory (Stored)", items: equipment.filter(i => itemPlacement(i) === "inventory") },
      { key: "away", title: "At Home / Elsewhere", items: equipment.filter(i => itemPlacement(i) === "away") }
    ];
    const worn = context.armorItems.filter(i => itemPlacement(i) === "worn");
    context.armorSlots = BODY_LOCATIONS.map(location => {
      const pieces = worn.filter(i => i.system.location === location);
      return { location, items: pieces, conflict: pieces.length > 1, protection: pieces.length === 1 ? (pieces[0].system.sundered ? 0 : pieces[0].system.protection) : 0 };
    });
    context.unassignedArmor = worn.filter(i => !BODY_LOCATIONS.includes(i.system.location));
    const carried = this.actor.items.filter(i => ["weapon", "shield"].includes(i.type) && ["ready", "atHand"].includes(itemPlacement(i)));
    const inventory = this.actor.items.filter(i => itemPlacement(i) === "inventory" && ["weapon", "shield", "armor", "gear"].includes(i.type));
    context.weaponENC = carried.reduce((sum, i) => sum + itemENC(i), 0);
    context.inventoryENC = inventory.reduce((sum, i) => sum + (i.type === "armor" ? 1 : itemENC(i) * (i.type === "gear" ? Math.max(0, Number(i.system.quantity) || 0) : 1)), 0) + Math.max(0, Math.ceil((Number(this.actor.system.silver) || 0) / 500));
    context.wornBulk = worn.reduce((sum, i) => sum + (Number(i.system.bulk) || 0), 0);
    context.armorInitiativePenalty = Math.ceil(context.wornBulk / 3);
    context.inventoryMax = this.actor.system.encumbranceMax || 6;
    context.weaponOver = context.weaponENC > 6;
    context.inventoryOver = context.inventoryENC > context.inventoryMax;
    context.carriedBurden = context.weaponENC + context.inventoryENC + context.wornBulk;
    context.isGM = game.user.isGM;
    context.supplyDisplay = Object.fromEntries(["gear", "ammo", "rations", "medical"].map(type => [type, this.actor.system.supply[type] || "d12"]));
    const ll = Number(this.actor.system.attributes.lethalityLevel) || 0;
    context.woundSummary = BODY_LOCATIONS.map(location => {
      const wounds = this.actor.system.wounds.filter(w => inferWoundLocation(w) === location);
      return { location, lethal: wounds.filter(w => w.lethal).reduce((sum, w) => sum + Math.max(0, Number(w.points) || 0), 0), nonlethal: wounds.filter(w => !w.lethal).reduce((sum, w) => sum + Math.max(0, Number(w.points) || 0), 0), ll };
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
    this.element.querySelectorAll("[data-add]").forEach(button => button.addEventListener("click", async event => {
      event.preventDefault();
      this._savedScrollTop = scroller?.scrollTop ?? 0;
      const collection = button.dataset.add;
      if (["item", "talent", "weapon", "armor", "shield", "gear"].includes(collection)) {
        const typeOptions = ["weapon", "armor", "shield", "gear", "talent"];
        const typeSelect = collection === "item" ? `<label>Type <select name="type">${typeOptions.map(type => `<option value="${type}">${type === "armor" ? "Armour" : type[0].toUpperCase() + type.slice(1)}</option>`).join("")}</select></label>` : "";
        const details = await foundry.applications.api.DialogV2.input({
          window: { title: `Add ${collection === "item" ? "Item" : collection === "armor" ? "Armour" : collection}` },
          content: `${typeSelect}<label>Name <input name="itemName" required autofocus placeholder="Item name"></label>`,
          ok: { label: "Create on character" }
        });
        if (!details) return;
        const type = collection === "item" ? details.type : collection;
        const name = String(details.itemName ?? "").trim();
        if (!typeOptions.includes(type) || !name) return;
        const created = await this.actor.createEmbeddedDocuments("Item", [{ name, type }]);
        created[0]?.sheet.render(true);
      } else {
        const defaults = { customSkills: { name: "", category: "Other", value: 0, expertise: 0, savvy: false }, resources: { name: "", value: 0, max: 0 }, abilityScores: { name: "", descriptor: "" }, racialTraits: { name: "", effect: "" }, personalityTraits: { name: "", description: "" }, goals: { text: "", shared: false }, sharedHistories: { character: "", event: "", skill: "", story: "" }, relationships: { name: "", type: "", notes: "" }, wounds: { generalLocation: "", location: "", detail: "", points: 0, lethal: true, ritual: false, infection: false, septic: false }, equipment: { name: "", quantity: 1, encumbrance: 0, notes: "" }, armor: { location: "", name: "", protection: 0, bulk: 0, notes: "" } };
        await this.actor.update({ [`system.${collection}`]: [...this.actor.system[collection], defaults[collection]] });
      }
    }));
    this.element.querySelectorAll("[data-remove]").forEach(button => button.addEventListener("click", async event => {
      event.preventDefault();
      this._savedScrollTop = scroller?.scrollTop ?? 0;
      const [collection, index] = button.dataset.remove.split(":");
      await this.actor.update({ [`system.${collection}`]: this.actor.system[collection].filter((_, i) => i !== Number(index)) });
    }));
    this.element.querySelectorAll("[data-item-placement]").forEach(select => select.addEventListener("change", async event => {
      this._savedScrollTop = scroller?.scrollTop ?? 0;
      const item = this.actor.items.get(select.dataset.itemPlacement);
      if (!item) return;
      const valid = PLACEMENTS[item.type]?.some(option => option.value === event.target.value);
      if (!valid) return;
      await item.update({ "system.placement": event.target.value });
    }));
    this.element.querySelectorAll("[data-copy-item]").forEach(button => button.addEventListener("click", async event => {
      event.preventDefault();
      const source = this.actor.items.get(button.dataset.copyItem);
      if (!source || !game.user.isGM) return;
      const data = source.toObject();
      delete data._id;
      if (data.system) {
        delete data.system.placement;
        if (source.type === "armor") data.system.sundered = false;
        if (source.type === "shield") data.system.split = false;
        if (source.type === "gear") data.system.quantity = 1;
        if (source.type === "talent") data.system.source = "";
      }
      const copied = await Item.implementation.create(data);
      copied?.sheet.render(true);
    }));
    this.element.querySelectorAll("[data-delete-item]").forEach(button => button.addEventListener("click", async event => {
      event.preventDefault(); this._savedScrollTop = scroller?.scrollTop ?? 0; await this.actor.deleteEmbeddedDocuments("Item", [button.dataset.deleteItem]);
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
    if (item && ["talent", "weapon", "armor", "shield", "gear"].includes(item.type)) {
      if (item.parent?.documentName === "Actor" && item.parent.id === this.actor.id) return;
      const copy = item.toObject();
      delete copy._id;
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
    context.placements = PLACEMENTS[this.item.type] ?? [];
    context.locations = BODY_LOCATIONS;
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
Hooks.once("init", () => {
  CONFIG.Actor.dataModels.character = CharacterData;
  CONFIG.Item.dataModels.talent = TalentData;
  CONFIG.Item.dataModels.weapon = WeaponData;
  CONFIG.Item.dataModels.armor = ArmorData;
  CONFIG.Item.dataModels.shield = ShieldData;
  CONFIG.Item.dataModels.gear = GearData;
  foundry.documents.collections.Actors.registerSheet("broken-empires-foundry", CharacterSheet, { types: ["character"], makeDefault: true, label: "TBE Character" });
  foundry.documents.collections.Items.registerSheet("broken-empires-foundry", TBEItemSheet, { types: ["talent", "weapon", "armor", "shield", "gear"], makeDefault: true, label: "TBE Item" });
});

// Preserve the three values entered on the 0.1.x test sheet when opening an old world.
Hooks.once("ready", async () => {
  if (!game.user.isGM) return;
  for (const actor of game.actors.filter(a => a.type === "character")) {
    if (!actor.getFlag("broken-empires-foundry", "startingItemsAdded")) {
      const existing = actor.items.contents;
      const additions = [];
      if (!existing.some(i => i.type === "weapon" && i.name === "Fists/Kicks")) additions.push(STARTING_ITEMS[0]);
      if (!existing.some(i => i.type === "weapon" && i.name === "New Weapon")) additions.push(STARTING_ITEMS[1]);
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
    if (!actor.getFlag("broken-empires-foundry", "equipmentPlaceholdersAdded")) {
      const placeholders = ["armor", "shield", "gear"].filter(type => !actor.items.contents.some(i => i.type === type && i.name === `New ${type[0].toUpperCase()}${type.slice(1)}`)).map(type => ({ name: type === "armor" ? "New Armour" : `New ${type[0].toUpperCase()}${type.slice(1)}`, type, system: { placement: "away" } }));
      try {
        if (placeholders.length) await actor.createEmbeddedDocuments("Item", placeholders);
        await actor.setFlag("broken-empires-foundry", "equipmentPlaceholdersAdded", true);
      } catch (error) { console.error(`TBE: failed to add equipment placeholders for ${actor.name}`, error); }
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
  { name: "Fists/Kicks", type: "weapon", system: { price: 0, reach: "0", damage: "0 NL", chooseLocation: "1", circumventShield: "3", disarm: "2", trip: "4", encumbrance: 0, range: "-", notes: "Unarmed Might attacks; -20 vs armed foes" } },
  { name: "New Weapon", type: "weapon" },
  { name: "New Talent", type: "talent" },
  { name: "New Armour", type: "armor", system: { placement: "away" } },
  { name: "New Shield", type: "shield", system: { placement: "away" } },
  { name: "New Gear", type: "gear", system: { placement: "away" } }
];

// Only the client creating a new character adds these embedded Items.
Hooks.on("createActor", async (actor, options, userId) => {
  if (actor.type !== "character" || userId !== game.user.id) return;
  try {
    await actor.createEmbeddedDocuments("Item", STARTING_ITEMS);
    await actor.setFlag("broken-empires-foundry", "startingItemsAdded", true);
  } catch (error) { console.error(`TBE: failed to create starting items for ${actor.name}`, error); }
});
