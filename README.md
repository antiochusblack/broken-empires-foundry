# The Broken Empires Foundry system

An unofficial, lightweight Foundry VTT v14 system. Version 0.6.0 has an editable character sheet, owned Item sheets, an equipment compendium and a manual-target attack roll. Defence, opposed outcome, damage and wounds remain table decisions.

## Install or update on Forge

Install or update the **Game System** using:

`https://raw.githubusercontent.com/antiochusblack/broken-empires-foundry/main/system.json`

Commit these files to `main`, then create a GitHub release tagged `v0.6.0` and attach `broken-empires-foundry-v0.6.0.zip`. The ZIP contains a top-level `broken-empires-foundry/` folder. Restart the world after updating.

When the first GM opens a world, the system creates a separate **TBE Equipment** world compendium with 121 entries and folders based on the book categories. Existing starter equipment and any edited compendiums are preserved. The new pack adds missing entries on startup without overwriting existing entries. Armour examples have their body location defined before they are dragged onto a sheet; placement belongs to the owned copy. To reuse a character's Item as a world Item, drag it to the Items sidebar. The compendium is stored with that world.

## Equipment

The character sheet has Held and Ready, At Hand, Worn, Inventory (Stored), and At Home / Elsewhere areas. Every area accepts a dropped Item and has **+ Item**, which makes a new owned Item directly in that area. The location selector moves owned Items between areas. The Worn area also shows armour missing a valid body location so it can be repaired or deleted. The protection slots show worn armour by body location; two pieces in one slot are flagged.

Weapon ENC includes Held and Ready and At Hand weapons and shields. One weapon marked as free At Hand (such as the first dagger) uses no ENC there. Inventory ENC includes stored items, non-armour worn Items, carried armour (1 ENC per piece), ready or at-hand gear, and one point per 500 sp. Worn armour contributes Bulk to the displayed Initiative penalty (Bulk / 3, rounded up). Gear uses quantity × ENC per Item. **At Home / Elsewhere** contributes zero. The displayed total carried burden adds Weapon ENC, Inventory ENC and worn Bulk for reference; the separate limits still apply. The four standard Supply Dice use no Inventory ENC.

New characters start with Fists/Kicks and a blank Talent. Equipment areas start empty. Existing placeholder Items remain editable; you may remove any you no longer need. Filled armour and equipment rows from versions before 0.3.0 migrate once into owned Items, leaving their original rows in the actor data as a backup.

## Wounds and deletion

The sheet shows lethal WP, nonlethal WP and their combined total at each body location. That location total is used for the Wound Die impairment check. Overall lethal WP is displayed against the character-wide LL. Wounds without a recognised general location still contribute to overall totals and are flagged for assignment. Item and wound deletion ask for confirmation. Wounds also track ritual damage, infection and septic status individually.

## Attack and combat reference

Weapons in Held and Ready or At Hand have an Attack button. Select a Combat skill, tick common modifiers and enter any other situational modifier. An At Hand weapon defaults to Draw and Attack (−20), which can be unchecked if already drawn; throwing knives and unarmed attacks are exempt. The chat message shows the d100 result, rolled SLs, critical state, general hit location, and weapon base damage. The defender's roll and detailed hit location are resolved at the table. It never requires a target token. The Combat reference section lists the manoeuvres, common modifiers and turn reminders in expandable entries.

The equipment pack includes all standard tabulated weapon profiles, four shields, six body-location pieces for each of the eight armour types, and the miscellaneous table. The two longsword stances and thrown profiles are separate reference Items; add the profile needed for play instead of treating them as separate purchases. Book services and property are represented as Gear Items for browsing. Some specialised entries, such as horse barding, need their details selected when acquired.
