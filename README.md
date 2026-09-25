# The Broken Empires Foundry system

An unofficial, lightweight Foundry VTT v14 game system. Version 0.2.0 adds the character creation and character sheet fields, editable skills, Expertise and Savvy, custom skills/resources, fatigue and wounds, and Item-based talents and weapons. Character creation bonuses, combat and rolls are entered manually for now.

## Install or update on Forge

Install or update a **Game System** using this manifest URL:

`https://raw.githubusercontent.com/antiochusblack/broken-empires-foundry/main/system.json`

Commit these files to `main` and create a GitHub release tagged `v0.2.0` with the asset `broken-empires-foundry-v0.2.0.zip`. The archive contains a top-level `broken-empires-foundry/` folder with `system.json` immediately inside. Restart your world after updating the system.

Existing test characters keep their name, concept, Resolve and notes. The old Melee, Ranged and Dodge test values are copied to Melee: Light, Missile and Dodge when a GM opens the world. All new fields can be filled out on the sheet.

Use **Add talent** to make an editable Talent Item with a name, source and effect. Talent Items can also be dropped from the Items sidebar or a compendium onto a character sheet. Weapons are Items too. Gear, armor, wounds and custom resources are editable sheet entries.
