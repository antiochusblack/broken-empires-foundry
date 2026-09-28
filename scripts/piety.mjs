// Keep the old skill fields readable until a character's first Piety log entry.
export function pietyBaseline(actor) {
  const base = Number(actor.system.pietyBase);
  if (Number.isInteger(base) && base >= 0) return base;
  const skill = actor.system.skills?.magic?.piety ?? {};
  const changes = ["race", "culture", "lifeEvents", "career", "rounding", "xp", "other"]
    .reduce((sum, field) => sum + (Number(skill[field]) || 0), 0);
  const spent = Math.max(0, Number(actor.system.pietySpent) || 0);
  const hasGodbound = actor.items?.some(item => item.type === "talent" && item.name.trim().toLowerCase() === "godbound");
  const configured = Number(skill.value) !== 20 || changes !== 0 || spent !== 0;
  return Math.max(0, configured ? (Number(skill.value) || 0) + changes - spent : hasGodbound ? 30 : 0);
}

export function currentPiety(actor) {
  const entries = actor.system.pietyEntries ?? [];
  const changes = entries.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
  return Math.max(0, Math.min(90, pietyBaseline(actor) + changes));
}

export async function recordPiety(actor, amount, description) {
  if (!Number.isInteger(amount) || !description?.trim()) throw new Error("Piety changes need an amount and reason.");
  const entries = (actor.system.pietyEntries ?? []).map(row => ({ date: row.date, description: row.description, amount: Number(row.amount) || 0 }));
  entries.push({ date: new Date().toLocaleDateString("en-CA"), description, amount });
  await actor.update({ "system.pietyBase": pietyBaseline(actor), "system.pietyEntries": entries });
}
