# The Broken Empires Foundry system

An unofficial, lightweight Foundry VTT v14 system. Version 0.5.0 has an editable character sheet, owned Item sheets, and a starter equipment compendium. Character creation, combat and rolls remain manual.

## Install or update on Forge

Install or update the **Game System** using:

`https://raw.githubusercontent.com/antiochusblack/broken-empires-foundry/main/system.json`

Commit these files to `main`, then create a GitHub release tagged `v0.5.0` and attach `broken-empires-foundry-v0.5.0.zip`. The ZIP contains a top-level `broken-empires-foundry/` folder. Restart the world after updating.

When the first GM opens a world, the system creates a **TBE Starter Equipment** world compendium with 14 sample Items from the rulebook. It does not replace a compendium you have already edited. Armour examples have their body location defined before they are dragged onto a sheet; placement belongs to the owned copy. To reuse a character's Item as a world Item, drag it to the Items sidebar. The compendium is stored with that world.

## Equipment

The character sheet has Held and Ready, At Hand, Worn, Inventory (Stored), and At Home / Elsewhere areas. Every area accepts a dropped Item and has **+ Item**, which makes a new owned Item directly in that area. The location selector moves owned Items between areas. The Worn area also shows armour missing a valid body location so it can be repaired or deleted. The protection slots show worn armour by body location; two pieces in one slot are flagged.

Weapon ENC includes Held and Ready and At Hand weapons and shields. One weapon marked as free At Hand (such as the first dagger) uses no ENC there. Inventory ENC includes stored items, non-armour worn Items, carried armour (1 ENC per piece), ready or at-hand gear, and one point per 500 sp. Worn armour contributes Bulk to the displayed Initiative penalty (Bulk / 3, rounded up). Gear uses quantity × ENC per Item. **At Home / Elsewhere** contributes zero. The displayed total carried burden adds Weapon ENC, Inventory ENC and worn Bulk for reference; the separate limits still apply. The four standard Supply Dice use no Inventory ENC.

New characters start with Fists/Kicks and a blank Talent. Equipment areas start empty. Existing placeholder Items remain editable; you may remove any you no longer need. Filled armour and equipment rows from versions before 0.3.0 migrate once into owned Items, leaving their original rows in the actor data as a backup.

## Wounds and deletion

The sheet shows lethal WP, nonlethal WP and their combined total at each body location. That location total is used for the Wound Die impairment check. Overall lethal WP is displayed against the character-wide LL. Wounds without a recognised general location still contribute to overall totals and are flagged for assignment. Item and wound deletion ask for confirmation. Wounds also track ritual damage, infection and septic status individually.
