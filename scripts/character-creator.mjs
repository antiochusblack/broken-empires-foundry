// An in-memory draft: changing steps keeps choices, closing the window discards them.
import { SKILL_DESCRIPTIONS } from "./skill-descriptions.mjs";
const SYSTEM = "broken-empires-foundry";
const html = value => foundry.utils.escapeHTML(String(value ?? ""));
const slug = name => String(name).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/_$/, "");
const GROUPS = {
  Combat: ["Dodge", "Melee: Light", "Melee: Medium", "Melee: Heavy", "Might", "Missile", "Thrown Weapons"],
  Adventuring: ["Athletics", "Endurance", "Locks & Traps", "Perception", "Ride", "Sail/Boat", "Sleight of Hand", "Stealth", "Survival", "Track", "Willpower"],
  Social: ["Deceive", "Insight", "Inspire", "Intimidate", "Perform", "Persuade", "Protocol", "Seduce", "Wit"],
  Lore: ["Ancient Lore", "Arcana", "Commerce", "Common Lore", "Craft: Practical", "Craft: Artistic", "Divinity", "Heal", "Naturewise", "Streetwise"],
  Binds: ["Change", "Conjure", "Control", "Destroy", "Witness"],
  Strands: ["Air", "Beasts", "Body", "Earth", "Fire", "Plants", "Spheres", "Spirit", "Thought", "Water"]
};
const ABILITIES = {
  Strength: { skills: ["Melee: Medium", "Melee: Heavy", "Thrown Weapons", "Athletics", "Sail/Boat", "Intimidate"], talents: ["POWERFUL BLOW", "SWEEPING ATTACK", "STRONG BACK"] },
  Dexterity: { skills: ["Dodge", "Melee: Light", "Missile", "Ride", "Sleight of Hand", "Stealth"], talents: ["COMBAT AWARENESS", "QUICK AND QUIET", "QUICKDRAW"] },
  Constitution: { skills: ["Might", "Endurance", "Survival", "Track", "Craft: Practical"], talents: ["ENDURING WATCH", "NOT TODAY, DEATH", "METTLE"] },
  Intelligence: { skills: ["Locks & Traps", "Protocol", "Wit", "Ancient Lore", "Arcana", "Commerce", "Common Lore"], talents: ["TACTICIAN", "TRAVEL PLANNER", "INNER STRENGTH"] },
  Wisdom: { skills: ["Perception", "Willpower", "Insight", "Craft: Artistic", "Divinity", "Heal", "Naturewise"], talents: ["COMBAT AWARENESS", "FEARLESS", "I SEE YOUR MIND"] },
  Charisma: { skills: ["Deceive", "Inspire", "Perform", "Persuade", "Seduce", "Streetwise"], talents: ["FEINT", "PRESS THE POINT", "ALLOW ME TO INTRODUCE…"] }
};
const RACES = ["Human", "Half-Orc (Uthrak)", "Dwarf", "Ogre", "Bolg Fiir", "The Replaced"];
const CULTURES = ["Civilized, Urban", "Civilized, Rural", "Barbarian", "Wanderer"];
const CAREERS = {
  Warrior: [80, 50, 40, 30, 0], Rogue: [50, 70, 50, 30, 0], Ranger: [50, 80, 30, 40, 0],
  Speaker: [20, 40, 80, 60, 0], Bard: [30, 50, 70, 50, 0], Civilian: [50, 50, 50, 50, 0],
  Loremaster: [20, 50, 50, 80, 0], Merchant: [20, 60, 60, 60, 0], Godbound: [30, 40, 50, 60, 20],
  Spellweaver: [20, 20, 20, 40, 100]
};
const STEPS = ["Concept & starting skills", "Race", "Ability scores", "Attributes", "Culture", "Life events", "Previous career", "Rounding out", "Equipment", "Personality", "Goals", "Status & review"];
const CATEGORIES = ["Combat", "Adventuring", "Social", "Lore", "Binds"];
const choices = (names, selected, blank = "Choose…") => `<option value="">${html(blank)}</option>${names.map(name => `<option value="${html(name)}" ${name === selected ? "selected" : ""}>${html(name)}</option>`).join("")}`;
const talentDescription = name => {
  const entry = game.packs.get("world.tbe-talents")?.index?.contents?.find(item => item.name === name);
  return [entry?.system?.effect, entry?.system?.requirements && `Requirements: ${entry.system.requirements}`].filter(Boolean).join("\n") || "No description available.";
};
const choiceType = path => /(?:talent|Talents)/i.test(path) ? "talent" : /^(?:starting|raceSavvy|raceExpertise|bolgSavvy|abilities\.\d+\.expertise|cultureExpertise|cultureSelections|events\.\d+\.skill|sharedHistories\.\d+\.skill|savvy|oldExpertise|focusBinds|focusStrands|thin|bindExpertise|bolgBind)/.test(path) ? "skill" : "";
const choiceDescription = (name, type) => type === "talent" ? talentDescription(name) : SKILL_DESCRIPTIONS[name] || "No description available.";
const info = description => `<span class="tbe-creator-info" role="img" aria-label="${html(description)}" title="${html(description)}">i</span>`;
const select = (path, names, value, blank) => {
  const type = choiceType(path);
  const description = type ? value ? choiceDescription(value, type) : "Choose an option to see its description." : "";
  return `<select data-field="${html(path)}" ${type ? `data-choice-type="${type}" title="${html(description)}"` : ""}>${choices(names, value, blank)}</select>${type ? info(description) : ""}`;
};
const input = (path, value, type = "text", extra = "") => `<input data-field="${html(path)}" type="${type}" value="${html(value)}" ${extra}>`;
const area = (path, value, rows = 3) => `<textarea data-field="${html(path)}" rows="${rows}">${html(value)}</textarea>`;
const label = (name, content) => `<label>${html(name)} ${content}</label>`;
const num = (path, value, max = 100) => input(path, value ?? 0, "number", `min="0" max="${max}" step="1"`);
const flattened = Object.fromEntries(Object.entries(GROUPS).flatMap(([category, names]) => names.map(name => [name, category])));
const allSkills = [...CATEGORIES.flatMap(c => GROUPS[c]), "Piety"];

function fresh() {
  return {
    name: "", concept: "", starting: {}, race: "", region: "", language: "", sex: "", size: "Medium", raceSavvy: "", raceExpertise: "", raceTalent: "", bolgSavvy: "", bolgBind: "",
    abilities: [{ name: "", descriptor: "", expertise: "", talent: "" }, { name: "", descriptor: "", expertise: "", talent: "" }],
    attributes: { Resolve: 0, Initiative: 0, Toughness: 0, "Death Threshold": 0 }, initiativeBase: 10, dtBase: 20, randomizedAttributes: { initiative: false, dt: false },
    culture: "", cultureSelections: [], cultureExpertise: ["", ""], cultureCoin: 0, wandererLanguage: "", rolled: { cultureCoin: false, careerCoin: false, equipmentCoin: false, freeArmor: false },
    events: Array.from({ length: 3 }, () => ({ table: "", name: "", text: "", skill: "", points: 0, strand: "", strandLevels: 0, customName: "", customPoints: 0, status: 0, story: "" })),
    sharedHistories: [{ character: "", event: "", skill: "", story: "" }, { character: "", event: "", skill: "", story: "" }],
    career: "", careerSkills: {}, careerCoin: 0, careerWise: ["", "", ""], careerTalents: ["", ""], swapCareerTalent: "None",
    focusBinds: ["", ""], focusStrands: ["", "", "", ""], thin: ["", ""], strandCareer: {}, strandExtra: {}, thread: "", bindExpertise: "", trueName: "", duplicateTalentReward: "Silver",
    age: "Adult", roundingSkills: {}, roundingStrands: {}, civilianExtra: {}, savvy: ["", "", ""], roundingChoice: "Talent", roundingTalent: "", oldExpertise: "", oldLore: {},
    equipmentCoin: 0, freeArmorCount: 2, gear: [], freeArmor: [], personality: ["", "", ""], goals: ["", ""], status: 0
  };
}

