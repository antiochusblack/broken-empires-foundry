import { rollCard, escapeCard } from "./roll-card.mjs";
const SYSTEM = "broken-empires-foundry";
const Sheet = foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.sheets.ActorSheetV2);
const asObject = value => value?.toObject?.() ?? foundry.utils.deepClone(value);
const locations = ["Body", "Right Arm", "Left Arm", "Right Leg", "Left Leg", "Head"];
export class NPCSheet extends Sheet {
  static DEFAULT_OPTIONS = { classes: ["tbe", "npc-sheet"], tag: "form", position: { width: 760, height: 740 }, window: { resizable: true }, form: { submitOnChange: true, closeOnSubmit: false }, dragDrop: [{ dragSelector: "[data-item-id]", dropSelector: ".tbe-npc-body" }] };
  static PARTS = { main: { template: `systems/${SYSTEM}/templates/npc.hbs` } };
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const system = this.actor.system;
    const summary = locations.map(location => {
      const wounds = system.wounds.filter(w => w.location === location);
      return { location, lethal: wounds.filter(w => w.lethal).reduce((n,w) => n + w.points, 0), nonlethal: wounds.filter(w => !w.lethal).reduce((n,w) => n + w.points, 0), ap: system.protection.find(row => row.location === location)?.ap ?? "—" };
    });
    return { ...context, actor: this.actor, system, summary, locations, loot: this.actor.items.filter(item => ["gear", "weapon", "armor", "shield"].includes(item.type)),
      totalLethal: system.wounds.filter(w => w.lethal).reduce((n,w) => n + w.points, 0),
      totalNonlethal: system.wounds.filter(w => !w.lethal).reduce((n,w) => n + w.points, 0) };
  }
  _onRender(context, options) {
    super._onRender(context, options);
    this.element.querySelectorAll("[data-npc-new-item]").forEach(button => button.addEventListener("click", async () => {
      if (!this.actor.isOwner) return;
      const type = button.dataset.npcNewItem;
      if (!["gear", "weapon", "armor", "shield"].includes(type)) return;
      const [item] = await this.actor.createEmbeddedDocuments("Item", [{ name: `New ${type}`, type, system: { quantity: 1, placement: type === "armor" ? "worn" : "inventory" } }]);
      item?.sheet.render(true);
    }));
    this.element.querySelectorAll("[data-npc-open-item]").forEach(button => button.addEventListener("click", () => this.actor.items.get(button.dataset.npcOpenItem)?.sheet.render(true)));
    this.element.querySelectorAll("[data-npc-delete-item]").forEach(button => button.addEventListener("click", async () => {
      const item = this.actor.items.get(button.dataset.npcDeleteItem);
      if (!item) return;
      const confirmed = await foundry.applications.api.DialogV2.confirm({ window: { title: "Delete NPC gear?" }, content: `Delete ${foundry.utils.escapeHTML(item.name)}?`, yes: { label: "Delete" }, no: { label: "Cancel" } });
      if (confirmed) await this.actor.deleteEmbeddedDocuments("Item", [item.id]);
    }));
    this.element.querySelector("[data-portrait]")?.addEventListener("click", event => {
      event.preventDefault();
      if (this.actor.isOwner) new foundry.applications.apps.FilePicker({ type: "image", current: this.actor.img, callback: path => this.actor.update({ img: path }) }).browse();
    });
    this.element.querySelectorAll("[data-npc-add]").forEach(button => button.addEventListener("click", async () => {
      await this.submit();
      const field = button.dataset.npcAdd;
      const defaults = { skills: { name: "", value: 35, expertise: 0 }, attacks: { name: "", value: 35, expertise: 0, damage: "", reach: "", range: "", notes: "" }, protection: { location: "", ap: "", notes: "" }, wounds: { location: "Body", points: 0, lethal: true, detail: "" }, abilities: { name: "", effect: "" } };
      if (defaults[field]) await this.actor.update({ [`system.${field}`]: [...this.actor.system[field].map(asObject), defaults[field]] });
    }));
    this.element.querySelectorAll("[data-npc-remove]").forEach(button => button.addEventListener("click", async () => {
      const [field,indexText] = button.dataset.npcRemove.split(":");
      if (!["skills","attacks","protection","wounds","abilities"].includes(field)) return;
      const confirmed = await foundry.applications.api.DialogV2.confirm({ window: { title: "Confirm deletion" }, content: `Delete this ${field.slice(0,-1)}?`, yes: { label: "Delete" }, no: { label: "Cancel" } });
      if (!confirmed) return;
      const entries = this.actor.system[field].map(asObject);
      entries.splice(Number(indexText),1);
      await this.actor.update({ [`system.${field}`]: entries });
    }));
    this.element.querySelectorAll("[data-npc-roll]").forEach(button => button.addEventListener("click", async () => {
      await this.submit();
      const [field,indexText] = button.dataset.npcRoll.split(":");
      const entry = this.actor.system[field]?.[Number(indexText)];
      if (!entry || !["skills","attacks"].includes(field)) return;
      const other = await foundry.applications.api.DialogV2.prompt({ window: { title: `Roll ${entry.name}` }, content: '<label>Other modifier <input type="number" name="modifier" value="0"></label>', ok: { label: "Roll", callback: (_event,button) => Number(button.form.elements.modifier.value) || 0 } });
      if (other === null) return;
      const roll = await new Roll("1d100").evaluate();
      const target = Number(entry.value) + other, value = roll.total;
      const success = value <= target, rolledSL = Math.floor(target / 10) - Math.floor(value / 10);
      const sl = success ? Math.max(rolledSL, Number(entry.expertise) || 0) : rolledSL;
      const details = field === "attacks" ? `<div class="tbe-attack-stats">${[["DMG",entry.damage],["Reach",entry.reach],["Range",entry.range]].filter(([,v])=>v).map(([k,v])=>`<span><b>${k}</b> ${escapeCard(v)}</span>`).join("")}</div><p>${escapeCard(entry.notes)}</p>` : "";
      const html = rollCard({ kind: field === "attacks" ? "NPC Attack" : "NPC Skill", title: `${this.actor.name} — ${entry.name}`, dieLabel: "d100 roll", die: value === 100 ? "00" : value, resultLabel: "Target", result: target, rows: [["Base",entry.value],["Other",other],["Expertise",entry.expertise || 0],["Rolled SL",rolledSL],["Effective SL",sl]], status: `${success ? "Success" : "Failure"} • ${sl} SL`, tone: success ? "success" : "failure", details });
      await roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor: this.actor }), flavor: html });
    }));
  }
  async _onDrop(event) {
    if (!this.actor.isOwner) return;
    const data = foundry.applications.ux.TextEditor.getDragEventData(event);
    if (data.type !== "Item") return;
    const item = await Item.implementation.fromDropData(data);
    if (!item || !["gear", "weapon", "armor", "shield"].includes(item.type)) return;
    if (item.parent?.documentName === "Actor" && item.parent.id === this.actor.id) return;
    const copy = item.toObject();
    delete copy._id;
    copy.system.quantity = 1;
    await this.actor.createEmbeddedDocuments("Item", [copy]);
  }
}

