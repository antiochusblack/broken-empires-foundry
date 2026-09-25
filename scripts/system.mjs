const { NumberField, SchemaField, StringField } = foundry.data.fields;

class CharacterData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const score = () => new NumberField({ required: true, integer: true, min: 0, initial: 0 });
    return {
      description: new StringField({ required: true, blank: true, initial: "" }),
      notes: new StringField({ required: true, blank: true, initial: "" }),
      resolve: new SchemaField({ value: score(), max: score() }),
      skills: new SchemaField({
        melee: score(),
        ranged: score(),
        dodge: score()
      })
    };
  }
}

const HandlebarsSheet = foundry.applications.api.HandlebarsApplicationMixin(
  foundry.applications.sheets.ActorSheetV2
);

class CharacterSheet extends HandlebarsSheet {
  static DEFAULT_OPTIONS = {
    classes: ["tbe", "character-sheet"],
    tag: "form",
    position: { width: 620, height: 610 },
    window: { resizable: true },
    form: { submitOnChange: true, closeOnSubmit: false }
  };

  static PARTS = {
    main: { template: "systems/broken-empires-foundry/templates/character.hbs" }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.system = this.actor.system;
    return context;
  }
}

Hooks.once("init", () => {
  CONFIG.Actor.dataModels.character = CharacterData;
  foundry.documents.collections.Actors.registerSheet(
    "broken-empires-foundry",
    CharacterSheet,
    { types: ["character"], makeDefault: true, label: "TBE Character" }
  );
});
