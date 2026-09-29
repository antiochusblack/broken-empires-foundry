const ACTIONS = {
  rollSkill: { label: "Roll", selector: "[data-roll-skill]" },
  attackItem: { label: "Attack", selector: "[data-attack-item]" },
  castSpell: { label: "Cast a spell", selector: "[data-cast-spell]" },
  requestMiracle: { label: "Request a miracle", selector: "[data-request-miracle]" },
  rollInitiative: { label: "Roll Initiative", selector: "[data-roll-initiative]" },
  riseFromProne: { label: "Rise from Prone", selector: "[data-rise-from-prone]" },
  rollSupply: { label: "Supply", selector: "[data-roll-supply]" },
  rollThread: { label: "Thread", selector: "[data-roll-thread]" },
  woundRoll: { label: "Wound Die", selector: "[data-wound-roll]" },
  infectionRoll: { label: "Infection Die", selector: "[data-infection-roll]" }
};

function actionFromButton(button) {
  for (const [key, { selector }] of Object.entries(ACTIONS)) {
    if (!button.matches(selector)) continue;
    return { action: key, value: button.dataset[key] ?? "", woundIndex: button.dataset.woundIndex ?? "" };
  }
  return null;
}

export function enableHotbarDrags(sheet) {
  sheet.element.querySelectorAll(Object.values(ACTIONS).map(a => a.selector).join(",")).forEach(button => {
    button.draggable = true;
    button.title = `${button.title ? button.title + " • " : ""}Drag to the macro bar`;
    button.addEventListener("dragstart", event => {
      if (!sheet.actor.isOwner || !event.dataTransfer) { event.preventDefault(); return; }
      const action = actionFromButton(button);
      if (!action) return;
      event.stopPropagation(); // Equipment cards are also draggable.
      event.dataTransfer.setData("text/plain", JSON.stringify({ type: "TBEHotbarAction", actorUuid: sheet.actor.uuid, ...action,
        name: button.dataset.skillName || sheet.actor.items.get(action.value)?.name || "" }));
      event.dataTransfer.effectAllowed = "copy";
    });
  });
}

export function installHotbarActions() {
  game.system.api ??= {};
  game.system.api.runSheetAction = async (actorUuid, action, value = "", woundIndex = "") => {
    const actor = await fromUuid(actorUuid);
    if (!actor || actor.type !== "character" || !actor.isOwner || !ACTIONS[action]) {
      ui.notifications.warn("This character or action is no longer available to you.");
      return;
    }
    const sheet = actor.sheet;
    await sheet.render(true);
    const button = [...sheet.element.querySelectorAll(ACTIONS[action].selector)].find(element =>
      (element.dataset[action] ?? "") === value && (element.dataset.woundIndex ?? "") === woundIndex);
    if (!button) { ui.notifications.warn("That action is no longer on this character sheet."); return; }
    button.click();
  };
}

Hooks.on("hotbarDrop", (_hotbar, data, slot) => {
  if (data.type !== "TBEHotbarAction") return;
  void (async () => {
    if (!game.user.hasPermission("MACRO_SCRIPT")) {
      ui.notifications.warn("Ask the GM to enable Create Script Macros for your Foundry role before adding sheet actions to the hotbar.");
      return;
    }
    const actor = await fromUuid(data.actorUuid);
    if (!actor || actor.type !== "character" || !actor.isOwner || !ACTIONS[data.action]) return;
    const { action } = data;
    const value = String(data.value ?? ""), woundIndex = String(data.woundIndex ?? "");
    const label = data.name ? `${ACTIONS[action].label}: ${data.name}` : ACTIONS[action].label;
    const identity = { actorUuid: actor.uuid, action, value, woundIndex };
    let macro = game.macros.find(m => m.isOwner && JSON.stringify(m.getFlag("broken-empires-foundry", "hotbarAction")) === JSON.stringify(identity));
    if (!macro) macro = await Macro.create({ name: `${actor.name} — ${label}`, type: "script", img: actor.img || "icons/svg/d20-black.svg",
      command: `game.system.api.runSheetAction(${[actor.uuid, action, value, woundIndex].map(JSON.stringify).join(", ")});`,
      flags: { "broken-empires-foundry": { hotbarAction: identity } } });
    await game.user.assignHotbarMacro(macro, slot);
  })().catch(error => { console.error("TBE hotbar action", error); ui.notifications.error("Could not add that action to the hotbar."); });
  return false;
});
