# The Broken Empires Foundry system

An unofficial, lightweight Foundry VTT v14 system. Version 0.3.0 provides a manually editable character sheet and Item-based talents, weapons, armor, shields, and gear. Character creation calculations, combat, and rolls remain manual.

## Install or update on Forge

Install or update a **Game System** using this manifest URL:

`https://raw.githubusercontent.com/antiochusblack/broken-empires-foundry/main/system.json`

Commit these files to `main` and create a GitHub release tagged `v0.3.0` with the asset `broken-empires-foundry-v0.3.0.zip`. The archive contains a top-level `broken-empires-foundry/` folder with `system.json` immediately inside. Restart the world after updating.

## Equipment

The character sheet groups Items as Held and Ready, At Hand, Inventory (Stored), At Home / Elsewhere, and Worn Armor. Open an owned Item to change its placement. Selecting a body location for an owned armor piece also marks it as worn. Only worn armor appears in a body protection slot; a sundered piece grants zero AP. The sheet flags two pieces assigned to the same slot.

Weapon ENC counts ready and at-hand weapons and shields (capacity 6). Inventory ENC counts stored items, one point per carried armor piece, and one point per 500 sp. Worn armor contributes Bulk to the displayed armor Initiative penalty (Bulk / 3, rounded up). Gear uses quantity × ENC per item. The four standard Supply Dice are abstracted separately, without Inventory ENC. A spare Supply Die can be entered as a Gear Item with ENC 2.

Filled armor and inventory rows from earlier versions are copied to embedded Items once when a GM opens the world. Their original row data remains in the actor record as a backup. New characters start with Fists/Kicks, a blank weapon and talent, plus empty armor, shield, and gear Items kept away from the character until placed. Previously entered weapons and talents remain in place.

Wounds track infection and septic status individually, with a character-level in-game sepsis deadline field.
