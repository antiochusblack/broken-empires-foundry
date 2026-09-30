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
const HOMELANDS = {
  "The Westlands": { languages: ["Westronne"], description: "Free western lands guided by the memory of a lost king." },
  Angevarre: { languages: ["Angevarran", "High Angevarran"], description: "An old feudal empire and breadbasket of the west; High Angevarran belongs to noble courts." },
  Thessia: { languages: ["Thessian"], description: "A cold rural land whose people guard a forgotten history." },
  Haedravik: { languages: ["Vikstongue"], description: "Home of fierce sea raiders with a bloody past." },
  "The Ironlands": { languages: ["Iron Tongue"], description: "Exiled people from beyond the Iron Veil in the far north." },
  "The Serpent’s Teeth": { languages: ["Pirate’s Cant"], description: "Island sailors and free lords of the Serpent’s Teeth." },
  "Tical Dondala": { languages: ["Dondalese"], description: "A naval empire whose treasure fleets roam the seas." },
  Dunblaine: { languages: ["Gael"], description: "A distant fogbound kingdom linked in stories to the dark Fae." },
  "Old Vestria": { languages: ["Low Vestrian"], description: "A declining ancient empire; Low Vestrian 70 and High Vestrian 20." },
  Hohenvall: { languages: ["Meersreich"], description: "Isolationist seafaring merchant princes." },
  Vieksgrad: { languages: ["Slahvac"], description: "A land of hardy warrior clans and old memories." },
  "The Red Wastes": { languages: ["Sandspeech"], description: "Desert tribes surviving in the Red Wastes." },
  Ansharir: { languages: ["Ellaric (Anshari)"], description: "A prosperous city-state on the desert caravan routes." },
  Drangia: { languages: ["Khannish"], description: "Warlike tribes distrustful of Spellweavers." },
  "The Sattagoya Steppes": { languages: ["Khannish"], description: "Horse lords whose clans rarely unite under one Khanate." },
  "Other homeland": { languages: [], description: "Name another homeland with your GM and enter its native language." }
};
const racialLanguage = race => ({ Dwarf: "Kharzhad", "Half-Orc (Uthrak)": "Orcish", Ogre: "Tusker", "Bolg Fiir": "Fionnan (Low Court)" })[race] || "";
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
const choiceType = path => path === "region" ? "homeland" : path === "language" ? "language" : /^(?:raceTalent|roundingTalent|abilities\.\d+\.talent|careerTalents\.\d+)$/.test(path) ? "talent" : /^(?:starting|raceSavvy|raceExpertise|bolgSavvy|abilities\.\d+\.expertise|cultureExpertise|cultureSelections|events\.\d+\.skill|sharedHistories\.\d+\.skill|savvy|oldExpertise|focusBinds|focusStrands|thin|bindExpertise|bolgBind)/.test(path) ? "skill" : "";
const choiceDescription = (name, type) => type === "talent" ? talentDescription(name) : type === "homeland" ? HOMELANDS[name]?.description || "" : type === "language" ? `Native language: ${name}. Starts at 70%.` : SKILL_DESCRIPTIONS[name] || "No description available.";
const info = description => `<span class="tbe-creator-info" role="img" aria-label="${html(description)}" title="${html(description)}">i</span>`;
let activeDraft;
const choiceBonus = path => {
  const d = activeDraft;
  if (path.startsWith("starting.")) return "+10";
  if (/^(raceSavvy|bolgSavvy|savvy\.)/.test(path)) return "Savvy";
  if (/^(raceExpertise|oldExpertise|bindExpertise|cultureExpertise\.|abilities\.\d+\.expertise)/.test(path)) return "+1 Expertise";
  if (path.startsWith("focusBinds.")) return "+10";
  if (path.startsWith("sharedHistories.")) return "+5";
  const cultureIndex = /^cultureSelections\.(\d+)$/.exec(path);
  if (cultureIndex) return `+${culturePlan[d?.culture]?.choices[+cultureIndex[1]]?.[0] ?? 10}`;
  const eventIndex = /^events\.(\d+)\.skill$/.exec(path);
  if (eventIndex) return `+${d?.events[+eventIndex[1]]?.points || 0}`;
  return "";
};
const choiceHelp = path => path === "region" ? "Choose where the character comes from. The homeland determines a Human or Replaced character’s starting languages." : path === "language" ? "Choose the native language where the region allows more than one. The native language starts at 70%." : /expertise/i.test(path) ? "Expertise sets a minimum number of success levels on a successful skill roll. Each choice raises its Expertise level by one." : /savvy/i.test(path) ? "Savvy helps this skill improve faster with XP: add +1 to the points gained whenever you improve it. It does not raise the skill during creation. Piety and Strands cannot be Savvy." : /talent/i.test(path) ? "Choose a Talent whose requirements your character meets. Hover over entries to read their effects." : /strand/i.test(path) ? "A Strand describes the subject of Weave magic; focus and Thin choices affect how you develop it." : /bind/i.test(path) ? "A Bind describes what the spell does. Focus Binds gain the indicated bonus." : "Choose a skill for this benefit. Hover over entries to read what each skill covers.";
const select = (path, names, value, blank) => {
  const type = choiceType(path);
  if (!type) return `<select data-field="${html(path)}">${choices(names, value, blank)}</select>`;
  const bonus = type === "skill" ? choiceBonus(path) : "";
  const preview = name => {
    if (type !== "skill" || !/^\+\d+$/.test(bonus)) return null;
    const proposed = structuredClone(activeDraft);
    setPath(proposed, path, name);
    return skillProjection(proposed, activeStep).get(name)?.total;
  };
  const display = name => {
    const total = preview(name);
    return `${name}${bonus ? ` (${bonus}${total === undefined || total === null ? "" : ` → ${total}%`})` : ""}`;
  };
  return `<select data-field="${html(path)}" data-choice-type="${type}" hidden>${choices(names, value, blank)}</select><details class="tbe-creator-choice-menu"><summary${value ? ` title="${html(choiceDescription(value, type))}"` : ""}>${html(value ? display(value) : blank || "Choose…")}</summary><div class="tbe-creator-choice-list">${names.map(name => { const total = preview(name), over = total > 70; return `<button type="button" data-choice-option="${html(name)}" data-choice-label="${html(display(name))}" ${over ? `data-over-cap="${total}"` : ""} title="${html(choiceDescription(name, type))}${over ? ` — Would reach ${total}%; creation cap is 70%.` : ""}" class="${over ? "tbe-creator-over-cap" : ""}"><span>${html(display(name))}</span></button>`; }).join("")}</div></details>${info(choiceHelp(path))}`;
};
const input = (path, value, type = "text", extra = "") => `<input data-field="${html(path)}" type="${type}" value="${html(value)}" ${extra}>`;
const area = (path, value, rows = 3, extra = "") => `<textarea data-field="${html(path)}" rows="${rows}" ${extra}>${html(value)}</textarea>`;
const label = (name, content) => `<label>${html(name)} ${content}</label>`;
const num = (path, value, max = 100) => input(path, value ?? 0, "number", `min="0" max="${max}" step="1"`);
const flattened = Object.fromEntries(Object.entries(GROUPS).flatMap(([category, names]) => names.map(name => [name, category])));
const allSkills = [...CATEGORIES.flatMap(c => GROUPS[c]), "Piety"];
let activeStep = 0;