function setPath(object, path, value) {
  const parts = path.split("."), last = parts.pop();
  const parent = parts.reduce((node, part) => node[part] ??= {}, object);
  parent[last] = value;
}
function raceForRoll(n) { return n <= 70 ? RACES[0] : n <= 80 ? RACES[1] : n <= 90 ? RACES[2] : n <= 95 ? RACES[3] : n <= 99 ? RACES[4] : RACES[5]; }
function careerForRoll(n) { return Object.keys(CAREERS)[n - 1]; }
function cultureForRoll(n) { return n <= 3 ? CULTURES[0] : n <= 6 ? CULTURES[1] : n <= 8 ? CULTURES[2] : CULTURES[3]; }
const raceModifiers = { Dwarf: { Endurance: 10, Inspire: -10 }, "Half-Orc (Uthrak)": { Willpower: -10 }, Ogre: { Might: 10, Stealth: -20, Athletics: -20, "Melee: Light": -20 }, "Bolg Fiir": { Stealth: -10, Insight: -10 } };
const coinFormula = { Warrior: [1, 6, 5], Rogue: [1, 6, 5], Ranger: [1, 6, 5], Speaker: [2, 4, 10], Bard: [1, 6, 5], Civilian: [2, 6, 10], Loremaster: [2, 4, 10], Merchant: [3, 6, 10], Godbound: [1, 6, 10], Spellweaver: [1, 6, 5] };
const careerRequirements = {
  Warrior: [["ARMOR TRAINING (I-IV)"], []], Rogue: [[], []], Ranger: [["ON THROUGH THE NIGHT", "ARMOR TRAINING (I-IV)"], []],
  Speaker: [[], []], Bard: [["ENTERTAINING"], []], Civilian: [["EXPERIENCED"], []],
  Loremaster: [["LITERATE"], ["LECTURER", "TRAVEL PLANNER"]], Merchant: [["LITERATE"], ["BARTERER", "I SEE YOUR MIND"]],
  Godbound: [["GODBOUND"], []], Spellweaver: [["PATTERNED IN THE WEAVE"], ["LITERATE"]]
};
function careerTalentCategories(career, slot) {
  if (career === "Warrior") return slot === 0 ? [] : ["Combat Talents"];
  if (career === "Rogue") return ["Combat Talents", "Adventuring Talents", "Social Talents"];
  if (career === "Ranger") return slot === 0 ? [] : ["Combat Talents", "Adventuring Talents"];
  if (career === "Speaker" || career === "Bard") return ["Social Talents"];
  if (career === "Civilian") return slot === 0 ? [] : ["Adventuring Talents", "Social Talents", "Lore Talents"];
  if (career === "Godbound") return slot === 0 ? [] : ["Lore Talents"];
  return [];
}
const cultureCoinFormula = { "Civilized, Urban": [1, 6, 10], "Civilized, Rural": [1, 4, 10], Barbarian: [1, 4, 5], Wanderer: [1, 6, 5] };
const fixedCultureExpertise = { "Civilized, Rural": "Naturewise", Barbarian: "Survival", Wanderer: "Common Lore" };
const culturePlan = {
  "Civilized, Urban": { fixed: { "Common Lore": 20, Perception: 10, Commerce: 10, Heal: 10, Streetwise: 10 }, choices: [[20, GROUPS.Social], [10, GROUPS.Combat], [10, GROUPS.Combat], ...Array.from({ length: 4 }, () => [10, GROUPS.Social]), [10, ["Arcana", "Divinity"]], [10, ["Craft: Practical", "Craft: Artistic"]]] },
  "Civilized, Rural": { fixed: { "Common Lore": 20, "Craft: Practical": 20, Athletics: 10, Endurance: 10, Perception: 10, Survival: 10, Heal: 10, Naturewise: 10 }, choices: [[10, GROUPS.Combat], [10, GROUPS.Combat], [10, ["Ride", "Sail/Boat"]], [10, GROUPS.Social], [10, GROUPS.Social], [10, ["Arcana", "Divinity"]]] },
  Barbarian: { fixed: { "Common Lore": 20, Survival: 20, Athletics: 10, Endurance: 10, Perception: 10, Stealth: 10, Track: 10, Divinity: 10, Heal: 10, Naturewise: 10 }, choices: [[10, GROUPS.Combat], [10, GROUPS.Combat], [10, ["Ride", "Sail/Boat"]], [10, GROUPS.Social]] },
  Wanderer: { fixed: { Naturewise: 20, Athletics: 10, Endurance: 10, Perception: 10, Survival: 10, Track: 10, "Common Lore": 10, "Craft: Practical": 10, Divinity: 10, Heal: 10 }, choices: [[20, ["Ride", "Sail/Boat"]], [10, GROUPS.Combat], [10, GROUPS.Combat], [10, GROUPS.Social]] }
};
function cultureBonuses(d) {
  const plan = culturePlan[d.culture]; if (!plan) return {};
  const result = { ...plan.fixed };
  plan.choices.forEach(([amount], index) => { const name = d.cultureSelections[index]; if (name) result[name] = (result[name] || 0) + amount; });
  return result;
}
function collectCustomSkills(entries) {
  const result = new Map();
  for (const entry of entries) {
    if (!entry.name?.trim()) continue;
    const name = entry.name.trim(), key = name.toLocaleLowerCase();
    const previous = result.get(key);
    if (previous) previous.value = Math.min(70, previous.value + entry.value);
    else result.set(key, { name, category: "Languages, custom -wise and other skills", value: entry.value });
  }
  return [...result.values()];
}