export function addNPCImportButton(application, element) {
  if (!game.user.isGM) return;
  const root = element instanceof HTMLElement ? element : element?.[0] ?? application?.element;
  if (!root || root.querySelector("[data-tbe-import-npcs]")) return;
  const header = root.querySelector(".directory-header") || root.querySelector(".directory-list")?.parentElement;
  if (!header) return;
  const button = document.createElement("button");
  button.type = "button"; button.dataset.tbeImportNpcs = ""; button.className = "tbe-journal-import-button";
  button.textContent = "Import private TBE NPCs";
  button.addEventListener("click", () => {
    const input = document.createElement("input"); input.type = "file"; input.accept = ".json,application/json";
    input.addEventListener("change", async () => {
      const file = input.files?.[0]; if (!file) return;
      try {
        const data = JSON.parse(await file.text());
        if (data.format !== "tbe-npcs-v1" || !Array.isArray(data.actors) || !data.actors.length || data.actors.some(a => a.type !== "npc" || typeof a.name !== "string" || !a.name || typeof a.system !== "object")) throw new Error("Choose a TBE NPC import JSON file.");
        const confirmed = await foundry.applications.api.DialogV2.confirm({ window: { title: "Import private NPCs?" }, content: `Import ${data.actors.length} NPCs and creatures from this private file into a world compendium? Matching entries will be updated.`, yes: { label: "Import / Update" }, no: { label: "Cancel" } });
        if (!confirmed) return;
        let pack = game.packs.get("world.tbe-npcs");
        if (!pack) pack = await foundry.documents.collections.CompendiumCollection.createCompendium({ name: "tbe-npcs", label: "TBE NPCs & Creatures (Private)", type: "Actor" });
        const index = await pack.getIndex({ fields: ["type","flags.broken-empires-foundry.sourceKey"] });
        const byKey = new Map(index.map(row => [row.flags?.[SYSTEM]?.sourceKey, row]));
        let created=0,updated=0;
        for (const actor of data.actors) {
          const key = actor.flags?.[SYSTEM]?.sourceKey;
          if (!key) throw new Error(`${actor.name} has no source key.`);
          const old = byKey.get(key) ?? index.find(row => row.type === "npc" && row.name === actor.name);
          if (old) { const document = await pack.getDocument(old._id); await document.update({ name: actor.name, img: actor.img, system: actor.system }); updated++; }
          else { await Actor.implementation.createDocuments([actor], { pack: pack.collection }); created++; }
        }
        ui.notifications.info(`TBE NPCs: ${created} created, ${updated} updated in the private compendium.`);
      } catch(error) { console.error("TBE: NPC import failed",error); ui.notifications.error(`TBE NPC import failed: ${error.message}`); }
    }, { once:true }); input.click();
  });
  header.append(button);
}
