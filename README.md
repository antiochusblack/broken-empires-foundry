# The Broken Empires Foundry system

An unofficial, lightweight Foundry VTT v14 system. Version 0.18.0 has an editable character sheet, owned Item sheets, equipment and Talent compendiums, and a manual-target attack roll. Defence, opposed outcome, damage and wounds remain table decisions.

## Install or update on Forge

Install or update the **Game System** using:

`https://raw.githubusercontent.com/antiochusblack/broken-empires-foundry/main/system.json`

Commit these files to `main`, then create a GitHub release tagged `v0.18.0` and attach `broken-empires-foundry-v0.18.0.zip`. The ZIP contains a top-level `broken-empires-foundry/` folder. Restart the world after updating.

When the first GM opens a world, the system creates a separate **TBE Equipment** world compendium with 121 entries and folders based on the book categories. Existing starter equipment and any edited compendiums are preserved. The new pack adds missing entries on startup without overwriting existing entries. Armour examples have their body location defined before they are dragged onto a sheet; placement belongs to the owned copy. To reuse a character's Item as a world Item, drag it to the Items sidebar. The compendium is stored with that world.

## Equipment

The character sheet has Held and Ready, At Hand, Worn, Inventory (Stored), and At Home / Elsewhere areas. Every area accepts a dropped Item and has **+ Item**, which makes a new owned Item directly in that area. The location selector moves owned Items between areas. The Worn area also shows armour missing a valid body location so it can be repaired or deleted. The protection slots show worn armour by body location; two pieces in one slot are flagged.

Only At Hand weapons and shields count against the editable At Hand ENC limit (6 by default). Held and Ready has no ENC limit; its ENC is displayed separately for reference. One weapon marked as free At Hand (such as the first dagger) uses no ENC there. Inventory ENC includes stored items, non-armour worn Items, carried armour (1 ENC per piece), ready or at-hand gear, and one point per 500 sp. Worn armour contributes Bulk to the displayed Initiative penalty (Bulk / 3, rounded up). Gear uses quantity × ENC per Item. **At Home / Elsewhere** contributes zero. The At Hand limit, Inventory limit, and worn Bulk are tracked separately. The four standard Supply Dice use no Inventory ENC.

New characters start with Fists/Kicks and a blank Talent. Equipment areas start empty. Existing placeholder Items remain editable; you may remove any you no longer need. Filled armour and equipment rows from versions before 0.3.0 migrate once into owned Items, leaving their original rows in the actor data as a backup.

## Wounds and deletion

The sheet shows lethal WP, nonlethal WP and their combined total at each body location. That location total is used for the Wound Die impairment check. Overall lethal WP is displayed against the character-wide LL. Wounds without a recognised general location still contribute to overall totals and are flagged for assignment. Every sheet deletion asks for confirmation, including shared histories, NPC relationships, Items and wounds. Wounds also track ritual damage, infection and septic status individually.

## Attack and combat reference

Weapons in Held and Ready or At Hand have an Attack button. Select a Combat skill, tick common modifiers and enter any other situational modifier. An At Hand weapon defaults to Draw and Attack (−20), which can be unchecked if already drawn; throwing knives and unarmed attacks are exempt. The chat message shows the d100 result, rolled SLs, critical state, general hit location, and an optional detailed-location lookup for the defender's ones die. No target token is required. The Reference section lists manoeuvres, common modifiers and turn reminders.

## Changes in 0.18.0

- Cast a spell and Request a miracle sit together beneath the Magic heading.
- Save as PDF opens a printable sheet including collapsed sections; use the browser’s Save as PDF destination. Back up data downloads a Foundry JSON copy suitable for reimporting.
- Identity shows Total XP, Spent XP and Current XP. The saved XP log records dated rewards as positive entries and purchases as negative entries; existing XP is retained as the starting total.
- A parchment, dark green and brass sheet theme uses bundled Cinzel and Alegreya fonts with their open font licences.
- The Edit Roll context option uses Foundry v14’s menu fields. It applies to new skill and weapon attack cards made after 0.17.0.
- Wounds can roll the Wound Die and infection after infectious attacks or events. Journey Infection and Sepsis checks have separate buttons. Condition checkboxes record impairment, Shock, Prone, unconsciousness, Dying and related effects; results explain manual follow-up rolls or Resolve choices.

## Changes in 0.17.0

