# The Broken Empires Foundry system

An unofficial, lightweight Foundry VTT v14 system. Version 0.4.0 provides a manually editable character sheet and Item-based talents, weapons, armour, shields, and gear. Character creation calculations, combat, and rolls remain manual.

## Install or update on Forge

Install or update a **Game System** using this manifest URL:

`https://raw.githubusercontent.com/antiochusblack/broken-empires-foundry/main/system.json`

Commit these files to `main` and create a GitHub release tagged `v0.4.0` with the asset `broken-empires-foundry-v0.4.0.zip`. The archive contains a top-level `broken-empires-foundry/` folder with `system.json` immediately inside. Restart the world after updating.

## Equipment

The character sheet groups Items as Held and Ready, At Hand, Inventory (Stored), At Home / Elsewhere, and Worn Armour. Change an owned Item’s location from its selector on the character sheet; it moves to the selected area. The Item sheet also has this selector. Set an armour Item’s body location on the Item before adding it to a character. An owned piece is worn only when its placement is Worn. Only worn armour appears in a body protection slot; a sundered piece grants zero AP. The sheet flags two pieces assigned to the same slot.

Weapon ENC counts ready and at-hand weapons and shields (capacity 6). Inventory ENC counts stored items, one point per carried armour piece, and one point per 500 sp. Worn armor contributes Bulk to the displayed armour Initiative penalty (Bulk / 3, rounded up). Gear uses quantity × ENC per item. The four standard Supply Dice have d12, d10, d8, d6, and Depleted choices and use no Inventory ENC. A spare Supply Die can be entered as a Gear Item with ENC 2.

Filled armour and inventory rows from earlier versions are copied to embedded Items once when a GM opens the world. Their original row data remains in the actor record as a backup. New characters start with Fists/Kicks, a blank weapon and talent, plus empty armour, shield, and gear Items kept away from the character until placed. Previously entered weapons and talents remain in place.

Wounds track infection and septic status individually, with a character-level in-game sepsis deadline field.

## Wounds and Item copies

The combat section totals lethal and nonlethal Wound Points at each of six body locations. Choose a general location on every wound; existing detailed locations are inferred where possible. LL is a character-wide limit, shown beside each location as a reference. Unassigned wounds still count toward overall lethal and nonlethal totals.

Use **+ Item** to create an owned Item and open its editor. Item cards can be dragged between character sheets. The GM can use **Copy to Items** on a card to create a reusable world Item, with character-specific placement and damage state cleared.
