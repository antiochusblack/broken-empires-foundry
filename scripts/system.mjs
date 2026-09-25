const { ArrayField, BooleanField, NumberField, SchemaField, StringField } = foundry.data.fields;
const string = () => new StringField({ required: true, blank: true, initial: "" });
const number = (initial = 0) => new NumberField({ required: true, integer: true, initial });
const entry = (fields) => new SchemaField(fields);
const list = (fields) => new ArrayField(entry(fields), { initial: [] });

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
      abilityScores: list({ name: string(), descriptor: string() }),
      racialTraits: list({ name: string(), effect: string() }),
      personalityTraits: list({ name: string(), description: string() }),
      goals: list({ text: string(), shared: new BooleanField({ initial: false }) }),
      events: new SchemaField(Object.fromEntries(["origin", "youth", "recent"].map(x => [x, entry({ name: string(), benefit: string(), story: string() })]))),
      sharedHistories: list({ character: string(), event: string(), skill: string(), story: string() }),
      relationships: list({ name: string(), type: string(), notes: string() }),
      resolve: entry({ value: number(10), max: number(10), fatigue: number(), permanentFatigue: number() }),
      attributes: entry({ initiative: number(10), initiativePenalty: number(), toughness: number(), deathThreshold: number(), lethalityLevel: number() }),
      wounds: list({ location: string(), detail: string(), points: number(), lethal: new BooleanField({ initial: true }), ritual: new BooleanField({ initial: false }), infection: new BooleanField({ initial: false }) }),
      skills: new SchemaField(skills),
      customSkills: list({ name: string(), category: string(), value: number(), expertise: number(), savvy: new BooleanField({ initial: false }) }),
      resources: list({ name: string(), value: number(), max: number() }),
      equipment: list({ name: string(), quantity: number(1), encumbrance: number(), notes: string() }),
      armor: list({ location: string(), name: string(), protection: number(), bulk: number(), notes: string() }),
      supply: entry({ gear: string(), ammo: string(), rations: string(), medical: string() }),
      encumbranceMax: number(), fraying: number(), trueName: string(), threads: string()
    };
  }
}
class TalentData extends foundry.abstract.TypeDataModel {
  static defineSchema() { return { source: string(), effect: string(), requirements: string() }; }
}
class WeaponData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return { attack: string(), parry: string(), reach: string(), damage: string(), clash: string(), counterstrike: string(), disruption: string(), threat: string(), encumbrance: number(), range: string(), notes: string() };
  }
}
const HandlebarsSheet = foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.sheets.ActorSheetV2);
class CharacterSheet extends HandlebarsSheet {
  static DEFAULT_OPTIONS = {
    classes: ["tbe", "character-sheet"], tag: "form", position: { width: 850, height: 760 },
    window: { resizable: true }, form: { submitOnChange: true, closeOnSubmit: false },
    dragDrop: [{ dropSelector: ".tbe-sheet-body" }]
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
    return context;
  }
  _onRender(context, options) {
    super._onRender(context, options);
    this.element.querySelectorAll("[data-add]").forEach(button => button.addEventListener("click", async event => {
      event.preventDefault();
      const collection = button.dataset.add;
      if (collection === "talent" || collection === "weapon") {
        await this.actor.createEmbeddedDocuments("Item", [{ name: collection === "talent" ? "New Talent" : "New Weapon", type: collection }]);
      } else {
        const defaults = { customSkills: { name: "", category: "Other", value: 0, expertise: 0, savvy: false }, resources: { name: "", value: 0, max: 0 }, abilityScores: { name: "", descriptor: "" }, racialTraits: { name: "", effect: "" }, personalityTraits: { name: "", description: "" }, goals: { text: "", shared: false }, sharedHistories: { character: "", event: "", skill: "", story: "" }, relationships: { name: "", type: "", notes: "" }, wounds: { location: "", detail: "", points: 0, lethal: true, ritual: false, infection: false }, equipment: { name: "", quantity: 1, encumbrance: 0, notes: "" }, armor: { location: "", name: "", protection: 0, bulk: 0, notes: "" } };
        await this.actor.update({ [`system.${collection}`]: [...this.actor.system[collection], defaults[collection]] });
      }
    }));
    this.element.querySelectorAll("[data-remove]").forEach(button => button.addEventListener("click", async event => {
      event.preventDefault();
      const [collection, index] = button.dataset.remove.split(":");
      await this.actor.update({ [`system.${collection}`]: this.actor.system[collection].filter((_, i) => i !== Number(index)) });
    }));
    this.element.querySelectorAll("[data-delete-item]").forEach(button => button.addEventListener("click", async event => {
      event.preventDefault(); await this.actor.deleteEmbeddedDocuments("Item", [button.dataset.deleteItem]);
    }));
    this.element.querySelectorAll("[data-open-item]").forEach(button => button.addEventListener("click", event => {
      event.preventDefault(); this.actor.items.get(button.dataset.openItem)?.sheet.render(true);
    }));
  }
  async _onDrop(event) {
    const data = foundry.applications.ux.TextEditor.getDragEventData(event);
    if (data.type !== "Item" || !this.actor.isOwner) return;
    const item = await Item.implementation.fromDropData(data);
    if (item && ["talent", "weapon"].includes(item.type)) {
      await this.actor.createEmbeddedDocuments("Item", [item.toObject()]);
    }
  }
}
const ItemSheet = foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.sheets.ItemSheetV2);
class TBEItemSheet extends ItemSheet {
  static DEFAULT_OPTIONS = { classes: ["tbe", "item-sheet"], tag: "form", position: { width: 540, height: 460 }, window: { resizable: true }, form: { submitOnChange: true, closeOnSubmit: false } };
  static PARTS = { main: { template: "systems/broken-empires-foundry/templates/item.hbs" } };
  async _prepareContext(options) { const context = await super._prepareContext(options); context.system = this.item.system; return context; }
}
Hooks.once("init", () => {
  CONFIG.Actor.dataModels.character = CharacterData;
  CONFIG.Item.dataModels.talent = TalentData;
  CONFIG.Item.dataModels.weapon = WeaponData;
  foundry.documents.collections.Actors.registerSheet("broken-empires-foundry", CharacterSheet, { types: ["character"], makeDefault: true, label: "TBE Character" });
  foundry.documents.collections.Items.registerSheet("broken-empires-foundry", TBEItemSheet, { types: ["talent", "weapon"], makeDefault: true, label: "TBE Item" });
});

// Preserve the three values entered on the 0.1.x test sheet when opening an old world.
Hooks.once("ready", async () => {
  if (!game.user.isGM) return;
  for (const actor of game.actors.filter(a => a.type === "character")) {
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