- Spell casting accepts negative Other TC, shows live Total Cost, labels Bind roll modifiers next to Binds, adds a Strand modifier, and preserves unfinished casting settings until cast or reset. Bind and Strand hover help uses the relevant book descriptions.
- Request a miracle opens a Piety casting dialogue with roll modifiers, requests, holy symbol die and Piety expenditure. The Piety total reflects spent Piety.
- The new **TBE Example Threads** pack contains 30 original Bind and Strand Threads, including die and consumable examples.
- Turn Reminder help opens upward so it remains on screen.
- Fatigue can be edited directly; the Resolve track and current Resolve adjust together.
- Delete buttons across the character sheet use matching compact × controls and retain confirmation dialogs.
- Right-click a skill or weapon attack chat card to **Edit Roll**. The roller or GM can revise the target or d100 result, which recalculates success, SLs and general hit location.

## Changes in 0.16.0

- Main section headings match the tabs: Identity, Skills, Magic, Combat, Gear, Story, and Reference.
- Threads are draggable Items with a description, Thread die or points, and room for applicable Binds and Strands. Legacy Threads text is copied into an Item on world startup.
- Equipment locations, including custom locations, can be dragged into a saved order per character.
- True Name and Fraying sit in one compact row.
- Resolve tracks use slashes for spent Resolve and crosses for Fatigue, with click and right-click controls. Taking Fatigue does not erase spent Resolve; a full track warns of Fatigue-based wounds.
- Cast a spell guides shaping, Bind and Strand requisites, casting roll, Threads, mitigation, Weave Reaction roll, and chat summary. GM judgement is needed for costs, applicability and reaction effects.

## Changes in 0.15.0

- Armour items receive the book's default skill penalties; existing edited penalty values remain editable and are preserved.
- Combat values and Identity & Creation fields use compact layouts. Gear supplies use four columns and Strands use two.
- Defensive AP selection and its single Apply Defensive AP switch appear beside armour protection by location.
- Character inventory cards show Qty beside item names; size remains available on the Item sheet.
- Piety and Binds use the normal skill layout, including Increases, Total % rolls and breakdowns.
- Explanatory sheet text is available through information icons beside headings.
- Character section tabs can be dragged into a preferred order, saved on that character.

## Changes in 0.14.0

- Gear Items have a size and editable quantity. Quantity multiplies ENC; dragging an Item onto the sheet starts its quantity at one.
- Attack rolls include a non-lethal weapon for lethal injury −10 option and an editable inventory overflow penalty. Skill rolls have an editable inventory overflow penalty.
- Ready shields and eligible secondary weapons can be selected as Defensive AP, with an on/off switch. Armour by location shows worn AP, defensive AP and their total separately.
- Worn armour Items have editable Stealth, Dodge, Athletics, Perception and Rise from Prone penalties. The heavier leg piece's Athletics penalty applies once. Relevant skill rolls offer an armour penalty switch; Athletics has a swimming penalty switch.
- Combat has a separate Rise from Prone roll. Rise a Fighter's alternate skill is set on its Talent Item. On Your Feet and Jump Up reduce the body armour penalty when rising.
- The redundant Total carried burden display is removed.

The equipment pack includes all standard tabulated weapon profiles, four shields, six body-location pieces for each of the eight armour types, and the miscellaneous table. The two longsword stances and thrown profiles are separate reference Items; add the profile needed for play instead of treating them as separate purchases. Book services and property are represented as Gear Items for browsing. Some specialised entries, such as horse barding, need their details selected when acquired.

## Talent compendium

The GM's first world startup after updating creates a separate **TBE Talents** world compendium with 150 named book Talents, an Expertise reference Item and two house-rule Items. Folders follow the eight talent categories from the book, plus Expertise and House Rules. Existing Talent Items are never overwritten. Drag a Talent onto a character or copy it from the pack into the Items directory. The sheet keeps the book category and page reference separate from the character-specific Source field. The Runesmith Item is marked **Draft** because some effect conversions in the rune magic draft remain undecided. The Shield Wall house-rule variant is separate from the standard book Talent.

## Private rulebook Journals

The full rulebook text is **not** bundled in this public system or its ZIP. The GM can download the separate `TBE_Rulebook_Journals_Private.json`, open the **Journals sidebar**, click **Import TBE rulebook Journals** at the top, and select that JSON file. This creates chapter Journals with searchable text pages in the world's **TBE Rulebook** folder. Revision 2 presents paragraphs in column order. Importing the revised file into a world with earlier imported Journals updates their matching PDF pages in place, preserving Journal identity, permissions and unrelated pages. The confirmation explains that it will replace existing imported page text; an interrupted import can be resumed with the same file. Only a GM sees the import button. Keep the JSON private; it contains the full book text. Consult the original PDF for artwork, diagrams and complex tables because text extraction cannot preserve their layout.