function fresh() {
  return {
    name: "", concept: "", starting: {}, race: "", region: "", regionCustom: "", language: "", sex: "", size: "Medium", raceSavvy: "", raceExpertise: "", raceTalent: "", bolgSavvy: "", bolgBind: "",
    abilities: [{ name: "", descriptor: "", expertise: "", talent: "" }, { name: "", descriptor: "", expertise: "", talent: "" }],
    attributes: { Resolve: 0, Initiative: 0, Toughness: 0, "Death Threshold": 0 }, initiativeBase: 10, dtBase: 20, randomizedAttributes: { initiative: false, dt: false },
    culture: "", cultureSelections: [], cultureExpertise: ["", ""], cultureCoin: 0, wandererLanguage: "", rolled: { cultureCoin: false, careerCoin: false, equipmentCoin: false, freeArmor: false },
    events: Array.from({ length: 3 }, () => ({ table: "", name: "", text: "", benefitType: "", skill: "", points: 0, strand: "", strandLevels: 0, customName: "", customPoints: 0, status: 0, story: "" })),
    sharedHistories: [{ character: "", event: "", skill: "", story: "" }, { character: "", event: "", skill: "", story: "" }],
    career: "", careerSkills: {}, careerCoin: 0, careerWise: ["", "", ""], careerTalents: ["", ""], swapCareerTalent: "None",
    focusBinds: ["", ""], focusStrands: ["", "", "", ""], thin: ["", ""], strandCareer: {}, strandExtra: {}, thread: "", bindExpertise: "", trueName: "", duplicateTalentReward: "Silver",
    age: "Adult", roundingSkills: {}, roundingStrands: {}, civilianExtra: {}, savvy: ["", "", ""], roundingChoice: "Talent", roundingTalent: "", oldExpertise: "", oldLore: {},
    equipmentCoin: 0, freeArmorCount: 2, freeArmor: [], personality: ["", "", ""], goals: ["", ""], status: 0
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
const descriptorSuggestions = {
  Strength: ["Strong", "Powerful", "Broad-shouldered"], Dexterity: ["Nimble", "Quick", "Light-footed"],
  Constitution: ["Hardy", "Rugged", "Tireless"], Intelligence: ["Astute", "Curious", "Well-read"],
  Wisdom: ["Perceptive", "Prudent", "Sage"], Charisma: ["Affable", "Magnetic", "Persuasive"]
};
const coinFormula = { Warrior: [1, 6, 5], Rogue: [1, 6, 5], Ranger: [1, 6, 5], Speaker: [2, 4, 10], Bard: [1, 6, 5], Civilian: [2, 6, 10], Loremaster: [2, 4, 10], Merchant: [3, 6, 10], Godbound: [1, 6, 10], Spellweaver: [1, 6, 5] };
const careerCustomCount = career => career === "Loremaster" ? 3 : career === "Bard" ? 2 : 1;
const careerCustomValue = career => ["Godbound", "Speaker", "Merchant", "Loremaster"].includes(career) ? 30 : 20;
const careerCustomLabel = (career, index) => career === "Godbound"
  ? "Custom -wise (your chosen deity) — starts at 30%"
  : `Custom -wise / Language ${index + 1} — starts at ${careerCustomValue(career)}%`;
const careerRequirements = {
  Warrior: [["ARMOR TRAINING III"], []], Rogue: [[], []], Ranger: [["ON THROUGH THE NIGHT", "ARMOR TRAINING I"], []],
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
const CULTURE_REFERENCE = {
  "Civilized, Urban": { twenty: "Common Lore; one Social skill", ten: "Two Combat skills; four more Social skills; Perception; Arcana or Divinity; Commerce; one Craft; Heal; Streetwise", expertise: "One Adventuring and one Lore skill", coin: "1d6 × 10 sp" },
  "Civilized, Rural": { twenty: "Common Lore; Craft: Practical", ten: "Two Combat skills; Athletics; Endurance; Perception; Ride or Sail/Boat; Survival; two Social skills; Arcana or Divinity; Heal; Naturewise", expertise: "Naturewise and one Adventuring or Lore skill", coin: "1d4 × 10 sp" },
  Barbarian: { twenty: "Common Lore; Survival", ten: "Two Combat skills; Athletics; Endurance; Perception; Ride or Sail/Boat; Stealth; Track; one Social skill; Divinity; Heal; Naturewise", expertise: "Survival and one Adventuring or Lore skill", coin: "1d4 × 5 sp" },
  Wanderer: { twenty: "Naturewise; Ride or Sail/Boat", ten: "Two Combat skills; Athletics; Endurance; Perception; Survival; Track; one Social skill; Common Lore; Craft: Practical; Divinity; Heal. Additional Language starts at 40% (separate benefit).", expertise: "Common Lore and one Adventuring or Lore skill", coin: "1d6 × 5 sp" }
};
function cultureReference() {
  return `<div class="tbe-creator-culture-reference"><strong>Culture comparison</strong><div class="tbe-creator-culture-scroll"><table><thead><tr><th>Culture</th><th>+20</th><th>+10</th><th>Expertise</th><th>Starting coin / extra</th></tr></thead><tbody>${CULTURES.map(name => { const row = CULTURE_REFERENCE[name]; return `<tr><th scope="row">${html(name)}</th><td>${html(row.twenty)}</td><td>${html(row.ten)}</td><td>${html(row.expertise)}</td><td>${html(row.coin)}</td></tr>`; }).join("")}</tbody></table></div></div>`;
}
function cultureChoicePrompt(plan, index) {
  const [amount, names] = plan.choices[index];
  const group = names === GROUPS.Combat ? "Combat" : names === GROUPS.Social ? "Social" : names === GROUPS.Adventuring ? "Adventuring" : names === GROUPS.Lore ? "Lore" : "";
  if (!group) return `Choose ${names.join(" or ")}`;
  const previous = plan.choices.slice(0, index).filter(([points, options]) => points === amount && options === names).length;
  const total = plan.choices.filter(([points, options]) => points === amount && options === names).length;
  return `Choose ${group}${total > 1 ? ` ${previous + 1}` : ""}`;
}
function cultureBonuses(d) {
  const plan = culturePlan[d.culture]; if (!plan) return {};
  const result = { ...plan.fixed };
  plan.choices.forEach(([amount], index) => { const name = d.cultureSelections[index]; if (name) result[name] = (result[name] || 0) + amount; });
  return result;
}
function skillProjection(d, throughStep) {
  const result = new Map();
  for (const name of allSkills) {
    const category = flattened[name];
    const base = name === "Piety" ? throughStep >= 6 && d.career === "Godbound" ? 30 : 0 : category === "Binds" ? 0 : d.starting[category] === name ? 30 : 20;
    const parts = { Starting: base };
    if (throughStep >= 1) parts.Race = raceModifiers[d.race]?.[name] || 0;
    if (throughStep >= 2) parts.Abilities = d.abilities.reduce((n, a) => n + (ABILITIES[a.name]?.skills.includes(name) ? 5 : 0), 0);
    if (throughStep >= 4) parts.Culture = cultureBonuses(d)[name] || 0;
    if (throughStep >= 5) parts["Life Events"] = d.events.reduce((n, e) => n + (e.skill === name ? Number(e.points) || 0 : 0), 0) + (d.sharedHistories.some(h => h.character && h.skill === name) ? 5 : 0);
    if (throughStep >= 6) parts.Career = (Number(d.careerSkills[name]) || 0) + (d.career === "Spellweaver" ? d.focusBinds.filter(n => n === name).length * 10 + (d.race === "Bolg Fiir" && d.bolgBind === name ? 10 : 0) : 0);
    if (throughStep >= 7) parts["Rounding Out"] = (Number(d.roundingSkills[name]) || 0) + (Number(d.civilianExtra[name]) || 0) + (d.age === "Old" ? Number(d.oldLore[name]) || 0 : 0) + (name === "Endurance" ? d.age === "Young" ? 20 : d.age === "Old" ? -20 : 0 : 0);
    result.set(name, { category: category || "Magic", parts, total: Object.values(parts).reduce((sum, n) => sum + n, 0), changed: base !== (category === "Binds" || name === "Piety" ? 0 : 20) || Object.entries(parts).some(([key, n]) => key !== "Starting" && n) });
  }
  return result;
}
function skillOverflow(d, step) { return [...skillProjection(d, step)].find(([, row]) => row.total > 70); }
export function eventBenefits(text) {
  const tail = String(text || "").slice(String(text || "").lastIndexOf("?") + 1).replace(/Artis-\s*tic/gi, "Artistic");
  const namedWise = /(?:gain|give yourself)(?:\s+(?:a|an|the))?\s+([\w-]+-wise)/i.exec(tail)?.[1] || "";
  let skills = allSkills.filter(name => new RegExp(`(^|[^A-Za-z])${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=$|[^A-Za-z])`, "i").test(tail));
  if (/\b(?:any|one|a) Combat skill\b/i.test(tail)) skills = [...new Set([...skills, ...GROUPS.Combat])];
  if (/Melee \(Light, Medium, or Heavy\)/i.test(tail)) skills = [...new Set([...skills, "Melee: Light", "Melee: Medium", "Melee: Heavy"])];
  if (/\b(?:a|any) skill of your choice\b/i.test(tail) && !/Bind skill of your choice/i.test(tail)) skills = allSkills;
  if (/Bind skill of your choice/i.test(tail)) skills = [...new Set([...skills, ...GROUPS.Binds])];
  const strandName = /Strand:\s*(\w+)/i.exec(tail)?.[1];
  const strands = /\+2\s+to\s+(?:a\s+)?Strand/i.test(tail) ? strandName ? GROUPS.Strands.filter(name => name.toLowerCase() === strandName.toLowerCase()) : GROUPS.Strands : [];
  const status = /(?:take|gain|add)\s+\+1\s+Status/i.test(tail);
  const simultaneousWise = /\band give yourself\b/i.test(tail);
  const types = [skills.length && "skill", namedWise && !simultaneousWise && "custom", strands.length && "strand", status && "status"].filter(Boolean);
  return { types, skills, strands, namedWise, simultaneousWise };
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
class CharacterCreatorSkills extends App {
  constructor(creator, options = {}) { super(options); this.creator = creator; }
  static DEFAULT_OPTIONS = { classes: ["tbe", "tbe-creator-skills-window"], position: { width: 220, height: 640 }, window: { resizable: true, title: "Skills so far" } };
  static PARTS = { main: { template: `systems/${SYSTEM}/templates/character-creator-skills.hbs` } };
  async _prepareContext(options) { return { ...await super._prepareContext(options), skillsPreview: this.creator._skillsPreview(), skillsBenefits: this.creator._skillsBenefits() }; }
  refresh() {
    const list = this.element?.querySelector(".tbe-creator-preview-list");
    if (list) list.innerHTML = this.creator._skillsPreview();
    const benefits = this.element?.querySelector(".tbe-creator-benefits");
    if (benefits) benefits.innerHTML = this.creator._skillsBenefits();
  }
  async close(options) {
    if (this.creator?._skillsWindow === this) {
      this.creator._skillsWindow = null;
      this.creator._previewOpen = false;
      const button = this.creator.element?.querySelector("[data-toggle-skills]");
      if (button) { button.textContent = "Show skills"; button.setAttribute("aria-expanded", "false"); }
    }
    return super.close(options);
  }
}
export class CharacterCreator extends App {
  constructor(actor, options = {}) { super(options); this.actor = actor; this.draft = fresh(); this.step = 0; this._busy = false; this._previewOpen = true; this._skillsWindow = null; }
  static DEFAULT_OPTIONS = { classes: ["tbe", "tbe-creator"], position: { width: 890, height: 740 }, window: { resizable: true, title: "Create a character" } };
  static PARTS = { main: { template: `systems/${SYSTEM}/templates/character-creator.hbs` } };
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    await Promise.all(["tbe-talents", "tbe-threads", "tbe-equipment", "tbe-races"].map(name => game.packs.get(`world.${name}`)?.getIndex({ fields: ["type", "system.price", "system.category", "system.effect", "system.requirements", "system.traits"] })));
    return { ...context, title: STEPS[this.step], step: this.step + 1, count: STEPS.length, body: this._body(), guidance: this._guidance(), pointsTracker: this._pointsTracker(), previewOpen: this._previewOpen, first: this.step === 0, last: this.step === STEPS.length - 1 };
  }
  _pointsTracker() {
    if (this.step !== 7) return "";
    const d = this.draft, budget = d.age === "Young" ? 70 : 100;
    const sum = values => Object.values(values).reduce((total, value) => total + (Number(value) || 0), 0);
    const spent = sum(d.roundingSkills) + sum(d.roundingStrands) * 5;
    const extras = [d.age === "Old" ? `Old Lore: ${sum(d.oldLore)}/30` : "", d.career === "Civilian" ? `Civilian extra: ${sum(d.civilianExtra)}/30` : ""].filter(Boolean);
    return `Rounding Out: ${spent}/${budget} spent · ${budget - spent} remaining${extras.length ? ` · ${extras.join(" · ")}` : ""}`;
  }
  _skillsPreview() {
    const rows = [...skillProjection(this.draft, this.step)].filter(([, row]) => row.total > (row.category === "Binds" || row.category === "Magic" ? 0 : 20));
    return rows.length ? rows.map(([name, row]) => `<div class="tbe-creator-preview-row ${row.total > 70 ? "tbe-creator-over-cap" : ""}"><strong>${html(name)}</strong><b>${row.total}%</b><small>${Object.entries(row.parts).filter(([, n]) => n).map(([source, n]) => `${html(source)} ${n > 0 && source !== "Starting" ? "+" : ""}${n}`).join(" · ")}</small></div>`).join("") : `<p>Improved skills appear here as you make choices.</p>`;
  }
  _skillsBenefits() {
    const d = this.draft, step = this.step;
    const expertise = [
      ...(step >= 1 && ["Human", "The Replaced"].includes(d.race) ? [d.raceExpertise] : []),
      ...(step >= 2 ? d.abilities.map(a => a.expertise) : []),
      ...(step >= 4 ? d.cultureExpertise : []),
      ...(step >= 6 ? [d.bindExpertise] : []),
      ...(step >= 7 ? [d.age === "Old" ? d.oldExpertise : ""] : [])
    ].filter(Boolean);
    const savvy = [
      ...(step >= 1 ? [d.raceSavvy, d.bolgSavvy, d.race === "Dwarf" ? "Locks & Traps" : "", d.race === "Half-Orc (Uthrak)" ? "Endurance" : ""] : []),
      ...(step >= 7 ? d.savvy : [])
    ].filter(Boolean);
    const counts = new Map();
    for (const name of expertise) counts.set(name, (counts.get(name) || 0) + 1);
    const talents = [
      ...(step >= 1 && ["Human", "The Replaced"].includes(d.race) && d.raceTalent ? [[d.raceTalent, `${d.race} race choice`]] : []),
      ...(step >= 1 && d.race === "The Replaced" ? [["HUNTED BY THE QUEEN", "Replaced racial trait"]] : []),
      ...(step >= 2 ? d.abilities.flatMap((a, i) => a.talent ? [[a.talent, `Ability ${i + 1}${a.name ? `: ${a.name}` : ""}`]] : []) : []),
      ...(step >= 6 ? d.careerTalents.flatMap((name, i) => name && d.swapCareerTalent !== (i === 0 ? "First" : "Second") ? [[name, `${d.career || "Career"} choice ${i + 1}`]] : []) : []),
      ...(step >= 7 && d.roundingChoice === "Talent" && d.roundingTalent ? [[d.roundingTalent, "Rounding Out bonus"]] : [])
    ];
    return `<strong>Special benefits</strong><p><b>Expertise:</b> ${[...counts].map(([name, n]) => `${html(name)}${n > 1 ? ` ×${n}` : ""}`).join(", ") || "None selected"}</p><p><b>Savvy:</b> ${[...new Set(savvy)].map(html).join(", ") || "None selected"}</p><b>Talents:</b>${talents.length ? `<ul>${talents.map(([name, source]) => `<li title="${html(talentDescription(name))}"><b>${html(name)}</b><small>${html(source)}</small></li>`).join("")}</ul>` : `<p>None selected</p>`}`;
  }
  _raceSummary() {
    const race = this.draft.race;
    if (!race) return `<aside class="tbe-creator-race-summary"><strong>Race traits</strong><p>Select a race to see its abilities, bonuses and penalties here.</p></aside>`;
    const entry = game.packs.get("world.tbe-races")?.index?.contents?.find(item => item.name === race);
    const traits = entry?.system?.traits ?? [];
    const modifiers = Object.entries(raceModifiers[race] ?? {});
    return `<aside class="tbe-creator-race-summary" aria-label="${html(race)} traits and modifiers"><strong>${html(race)} — traits and modifiers</strong>${modifiers.length ? `<p><b>Skill modifiers:</b> ${modifiers.map(([name, amount]) => `${html(name)} ${amount > 0 ? "+" : ""}${amount}`).join(" · ")}</p>` : ""}${traits.length ? `<ul>${traits.map(trait => `<li><b>${html(trait.name)}:</b> ${html(trait.effect)}</li>`).join("")}</ul>` : `<p>Race traits are loading. They will appear when the race compendium is ready.</p>`}</aside>`;
  }
  _rerenderKeepingScroll() {
    this._contentScrollTop = this.element?.querySelector(".tbe-creator-content")?.scrollTop ?? 0;
    return this.render();
  }
  async _toggleSkillsWindow() {
    if (this._skillsWindow) { await this._skillsWindow.close(); return; }
    const popup = new CharacterCreatorSkills(this);
    this._skillsWindow = popup;
    this._previewOpen = true;
    try {
      await popup.render(true);
      const right = (this.position.left ?? 0) + (this.position.width ?? 890);
      const left = right + 220 <= window.innerWidth ? right : Math.max(0, (this.position.left ?? 0) - 220);
      popup.setPosition({ left, top: this.position.top ?? 80, height: this.position.height ?? 740 });
      const button = this.element?.querySelector("[data-toggle-skills]");
      if (button) { button.textContent = "Hide skills"; button.setAttribute("aria-expanded", "true"); }
    } catch (error) { this._skillsWindow = null; this._previewOpen = false; throw error; }
  }
  async close(options) {
    if (this._skillsWindow) await this._skillsWindow.close();
    return super.close(options);
  }
  async _rerenderAtEvent(index) {
    const content = this.element?.querySelector(".tbe-creator-content");
    const section = content?.querySelector(`[data-life-event="${index}"]`);
    const offset = section && content ? section.getBoundingClientRect().top - content.getBoundingClientRect().top : 0;
    this._contentScrollTop = content?.scrollTop ?? 0;
    await this.render();
    const nextContent = this.element?.querySelector(".tbe-creator-content");
    const nextSection = nextContent?.querySelector(`[data-life-event="${index}"]`);
    if (nextContent && nextSection) nextContent.scrollTop += nextSection.getBoundingClientRect().top - nextContent.getBoundingClientRect().top - offset;
  }
  _onRender(context, options) {
    super._onRender(context, options);
    const content = this.element.querySelector(".tbe-creator-content");
    if (content) content.scrollTop = this._contentScrollTop ?? 0;
    this._skillsWindow?.refresh();
    if (this._previewOpen && !this._skillsWindow) void this._toggleSkillsWindow();
    this.element.querySelector("[data-toggle-skills]")?.addEventListener("click", () => void this._toggleSkillsWindow());
    this.element.querySelectorAll("[data-field]").forEach(field => field.addEventListener("change", () => {
      const value = field.type === "number" ? (Number(field.value) || 0) : field.type === "checkbox" ? field.checked : field.value;
      const proposed = structuredClone(this.draft);
      setPath(proposed, field.dataset.field, value);
      if (field.dataset.field === "culture") proposed.cultureSelections = [];
      if (field.dataset.field === "career") { proposed.careerSkills = {}; proposed.focusBinds = ["", ""]; }
      const overflow = this.step <= 7 && !/^events\.\d+\.benefitType$/.test(field.dataset.field) && skillOverflow(proposed, this.step);
      if (overflow) { ui.notifications.warn(`${overflow[0]} would reach ${overflow[1].total}%; starting skills cannot exceed 70%.`); void this._rerenderKeepingScroll(); return; }
      const previousCareer = this.draft.career;
      setPath(this.draft, field.dataset.field, value);
      const eventChoice = /^events\.(\d+)\.benefitType$/.exec(field.dataset.field);
      if (eventChoice) this._setEventBenefit(Number(eventChoice[1]), value);
      if (field.dataset.field === "region" || field.dataset.field === "race") this.draft.language = racialLanguage(this.draft.race) || HOMELANDS[this.draft.region]?.languages[0] || "";
      if (field.dataset.field === "career" && previousCareer !== value && careerRequirements[value]) { this.draft.careerSkills = {}; this.draft.strandCareer = {}; this.draft.strandExtra = {}; this.draft.careerTalents = careerRequirements[value].map(names => names.length === 1 ? names[0] : ""); this.draft.rolled.careerCoin = false; }
      if (field.dataset.field === "culture") { this.draft.cultureSelections = []; this.draft.cultureExpertise = [fixedCultureExpertise[value] || "", ""]; this.draft.rolled.cultureCoin = false; }
      if (this.step <= 7 && (field.dataset.choiceType === "skill" || ["race", "culture", "career", "age", "roundingChoice"].includes(field.dataset.field) || /^events\.\d+\.(points|benefitType)$/.test(field.dataset.field) || field.dataset.field.startsWith("abilities.") && field.dataset.field.endsWith(".name"))) void this._rerenderKeepingScroll();
      else if (field.dataset.field === "region") void this._rerenderKeepingScroll();
    }));
    this.element.querySelectorAll("[data-choice-option]").forEach(button => button.addEventListener("click", () => {
      if (button.dataset.overCap) { ui.notifications.warn(`${button.dataset.choiceOption} would reach ${button.dataset.overCap}%; starting skills cannot exceed 70%.`); return; }
      const menu = button.closest(".tbe-creator-choice-menu"), field = menu.previousElementSibling;
      field.value = button.dataset.choiceOption;
      const summary = menu.querySelector("summary");
      summary.textContent = button.dataset.choiceLabel;
      summary.title = choiceDescription(button.dataset.choiceOption, field.dataset.choiceType);
      menu.open = false;
      field.dispatchEvent(new Event("change", { bubbles: true }));
    }));
    this.element.querySelectorAll(".tbe-creator-choice-menu").forEach(menu => menu.addEventListener("toggle", () => {
      if (!menu.open) return;
      this.element.querySelectorAll(".tbe-creator-choice-menu").forEach(other => { if (other !== menu) other.open = false; });
      const bounds = this.element.querySelector(".tbe-creator-content").getBoundingClientRect();
      const rect = menu.getBoundingClientRect();
      menu.classList.toggle("tbe-creator-choice-up", bounds.bottom - rect.bottom < 280 && rect.top - bounds.top > bounds.bottom - rect.bottom);
    }));
    this.element.querySelectorAll("[data-bucket][data-skill]").forEach(field => field.addEventListener("input", () => {
      const proposed = structuredClone(this.draft);
      proposed[field.dataset.bucket][field.dataset.skill] = Number(field.value) || 0;
      const overflow = skillOverflow(proposed, this.step);
      if (overflow) { ui.notifications.warn(`${overflow[0]} would reach ${overflow[1].total}%; starting skills cannot exceed 70%.`); field.value = this.draft[field.dataset.bucket][field.dataset.skill] || 0; return; }
      this.draft[field.dataset.bucket][field.dataset.skill] = Number(field.value) || 0;
      const legend = field.closest("fieldset")?.querySelector("legend");
      if (legend) legend.textContent = this._bucketLegend(field.dataset.bucket, field.dataset.group, field.dataset.budget);
      this._skillsWindow?.refresh();
      const tracker = this.element.querySelector("[data-points-tracker]");
      if (tracker) tracker.textContent = this._pointsTracker();
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
    this.element.querySelectorAll("[data-free-armor]").forEach(input => input.addEventListener("change", () => {
      const list = this.draft.freeArmor;
      if (input.checked) list.push(input.dataset.freeArmor); else list.splice(list.indexOf(input.dataset.freeArmor), 1);
      void this.render();
    }));
  }
  _adjustAttribute(name, direction) {
    if (!["Resolve", "Initiative", "Toughness", "Death Threshold"].includes(name) || ![-1, 1].includes(direction)) return;
    if (name === "Death Threshold" && this.draft.randomizedAttributes.dt) return;
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
        content: `<p>This roll is final for this character. If you do not accept the result, you must abandon this character draft and start again.</p><p>${key === "dt" ? "Any points already spent on DT return to the pool. You cannot spend points on DT after rolling." : "Your Initiative starts at 6 + d6 instead of 10. Any Initiative points already spent remain, and you may spend more afterward."}</p>`,
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
      if (key === "race") { d.race = raceForRoll(n); d.language = racialLanguage(d.race) || HOMELANDS[d.region]?.languages[0] || ""; }
      if (key === "culture") { d.culture = cultureForRoll(n); d.cultureSelections = []; d.cultureExpertise = [fixedCultureExpertise[d.culture] || "", ""]; d.rolled.cultureCoin = false; }
      if (key === "career") { const next = careerForRoll(n); if (d.career !== next) { d.careerSkills = {}; d.strandCareer = {}; d.strandExtra = {}; d.careerTalents = careerRequirements[next].map(names => names.length === 1 ? names[0] : ""); d.rolled.careerCoin = false; } d.career = next; }
      if (key === "abilities") roll.dice[0].results.forEach((result, i) => { d.abilities[i].name = Object.keys(ABILITIES)[result.result - 1]; });
      if (key === "initiative") { d.initiativeBase = n; d.randomizedAttributes.initiative = true; }
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
    const rows = (group === "Piety" ? ["Piety"] : GROUPS[group]).map(name => {
      const value = this.draft[bucket]?.[name] || 0;
      return `<label class="tbe-creator-skill"><span>${html(name)} ${info(SKILL_DESCRIPTIONS[name] || "No description available.")}</span><input type="number" min="0" max="${strand ? 5 : 100}" value="${value}" data-bucket="${html(bucket)}" data-skill="${html(name)}" data-group="${html(group)}" data-budget="${html(budget ?? "")}"></label>`;
    }).join("");
    return `<fieldset><legend>${html(this._bucketLegend(bucket, group, budget))}</legend><div class="tbe-creator-skills">${rows}</div></fieldset>`;
  }
  _bucketLegend(bucket, group, budget) {
    const spent = (group === "Piety" ? ["Piety"] : GROUPS[group]).reduce((n, name) => n + (Number(this.draft[bucket]?.[name]) || 0), 0);
    return `${group}${budget === null || budget === "" ? "" : ` — ${budget}; spent ${spent}`}`;
  }
  _setEventBenefit(index, type) {
    const event = this.draft.events[index], options = eventBenefits(event.text);
    event.benefitType = type;
    event.skill = ""; event.points = 0; event.strand = ""; event.strandLevels = 0; event.customName = ""; event.customPoints = 0; event.status = 0;
    if (type === "skill") { event.points = 10; if (options.skills.length === 1) event.skill = options.skills[0]; }
    if (type === "custom") { event.customName = options.namedWise; event.customPoints = 20; }
    if (type === "strand") { event.strandLevels = 2; if (options.strands.length === 1) event.strand = options.strands[0]; }
    if (type === "status") event.status = 1;
    if (options.simultaneousWise && type === "skill") { event.customName = options.namedWise; event.customPoints = 20; }
  }
  _applyEventResult(index, text, tableName) {
    const event = this.draft.events[index], options = eventBenefits(text);
    event.table = tableName; event.text = text;
    event.name = text.split(/[.:]/)[0]?.trim() || tableName;
    this._setEventBenefit(index, options.types.length === 1 ? options.types[0] : "");
  }
  _eventBenefitFields(event, index) {
    if (!event.text) return `<p class="tbe-creator-event-hint">Choose or roll a result to see its benefits.</p>`;
    const options = eventBenefits(event.text);
    const types = options.types.length ? options.types : ["skill", "custom", "strand", "status"];
    const typeNames = { skill: "Increase a skill +10", custom: `${options.namedWise || "New -wise / Language"} at 20%`, strand: "Increase a Strand +2", status: "Gain +1 Status" };
    const selected = types.includes(event.benefitType) ? event.benefitType : types.length === 1 ? types[0] : "";
    const picker = types.length > 1 ? label("Choose one benefit", `<select data-field="events.${index}.benefitType"><option value="">Choose a benefit…</option>${types.map(type => `<option value="${type}" ${selected === type ? "selected" : ""}>${html(typeNames[type])}</option>`).join("")}</select>`) : `<p class="tbe-creator-event-hint"><strong>Benefit:</strong> ${html(typeNames[selected])}</p>`;
    const skillField = selected === "skill" ? options.skills.length === 1 ? label("Skill gaining +10", input(`events.${index}.skill`, event.skill || options.skills[0], "text", "readonly")) : label("Skill gaining +10", select(`events.${index}.skill`, options.skills.length ? options.skills : allSkills, event.skill, "Choose a skill…")) : "";
    const strandField = selected === "strand" ? options.strands.length === 1 ? label("Strand gaining +2 levels", input(`events.${index}.strand`, event.strand || options.strands[0], "text", "readonly")) : label("Strand gaining +2 levels", select(`events.${index}.strand`, options.strands.length ? options.strands : GROUPS.Strands, event.strand, "Choose a Strand…")) : "";
    const customField = selected === "custom" || selected === "skill" && options.simultaneousWise ? label("New -wise / Language (20%)", input(`events.${index}.customName`, event.customName || options.namedWise, "text", options.namedWise ? "readonly" : "")) : "";
    return `${picker}<div class="tbe-creator-grid">${skillField}${strandField}${customField}</div>`;
  }
  _guidance() {
    const d = this.draft;
    const notes = [
      ["Pick the skills that best express your concept. The four starting choices each begin at 30%; other ordinary skills begin at 20%.", "Hover over the information icons to see what a skill covers."],
      ["Race adds traits and bonuses when you finish. Human and Replaced characters have additional choices in this step.", "Your region and language give the character a place in the world; you can add more detail to the story later."],
      ["Each of your two abilities adds +5 to its linked skills, even if both abilities affect the same skill.", "Expertise and Talent are separate picks for each ability. A descriptor is a short personality phrase you can use during play."],
      ["Spend all five Attribute points. Each point gives +2 Max Resolve, +1 Initiative, or +2 DT. Toughness costs two points for +1.", "The optional Initiative roll changes its starting value to 6 + d6; you can still spend points on it. The optional DT roll changes its starting value to 15 + 2d4 and prevents further DT increases."],
      ["Cultural skill bonuses add to those from earlier steps. You can pick the same skill at different stages, but each separate cultural choice must be distinct.", "Expertise increases the chosen skill's Expertise level; choosing an existing Expertise skill improves it further. Roll cultural silver before continuing."],
      ["Resolve Origin, Youth and Recent separately. The event text goes into your history; record any skill, Strand or status benefit in the matching fields.", "Shared histories are optional. If you add them, use different characters and different skills for the two connections."],
      ["Spend each career category's points in that category; the fieldset headings show its budget and how much you have spent.", "Pick both career Talents and roll career silver. Your career may also grant custom skills, magic choices or other benefits."],
      ["Rounding Out lets you shape the character beyond their career. Young characters spend 70 points; Adults and Old characters spend 100.", "Strand levels cost five rounding points each. Pick three different Savvy skills and your bonus choice before continuing."],
      ["Roll starting silver and the number of free armour pieces, then select exactly that many free pieces.", "A dagger and four d12 supply dice are included automatically. Buy additional gear manually on the finished sheet."],
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
    activeDraft = d; activeStep = this.step;
    switch (this.step) {
      case 0: return `<p>Choose one starting skill at 30% in each category. All other ordinary skills start at 20%.</p><div class="tbe-creator-grid">${label("Name", input("name", d.name))}<label class="tbe-creator-concept">Concept ${area("concept", d.concept, 3)}</label>${CATEGORIES.slice(0, 4).map(c => label(`${c} at 30%`, select(`starting.${c}`, GROUPS[c], d.starting[c]))).join("")}</div>`;
      case 1: {
        const humanLanguages = ["Human", "The Replaced"].includes(d.race);
        const languages = humanLanguages ? HOMELANDS[d.region]?.languages ?? [] : [racialLanguage(d.race)].filter(Boolean);
        const native = humanLanguages ? d.language : racialLanguage(d.race);
        const second = humanLanguages && d.region === "Old Vestria" ? "High Vestrian" : "Low Vestrian";
        const languageField = languages.length > 1 ? label("Native language (70%)", select("language", languages, d.language)) : label("Native language (70%)", input("language", native, "text", d.region === "Other homeland" && humanLanguages ? "" : "readonly"));
        return `<p>Choose a race, or roll d100. Fixed racial traits and bonuses are applied at Finish.</p><div class="tbe-creator-grid">${label("Race", select("race", RACES, d.race))}<button type="button" data-roll-choice="race">Roll race (d100)</button></div>${this._raceSummary()}<div class="tbe-creator-grid">${label("Region / homeland", select("region", Object.keys(HOMELANDS), d.region))}${d.region === "Other homeland" ? label("Name your homeland", input("regionCustom", d.regionCustom)) : ""}${languageField}${label("Second language (20%)", input("secondaryLanguage", second, "text", "readonly"))}${label("Sex / gender", input("sex", d.sex))}${humanLanguages ? `${label("Racial Savvy skill", select("raceSavvy", allSkills.filter(n => n !== "Piety"), d.raceSavvy))}${label("Racial Expertise skill", select("raceExpertise", allSkills.filter(n => n !== "Piety"), d.raceExpertise))}${label("Racial Talent", select("raceTalent", talentNames, d.raceTalent))}` : ""}${d.race === "Bolg Fiir" ? label("Bolg bonus Savvy", select("bolgSavvy", ["Melee: Light", "Missile", "Ancient Lore", "Arcana", "Naturewise"], d.bolgSavvy)) : ""}</div>`;
      }
      case 2: return `<p>Choose two abilities (or roll 1d6 twice). Each adds +5 to its linked skills; select an Expertise skill, a Talent, and a descriptor for each.</p><button type="button" data-roll-choice="abilities">Roll both abilities</button>${d.abilities.map((a, i) => { const examples = descriptorSuggestions[a.name] ?? []; const hint = examples.length ? `Examples for ${a.name}: ${examples.join(", ")}. You can write your own.` : "Choose an ability to see example descriptors, or write your own."; return `<fieldset><legend>Ability ${i + 1}</legend><div class="tbe-creator-grid">${label("Ability", select(`abilities.${i}.name`, Object.keys(ABILITIES), a.name))}<label title="${html(hint)}">Descriptor ${input(`abilities.${i}.descriptor`, a.descriptor, "text", `placeholder="${html(examples.length ? `e.g. ${examples[0]}` : "e.g. Strong")}" title="${html(hint)}"`)}</label>${label("Expertise", select(`abilities.${i}.expertise`, ABILITIES[a.name]?.skills ?? [], a.expertise))}${label("Talent", select(`abilities.${i}.talent`, ABILITIES[a.name]?.talents ?? [], a.talent))}</div></fieldset>`; }).join("")}`;
      case 3: {
        const remaining = 5 - Object.values(d.attributes).reduce((sum, points) => sum + points, 0);
        const rows = [
          ["Resolve", 10 + 2 * d.attributes.Resolve, "+2 Max Resolve per Attribute point", "Max Resolve is your reserve of inner strength. You can spend Resolve to push important rolls, and magic often calls on it. Each Attribute point adds two Resolve boxes."],
          ["Toughness", d.attributes.Toughness / 2, "+1 Toughness per two Attribute points", "Toughness represents physical grit. It improves Wound Die rolls and helps you resist shock and the effects of serious wounds."],
          ["Initiative", d.initiativeBase + d.attributes.Initiative, "+1 Initiative per Attribute point", "Initiative helps determine how early you act in each combat round. Armour can reduce it; you roll a d10 and add your Initiative modifier."],
          ["Death Threshold", d.dtBase + 2 * d.attributes["Death Threshold"], "+2 DT per Attribute point", "Death Threshold is how much total lethal Wound Points you can suffer before death. A higher DT also raises your derived Lethality Level at certain thresholds."]
        ];
        return `<p>Spend five Attribute points. Toughness costs two points per increase.</p><p><strong>Optional starting rolls:</strong> Roll Initiative at 6 + d6 instead of 10, then spend Attribute points on it as normal. Or roll DT at 15 + 2d4 instead of 20; this costs no points, but you cannot increase DT further with Attribute points. Rolled results are final for this character.</p><p class="tbe-creator-pool" aria-live="polite">Points remaining: <strong>${remaining} / 5</strong></p><div class="tbe-creator-attributes">${rows.map(([name, total, hint, explanation]) => {
          const locked = name === "Death Threshold" && d.randomizedAttributes.dt;
          const cost = name === "Toughness" ? 2 : 1;
          const spent = d.attributes[name];
          const roll = name === "Initiative" ? `<button type="button" data-roll-choice="initiative" ${d.randomizedAttributes.initiative ? "disabled" : ""}>${d.randomizedAttributes.initiative ? "(Optional) Initiative rolled" : "(Optional) Roll Initiative (6 + d6)"}</button>` : name === "Death Threshold" ? `<button type="button" data-roll-choice="dt" ${locked ? "disabled" : ""}>${locked ? "(Optional) DT rolled (locked)" : "(Optional) Roll DT (15 + 2d4)"}</button>` : "";
          return `<div class="tbe-creator-attribute"><div class="tbe-creator-attribute-row"><label for="attribute-${slug(name)}">${name === "Resolve" ? "Max Resolve" : html(name)} ${info(explanation)}</label><button type="button" data-attribute="${html(name)}" data-direction="-1" aria-label="Remove ${html(name)} points" ${locked || spent < cost ? "disabled" : ""}>−</button><span class="tbe-creator-attribute-spent" title="Attribute points spent">${spent} pt${spent === 1 ? "" : "s"}</span><button type="button" data-attribute="${html(name)}" data-direction="1" aria-label="Add ${html(name)} points" ${locked || remaining < cost ? "disabled" : ""}>+</button><input id="attribute-${slug(name)}" type="number" aria-label="${html(name)} total" value="${total}" readonly></div><small>${hint}</small>${roll}</div>`;
        }).join("")}</div><p class="tbe-creator-roll-warning">Random Initiative and DT rolls are final for this draft. If you do not accept a result, you must abandon the character and start again.</p>`;
      }
      case 4: {
        const plan = culturePlan[d.culture];
        return `<p>Choose or roll your culture, then make its skill selections. Fixed bonuses are applied automatically.</p><div class="tbe-creator-grid">${label("Culture", select("culture", CULTURES, d.culture))}<button type="button" data-roll-choice="culture">Roll culture (d10)</button></div>${cultureReference()}<div class="tbe-creator-grid">${label("Culture silver (sp)", input("cultureCoin", d.cultureCoin, "number", "readonly"))}<button type="button" data-roll-choice="cultureCoin">Roll culture coin</button>${[0, 1].map(i => label(`Culture Expertise ${i + 1}`, select(`cultureExpertise.${i}`, fixedCultureExpertise[d.culture] && i === 0 ? [fixedCultureExpertise[d.culture]] : d.culture === "Civilized, Urban" ? (i === 0 ? GROUPS.Adventuring : GROUPS.Lore) : [...GROUPS.Adventuring, ...GROUPS.Lore], d.cultureExpertise[i]))).join("")}${d.culture === "Wanderer" ? label("Additional Language at 40", input("wandererLanguage", d.wandererLanguage)) : ""}</div>${plan ? `<p>Fixed bonuses: ${Object.entries(plan.fixed).map(([n, v]) => `${html(n)} +${v}`).join(", ")}.</p><div class="tbe-creator-grid">${plan.choices.map(([amount, names], i) => label(`+${amount} — ${cultureChoicePrompt(plan, i).replace("Choose ", "")}`, select(`cultureSelections.${i}`, names, d.cultureSelections[i], `${cultureChoicePrompt(plan, i)}…`))).join("")}</div>` : ""}`;
      }
      case 5: return `<p>Choose or roll an Origin, Youth and Recent result. Select the benefit the result offers, then add your own story. Results remain in the character history.</p>${d.events.map((e, i) => `<fieldset data-life-event="${i}"><legend>${["Origin", "Youth", "Recent"][i]}</legend><div class="tbe-creator-grid"><button type="button" data-roll-event="${i}">Roll table</button><button type="button" data-pick-event="${i}">Choose result</button></div>${e.name ? `<p class="tbe-creator-event-title">${html(e.name)}</p>` : ""}${e.text ? label("Result and choices", area(`events.${i}.text`, e.text, 3, "readonly")) : ""}${this._eventBenefitFields(e, i)}${label("Your story", area(`events.${i}.story`, e.story, 2))}</fieldset>`).join("")}<fieldset><legend>Optional shared histories (up to two)</legend>${d.sharedHistories.map((h, i) => `<div class="tbe-creator-grid">${label(`Character ${i + 1}`, input(`sharedHistories.${i}.character`, h.character))}${label("Life Event", input(`sharedHistories.${i}.event`, h.event))}${label("Skill +5", select(`sharedHistories.${i}.skill`, allSkills, h.skill))}${label("What happened", input(`sharedHistories.${i}.story`, h.story))}</div>`).join("")}</fieldset>`;
      case 6: {
        const pool = CAREERS[d.career] ?? [0, 0, 0, 0, 0];
        return `<p>Choose or roll a previous career. Spend each category's pool in that category; record career Talents and custom -wises or Languages. Spellweavers also choose magical focus and Strand levels.</p><div class="tbe-creator-grid">${label("Career", select("career", Object.keys(CAREERS), d.career))}<button type="button" data-roll-choice="career">Roll career (d10)</button>${label("Career silver (sp)", input("careerCoin", d.careerCoin, "number", "readonly"))}<button type="button" data-roll-choice="careerCoin">Roll career coin</button>${d.careerWise.slice(0, careerCustomCount(d.career)).map((v, i) => label(careerCustomLabel(d.career, i), input(`careerWise.${i}`, v))).join("")}${d.careerTalents.map((v, i) => label(`Career Talent ${i + 1}`, select(`careerTalents.${i}`, careerRequirements[d.career]?.[i]?.length ? careerRequirements[d.career][i] : careerTalentCategories(d.career, i).length ? talentEntries.filter(e => careerTalentCategories(d.career, i).includes(e.system?.category)).map(e => e.name).sort() : talentNames, v))).join("")}${label("Swap one career Talent for +2 Status", select("swapCareerTalent", ["None", "First", "Second"], d.swapCareerTalent))}</div>${CATEGORIES.map((c, i) => this._rowFields(d.career === "Godbound" && c === "Binds" ? "Piety" : c, "careerSkills", pool[i])).join("")}${d.career === "Spellweaver" ? `<fieldset><legend>Spellweaver focus</legend><div class="tbe-creator-grid">${d.focusBinds.map((v, i) => label(`Focus Bind ${i + 1} (+10)`, select(`focusBinds.${i}`, GROUPS.Binds, v))).join("")}${d.focusStrands.map((v, i) => label(`Focus Strand ${i + 1}`, select(`focusStrands.${i}`, GROUPS.Strands, v))).join("")}${d.thin.map((v, i) => label(`Thin Strand ${i + 1}`, select(`thin.${i}`, GROUPS.Strands, v))).join("")}${label("Bind Expertise", select("bindExpertise", GROUPS.Binds, d.bindExpertise))}${label("d8 Thread item", select("thread", game.packs.get("world.tbe-threads")?.index?.contents?.map(e => e.name).sort() ?? [], d.thread))}${label("True Name", input("trueName", d.trueName))}${d.race === "Bolg Fiir" ? label("Bolg Bind +10", select("bolgBind", GROUPS.Binds, d.bolgBind)) : ""}</div>${this._rowFields("Strands", "strandCareer", "10 focus levels")}${this._rowFields("Strands", "strandExtra", "3 additional levels")}</fieldset>` : ""}`;
      }
      case 7: return `<p>Choose your age, one bonus (Talent, +1 Status, or 100 sp), and three Savvy skills. Spend the age pool on skills; Strand levels cost five points each. Young also receive +20 Endurance and +1 DT; Old receive -20 Endurance, -2 DT, 30 Lore points, and one Expertise level.</p><fieldset><legend>Age benefits</legend><div class="tbe-creator-grid">${label("Age", select("age", ["Young", "Adult", "Old"], d.age))}${d.age === "Old" ? label("Old age Expertise", select("oldExpertise", allSkills, d.oldExpertise)) : ""}</div></fieldset><fieldset><legend>Bonus choice</legend><div class="tbe-creator-grid">${label("Bonus choice", select("roundingChoice", ["Talent", "Status", "Silver"], d.roundingChoice))}${d.roundingChoice === "Talent" ? label("Bonus Talent", select("roundingTalent", talentNames, d.roundingTalent)) : ""}</div></fieldset><div class="tbe-creator-grid">${d.savvy.map((v, i) => label(`Savvy ${i + 1}`, select(`savvy.${i}`, allSkills.filter(n => n !== "Piety"), v))).join("")}</div>${CATEGORIES.map(c => this._rowFields(c, "roundingSkills")).join("")}${d.career === "Godbound" ? label("Piety rounding points", num("roundingSkills.Piety", d.roundingSkills.Piety, 100)) : ""}${d.career === "Spellweaver" ? this._rowFields("Strands", "roundingStrands", "5 points per level") : ""}${d.age === "Old" ? this._rowFields("Lore", "oldLore", "30 Lore points") : ""}${d.career === "Civilian" ? ["Adventuring", "Social", "Lore"].map(c => this._rowFields(c, "civilianExtra", "30 Civilian extra points total")).join("") : ""}`;
      case 8: {
        const armor = game.packs.get("world.tbe-equipment")?.index?.contents?.filter(i => i.type === "armor") ?? [];
        const armorGroups = ["Padding", "Quilt", "Leather", "Reinforced Leather", "Mail", "Bone", "Scale", "Plate"].map(type => ({ type, pieces: armor.filter(i => i.name === type || i.name.startsWith(`${type} `)) }));
        return `<p>Every character starts with a dagger, 1d3+1 armour pieces they can wear, and d12 Gear, Ammo, Rations and Medical supply dice. Roll 2d4 × 50 sp starting coin. Buy any additional equipment directly on the sheet after creation.</p><div class="tbe-creator-grid">${label("Starting coin", input("equipmentCoin", d.equipmentCoin, "number", "readonly"))}<button type="button" data-roll-choice="equipmentCoin">Roll coin</button>${label("Free armour pieces", input("freeArmorCount", d.freeArmorCount, "number", "readonly"))}<button type="button" data-roll-choice="freeArmor">Roll 1d3+1</button></div><fieldset><legend>Free armour (${d.freeArmor.length}/${d.freeArmorCount})</legend>${armorGroups.filter(group => group.pieces.length).map(group => `<h3>${html(group.type)}</h3><div class="tbe-creator-skills">${group.pieces.map(i => `<label><input type="checkbox" data-free-armor="${html(i.name)}" ${d.freeArmor.includes(i.name) ? "checked" : ""}>${html(i.name)}</label>`).join("")}</div>`).join("")}</fieldset>`;
      }
      case 9: return `<p>Choose personality traits; ability descriptors are included automatically.</p><div class="tbe-creator-grid">${d.personality.map((v, i) => label(`Trait ${i + 1}`, input(`personality.${i}`, v))).join("")}</div>`;
      case 10: return `<p>Give the character reasons to go adventuring. These can be changed during play.</p>${d.goals.map((v, i) => label(`Goal ${i + 1}`, area(`goals.${i}`, v, 2))).join("")}`;
      case 11: return `<p>Review your choices, then Finish to fill the character sheet. The draft is discarded when this window closes.</p><div class="tbe-creator-grid">${label("Optional Status", num("status", d.status, 100))}${label("Duplicate Talent reward", select("duplicateTalentReward", ["Silver", "Status"], d.duplicateTalentReward))}<div><strong>${html(d.name || this.actor.name)}</strong><br>${html(d.race)} · ${html(d.culture)} · ${html(d.career)} · ${html(d.age)}</div></div><p>${html(d.concept)}</p><p>Ability scores: ${d.abilities.map(a => html(a.name)).join(", ")}. Free armour: ${d.freeArmor.length}. Additional shopping happens on the sheet.</p>`;
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
    this._applyEventResult(index, result.text ?? "", tables[0].name);
    await this._rerenderAtEvent(index);
  }
  async _pickEvent(index) {
    const tables = await this._tablesFor(index);
    if (tables.length !== 1) { ui.notifications.warn(`Import the private Life Event: ${["Origin", "Youth", "Recent"][index]} RollTable first.`); return; }
    const entries = [...tables[0].results].sort((a, b) => a.range[0] - b.range[0]);
    const result = await foundry.applications.api.DialogV2.input({ window: { title: `Choose ${tables[0].name}` },
      content: `<select name="result"><option value="">Choose…</option>${entries.map(e => `<option value="${html(e.id)}">${html(e.range.join("–"))}: ${html(e.text?.slice(0, 90))}</option>`).join("")}</select>`, ok: { label: "Choose" } });
    const entry = entries.find(e => e.id === result?.result);
    if (!entry) return;
    this._applyEventResult(index, entry.text ?? "", tables[0].name);
    await this._rerenderAtEvent(index);
  }
  _validateStep() {
    const d = this.draft, required = (condition, message) => { if (!condition) throw new Error(message); };
    if (this.step <= 7) { const overflow = skillOverflow(d, this.step); required(!overflow, `${overflow?.[0]} would be ${overflow?.[1]?.total}%; starting skills cannot exceed 70%.`); }
    const poolValues = bucket => Object.values(bucket);
    if ([4, 5, 6, 7, 8, 11].includes(this.step)) {
      const nonnegative = [d.careerSkills, d.roundingSkills, d.roundingStrands, d.strandCareer, d.strandExtra, d.oldLore, d.civilianExtra].flatMap(poolValues);
      required(nonnegative.every(n => Number.isInteger(n) && n >= 0), "Skill and Strand allocations must be nonnegative whole numbers.");
      required(d.events.every(e => [e.points, e.customPoints, e.strandLevels, e.status].every(Number.isInteger)), "Life Event benefits must be whole numbers.");
    }
    if (this.step === 0) { required(d.name.trim(), "Give the character a name."); for (const c of CATEGORIES.slice(0, 4)) required(GROUPS[c].includes(d.starting[c]), `Choose a starting ${c} skill.`); }
    if (this.step === 1) { required(RACES.includes(d.race), "Choose or roll a race."); if (["Human", "The Replaced"].includes(d.race)) required(d.raceSavvy && d.raceExpertise && d.raceTalent && HOMELANDS[d.region] && d.language.trim() && (d.region !== "Other homeland" || d.regionCustom.trim()), "Choose Human benefits, a homeland and its native language."); if (d.race === "Bolg Fiir") required(d.bolgSavvy, "Choose a Bolg Savvy skill."); }
    if (this.step === 2) for (const [i, a] of d.abilities.entries()) { required(ABILITIES[a.name], `Choose ability ${i + 1}.`); required(ABILITIES[a.name].skills.includes(a.expertise), `Choose ability ${i + 1}'s Expertise.`); required(ABILITIES[a.name].talents.includes(a.talent), `Choose ability ${i + 1}'s Talent.`); }
    if (this.step === 3) { required(Object.values(d.attributes).every(n => Number.isInteger(n) && n >= 0), "Attribute points must be whole and nonnegative."); required(Object.values(d.attributes).reduce((a, b) => a + b, 0) === 5, "Allocate exactly five Attribute points."); required(d.attributes.Toughness % 2 === 0, "Toughness costs two points per +1."); required(!d.randomizedAttributes.dt || d.attributes["Death Threshold"] === 0, "Random DT cannot receive Attribute points."); }
    if (this.step === 4) { required(CULTURES.includes(d.culture) && !(d.race === "Ogre" && d.culture.startsWith("Civilized")) && !(d.race === "Bolg Fiir" && d.culture === "Civilized, Urban"), "Choose a culture permitted for this race."); const plan = culturePlan[d.culture]; required(plan.choices.every(([, names], i) => names.includes(d.cultureSelections[i])), "Make every cultural skill choice."); required(new Set(d.cultureSelections).size === d.cultureSelections.length, "Choose distinct skills for each cultural bonus."); required(d.cultureExpertise.every(Boolean), "Choose both cultural Expertise bonuses."); required(d.rolled.cultureCoin, "Roll cultural starting silver."); if (d.culture === "Wanderer") required(d.wandererLanguage.trim(), "Enter the additional Wanderer Language."); }
    if (this.step === 5) { required(d.events.every(e => e.name.trim()), "Choose or roll each of the three Life Events."); required(d.events.every(e => !e.text || eventBenefits(e.text).types.length === 0 || eventBenefits(e.text).types.includes(e.benefitType)), "Choose one of the benefits offered by each Life Event."); required(d.events.every(e => !e.points || e.skill), "Choose a skill for each Life Event skill bonus."); required(d.events.every(e => !e.strandLevels || e.strand), "Choose a Strand for each Life Event Strand bonus."); required(d.events.every(e => !e.customPoints || e.customName.trim()), "Name each new -wise or Language skill."); const histories = d.sharedHistories.filter(h => h.character.trim()); required(histories.every(h => h.skill), "Choose a skill for each shared history."); required(new Set(histories.map(h => h.character)).size === histories.length && new Set(histories.map(h => h.skill)).size === histories.length, "Shared histories must involve different characters and different skills."); }
    if (this.step === 6) { required(CAREERS[d.career] && !(d.career === "Spellweaver" && ["Ogre", "The Replaced"].includes(d.race)), "Choose a permitted career.");
      required(d.career === "Godbound" || !d.careerSkills.Piety, "Only Godbound receive career Piety points.");
      required(d.career === "Spellweaver" || !GROUPS.Binds.some(n => d.careerSkills[n]) && !Object.values(d.strandCareer).some(Boolean) && !Object.values(d.strandExtra).some(Boolean), "Only Spellweavers receive career Bind and Strand points.");
      required(d.careerTalents.every(Boolean), "Choose both career Talents.");
      (careerRequirements[d.career] || []).forEach((allowed, i) => { if (allowed.length) required(allowed.includes(d.careerTalents[i]), `Career Talent ${i + 1} must follow the career choice.`); });
      d.careerTalents.forEach((name, i) => { const categories = careerTalentCategories(d.career, i); if (categories.length) { const entry = game.packs.get("world.tbe-talents")?.index?.find(e => e.name === name); required(categories.includes(entry?.system?.category), `Career Talent ${i + 1} must belong to ${categories.join(" or ")}.`); } });
      required(d.careerWise.slice(0, careerCustomCount(d.career)).every(v => v.trim()), "Name each career -wise or Language.");
      required(d.rolled.careerCoin, "Roll career starting silver.");
      CAREERS[d.career].forEach((budget, i) => { const names = i === 4 ? (d.career === "Godbound" ? ["Piety"] : GROUPS.Binds) : GROUPS[CATEGORIES[i]]; required(names.reduce((sum, name) => sum + (Number(d.careerSkills[name]) || 0), 0) === budget, `Spend exactly ${budget} ${i === 4 ? "Magic" : CATEGORIES[i]} career points.`); });
      if (d.career === "Spellweaver") { required(new Set(d.focusBinds).size === 2 && d.focusBinds.every(n => GROUPS.Binds.includes(n)), "Choose two distinct focus Binds."); required(new Set(d.focusStrands).size === 4 && d.focusStrands.every(n => GROUPS.Strands.includes(n)), "Choose four distinct focus Strands."); required(new Set(d.thin).size === 2 && d.thin.every(n => GROUPS.Strands.includes(n)), "Choose two distinct Thin Strands."); required(d.thin.every(n => !d.focusStrands.includes(n)), "Focus and Thin Strands must be different."); required(GROUPS.Strands.reduce((n, s) => n + (d.strandCareer[s] || 0), 0) === 10, "Allocate ten focus Strand levels."); required(GROUPS.Strands.reduce((n, s) => n + (d.strandExtra[s] || 0), 0) === 3, "Allocate three additional Strand levels."); required(Object.entries(d.strandCareer).every(([s, n]) => !n || d.focusStrands.includes(s)), "Ten career Strand levels must be in focus Strands."); required(d.thin.every(s => !(d.strandCareer[s] || d.strandExtra[s])), "Thin Strands cannot be developed in creation."); required(d.bindExpertise && d.thread && d.trueName.trim(), "Choose Bind Expertise, a Thread and a True Name."); if (d.race === "Bolg Fiir") required(GROUPS.Binds.includes(d.bolgBind), "Choose the Bolg bonus Bind."); }
    }
    if (this.step === 7) { const budget = d.age === "Young" ? 70 : 100; const spend = Object.values(d.roundingSkills).reduce((a, b) => a + b, 0) + 5 * Object.values(d.roundingStrands).reduce((a, b) => a + b, 0); required(spend === budget, `Spend exactly ${budget} Rounding Out points.`); if (d.age === "Old") required(Object.values(d.oldLore).reduce((a, b) => a + b, 0) === 30, "Spend all 30 Old age Lore points."); if (d.career === "Civilian") required(Object.values(d.civilianExtra).reduce((a, b) => a + b, 0) === 30, "Spend 30 Civilian extra points on Adventuring, Social or Lore."); required(new Set(d.savvy).size === 3 && d.savvy.every(n => n !== "Piety" && allSkills.includes(n)), "Choose three distinct Savvy skills."); if (d.roundingChoice === "Talent") required(d.roundingTalent, "Choose a bonus Talent."); required(d.career === "Spellweaver" || !Object.values(d.roundingStrands).some(Boolean), "Only Spellweavers or Fades may develop Strands."); required(d.thin.every(n => !d.roundingStrands[n]), "Thin Strands cannot be developed during creation."); required(d.career === "Spellweaver" || !GROUPS.Binds.some(n => d.roundingSkills[n]), "Only Spellweavers or Fades may raise Binds."); required(d.career === "Godbound" || !d.roundingSkills.Piety, "Only Godbound may raise Piety."); }
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
      const selected = ["Dagger", ...d.freeArmor];
      const catalogue = await equipmentPack.getIndex({ fields: ["type", "system.price"] });
      const talentNames = [...d.abilities.map(a => a.talent), ...d.careerTalents.filter((name, i) => name && d.swapCareerTalent !== (i === 0 ? "First" : "Second")), ...(["Human", "The Replaced"].includes(d.race) ? [d.raceTalent] : []), d.roundingChoice === "Talent" ? d.roundingTalent : "", ...(d.race === "The Replaced" ? ["HUNTED BY THE QUEEN"] : [])].filter(Boolean);
      const duplicates = talentNames.length - new Set(talentNames).size;
      let money = d.cultureCoin + d.careerCoin + d.equipmentCoin + (d.roundingChoice === "Silver" ? 100 : 0) + (d.duplicateTalentReward === "Silver" ? 100 * duplicates : 0);
      const items = [];
      for (const name of selected) { const match = catalogue.find(e => e.name === name); if (!match) throw new Error(`${name} is missing from Equipment.`); const doc = await equipmentPack.getDocument(match._id); const source = doc.toObject(); delete source._id; delete source.folder; source.system.placement = source.type === "armor" ? "worn" : "atHand"; source.system.quantity = 1; items.push(source); }
      const talentIndex = await talentPack.getIndex();
      for (const name of [...new Set(talentNames)]) { const match = talentIndex.find(e => e.name === name); if (!match) throw new Error(`${name} is missing from Talents.`); const source = (await talentPack.getDocument(match._id)).toObject(); delete source._id; delete source.folder;
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
      const secondaryLanguage = ["Human", "The Replaced"].includes(d.race) && d.region === "Old Vestria" ? "High Vestrian" : "Low Vestrian";
      const customSkills = collectCustomSkills([{ name: nativeLanguage, value: 70 }, { name: secondaryLanguage, value: 20 }, { name: d.wandererLanguage, value: 40 }, ...d.events.filter(e => e.customName).map(e => ({ name: e.customName, value: e.customPoints || 20 })), ...d.careerWise.slice(0, careerCustomCount(d.career)).map(name => ({ name, value: careerCustomValue(d.career) }))]);
      const homeland = d.region === "Other homeland" ? d.regionCustom.trim() : d.region;
      const notes = `Character creator choices. Region: ${homeland}. Starting skills: ${JSON.stringify(d.starting)}. Culture coin ${d.cultureCoin} sp; career coin ${d.careerCoin} sp; equipment coin ${d.equipmentCoin} sp.\n\nLife Events: ${d.events.map(e => `${e.table}: ${e.name} — ${e.text}\n${e.story}`).join("\n\n")}`;
      const update = { name: d.name, "system.description": d.concept, "system.notes": notes, "system.race": d.race, "system.sex": d.sex, "system.size": d.race === "Ogre" ? "Large" : d.size, "system.age": d.age, "system.culture": `${d.culture}${homeland ? ` (${homeland})` : ""}`, "system.career": d.career, "system.status": d.status + (d.roundingChoice === "Status" ? 1 : 0) + (d.swapCareerTalent !== "None" ? 2 : 0) + (d.duplicateTalentReward === "Status" ? duplicates : 0) + d.events.reduce((n, e) => n + e.status, 0), "system.silver": money, "system.supply": { gear: "d12", ammo: "d12", rations: "d12", medical: "d12" },
        "system.abilityScores": d.abilities.map(a => ({ name: a.name, descriptor: a.descriptor })), "system.racialTraits": raceDoc?.system.traits.map(t => ({ name: t.name, effect: t.effect, source: d.race })) ?? [], "system.trueName": d.trueName,
        "system.events": Object.fromEntries(d.events.map((e, i) => [["origin", "youth", "recent"][i], { name: e.name, benefit: e.text, story: e.story }])), "system.sharedHistories": d.sharedHistories.filter(h => h.character.trim()).map(h => ({ ...h })),
        "system.resolve": { max: resolve, value: resolve, fatigue: 0, permanentFatigue: 0 }, "system.attributes": attributes, "system.skills": skillData, "system.customSkills": customSkills,
        "system.personalityTraits": [...d.abilities.map(a => a.descriptor), ...d.personality].filter(Boolean).map(name => ({ name, description: "" })), "system.goals": d.goals.filter(Boolean).map(text => ({ text, shared: false })), "system.pietyBase": d.career === "Godbound" ? 30 + (d.careerSkills.Piety || 0) + (d.roundingSkills.Piety || 0) + d.events.reduce((n, e) => n + (e.skill === "Piety" ? e.points : 0), 0) : 0, "system.encumbranceMax": d.race === "Ogre" ? 8 : 6 };
      // A character is only modified after all choices and source Items validate.
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
