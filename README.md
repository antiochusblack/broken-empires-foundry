# The Broken Empires Foundry system

An unofficial, lightweight Foundry VTT v14 game system. Version 0.2.6 includes the character creation and character sheet fields, editable skills, Expertise and Savvy, custom skills/resources, fatigue and wounds, and Item-based talents and weapons. Character creation bonuses, combat and rolls are entered manually for now. This update fixes the weapon Item fields to match the book: SP, RCH, DMG, CL, CS, DIS, T, ENC, RNG and Notes. Old prototype fields are retained internally so existing entries are not deleted.

## Install or update on Forge

Install or update a **Game System** using this manifest URL:

`https://raw.githubusercontent.com/antiochusblack/broken-empires-foundry/main/system.json`

Commit these files to `main` and create a GitHub release tagged `v0.2.6` with the asset `broken-empires-foundry-v0.2.6.zip`. The archive contains a top-level `broken-empires-foundry/` folder with `system.json` immediately inside. Restart your world after updating the system.

Existing test characters keep their name, concept, Resolve and notes. The old Melee, Ranged and Dodge test values are copied to Melee: Light, Missile and Dodge when a GM opens the world. All new fields can be filled out on the sheet.

Use **Add talent** to make an editable Talent Item with a name, source and effect. Talent Items can also be dropped from the Items sidebar or a compendium onto a character sheet. Weapons are Items too. Gear, armor, wounds and custom resources are editable sheet entries.

New characters begin with one editable row in each repeatable section, plus Fists/Kicks, a blank weapon and a blank talent. Existing characters receive the starting Items once when a GM opens the world. The character sheet now displays the full weapon table, and armor and inventory columns use aligned grids.

Version 0.2.6 aligns the column headings and fields in every repeated section, including skills, Binds, Strands, custom skills, wounds, resources, traits, histories, relationships, goals, talents, weapons, armor and inventory. Wide tables scroll horizontally within their section on narrower screens.

Version 0.2.6 keeps the 850px opening width and the resizable sheet. Weapon statistics use wrapping cards rather than a wide scrolling table; prose fields grow with their content and list entries wrap at narrow widths.

Version 0.2.6 displays talents in compact blocks with the full source, effect and requirements text wrapped on the character sheet.
