# IM-Auto-Attack
An Imperium Maledictum auto-attack module for Foundry, with additional bulk token manager controls

## Target Prioritization
- Hostile tokens will prioritize the closest player, friendly, and neutral target, in that order. If the target is out of "arm's reach" (within a square) it will ask if you would like to use a ranged attack or cancel and move.
- Friendly and Neutral tokens will prioritize the closest hostile target. If the target is out of "arm's reach" (within a square) it will ask if you would like to use a ranged attack or cancel and move.

## Setting up default attacks
The macro will look for powers, weapons, or attacks with an * at the end of the name, i.e. _"Rending Claws*"_. For ranged attacks, it will look for ***R**, i.e. _"Heavy Bolter *R"_. The macro will randomly choose an attack from found options if more than one item on the token's sheet has a * or ***R** indicator.

> ### A note about the first turn in an encounter:
> If a token with auto-attack is up first when combat first begins, the macro will select a target but not roll a default attack, in case you would like to set up the battlefield before starting the encounter properly. You can roll a default attack using the DefaultAttack.js macro when you are ready to begin. All tokens following the first turn that have the auto-attack trait will try to set up an auto-attack on their turn. I might change this functionality in the future if there's a demand for it.

## Bulk Token Actions
 - ### Clear Effects
   Clears all status effects on all selected tokens.

 - ### Reset Wounds
   Resets wounds to 0 on all selected tokens.

 - ### Set Name
   Enter a name for all selected tokens.

 - ### Set Name Display
   Configure visibility of name on all selected tokens.

 - ### Set Wounds Display
   Configure visibility of wounds on all selected tokens.

 - ### Set Image
   Set an image as the artwork for all selected tokens.
   Uses a skull as default.

 - ### BulkTokenLights
   Set a light effect on selected tokens. If the tokens already have a light, it turns them off.

## Macros 

## Combat Macros
Standalone combat macros, to be used with or without auto-combat.
 - ### Auto-Target
 - ### Target Player
 - ### Default Attack

## Other Macros
These macros are still in development, but included in case you want to play around with them.
 - ### Reset Elevation
   Resets elevation for selected tokens.
 - ### Clear Zone Effects
   Sometimes, my zone effects tend to get stuck. This clears any active effects on a selected zone.
 - ### Loot
   This is the ugliest macro I have ever written, but it does make giving my players loot easier. Essentially, the macro will display a list of roll tables from the IMAA Compendium folder labeled "Loot". It will use the last skill check displayed in chat to determine the loot. A better roll results in more loot: 1–20 = 4 rolls/items, 21–40 = 3 rolls/items, 41–60 = 2 rolls/items, 61–100 = 1 roll/item. It doesn't check if it was a success or not because I couldn't figure it out. I was sleepy and grumpy and overcomplicated the whole thing. I might work on it again later, but more likely I'll realize there's a better way to handle this and re-do it completely. Sorry in advance to anyone who ever makes the mistake of actually looking at it!