const App = foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2);
export class CharacterCreator extends App {
  constructor(actor, options = {}) { super(options); this.actor = actor; this.draft = fresh(); this.step = 0; this._busy = false; }
  static DEFAULT_OPTIONS = { classes: ["tbe", "tbe-creator"], position: { width: 890, height: 740 }, window: { resizable: true, title: "Create a character" } };
  static PARTS = { main: { template: `systems/${SYSTEM}/templates/character-creator.hbs` } };
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    await Promise.all(["tbe-talents", "tbe-threads", "tbe-equipment"].map(name => game.packs.get(`world.${name}`)?.getIndex({ fields: ["type", "system.price", "system.category", "system.effect", "system.requirements"] })));
    return { ...context, title: STEPS[this.step], step: this.step + 1, count: STEPS.length, body: this._body(), guidance: this._guidance(), first: this.step === 0, last: this.step === STEPS.length - 1 };
  }
  _onRender(context, options) {
    super._onRender(context, options);
    this.element.querySelectorAll("[data-field]").forEach(field => field.addEventListener("change", () => {
      const value = field.type === "number" ? (Number(field.value) || 0) : field.type === "checkbox" ? field.checked : field.value;
      const previousCareer = this.draft.career;
      setPath(this.draft, field.dataset.field, value);
      if (field.dataset.choiceType) {
        const description = value ? choiceDescription(value, field.dataset.choiceType) : "Choose an option to see its description.";
        field.title = description;
        const icon = field.nextElementSibling;
        if (icon?.classList.contains("tbe-creator-info")) { icon.title = description; icon.setAttribute("aria-label", description); }
      }
      if (field.dataset.field === "career" && previousCareer !== value && careerRequirements[value]) { this.draft.careerSkills = {}; this.draft.strandCareer = {}; this.draft.strandExtra = {}; this.draft.careerTalents = careerRequirements[value].map(names => names.length === 1 ? names[0] : ""); this.draft.rolled.careerCoin = false; }
      if (field.dataset.field === "culture") { this.draft.cultureSelections = []; this.draft.cultureExpertise = [fixedCultureExpertise[value] || "", ""]; this.draft.rolled.cultureCoin = false; }
      if (["race", "culture", "career", "age"].includes(field.dataset.field) || field.dataset.field.startsWith("abilities.") && field.dataset.field.endsWith(".name")) void this.render();
    }));
    this.element.querySelectorAll("[data-bucket][data-skill]").forEach(field => field.addEventListener("change", () => {
      this.draft[field.dataset.bucket][field.dataset.skill] = Number(field.value) || 0;
    }));
    this.element.querySelector("[data-back]")?.addEventListener("click", () => { this.step--; void this.render(); });
    this.element.querySelector("[data-next]")?.addEventListener("click", async () => {
      try { this._validateStep(); this.step++; await this.render(); }
      catch (error) { ui.notifications.warn(error.message); }
    });
    this.element.querySelector("[data-finish]")?.addEventListener("click", () => void this._finish());
    this.element.querySelectorAll("[data-roll-choice]").forEach(button => button.addEventListener("click", () => void this._rollChoice(button.dataset.rollChoice)));
    this.element.querySelectorAll("[data-attribute]").forEach(button => button.addEventListener("click", () => this._adjustAttribute(button.dataset.attribute, Number(button.dataset.direction))));
    this.element.querySelectorAll("[data-roll-event]").forEach(button => button.addEventListener("click", () => void this._rollEvent(Number(button.dataset.rollEvent))));
    this.element.querySelectorAll("[data-pick-event]").forEach(button => button.addEventListener("click", () => void this._pickEvent(Number(button.dataset.pickEvent))));
    this.element.querySelectorAll("[data-gear]").forEach(input => input.addEventListener("change", () => {
      const list = input.dataset.free ? this.draft.freeArmor : this.draft.gear;
      if (input.checked) list.push(input.dataset.gear); else list.splice(list.indexOf(input.dataset.gear), 1);
      void this.render();
    }));
  }
  _adjustAttribute(name, direction) {
    if (!["Resolve", "Initiative", "Toughness", "Death Threshold"].includes(name) || ![-1, 1].includes(direction)) return;
    if (name === "Initiative" && this.draft.randomizedAttributes.initiative || name === "Death Threshold" && this.draft.randomizedAttributes.dt) return;
    const cost = name === "Toughness" ? 2 : 1;
    const spent = Object.values(this.draft.attributes).reduce((sum, n) => sum + n, 0);
    if (direction > 0 && spent + cost > 5 || direction < 0 && this.draft.attributes[name] < cost) return;
    this.draft.attributes[name] += direction * cost;
    void this.render();
  }
  async _rollChoice(key) {
    if (["initiative", "dt"].includes(key)) {
      if (this.draft.randomizedAttributes[key]) return;
      const accepted = await foundry.applications.api.DialogV2.confirm({
        window: { title: `Commit to random ${key === "dt" ? "DT" : "Initiative"}?` },
        content: `<p>This roll is final for this character. If you do not accept the result, you must abandon this character draft and start again.</p><p>Any points already spent on ${key === "dt" ? "DT" : "Initiative"} will return to the five-point pool, and its +/− buttons will be locked.</p>`,
        yes: { label: "Roll and commit" }, no: { label: "Keep standard value" }
      });
      if (!accepted) return;
    }
    const formula = {
      race: "1d100", culture: "1d10", career: "1d10", abilities: "2d6", initiative: "1d6+6", dt: "2d4+15",
      cultureCoin: this.draft.culture ? `${cultureCoinFormula[this.draft.culture][0]}d${cultureCoinFormula[this.draft.culture][1]}*${cultureCoinFormula[this.draft.culture][2]}` : null,
      careerCoin: this.draft.career ? `${coinFormula[this.draft.career][0]}d${coinFormula[this.draft.career][1]}*${coinFormula[this.draft.career][2]}` : null,
      equipmentCoin: "2d4*50", freeArmor: "1d3+1"
    }[key];
    if (!formula) { ui.notifications.warn("Choose a culture or career before rolling its coin."); return; }
    try {
      const roll = await new Roll(formula).evaluate();
      await roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor: this.actor }), flavor: `Character creation: ${key}` });
      const n = roll.total, d = this.draft;
      if (key === "race") d.race = raceForRoll(n);
      if (key === "culture") { d.culture = cultureForRoll(n); d.cultureSelections = []; d.cultureExpertise = [fixedCultureExpertise[d.culture] || "", ""]; d.rolled.cultureCoin = false; }
      if (key === "career") { const next = careerForRoll(n); if (d.career !== next) { d.careerSkills = {}; d.strandCareer = {}; d.strandExtra = {}; d.careerTalents = careerRequirements[next].map(names => names.length === 1 ? names[0] : ""); d.rolled.careerCoin = false; } d.career = next; }
      if (key === "abilities") roll.dice[0].results.forEach((result, i) => { d.abilities[i].name = Object.keys(ABILITIES)[result.result - 1]; });
      if (key === "initiative") { d.initiativeBase = n; d.attributes.Initiative = 0; d.randomizedAttributes.initiative = true; }
      if (key === "dt") { d.dtBase = n; d.attributes["Death Threshold"] = 0; d.randomizedAttributes.dt = true; }
      if (key === "cultureCoin") d.cultureCoin = n;
      if (key === "careerCoin") d.careerCoin = n;
      if (key === "equipmentCoin") d.equipmentCoin = n;
      if (key === "freeArmor") d.freeArmorCount = n;
      if (Object.hasOwn(d.rolled, key)) d.rolled[key] = true;
      await this.render();
    } catch (error) { console.error("TBE character creation roll", error); ui.notifications.error(`Could not roll ${key}.`); }
  }
  _rowFields(group, bucket, budget = null, strand = false) {
    const rows = GROUPS[group].map(name => {
      const value = this.draft[bucket]?.[name] || 0;
      return `<label class="tbe-creator-skill"><span>${html(name)} ${info(SKILL_DESCRIPTIONS[name] || "No description available.")}</span><input type="number" min="0" max="${strand ? 5 : 100}" value="${value}" data-bucket="${html(bucket)}" data-skill="${html(name)}"></label>`;
    }).join("");
    const spent = GROUPS[group].reduce((n, name) => n + (Number(this.draft[bucket]?.[name]) || 0), 0);
    return `<fieldset><legend>${html(group)}${budget === null ? "" : ` — ${html(budget)}; spent ${spent}`}</legend><div class="tbe-creator-skills">${rows}</div></fieldset>`;
  }
  _guidance() {
    const d = this.draft;
    const notes = [
      ["Pick the skills that best express your concept. The four starting choices each begin at 30%; other ordinary skills begin at 20%.", "Hover over the information icons to see what a skill covers."],
      ["Race adds traits and bonuses when you finish. Human and Replaced characters have additional choices in this step.", "Your region and language give the character a place in the world; you can add more detail to the story later."],
      ["Each of your two abilities adds +5 to its linked skills, even if both abilities affect the same skill.", "Expertise and Talent are separate picks for each ability. A descriptor is a short personality phrase you can use during play."],
      ["The pool must reach zero before you continue. Toughness takes two points to gain +1; the other attributes take one point per increase.", "Lethality Level comes from your final DT, rounded up after dividing by three. Random Initiative or DT locks that attribute for this draft."],
      ["Cultural skill bonuses add to those from earlier steps. You can pick the same skill at different stages, but each separate cultural choice must be distinct.", "Expertise increases the chosen skill's Expertise level; choosing an existing Expertise skill improves it further. Roll cultural silver before continuing."],
      ["Resolve Origin, Youth and Recent separately. The event text goes into your history; record any skill, Strand or status benefit in the matching fields.", "Shared histories are optional. If you add them, use different characters and different skills for the two connections."],
      ["Spend each career category's points in that category; the fieldset headings show its budget and how much you have spent.", "Pick both career Talents and roll career silver. Your career may also grant custom skills, magic choices or other benefits."],
      ["Rounding Out lets you shape the character beyond their career. Young characters spend 70 points; Adults and Old characters spend 100.", "Strand levels cost five rounding points each. Pick three different Savvy skills and your bonus choice before continuing."],
      ["Roll starting silver and the number of free armour pieces, then select exactly that many free pieces.", "A dagger is included automatically. Purchased gear is added at Finish; you can edit quantities and locations on the sheet afterward."],
      ["Choose personality phrases you would enjoy bringing into scenes. Ability descriptors from the earlier step are included too.", "These are prompts for roleplaying; you can refine the wording on the finished sheet."],
      ["Give the character goals that can lead to adventures or difficult choices.", "Short, concrete aims are enough. You can change them as the story develops."],
      ["Check the character's name, background and choices before finishing. The wizard validates the complete draft.", "Finish fills the sheet and adds the chosen Items. Closing the wizard before Finish discards this draft."]
    ][this.step];
    if (this.step === 4 && d.race === "Ogre") notes[1] = "Ogres cannot select either Civilized culture.";
    if (this.step === 4 && d.race === "Bolg Fiir") notes[1] = "Bolg Fiir cannot select Civilized, Urban.";
    if (this.step === 6 && d.career === "Spellweaver") notes[1] = "Spellweavers choose two focus Binds, four focus Strands and two distinct Thin Strands. Thin Strands cannot be developed during creation.";
    if (this.step === 6 && d.career === "Godbound") notes[1] = "Godbound spend their Magic career points on Piety. Pick both career Talents and roll career silver.";
    return `<aside class="tbe-creator-guidance" aria-label="Guidance for this step"><strong>At this step</strong><ul>${notes.map(note => `<li>${html(note)}</li>`).join("")}</ul></aside>`;
  }
  _body() {
    const d = this.draft, talentEntries = game.packs.get("world.tbe-talents")?.index?.contents ?? [], talentNames = talentEntries.map(e => e.name).sort();
    switch (this.step) {
      case 0: return `<p>Choose one starting skill at 30% in each category. All other ordinary skills start at 20%.</p><div class="tbe-creator-grid">${label("Name", input("name", d.name))}<label class="tbe-creator-concept">Concept ${area("concept", d.concept, 3)}</label>${CATEGORIES.slice(0, 4).map(c => label(`${c} at 30%`, select(`starting.${c}`, GROUPS[c], d.starting[c]))).join("")}</div>`;
      case 1: return `<p>Choose a race, or roll d100. Fixed racial traits and bonuses are applied at Finish.</p><div class="tbe-creator-grid">${label("Race", select("race", RACES, d.race))}<button type="button" data-roll-choice="race">Roll race (d100)</button>${label("Region / homeland", input("region", d.region))}${label("Regional language", input("language", d.language))}${label("Sex / gender", input("sex", d.sex))}${["Human", "The Replaced"].includes(d.race) ? `${label("Racial Savvy skill", select("raceSavvy", allSkills.filter(n => n !== "Piety"), d.raceSavvy))}${label("Racial Expertise skill", select("raceExpertise", allSkills.filter(n => n !== "Piety"), d.raceExpertise))}${label("Racial Talent", select("raceTalent", talentNames, d.raceTalent))}` : ""}${d.race === "Bolg Fiir" ? label("Bolg bonus Savvy", select("bolgSavvy", ["Melee: Light", "Missile", "Ancient Lore", "Arcana", "Naturewise"], d.bolgSavvy)) : ""}</div>`;
      case 2: return `<p>Choose two abilities (or roll 1d6 twice). Each adds +5 to its linked skills; select an Expertise skill, a Talent, and a descriptor for each.</p><button type="button" data-roll-choice="abilities">Roll both abilities</button>${d.abilities.map((a, i) => `<fieldset><legend>Ability ${i + 1}</legend><div class="tbe-creator-grid">${label("Ability", select(`abilities.${i}.name`, Object.keys(ABILITIES), a.name))}${label("Descriptor", input(`abilities.${i}.descriptor`, a.descriptor))}${label("Expertise", select(`abilities.${i}.expertise`, ABILITIES[a.name]?.skills ?? [], a.expertise))}${label("Talent", select(`abilities.${i}.talent`, ABILITIES[a.name]?.talents ?? [], a.talent))}</div></fieldset>`).join("")}`;
      case 3: {
        const remaining = 5 - Object.values(d.attributes).reduce((sum, points) => sum + points, 0);
        const rows = [
          ["Resolve", 10 + 2 * d.attributes.Resolve, "+2 maximum Resolve per point"],
          ["Toughness", d.attributes.Toughness / 2, "+1 Toughness per two points"],
          ["Initiative", d.initiativeBase + d.attributes.Initiative, "+1 Initiative per point"],
          ["Death Threshold", d.dtBase + 2 * d.attributes["Death Threshold"], "+2 DT per point"]
        ];
        return `<p>Spend five Attribute points. Toughness costs two points per increase.</p><p class="tbe-creator-pool" aria-live="polite">Points remaining: <strong>${remaining} / 5</strong></p><div class="tbe-creator-attributes">${rows.map(([name, total, hint]) => {
          const locked = name === "Initiative" && d.randomizedAttributes.initiative || name === "Death Threshold" && d.randomizedAttributes.dt;
          const cost = name === "Toughness" ? 2 : 1;
          const spent = d.attributes[name];
          const roll = name === "Initiative" ? `<button type="button" data-roll-choice="initiative" ${locked ? "disabled" : ""}>${locked ? "Random Initiative rolled (locked)" : "Roll random Initiative (6 + d6)"}</button>` : name === "Death Threshold" ? `<button type="button" data-roll-choice="dt" ${locked ? "disabled" : ""}>${locked ? "Random DT rolled (locked)" : "Roll random DT (15 + 2d4)"}</button>` : "";
          return `<div class="tbe-creator-attribute"><div class="tbe-creator-attribute-row"><label for="attribute-${slug(name)}">${html(name)}</label><button type="button" data-attribute="${html(name)}" data-direction="-1" aria-label="Remove ${html(name)} points" ${locked || spent < cost ? "disabled" : ""}>−</button><span class="tbe-creator-attribute-spent" title="Attribute points spent">${spent} pt${spent === 1 ? "" : "s"}</span><button type="button" data-attribute="${html(name)}" data-direction="1" aria-label="Add ${html(name)} points" ${locked || remaining < cost ? "disabled" : ""}>+</button><input id="attribute-${slug(name)}" type="number" aria-label="${html(name)} total" value="${total}" readonly></div><small>${hint}</small>${roll}</div>`;
        }).join("")}</div><p class="tbe-creator-roll-warning">Random Initiative and DT rolls are final for this draft. If you do not accept a result, you must abandon the character and start again.</p>`;
      }
      case 4: {
        const plan = culturePlan[d.culture];
        return `<p>Choose or roll your culture, then make its skill selections. Fixed bonuses are applied automatically.</p><div class="tbe-creator-grid">${label("Culture", select("culture", CULTURES, d.culture))}<button type="button" data-roll-choice="culture">Roll culture (d10)</button>${label("Culture silver (sp)", input("cultureCoin", d.cultureCoin, "number", "readonly"))}<button type="button" data-roll-choice="cultureCoin">Roll culture coin</button>${[0, 1].map(i => label(`Culture Expertise ${i + 1}`, select(`cultureExpertise.${i}`, fixedCultureExpertise[d.culture] && i === 0 ? [fixedCultureExpertise[d.culture]] : d.culture === "Civilized, Urban" ? (i === 0 ? GROUPS.Adventuring : GROUPS.Lore) : [...GROUPS.Adventuring, ...GROUPS.Lore], d.cultureExpertise[i]))).join("")}${d.culture === "Wanderer" ? label("Additional Language at 40", input("wandererLanguage", d.wandererLanguage)) : ""}</div>${plan ? `<p>Fixed bonuses: ${Object.entries(plan.fixed).map(([n, v]) => `${html(n)} +${v}`).join(", ")}.</p><div class="tbe-creator-grid">${plan.choices.map(([amount, names], i) => label(`+${amount} choice ${i + 1}`, select(`cultureSelections.${i}`, names, d.cultureSelections[i]))).join("")}</div>` : ""}`;
      }
      case 5: return `<p>Choose a result from each imported Life Event table or roll it. Read the result, then enter the benefit that applies. The event text stays in the character history.</p>${d.events.map((e, i) => `<fieldset><legend>${["Origin", "Youth", "Recent"][i]}</legend><div class="tbe-creator-grid"><button type="button" data-roll-event="${i}">Roll table</button><button type="button" data-pick-event="${i}">Choose result</button>${label("Event", input(`events.${i}.name`, e.name))}${label("Benefit skill", select(`events.${i}.skill`, allSkills, e.skill))}${label("Skill points", num(`events.${i}.points`, e.points, 100))}${label("New -wise / Language", input(`events.${i}.customName`, e.customName))}${label("Custom skill value", num(`events.${i}.customPoints`, e.customPoints, 100))}${label("Strand", select(`events.${i}.strand`, GROUPS.Strands, e.strand))}${label("Strand levels", num(`events.${i}.strandLevels`, e.strandLevels, 5))}${label("Status change", input(`events.${i}.status`, e.status, "number", 'step="1"'))}</div>${label("Result text", area(`events.${i}.text`, e.text, 2))}${label("Your story", area(`events.${i}.story`, e.story, 2))}</fieldset>`).join("")}<fieldset><legend>Optional shared histories (up to two)</legend>${d.sharedHistories.map((h, i) => `<div class="tbe-creator-grid">${label(`Character ${i + 1}`, input(`sharedHistories.${i}.character`, h.character))}${label("Life Event", input(`sharedHistories.${i}.event`, h.event))}${label("Skill +5", select(`sharedHistories.${i}.skill`, allSkills, h.skill))}${label("What happened", input(`sharedHistories.${i}.story`, h.story))}</div>`).join("")}</fieldset>`;
      case 6: {
        const pool = CAREERS[d.career] ?? [0, 0, 0, 0, 0];
        return `<p>Choose or roll a previous career. Spend each category's pool in that category; record career Talents and custom -wises or Languages. Spellweavers also choose magical focus and Strand levels.</p><div class="tbe-creator-grid">${label("Career", select("career", Object.keys(CAREERS), d.career))}<button type="button" data-roll-choice="career">Roll career (d10)</button>${label("Career silver (sp)", input("careerCoin", d.careerCoin, "number", "readonly"))}<button type="button" data-roll-choice="careerCoin">Roll career coin</button>${d.careerWise.slice(0, d.career === "Loremaster" ? 3 : d.career === "Bard" ? 2 : 1).map((v, i) => label(`Custom -wise / Language ${i + 1}`, input(`careerWise.${i}`, v))).join("")}${d.careerTalents.map((v, i) => label(`Career Talent ${i + 1}`, select(`careerTalents.${i}`, careerRequirements[d.career]?.[i]?.length ? careerRequirements[d.career][i] : careerTalentCategories(d.career, i).length ? talentEntries.filter(e => careerTalentCategories(d.career, i).includes(e.system?.category)).map(e => e.name).sort() : talentNames, v))).join("")}${label("Swap one career Talent for +2 Status", select("swapCareerTalent", ["None", "First", "Second"], d.swapCareerTalent))}</div>${CATEGORIES.map((c, i) => this._rowFields(c, "careerSkills", pool[i])).join("")}${d.career === "Godbound" ? label("Piety career points (20)", num("careerSkills.Piety", d.careerSkills.Piety, 20)) : ""}${d.career === "Spellweaver" ? `<fieldset><legend>Spellweaver focus</legend><div class="tbe-creator-grid">${d.focusBinds.map((v, i) => label(`Focus Bind ${i + 1} (+10)`, select(`focusBinds.${i}`, GROUPS.Binds, v))).join("")}${d.focusStrands.map((v, i) => label(`Focus Strand ${i + 1}`, select(`focusStrands.${i}`, GROUPS.Strands, v))).join("")}${d.thin.map((v, i) => label(`Thin Strand ${i + 1}`, select(`thin.${i}`, GROUPS.Strands, v))).join("")}${label("Bind Expertise", select("bindExpertise", GROUPS.Binds, d.bindExpertise))}${label("d8 Thread item", select("thread", game.packs.get("world.tbe-threads")?.index?.contents?.map(e => e.name).sort() ?? [], d.thread))}${label("True Name", input("trueName", d.trueName))}${d.race === "Bolg Fiir" ? label("Bolg Bind +10", select("bolgBind", GROUPS.Binds, d.bolgBind)) : ""}</div>${this._rowFields("Strands", "strandCareer", "10 focus levels")}${this._rowFields("Strands", "strandExtra", "3 additional levels")}</fieldset>` : ""}`;
      }
      case 7: return `<p>Age, a bonus Talent (or +1 Status or 100 sp), and three Savvy skills. Spend the age pool on skills; Strand levels cost five points each. Young also receive +20 Endurance and +1 DT; Old receive -20 Endurance, -2 DT, and 30 Lore points.</p><div class="tbe-creator-grid">${label("Age", select("age", ["Young", "Adult", "Old"], d.age))}${label("Bonus choice", select("roundingChoice", ["Talent", "Status", "Silver"], d.roundingChoice))}${d.roundingChoice === "Talent" ? label("Bonus Talent", select("roundingTalent", talentNames, d.roundingTalent)) : ""}${d.savvy.map((v, i) => label(`Savvy ${i + 1}`, select(`savvy.${i}`, allSkills, v))).join("")}${d.age === "Old" ? label("Old age Expertise", select("oldExpertise", allSkills, d.oldExpertise)) : ""}</div>${CATEGORIES.map(c => this._rowFields(c, "roundingSkills")).join("")}${d.career === "Godbound" ? label("Piety rounding points", num("roundingSkills.Piety", d.roundingSkills.Piety, 100)) : ""}${d.career === "Spellweaver" ? this._rowFields("Strands", "roundingStrands", "5 points per level") : ""}${d.age === "Old" ? this._rowFields("Lore", "oldLore", "30 Lore points") : ""}${d.career === "Civilian" ? ["Adventuring", "Social", "Lore"].map(c => this._rowFields(c, "civilianExtra", "30 Civilian extra points total")).join("") : ""}`;
      case 8: {
        const equipment = game.packs.get("world.tbe-equipment")?.index?.contents ?? [];
        const gear = equipment.filter(i => ["weapon", "armor", "shield", "gear"].includes(i.type));
        const armor = gear.filter(i => i.type === "armor");
        return `<p>Every character receives a dagger and 1d3+1 eligible armour pieces. Roll starting coin (2d4 × 50 sp), then select purchases. Armour training and fit remain your choice.</p><div class="tbe-creator-grid">${label("Starting coin", input("equipmentCoin", d.equipmentCoin, "number", "readonly"))}<button type="button" data-roll-choice="equipmentCoin">Roll coin</button>${label("Free armour pieces", input("freeArmorCount", d.freeArmorCount, "number", "readonly"))}<button type="button" data-roll-choice="freeArmor">Roll 1d3+1</button></div><fieldset><legend>Free armour (${d.freeArmor.length}/${d.freeArmorCount})</legend><div class="tbe-creator-skills">${armor.map(i => `<label><input type="checkbox" data-gear="${html(i.name)}" data-free="1" ${d.freeArmor.includes(i.name) ? "checked" : ""}>${html(i.name)}</label>`).join("")}</div></fieldset><fieldset><legend>Purchases</legend><div class="tbe-creator-skills">${gear.map(i => `<label><input type="checkbox" data-gear="${html(i.name)}" ${d.gear.includes(i.name) ? "checked" : ""}>${html(i.name)}</label>`).join("")}</div></fieldset><p>Additional purchases and quantities can be adjusted after creation.</p>`;
      }
      case 9: return `<p>Choose personality traits; ability descriptors are included automatically.</p><div class="tbe-creator-grid">${d.personality.map((v, i) => label(`Trait ${i + 1}`, input(`personality.${i}`, v))).join("")}</div>`;
      case 10: return `<p>Give the character reasons to go adventuring. These can be changed during play.</p>${d.goals.map((v, i) => label(`Goal ${i + 1}`, area(`goals.${i}`, v, 2))).join("")}`;
      case 11: return `<p>Review your choices, then Finish to fill the character sheet. The draft is discarded when this window closes.</p><div class="tbe-creator-grid">${label("Optional Status", num("status", d.status, 100))}${label("Duplicate Talent reward", select("duplicateTalentReward", ["Silver", "Status"], d.duplicateTalentReward))}<div><strong>${html(d.name || this.actor.name)}</strong><br>${html(d.race)} · ${html(d.culture)} · ${html(d.career)} · ${html(d.age)}</div></div><p>${html(d.concept)}</p><p>Ability scores: ${d.abilities.map(a => html(a.name)).join(", ")}. Free armour: ${d.freeArmor.length}. Purchased item types: ${d.gear.length}.</p>`;
      default: return "";
    }
  }
  async _tablesFor(index) {
    const part = ["origin", "youth", "recent"][index];
    return game.tables.filter(table => table.getFlag(SYSTEM, "rulebookTable") && /life event/i.test(table.name) && new RegExp(part, "i").test(table.name));
  }
  async _rollEvent(index) {
    const tables = await this._tablesFor(index);
    if (tables.length !== 1) { ui.notifications.warn(`Import the private Life Event: ${["Origin", "Youth", "Recent"][index]} RollTable first.`); return; }
    const { results } = await tables[0].roll();
    const result = results[0];
    if (!result) return;
    const event = this.draft.events[index];
    event.table = tables[0].name; event.name = result.text?.split(/[.:]/)[0]?.trim() || tables[0].name;
    event.text = result.text ?? "";
    await this.render();
  }
  async _pickEvent(index) {
    const tables = await this._tablesFor(index);
    if (tables.length !== 1) { ui.notifications.warn(`Import the private Life Event: ${["Origin", "Youth", "Recent"][index]} RollTable first.`); return; }
    const entries = [...tables[0].results].sort((a, b) => a.range[0] - b.range[0]);
    const result = await foundry.applications.api.DialogV2.input({ window: { title: `Choose ${tables[0].name}` },
      content: `<select name="result"><option value="">Choose…</option>${entries.map(e => `<option value="${html(e.id)}">${html(e.range.join("–"))}: ${html(e.text?.slice(0, 90))}</option>`).join("")}</select>`, ok: { label: "Choose" } });
    const entry = entries.find(e => e.id === result?.result);
    if (!entry) return;
    const event = this.draft.events[index]; event.table = tables[0].name;
    event.name = entry.text?.split(/[.:]/)[0]?.trim() || tables[0].name; event.text = entry.text ?? "";
    await this.render();
  }
  _validateStep() {
    const d = this.draft, required = (condition, message) => { if (!condition) throw new Error(message); };
    const poolValues = bucket => Object.values(bucket);
    if ([4, 5, 6, 7, 8, 11].includes(this.step)) {
      const nonnegative = [d.careerSkills, d.roundingSkills, d.roundingStrands, d.strandCareer, d.strandExtra, d.oldLore, d.civilianExtra].flatMap(poolValues);
      required(nonnegative.every(n => Number.isInteger(n) && n >= 0), "Skill and Strand allocations must be nonnegative whole numbers.");
      required(d.events.every(e => [e.points, e.customPoints, e.strandLevels, e.status].every(Number.isInteger)), "Life Event benefits must be whole numbers.");
    }
    if (this.step === 0) { required(d.name.trim(), "Give the character a name."); for (const c of CATEGORIES.slice(0, 4)) required(GROUPS[c].includes(d.starting[c]), `Choose a starting ${c} skill.`); }
    if (this.step === 1) { required(RACES.includes(d.race), "Choose or roll a race."); if (["Human", "The Replaced"].includes(d.race)) required(d.raceSavvy && d.raceExpertise && d.raceTalent && d.language.trim(), "Choose Human benefits and a regional language."); if (d.race === "Bolg Fiir") required(d.bolgSavvy, "Choose a Bolg Savvy skill."); }
    if (this.step === 2) for (const [i, a] of d.abilities.entries()) { required(ABILITIES[a.name], `Choose ability ${i + 1}.`); required(ABILITIES[a.name].skills.includes(a.expertise), `Choose ability ${i + 1}'s Expertise.`); required(ABILITIES[a.name].talents.includes(a.talent), `Choose ability ${i + 1}'s Talent.`); }
    if (this.step === 3) { required(Object.values(d.attributes).every(n => Number.isInteger(n) && n >= 0), "Attribute points must be whole and nonnegative."); required(Object.values(d.attributes).reduce((a, b) => a + b, 0) === 5, "Allocate exactly five Attribute points."); required(d.attributes.Toughness % 2 === 0, "Toughness costs two points per +1."); required(!d.randomizedAttributes.initiative || d.attributes.Initiative === 0, "Random Initiative cannot receive Attribute points."); required(!d.randomizedAttributes.dt || d.attributes["Death Threshold"] === 0, "Random DT cannot receive Attribute points."); }
    if (this.step === 4) { required(CULTURES.includes(d.culture) && !(d.race === "Ogre" && d.culture.startsWith("Civilized")) && !(d.race === "Bolg Fiir" && d.culture === "Civilized, Urban"), "Choose a culture permitted for this race."); const plan = culturePlan[d.culture]; required(plan.choices.every(([, names], i) => names.includes(d.cultureSelections[i])), "Make every cultural skill choice."); required(new Set(d.cultureSelections).size === d.cultureSelections.length, "Choose distinct skills for each cultural bonus."); required(d.cultureExpertise.every(Boolean), "Choose both cultural Expertise bonuses."); required(d.rolled.cultureCoin, "Roll cultural starting silver."); if (d.culture === "Wanderer") required(d.wandererLanguage.trim(), "Enter the additional Wanderer Language."); }
    if (this.step === 5) { required(d.events.every(e => e.name.trim()), "Choose or roll each of the three Life Events."); required(d.events.every(e => !e.points || e.skill), "Choose a skill for each Life Event skill bonus."); required(d.events.every(e => !e.strandLevels || e.strand), "Choose a Strand for each Life Event Strand bonus."); const histories = d.sharedHistories.filter(h => h.character.trim()); required(histories.every(h => h.skill), "Choose a skill for each shared history."); required(new Set(histories.map(h => h.character)).size === histories.length && new Set(histories.map(h => h.skill)).size === histories.length, "Shared histories must involve different characters and different skills."); }
    if (this.step === 6) { required(CAREERS[d.career] && !(d.career === "Spellweaver" && ["Ogre", "The Replaced"].includes(d.race)), "Choose a permitted career.");
      required(d.career === "Godbound" || !d.careerSkills.Piety, "Only Godbound receive career Piety points.");
      required(d.career === "Spellweaver" || !GROUPS.Binds.some(n => d.careerSkills[n]) && !Object.values(d.strandCareer).some(Boolean) && !Object.values(d.strandExtra).some(Boolean), "Only Spellweavers receive career Bind and Strand points.");
      required(d.careerTalents.every(Boolean), "Choose both career Talents.");
      (careerRequirements[d.career] || []).forEach((allowed, i) => { if (allowed.length) required(allowed.includes(d.careerTalents[i]), `Career Talent ${i + 1} must follow the career choice.`); });
      d.careerTalents.forEach((name, i) => { const categories = careerTalentCategories(d.career, i); if (categories.length) { const entry = game.packs.get("world.tbe-talents")?.index?.find(e => e.name === name); required(categories.includes(entry?.system?.category), `Career Talent ${i + 1} must belong to ${categories.join(" or ")}.`); } });
      required(d.careerWise.slice(0, d.career === "Loremaster" ? 3 : d.career === "Bard" ? 2 : 1).every(v => v.trim()), "Name each career -wise or Language.");
      required(d.rolled.careerCoin, "Roll career starting silver.");
      CAREERS[d.career].forEach((budget, i) => { const names = i === 4 ? (d.career === "Godbound" ? ["Piety"] : GROUPS.Binds) : GROUPS[CATEGORIES[i]]; required(names.reduce((sum, name) => sum + (Number(d.careerSkills[name]) || 0), 0) === budget, `Spend exactly ${budget} ${i === 4 ? "Magic" : CATEGORIES[i]} career points.`); });
      if (d.career === "Spellweaver") { required(new Set(d.focusBinds).size === 2 && d.focusBinds.every(n => GROUPS.Binds.includes(n)), "Choose two distinct focus Binds."); required(new Set(d.focusStrands).size === 4 && d.focusStrands.every(n => GROUPS.Strands.includes(n)), "Choose four distinct focus Strands."); required(new Set(d.thin).size === 2 && d.thin.every(n => GROUPS.Strands.includes(n)), "Choose two distinct Thin Strands."); required(d.thin.every(n => !d.focusStrands.includes(n)), "Focus and Thin Strands must be different."); required(GROUPS.Strands.reduce((n, s) => n + (d.strandCareer[s] || 0), 0) === 10, "Allocate ten focus Strand levels."); required(GROUPS.Strands.reduce((n, s) => n + (d.strandExtra[s] || 0), 0) === 3, "Allocate three additional Strand levels."); required(Object.entries(d.strandCareer).every(([s, n]) => !n || d.focusStrands.includes(s)), "Ten career Strand levels must be in focus Strands."); required(d.thin.every(s => !(d.strandCareer[s] || d.strandExtra[s])), "Thin Strands cannot be developed in creation."); required(d.bindExpertise && d.thread && d.trueName.trim(), "Choose Bind Expertise, a Thread and a True Name."); if (d.race === "Bolg Fiir") required(GROUPS.Binds.includes(d.bolgBind), "Choose the Bolg bonus Bind."); }
    }
    if (this.step === 7) { const budget = d.age === "Young" ? 70 : 100; const spend = Object.values(d.roundingSkills).reduce((a, b) => a + b, 0) + 5 * Object.values(d.roundingStrands).reduce((a, b) => a + b, 0); required(spend === budget, `Spend exactly ${budget} Rounding Out points.`); if (d.age === "Old") required(Object.values(d.oldLore).reduce((a, b) => a + b, 0) === 30, "Spend all 30 Old age Lore points."); if (d.career === "Civilian") required(Object.values(d.civilianExtra).reduce((a, b) => a + b, 0) === 30, "Spend 30 Civilian extra points on Adventuring, Social or Lore."); required(new Set(d.savvy).size === 3 && d.savvy.every(n => allSkills.includes(n)), "Choose three distinct Savvy skills."); if (d.roundingChoice === "Talent") required(d.roundingTalent, "Choose a bonus Talent."); required(d.career === "Spellweaver" || !Object.values(d.roundingStrands).some(Boolean), "Only Spellweavers or Fades may develop Strands."); required(d.thin.every(n => !d.roundingStrands[n]), "Thin Strands cannot be developed during creation."); required(d.career === "Spellweaver" || !GROUPS.Binds.some(n => d.roundingSkills[n]), "Only Spellweavers or Fades may raise Binds."); required(d.career === "Godbound" || !d.roundingSkills.Piety, "Only Godbound may raise Piety."); }
    if (this.step === 8) { required(d.rolled.equipmentCoin && d.rolled.freeArmor, "Roll starting silver and the number of free armour pieces."); required(d.freeArmor.length === d.freeArmorCount, "Select the rolled number of free armour pieces."); }
    if (this.step === 11) {
      for (const name of allSkills) { const category = flattened[name]; const initial = category && CATEGORIES.indexOf(category) < 4 ? (d.starting[category] === name ? 30 : 20) : name === "Piety" && d.career === "Godbound" ? 30 : 0;
        const total = initial + (raceModifiers[d.race]?.[name] || 0) + (d.race === "Bolg Fiir" && d.career === "Spellweaver" && d.bolgBind === name ? 10 : 0) + d.abilities.reduce((sum, a) => sum + (ABILITIES[a.name]?.skills.includes(name) ? 5 : 0), 0) + (cultureBonuses(d)[name] || 0) + d.events.reduce((sum, e) => sum + (e.skill === name ? e.points : 0), 0) + (d.sharedHistories.some(h => h.character && h.skill === name) ? 5 : 0) + (d.careerSkills[name] || 0) + (d.career === "Spellweaver" ? d.focusBinds.filter(n => n === name).length * 10 : 0) + (d.roundingSkills[name] || 0) + (d.civilianExtra[name] || 0) + (d.age === "Old" ? d.oldLore[name] || 0 : 0) + (name === "Endurance" ? d.age === "Young" ? 20 : d.age === "Old" ? -20 : 0 : 0);
        required(total <= 70 && total >= 0, `${name} is ${total}; starting skills must be between 0 and 70.`);
      }
      if (d.career === "Spellweaver") for (const name of GROUPS.Strands) required((d.strandCareer[name] || 0) + (d.strandExtra[name] || 0) + (d.roundingStrands[name] || 0) + d.events.reduce((n, e) => n + (e.strand === name ? e.strandLevels : 0), 0) <= 5, `${name} exceeds level five.`);
    }
  }
  async _finish() {
    if (this._busy || !this.actor.isOwner) return;
    try {
      const currentStep = this.step;
      try { for (this.step = 0; this.step < STEPS.length; this.step++) this._validateStep(); }
      finally { this.step = currentStep; }
      this._busy = true;
      const d = this.draft;
      const wasBlank = !this.actor.getFlag(SYSTEM, "characterCreatorComplete") && !this.actor.system.race && !this.actor.items.some(i => !["Fists/Kicks", "New Talent"].includes(i.name));
      if (!wasBlank) {
        const replace = await foundry.applications.api.DialogV2.confirm({ window: { title: "Replace character details?" }, content: "This character already has creation choices or Items. Replace its sheet details, keep its existing Items and add the newly chosen Items?", yes: { label: "Replace sheet details" }, no: { label: "Cancel" } });
        if (!replace) return;
      }
      const equipmentPack = game.packs.get("world.tbe-equipment"), talentPack = game.packs.get("world.tbe-talents"), threadPack = game.packs.get("world.tbe-threads"), racePack = game.packs.get("world.tbe-races");
      if (!equipmentPack || !talentPack) throw new Error("The system equipment and talent compendiums must finish loading first.");
      const selected = ["Dagger", ...d.freeArmor, ...d.gear];
      const catalogue = await equipmentPack.getIndex({ fields: ["type", "system.price"] });
      const costs = d.gear.reduce((sum, name) => sum + (Number(catalogue.find(e => e.name === name)?.system?.price) || 0), 0);
      const talentNames = [...d.abilities.map(a => a.talent), ...d.careerTalents.filter((name, i) => name && d.swapCareerTalent !== (i === 0 ? "First" : "Second")), ...(["Human", "The Replaced"].includes(d.race) ? [d.raceTalent] : []), d.roundingChoice === "Talent" ? d.roundingTalent : "", ...(d.race === "The Replaced" ? ["HUNTED BY THE QUEEN"] : [])].filter(Boolean);
      const duplicates = talentNames.length - new Set(talentNames).size;
      let money = d.cultureCoin + d.careerCoin + d.equipmentCoin + (d.roundingChoice === "Silver" ? 100 : 0) + (d.duplicateTalentReward === "Silver" ? 100 * duplicates : 0);
      if (costs > money) throw new Error(`Purchases cost ${costs} sp, but you have ${money} sp.`);
      const items = [];
      for (const name of selected) { const match = catalogue.find(e => e.name === name); if (!match) throw new Error(`${name} is missing from Equipment.`); const doc = await equipmentPack.getDocument(match._id); const source = doc.toObject(); delete source._id; delete source.folder; source.system.placement = source.type === "armor" ? "worn" : "atHand"; source.system.quantity = 1; items.push(source); }
      const talentIndex = await talentPack.getIndex();
      for (const name of [...new Set(talentNames)]) { const match = talentIndex.find(e => e.name === name || e.name.startsWith(`${name} (`)); if (!match) throw new Error(`${name} is missing from Talents.`); const source = (await talentPack.getDocument(match._id)).toObject(); delete source._id; delete source.folder;
        if (name === "ARMOR TRAINING (I-IV)" && d.career === "Warrior") { source.name = "ARMOR TRAINING III"; source.system.effect += " Starting Warrior level: III (earlier levels included)."; }
        if (name === "ARMOR TRAINING (I-IV)" && d.career === "Ranger") { source.name = "ARMOR TRAINING I"; source.system.effect += " Starting Ranger level: I."; }
        items.push(source); }
      if (d.thread) { const index = await threadPack.getIndex(); const match = index.find(e => e.name === d.thread); if (!match) throw new Error(`${d.thread} is missing from Threads.`); const source = (await threadPack.getDocument(match._id)).toObject(); delete source._id; delete source.folder; source.system.die = "d8"; items.push(source); }
      const raceIndex = await racePack?.getIndex(); const raceEntry = raceIndex?.find(e => e.name === d.race), raceDoc = raceEntry ? await racePack.getDocument(raceEntry._id) : null;
      const attributes = { initiative: d.initiativeBase + d.attributes.Initiative, toughness: d.attributes.Toughness / 2 + (["Ogre", "Half-Orc (Uthrak)"].includes(d.race) ? 1 : 0), deathThreshold: d.dtBase + d.attributes["Death Threshold"] * 2 + (d.age === "Young" ? 1 : d.age === "Old" ? -2 : 0) + (d.race === "Ogre" ? 2 : 0) + (talentNames.includes("NOT TODAY, DEATH") ? 2 : 0) };
      attributes.lethalityLevel = Math.ceil(attributes.deathThreshold / 3) + (d.race === "Dwarf" ? 1 : 0);
      const resolve = 10 + d.attributes.Resolve * 2 + (talentNames.includes("INNER STRENGTH") ? 1 : 0) + (talentNames.includes("PATTERNED IN THE WEAVE") ? 5 : 0);
      const skillData = {};
      for (const category of CATEGORIES) skillData[slug(category)] = Object.fromEntries(GROUPS[category].map(name => [slug(name), { value: category === "Binds" ? 0 : d.starting[category] === name ? 30 : 20,
        race: (raceModifiers[d.race]?.[name] || 0) + (d.race === "Bolg Fiir" && d.career === "Spellweaver" && d.bolgBind === name ? 10 : 0), culture: cultureBonuses(d)[name] || 0, lifeEvents: d.events.reduce((sum, e) => sum + (e.skill === name ? e.points : 0), 0) + (d.sharedHistories.some(h => h.character && h.skill === name) ? 5 : 0) + (name === "Endurance" ? d.age === "Young" ? 20 : d.age === "Old" ? -20 : 0 : 0),
        career: (d.careerSkills[name] || 0) + (d.career === "Spellweaver" ? d.focusBinds.filter(n => n === name).length * 10 : 0), rounding: (d.roundingSkills[name] || 0) + (d.oldLore[name] || 0) + (d.civilianExtra[name] || 0), expertise: 0, savvy: d.savvy.includes(name) } ]));
      skillData.magic = { piety: { value: d.career === "Godbound" ? 30 : 0, lifeEvents: d.events.reduce((n, e) => n + (e.skill === "Piety" ? e.points : 0), 0), career: d.careerSkills.Piety || 0, rounding: d.roundingSkills.Piety || 0 } };
      skillData.strands = Object.fromEntries(GROUPS.Strands.map(name => [slug(name), { level: (d.strandCareer[name] || 0) + (d.strandExtra[name] || 0) + (d.roundingStrands[name] || 0) + d.events.reduce((n, e) => n + (e.strand === name ? e.strandLevels : 0), 0), thin: d.thin.includes(name) }]));
      for (const name of [...d.abilities.map(a => a.expertise), ...d.cultureExpertise, d.bindExpertise, d.oldExpertise, ...(["Human", "The Replaced"].includes(d.race) ? [d.raceExpertise] : [])].filter(Boolean)) { const category = flattened[name]; if (category && category !== "Strands") { const row = skillData[slug(category)][slug(name)]; row.expertise = row.expertise ? row.expertise + 1 : 2; } }
      for (const name of [d.raceSavvy && ["Human", "The Replaced"].includes(d.race) ? d.raceSavvy : "", d.race === "Dwarf" ? "Locks & Traps" : "", d.race === "Half-Orc (Uthrak)" ? "Endurance" : "", d.race === "Bolg Fiir" ? d.bolgSavvy : ""]) { const category = flattened[name]; if (category && category !== "Strands") skillData[slug(category)][slug(name)].savvy = true; }
      const nativeLanguage = d.race === "Dwarf" ? "Kharzhad" : d.race === "Half-Orc (Uthrak)" ? "Orcish" : d.race === "Ogre" ? "Tusker" : d.race === "Bolg Fiir" ? "Fionnan (Low Court)" : d.language;
      const secondaryLanguage = ["Human", "The Replaced"].includes(d.race) && nativeLanguage === "Low Vestrian" ? "High Vestrian" : "Low Vestrian";
      const customSkills = collectCustomSkills([{ name: nativeLanguage, value: 70 }, { name: secondaryLanguage, value: 20 }, { name: d.wandererLanguage, value: 40 }, ...d.events.filter(e => e.customName).map(e => ({ name: e.customName, value: e.customPoints || 20 })), ...d.careerWise.slice(0, d.career === "Loremaster" ? 3 : d.career === "Bard" ? 2 : 1).map(name => ({ name, value: ["Godbound", "Speaker", "Merchant", "Loremaster"].includes(d.career) ? 30 : 20 }))]);
      const notes = `Character creator choices. Region: ${d.region}. Starting skills: ${JSON.stringify(d.starting)}. Culture coin ${d.cultureCoin} sp; career coin ${d.careerCoin} sp; equipment coin ${d.equipmentCoin} sp; purchases ${costs} sp.\n\nLife Events: ${d.events.map(e => `${e.table}: ${e.name} — ${e.text}\n${e.story}`).join("\n\n")}`;
      const update = { name: d.name, "system.description": d.concept, "system.notes": notes, "system.race": d.race, "system.sex": d.sex, "system.size": d.race === "Ogre" ? "Large" : d.size, "system.age": d.age, "system.culture": `${d.culture}${d.region ? ` (${d.region})` : ""}`, "system.career": d.career, "system.status": d.status + (d.roundingChoice === "Status" ? 1 : 0) + (d.swapCareerTalent !== "None" ? 2 : 0) + (d.duplicateTalentReward === "Status" ? duplicates : 0) + d.events.reduce((n, e) => n + e.status, 0), "system.silver": money - costs,
        "system.abilityScores": d.abilities.map(a => ({ name: a.name, descriptor: a.descriptor })), "system.racialTraits": raceDoc?.system.traits.map(t => ({ name: t.name, effect: t.effect, source: d.race })) ?? [], "system.trueName": d.trueName,
        "system.events": Object.fromEntries(d.events.map((e, i) => [["origin", "youth", "recent"][i], { name: e.name, benefit: e.text, story: e.story }])), "system.sharedHistories": d.sharedHistories.filter(h => h.character.trim()).map(h => ({ ...h })),
        "system.resolve": { max: resolve, value: resolve, fatigue: 0, permanentFatigue: 0 }, "system.attributes": attributes, "system.skills": skillData, "system.customSkills": customSkills,
        "system.personalityTraits": [...d.abilities.map(a => a.descriptor), ...d.personality].filter(Boolean).map(name => ({ name, description: "" })), "system.goals": d.goals.filter(Boolean).map(text => ({ text, shared: false })), "system.pietyBase": d.career === "Godbound" ? 30 + (d.careerSkills.Piety || 0) + (d.roundingSkills.Piety || 0) + d.events.reduce((n, e) => n + (e.skill === "Piety" ? e.points : 0), 0) : 0, "system.encumbranceMax": d.race === "Ogre" ? 8 : 6 };
      // A character is only modified after all choices, costs and source Items validate.
      await this.actor.update(update);
      await this.actor.createEmbeddedDocuments("Item", items);
      const placeholders = wasBlank ? this.actor.items.filter(i => i.name === "New Talent" && i.type === "talent") : [];
      if (placeholders.length) await this.actor.deleteEmbeddedDocuments("Item", placeholders.map(i => i.id));
      await this.actor.setFlag(SYSTEM, "characterCreatorComplete", true);
      await this.close();
      ui.notifications.info(`${d.name} is ready.`);
    } catch (error) { console.error("TBE character creator", error); ui.notifications.error(`Character creator: ${error.message}`); }
    finally { this._busy = false; }
  }
}

export function openCharacterCreator(actor) { if (!actor?.isOwner) return; new CharacterCreator(actor).render(true); }