## RollTables (private import)

The rulebook tables are supplied as a **separate private JSON file**, not in the public system repository or release ZIP. In Foundry, a GM opens the **Tables** sidebar, clicks **Import TBE RollTables**, and selects `tbe-rolltables-private.json`. The importer creates named world RollTables in Character Creation, Travel, Combat, Magic, Solo Play, Names, Treasure, and Naval Combat folders; the Enemy Subtable stays at the top level. Running the import again updates the tables it created without duplicating them. Keep the JSON private, as it contains book text.

The Treasure Item Table rolls Type C (1d100) by default. Type A and B have dedicated tables with their +20 and +10 dice formulas, including entries above 100. The book also specifies −10/−20/−30 for Types D/E/F but gives no result for totals below 1; use the Type C table with the appropriate modifier and GM judgement on an out-of-range roll. Journey and HexMarch Fatigue tables roll their unmodified dice; apply the travel modifiers according to the book.

### 0.11.0 sheet changes

- Click the portrait to choose the actor picture; add custom skills in Combat, Adventuring, Social, and Lore directly below their category headings; hover skills and key mechanical fields for explanations.
- Skill rows have dividers; Supply Dice have roll buttons that reduce the die on 1–2 and report reductions in chat.
- Attack chat shows weapon statistics other than cost. Draw & Attack moves a drawn weapon to Held and Ready. Dropped in Zone sits above At Home / Elsewhere and includes a zone name.

### 0.12.0 sheet changes

- New characters have two ability score slots. Enter a full ability name or its three-letter abbreviation to apply its +5 to the listed skills. Skill rows show Starting, Ability, Other, Total, Expertise and Savvy; open Breakdown to record Race, Culture, Life Events, Career, Rounding Out, XP and other contributions. Existing recorded totals are preserved on the GM's first launch of 0.12.0 when an ability was already selected; check a migrated character's breakdown before reallocating older manually entered bonuses.
- Custom skills retain their category after saving. Use + Equipment location to create named areas, and Count ENC to include their contents in Inventory ENC. Removing a location moves its items to At Home / Elsewhere. Weapon ENC maximum is editable.
- The Resolve track shows available, spent, temporary Fatigue and permanent Fatigue. Click an available box to spend Resolve, a spent box to recover one, or a temporary Fatigue box to clear it. + Fatigue adds one temporary Fatigue; permanent Fatigue remains editable only through its number field.
- The TBE Playable Races compendium contains six Race Items. Drag one onto a character to fill Race and Race Traits. Manually entered traits are retained; dropping another Race replaces traits that were supplied by the previous Race Item.

### Pierce Through (house rule)

A thrown javelin or spear may use 4 SL to Pierce Through when shield AP stops or reduces the attack. Mark the owned Small, Medium or Large shield as pinned: its AP drops by 2, to a minimum of 0, until the lodged weapon is removed with a Minor Action. Additional pins do not stack; the earlier proposal makes a second pin cumbersome, adjudicated manually. Bucklers do not use this toggle.

### 0.12.3 sheet changes

Skill headings align with standard and custom rows. Each skill keeps its description tooltip and a compact breakdown control beside the name; Ability appears in the breakdown and its bonus is included in the Increases column. Custom skills use the same row layout, with description/category inside the breakdown and a compact delete button. Tooltips choose the side with space. Main sections can be collapsed, and navigation reopens them.

The Resolve track distinguishes empty spent spaces from Fatigue even when current Resolve is zero. Removing Fatigue leaves a spent space and the full-track warning checks Fatigue marks, not remaining Resolve. Only At Hand weapons and shields count against the default 6 ENC limit; Held and Ready has no limit and is shown separately. Owned Small, Medium and Large shields have a Pierced Through checkbox that reduces displayed AP by 2 until cleared.

### 0.13.0 sheet changes

- Skill breakdown fields now open beneath the skill and stay open while values are edited. Removing Thin or Savvy asks for confirmation. Gear comes between Combat and Story, and main sections have alternating subtle shades.
- Skill and attack rolls show playful fumble and critical messages. The Heavy Crossbow reload note now says two actions. A shield's reduced AP says “Pierced Through.”
- Dagger, Hand Axe, Spear and Javelin can switch between melee and thrown profiles on the character sheet. Existing owned copies of those four weapons also support the switch. Thrown attacks do not automatically move an Item into Dropped in Zone.
- Recognised weapon and armour note terms have tooltips. Pierce Through 4 SL (thrown only) appears in the spear and javelin notes. Each Item in Dropped in Zone has its own Zone field; existing dropped Items inherit the former shared Zone on first update.
