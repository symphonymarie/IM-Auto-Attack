class IMAATokenManager {
  static MODULE_NAME = "IMAA-token-manager";

  static async importFromCompendium() {
    if (!game.user.isGM) return;
    
    // Check if we should import from compendium
    const shouldImport = game.settings.get(this.MODULE_NAME, "importFromCompendium");
    if (!shouldImport) return;
    
    try {
      // Import Auto-Combat trait from compendium if it doesn't exist
      const itemsPack = game.packs.get('bulk-token-manager.bulk-token-manager-items');
      if (itemsPack) {
        const traitIndex = await itemsPack.getIndex();
        const traitEntry = traitIndex.find(e => e.name === "Auto-Combat");
        
        if (traitEntry) {
          const existingTrait = game.items?.find(item => item.name === "Auto-Combat" && item.type === "trait");
          if (!existingTrait) {
            const trait = await itemsPack.getDocument(traitEntry._id);
            if (trait) {
              await Item.create(trait.toObject());
              console.log(`${this.MODULE_NAME} | Auto-Combat trait imported from compendium`);
            }
          }
        }
      }
      
      // Set flag that we've imported
      await game.settings.set(this.MODULE_NAME, "importFromCompendium", false);
      
    } catch (error) {
      console.error(`${this.MODULE_NAME} | Error importing from compendium:`, error);
    }
  }
  
  static initialize() {
    // Register settings
    this.registerSettings();
    
    // Add control button to token HUD
    Hooks.on('getSceneControlButtons', (controls) => {
      this._addSceneControl(controls);
    });
    
    // Setup auto-combat trait and import from compendium
    Hooks.once('ready', () => {
      this.setupAutoCombatTrait();
      this.importFromCompendium();
    });
    
    console.log(`${this.MODULE_NAME} | Initialized`);
  }
    
    // add control button to token HRUD. he likes to feel important. we can add it to the HUD too, i guess.
    Hooks.on('getSceneControlButtons', (controls) => {
      this._addSceneControl(controls);
    });
    
    // setup auto-combat trait
    Hooks.once('ready', () => {
      this.setupAutoCombatTrait();
    });
    
    console.log(`${this.MODULE_NAME} | Initialized`);
  }
  static async importFromCompendium() {
  if (!game.user.isGM) return;
  
  // Check if we should import from compendium
  const shouldImport = game.settings.get(this.MODULE_NAME, "importFromCompendium");
  if (!shouldImport) return;
  
  try {
    // Import Auto-Combat trait from compendium if it doesn't exist
    const itemsPack = game.packs.get('bulk-token-manager.bulk-token-manager-items');
    if (itemsPack) {
      const traitIndex = await itemsPack.getIndex();
      const traitEntry = traitIndex.find(e => e.name === "Auto-Combat");
      
      if (traitEntry) {
        const existingTrait = game.items?.find(item => item.name === "Auto-Combat" && item.type === "trait");
        if (!existingTrait) {
          const trait = await itemsPack.getDocument(traitEntry._id);
          if (trait) {
            await Item.create(trait.toObject());
            console.log(`${this.MODULE_NAME} | Auto-Combat trait imported from compendium`);
          }
        }
      }
    }
    
    // Set flag that we've imported
    await game.settings.set(this.MODULE_NAME, "importFromCompendium", false);
    
  } catch (error) {
    console.error(`${this.MODULE_NAME} | Error importing from compendium:`, error);
  }
}
  static registerSettings() {
    game.settings.register(this.MODULE_NAME, "autoAttackUUID", {
      name: "Auto-Attack Item UUID",
      hint: "UUID of the Auto-Attack item to add/remove from tokens. Will be auto-filled when trait is created.",
      scope: "world",
      config: true,
      type: String,
      default: ""
    });

    game.settings.register(this.MODULE_NAME, "importFromCompendium", {
      name: "Import From Compendium",
      hint: "Automatically import content from compendium on first load",
      scope: "world",
      config: false,
      type: Boolean,
      default: true
    });

    game.settings.register(this.MODULE_NAME, "autoCombatTraitCreated", {
      name: "Auto-Combat Trait Created",
      hint: "Track if Auto-Combat trait has been created",
      scope: "world",
      config: false,
      type: Boolean,
      default: false
    });

    game.settings.register(this.MODULE_NAME, "createAutoCombatTrait", {
      name: "Create Auto-Combat Trait",
      hint: "Click to create the Auto-Combat trait item in your world",
      scope: "world",
      config: true,
      type: Button,
      onClick: () => this.createAutoCombatTrait()
    });
  }
  
  static _addSceneControl(controls) {
    const tokenControls = controls.find(control => control.name === "token");
    
    if (tokenControls) {
      tokenControls.tools.push({
        name: "IMAA-manager",
        title: "IMAA Token Manager",
        icon: "fas fa-users-cog",
        visible: game.user.isGM,
        onClick: () => this.openIMAAManager(),
        button: true
      });
    }
  }

  static async setupAutoCombatTrait() {
    if (!game.user.isGM) return;

    const autoAttackUUID = game.settings.get(this.MODULE_NAME, "autoAttackUUID");
    const traitCreated = game.settings.get(this.MODULE_NAME, "autoCombatTraitCreated");

    // If we have a UUID but the trait doesn't exist, clear the setting. also screw consistent capitalization. i do what I wanT.
    if (autoAttackUUID && autoAttackUUID !== "") {
      try {
        const item = await fromUuid(autoAttackUUID);
        if (!item) {
          console.log(`${this.MODULE_NAME} | Auto-Combat trait not found at UUID: ${autoAttackUUID}, clearing setting`);
          await game.settings.set(this.MODULE_NAME, "autoAttackUUID", "");
        }
      } catch (error) {
        console.error(`${this.MODULE_NAME} | Error checking Auto-Combat trait:`, error);
      }
    }
  }

  static async createAutoCombatTrait() {
    if (!game.user.isGM) {
      ui.notifications.error("Only GMs can create the Auto-Combat trait.");
      return;
    }

    // Check if trait already exists (I'm just kidding about the capitalization. I'm too lazy to stick to one thing or another...)
    const existingTrait = game.items?.find(item => 
      item.name === "Auto-Combat" && item.type === "trait"
    );

    if (existingTrait) {
      // Update setting with existing trait's UUID
      await game.settings.set(this.MODULE_NAME, "autoAttackUUID", existingTrait.uuid);
      await game.settings.set(this.MODULE_NAME, "autoCombatTraitCreated", true);
      ui.notifications.info(`Auto-Combat trait already exists! UUID has been set in module settings.`);
      return;
    }

    // Create the trait for auto-attack (...only tzeentch can judge me for that)
    try {
      const traitData = {
        name: "Auto-Combat",
        type: "trait",
        img: "modules/impmal-core/assets/icons/blank.webp",
        system: {
          notes: {
            player: "",
            gm: ""
          },
          attack: {
            type: "melee",
            characteristic: "",
            skill: {
              key: "",
              specialisation: ""
            },
            damage: {
              SL: false,
              base: "",
              characteristic: "",
              ignoreAP: false
            },
            range: "",
            traits: {
              list: []
            },
            self: false
          },
          test: {
            difficulty: "challenging",
            characteristic: "",
            skill: {
              key: "",
              specialisation: ""
            },
            self: false
          },
          roll: {
            enabled: false,
            formula: "",
            label: ""
          }
        },
        effects: [
          {
            name: "Auto-Combat",
            img: "modules/impmal-core/assets/icons/blank.webp",
            type: "base",
            system: {
              transferData: {
                type: "document",
                originalType: "document",
                documentType: "Actor",
                avoidTest: {
                  value: "none",
                  opposed: false,
                  prevention: true,
                  reversed: false,
                  skill: {}
                },
                testIndependent: false,
                equipTransfer: false,
                selfOnly: false,
                prompt: false,
                area: {
                  templateData: {
                    borderColor: null,
                    fillColor: null,
                    texture: null
                  },
                  keep: false,
                  aura: {
                    transferred: false,
                    render: false
                  },
                  duration: "sustained"
                },
                zone: {
                  type: "zone",
                  transferred: false,
                  traits: {
                    barrier: false,
                    difficult: false,
                    warpTouched: false
                  },
                  skipImmediateOnPlacement: false,
                  keep: false
                }
              },
              itemTargetData: {
                ids: [],
                allItems: false
              },
              scriptData: [
                {
                  script: `const token = canvas.tokens.controlled[0];\nif (!token) {\n    ui.notifications.warn("Please select a token first.");\n    return;\n}\n\n// Check token disposition\nconst disposition = token.document.disposition;\nconst isHostile = disposition === CONST.TOKEN_DISPOSITIONS.HOSTILE;\n\nlet targetTokens = [];\n\nif (isHostile) {\n    // Hostile tokens target anything that's NOT hostile (players, friendly, neutral)\n    targetTokens = canvas.tokens.placeables.filter(t => {\n        if (!t.actor || t.document.hidden || t.id === token.id) return false;\n        \n        // Target any token that is NOT hostile\n        return t.document.disposition !== CONST.TOKEN_DISPOSITIONS.HOSTILE;\n    });\n} else {\n    // Friendly/neutral tokens target hostile tokens only\n    targetTokens = canvas.tokens.placeables.filter(t => \n        t.actor && \n        t.document.disposition === CONST.TOKEN_DISPOSITIONS.HOSTILE &&\n        !t.document.hidden\n    );\n}\n\nif (targetTokens.length === 0) {\n    ui.notifications.warn("No valid targets found.");\n    return;\n}\n\n// Find nearest target token, using priority to break distance ties\nconst nearest = targetTokens.reduce((closest, t) => {\n    const distance = canvas.grid.measureDistance(token.center, t.center);\n    \n    // If no closest target yet, this one becomes closest\n    if (!closest) {\n        return { token: t, distance, priority: getPriority(t) };\n    }\n    \n    // If this token is closer, it becomes the new closest\n    if (distance < closest.distance) {\n        return { token: t, distance, priority: getPriority(t) };\n    }\n    \n    // If distance is equal, use priority to break tie\n    if (distance === closest.distance) {\n        const currentPriority = getPriority(t);\n        if (currentPriority > closest.priority) {\n            return { token: t, distance, priority: currentPriority };\n        }\n    }\n    \n    return closest;\n}, null);\n\nif (!nearest) {\n    ui.notifications.warn("No valid targets found.");\n    return;\n}\n\n// Target the selected token\nnearest.token.setTarget(true, { user: game.user, releaseOthers: true });\nui.notifications.info(\\`Targeting \\${nearest.token.name}\\`);\n\n// Get available attacks\nconst actor = token.actor;\nif (!actor) {\n    ui.notifications.error("No actor associated with selected token");\n    return;\n}\n\n// Calculate distance in grid squares more accurately\nconst tokenPosition = token.center;\nconst targetPosition = nearest.token.center;\nconst gridSize = canvas.grid.size;\n\n// Calculate the difference in grid units\nconst dx = Math.abs(tokenPosition.x - targetPosition.x) / gridSize;\nconst dy = Math.abs(tokenPosition.y - targetPosition.y) / gridSize;\n\n// Use the maximum of dx and dy for grid-based distance (chebyshev distance)\nconst gridDistance = Math.max(dx, dy);\n\nconst isWithinOneSquare = gridDistance <= 1;\n\n// Get attacks\nconst meleeAttacks = actor.items.filter(i => i.name.endsWith("*") && !i.name.endsWith("*R"));\nconst rangedAttacks = actor.items.filter(i => i.name.endsWith("*R"));\n\n// Function to execute a random attack\nfunction executeRandomAttack(attacks, attackType) {\n    if (attacks.length === 0) {\n        ui.notifications.warn(\\`No \\${attackType} attacks found.\\`);\n        return;\n    }\n    \n    // Select one random attack\n    const randomAttack = attacks[Math.floor(Math.random() * attacks.length)];\n    const itemUUID = randomAttack.uuid;\n    game.impmal.utility.rollItemMacro(itemUUID, actor);\n    ui.notifications.info(\\`Using \\${attackType} attack: \\${randomAttack.name}\\`);\n}\n\n// Handle based on distance\nif (isWithinOneSquare) {\n    // Target is within 1 square - use random melee attack\n    executeRandomAttack(meleeAttacks, "melee");\n} else {\n    // Target is more than 1 square away - show dialog\n    new Dialog({\n        title: "Target Out of Range",\n        content: \\`\n            <div style="padding: 10px;">\n                <p>Target is \\${Math.ceil(gridDistance)} squares away. Choose an action:</p>\n            </div>\n        \\`,\n        buttons: {\n            continue: {\n                icon: '<i class="fas fa-bullseye"></i>',\n                label: "Ranged Attack",\n                callback: () => {\n                    executeRandomAttack(rangedAttacks, "ranged");\n                }\n            },\n            cancel: {\n                icon: '<i class="fas fa-walking"></i>',\n                label: "Cancel and Move",\n                callback: () => {\n                    ui.notifications.info("Attack canceled. You may now move your token.");\n                }\n            }\n        },\n        default: "continue"\n    }).render(true);\n}\n\n// Helper function to assign priority values (players > friendly > neutral)\nfunction getPriority(targetToken) {\n    if (targetToken.actor.hasPlayerOwner) return 3; // Players - highest priority\n    if (targetToken.document.disposition === CONST.TOKEN_DISPOSITIONS.FRIENDLY) return 2;\n    if (targetToken.document.disposition === CONST.TOKEN_DISPOSITIONS.NEUTRAL) return 1;\n    return 0;\n}`,
                  label: "Auto Combat Handler",
                  trigger: "startTurn",
                  options: {
                    targeter: false,
                    defending: false,
                    deleteEffect: false
                  },
                  async: false
                }
              ],
              zone: {
                type: "zone",
                traits: {},
                skipImmediateOnPlacement: false
              },
              sourceData: {
                test: {}
              },
              computed: false
            },
            changes: [],
            disabled: false,
            duration: {
              startTime: null,
              combat: null,
              seconds: null,
              rounds: null,
              turns: null,
              startRound: null,
              startTurn: null
            },
            description: "",
            origin: null,
            tint: "#ffffff",
            transfer: true,
            statuses: [],
            sort: 0,
            flags: {
              impmal: {
                manualEffectKeys: false
              }
            }
          }
        ],
        flags: {},
        ownership: {
          default: 0
        }
      };

      const createdTrait = await Item.create(traitData);
      
      if (createdTrait) {
        // Store the UUID in settings (...but he won't because he understands that to be a messy bitch is a lifestyle)
        await game.settings.set(this.MODULE_NAME, "autoAttackUUID", createdTrait.uuid);
        await game.settings.set(this.MODULE_NAME, "autoCombatTraitCreated", true);
        
        ui.notifications.info(`Auto-Combat trait created successfully! UUID has been set in module settings.`);
        console.log(`${this.MODULE_NAME} | Auto-Combat trait created with UUID: ${createdTrait.uuid}`);
      }
    } catch (error) {
      console.error(`${this.MODULE_NAME} | Error creating Auto-Combat trait:`, error);
      ui.notifications.error(`Failed to create Auto-Combat trait: ${error.message}`);
    }
  }
  
  static openIMAAManager() {
    const selectedTokens = canvas.tokens.controlled;
    
    if (selectedTokens.length === 0) {
      ui.notifications.warn("Please select one or more tokens first.");
      return;
    }
    
    new IMAATokenDialog(selectedTokens).render(true);
  }
}

class IMAATokenDialog extends Dialog {
  constructor(selectedTokens, options = {}) {
    super({
      title: `IMAA Token Manager - ${selectedTokens.length} Token(s) Selected`,
      content: this._getContent(selectedTokens),
      buttons: {
        close: {
          icon: '<i class="fas fa-times"></i>',
          label: "Close"
        }
      },
      default: "close",
      ...options
    }, {
      width: 600
    });
    
    this.selectedTokens = selectedTokens;
    this.lightConfigs = this._getLightConfigs();
  }
  
  _getContent(selectedTokens) {
    const autoAttackUUID = game.settings.get("IMAA-token-manager", "autoAttackUUID");
    const uuidStatus = autoAttackUUID ? 
      `<span style="color: #4CAF50;">✓ UUID Set!</span>` : 
      `<span style="color: #f44336;">✗ Not Set!</span>`;
    
    return `
      <div class="IMAA-token-manager">
        <div class="IMAA-grid">
          <!-- Column 1 -->
          <div class="IMAA-column">
            <button class="IMAA-action-btn" data-action="add-auto-attack">
              <i class="fas fa-plus-circle"></i> Add Auto-Attack
            </button>
            <button class="IMAA-action-btn" data-action="set-image">
              <i class="fas fa-image"></i> Set Token Image
            </button>
            <button class="IMAA-action-btn" data-action="set-name-display">
              <i class="fas fa-eye"></i> Set Name Display
            </button>
            <button class="IMAA-action-btn" data-action="clear-effects">
              <i class="fas fa-broom"></i> Clear All Effects
            </button>
            <button class="IMAA-action-btn" data-action="token-lights">
              <i class="fas fa-lightbulb"></i> Configure Lights
            </button>
          </div>
          
          <!-- Column 2 -->
          <div class="IMAA-column">
            <button class="IMAA-action-btn" data-action="remove-auto-attack">
              <i class="fas fa-minus-circle"></i> Remove Auto-Attack
            </button>
            <button class="IMAA-action-btn" data-action="set-name">
              <i class="fas fa-tag"></i> Set Token Name
            </button>
            <button class="IMAA-action-btn" data-action="show-wounds">
              <i class="fas fa-heartbeat"></i> Set Wounds Display
            </button>
            <button class="IMAA-action-btn" data-action="reset-wounds">
              <i class="fas fa-heart"></i> Reset Wounds to 0
            </button>
            <button class="IMAA-action-btn" data-action="set-disposition">
              <i class="fas fa-users"></i> Set Disposition
            </button>
          </div>
        </div>
        
        <div class="IMAA-selected-tokens">
          <strong>Selected Tokens:</strong> ${selectedTokens.map(t => t.name).join(', ')}
        </div>
        <div class="IMAA-uuid-status">
          <strong>Auto-Attack UUID:</strong> ${uuidStatus}
        </div>
        <div class="IMAA-note">
          <strong>OY!</strong> Create da Auto-Combat trait da module settings first
        </div>
      </div>
    `;
  }
  
  _getLightConfigs() {
    return {
      def: {
        label: "Default",
        config: { dim: 0, bright: 0 },
      },
      // Uncomment lines 369-380 to add a new configuration. You can dup the lines too to add more than one. Obviously. You can use inspect element on a light config dialog to see all the different options for animations. Or Google it. Or make it up and hope for the best. It's your life, my man/lady/daemon.
      // MYNEWLIGHT: {
      //   label: "MA NEW LIGHT!!",
      //   config: {
      //     angle: 360,
      //     dim: 1,
      //     bright: 0,
      //     color: "#80ff80",
      //     luminosity: 0.5,
      //     attenuation: 1,
      //     coloration: 0,
      //     animation: { type: "smokepatch" }
      //   },
      tokenlight: {
        label: "Green Light",
        config: {
          angle: 360,
          dim: 1,
          bright: 0,
          color: "#80ff80",
          luminosity: 0.5,
          attenuation: 1,
          coloration: 0,
          animation: { type: "smokepatch" }
        },
      },
      loopylight: {
        label: "Blue Light",
        config: {
          angle: 360,
          dim: 1,
          bright: 0,
          color: "#24C1ED",
          luminosity: 0.5,
          attenuation: 1,
          coloration: 0,
          animation: { type: "witchwave" }
        },
      },
      crazylight: {
        label: "Magenta Light",
        config: {
          angle: 360,
          dim: 1,
          bright: 0,
          color: "#D60CF5",
          luminosity: 0.5,
          attenuation: 1,
          coloration: 0,
          animation: { type: "witchwave" }
        },
        yellowlight: {
          label: "Yellow Light",
          config: {
            angle: 360,
            dim: 1,
            bright: 0,
            color: "#ffff00",
            luminosity: 0.5,
            attenuation: 1,
            coloration: 0,
            animation: { type: "witchwave"}
              },
      redlight: {
        label: "Red Light",
        config: {
          angle: 360,
          dim: 1,
          bright: 0,
          color: "#ff0000",
          luminosity: 0.5,
          attenuation: 1,
          coloration: 0,
          animation: { type: "smokepatch" }
        }
      }
    };
  }
  
  activateListeners(html) {
    super.activateListeners(html);
    
    // Handle all action buttonz (actually maybe a messy bitch lifestyle is more nurgle. or slaanesh?)
    html.find('.IMAA-action-btn').click((event) => {
      const action = event.currentTarget.dataset.action;
      this._handleAction(action);
    });
  }
  
  async _handleAction(action) {
    switch (action) {
      case 'clear-effects':
        await this._clearEffects();
        break;
      case 'reset-wounds':
        await this._resetWounds();
        break;
      case 'set-image':
        await this._setImage();
        break;
      case 'set-name':
        await this._setName();
        break;
      case 'set-name-display':
        await this._setNameDisplay();
        break;
      case 'show-wounds':
        await this._showWounds();
        break;
      case 'token-lights':
        await this._tokenLights();
        break;
      case 'add-auto-attack':
        await this._addAutoAttack();
        break;
      case 'remove-auto-attack':
        await this._removeAutoAttack();
        break;
      case 'set-disposition':
        await this._setDisposition();
        break;
    }
  }
  
  async _clearEffects() {
    let clearedCount = 0;
    for (const tkn of this.selectedTokens) {
      if (tkn.actor) {
        try {
          const removeList = tkn.actor.temporaryEffects.map(e => e.id);
          if (removeList.length > 0) {
            await tkn.actor.deleteEmbeddedDocuments("ActiveEffect", removeList);
          }
          clearedCount++;
        } catch (error) {
          console.error(`Failed to clear effects for token ${tkn.name}:`, error);
        }
      }
    }
    ui.notifications.info(`Cleared effects from ${clearedCount} token(s)`);
  }
  
  async _resetWounds() {
    let updatedCount = 0;
    for (const tkn of this.selectedTokens) {
      if (tkn.actor) {
        try {
          await tkn.actor.update({"system.combat.wounds.value": 0});
          updatedCount++;
        } catch (error) {
          console.error(`Failed to update wounds for token ${tkn.name}:`, error);
        }
      }
    }
    ui.notifications.info(`Reset wounds for ${updatedCount} out of ${this.selectedTokens.length} selected tokens.`);
  }
  
  async _setImage() {
    const defaultImage = "tokens/icons/Icons_Skull.png";
    
    new Dialog({
      title: "Set Token Image",
      content: `
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <p>Set image for ${this.selectedTokens.length} selected token(s)</p>
          <div style="display: flex; gap: 5px;">
            <button id="search-image" style="flex: 1;">
              <i class="fas fa-search"></i> Browse Images
            </button>
            <button id="default-image" style="flex: 1;">
              <i class="fas fa-skull"></i> Use Default
            </button>
          </div>
        </div>
      `,
      buttons: {
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: "Cancel"
        }
      },
      render: (innerHtml) => {
        innerHtml.find('#search-image').click(async () => {
          const fp = new FilePicker({
            type: "image",
            current: defaultImage,
            callback: async (path) => {
              const updates = this.selectedTokens.map(token => 
                token.document.update({ texture: { src: path } })
              );
              await Promise.all(updates);
              ui.notifications.info(`Updated ${this.selectedTokens.length} token images!`);
            }
          });
          await fp.browse();
        });
        
        innerHtml.find('#default-image').click(async () => {
          const updates = this.selectedTokens.map(token => 
            token.document.update({ texture: { src: defaultImage } })
          );
          await Promise.all(updates);
          ui.notifications.info(`Updated ${this.selectedTokens.length} token images with default!`);
        });
      }
    }).render(true);
  }
  
  async _setName() {
    new Dialog({
      title: "Set Token Names",
      content: `
        <div style="display: flex; flex-direction: column; gap: 10px; padding: 10px 0;">
          <label for="tokenName">Enter Name for Selected Tokens:</label>
          <input type="text" id="tokenName" value="Sly Marbo" style="padding: 5px;">
          <p>This will update ${this.selectedTokens.length} selected token(s)</p>
        </div>
      `,
      buttons: {
        apply: {
          icon: '<i class="fas fa-check"></i>',
          label: "Apply",
          callback: (innerHtml) => {
            const newName = innerHtml.find('#tokenName').val();
            if (!newName.trim()) {
              ui.notifications.warn("The Machine-God is displeased. Please enter a valid name.");
              return;
            }
            const tokenUpdates = this.selectedTokens.map(token => ({
              _id: token.id,
              "name": newName
            }));
            canvas.scene.updateEmbeddedDocuments('Token', tokenUpdates);
            ui.notifications.info(`Updated ${tokenUpdates.length} tokens to "${newName}".`);
          }
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: "Cancel"
        }
      },
      default: "apply"
    }).render(true);
  }
  
  async _setNameDisplay() {
    new Dialog({
      title: "Token Name Display Settings",
      content: `
        <div style="display: flex; flex-direction: column; gap: 10px; padding: 10px 0;">
          <label for="displayMode">Select Display Mode:</label>
          <select id="displayMode" style="padding: 5px;">
            <option value="${CONST.TOKEN_DISPLAY_MODES.HOVER}">Show on Hover</option>
            <option value="${CONST.TOKEN_DISPLAY_MODES.ALWAYS}">Show Always</option>
            <option value="${CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER}">Show to Owner on Hover</option>
            <option value="${CONST.TOKEN_DISPLAY_MODES.OWNER}">Show to Owner Always</option>
            <option value="${CONST.TOKEN_DISPLAY_MODES.NONE}">Never Show</option>
          </select>
          <p>Updating ${this.selectedTokens.length} selected token(s)</p>
        </div>
      `,
      buttons: {
        apply: {
          icon: '<i class="fas fa-check"></i>',
          label: "Apply",
          callback: (innerHtml) => {
            const displayMode = parseInt(innerHtml.find('#displayMode').val());
            const tokenUpdates = this.selectedTokens.map(token => ({
              _id: token.id,
              "displayName": displayMode
            }));
            canvas.scene.updateEmbeddedDocuments('Token', tokenUpdates);
            ui.notifications.info(`Updated ${tokenUpdates.length} tokens with new display mode.`);
          }
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: "Cancel"
        }
      },
      default: "apply"
    }).render(true);
  }
  
  async _showWounds() {
    try {
      const tokenUpdates = this.selectedTokens.map(token => {
        if (token.document.disposition === CONST.TOKEN_DISPOSITIONS.HOSTILE) {
          return {
            _id: token.id,
            "bar1.attribute": "combat.wounds",
            "bar2.attribute": "",
            "displayName": CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER,
            "displayBars": CONST.TOKEN_DISPLAY_MODES.HOVER
          };
        } else {
          return {
            _id: token.id,
            "bar1.attribute": "combat.wounds",
            "bar2.attribute": "",
            "displayName": CONST.TOKEN_DISPLAY_MODES.HOVER,
            "displayBars": CONST.TOKEN_DISPLAY_MODES.HOVER
          };
        }
      });
      
      await canvas.scene.updateEmbeddedDocuments('Token', tokenUpdates);
      ui.notifications.info(`Configured wounds display for ${tokenUpdates.length} tokens.`);
    } catch (error) {
      console.error("Error updating wounds display:", error);
      ui.notifications.error("Error configuring wounds display. Check console for details.");
    }
  }
  
  async _tokenLights() {
    const states = new Set(Object.keys(this.lightConfigs));
    states.delete("def");
    
    const anyHasState = this.selectedTokens.some(token => 
      states.has(token.document.flags.world?.light)
    );

    if (anyHasState) {
      for (const token of this.selectedTokens) {
        await token.document.update({ 
          light: this.lightConfigs.def.config, 
          "flags.world.light": null 
        });
      }
      ui.notifications.info(`Disabled lights for ${this.selectedTokens.length} tokens.`);
    } else {
      const action = await new Promise((resolve) => {
        new Dialog({
          title: "Configure Token Light",
          content: `<p>Choose a pretty light for ${this.selectedTokens.length} selected tokens:</p>`,
          buttons: Array.from(states).map(state => {
            const label = this.lightConfigs[state].label;
            return {
              label: label,
              callback: () => resolve(state)
            };
          }),
          default: "cancel",
          close: () => resolve(null)
        }, {
          width: 400
        }).render(true);
      });

      if (action) {
        for (const token of this.selectedTokens) {
          await token.document.update({ 
            light: this.lightConfigs[action].config, 
            "flags.world.light": action 
          });
        }
        ui.notifications.info(`Applied ${this.lightConfigs[action].label} lights to ${this.selectedTokens.length} tokens.`);
      }
    }
  }
  
  async _addAutoAttack() {
    const autoAttackUUID = game.settings.get("IMAA-token-manager", "autoAttackUUID");
    
    if (!autoAttackUUID) {
      ui.notifications.error("OY YA GIT! Please create da Auto-Combat trait da module settings first!");
      return;
    }

    const traitItem = await fromUuid(autoAttackUUID);
    if (!traitItem) {
      ui.notifications.error("Auto-Attack trait item not found. Perhaps a nurgling ate it. Please recreate the trait in module settings.");
      return;
    }

    let addedCount = 0;
    let skippedCount = 0;
    const results = [];

    for (const t of this.selectedTokens) {
      const actor = t.actor;
      if (!actor) continue;

      const alreadyHas = actor.items.some(i =>
        i.getFlag?.("core", "sourceId") === autoAttackUUID ||
        i.name === traitItem.name
      );

      if (alreadyHas) {
        skippedCount++;
        results.push(`Skipped (already has): ${actor.name}`);
        continue;
      }

      await actor.createEmbeddedDocuments("Item", [traitItem.toObject()]);
      addedCount++;
      results.push(`Added to: ${actor.name}`);
    }

    const total = this.selectedTokens.length;
    ui.notifications.info(
      `Processed ${total} token(s): Added ${addedCount}, Skipped ${skippedCount}.`
    );
    console.log(results.join("\n"));
  }
  
  async _removeAutoAttack() {
    const autoAttackUUID = game.settings.get("IMAA-token-manager", "autoAttackUUID");
    
    if (!autoAttackUUID) {
      ui.notifications.error("OY YA GIT! Please create da Auto-Combat trait da module settings first!");
      return;
    }

    let traitItem = null;
    try {
      traitItem = await fromUuid(autoAttackUUID);
    } catch (err) {
      console.warn("Could not resolve Auto-Combat trait UUID", err);
    }

    let totalRemoved = 0;
    let actorsTouched = 0;

    for (const token of this.selectedTokens) {
      const actor = token.actor;
      if (!actor) continue;

      const toRemove = actor.items.filter(i =>
        i.getFlag?.("core", "sourceId") === autoAttackUUID ||
        (traitItem && i.name === traitItem.name)
      );

      if (toRemove.length > 0) {
        await actor.deleteEmbeddedDocuments(
          "Item",
          toRemove.map(i => i.id)
        );
        totalRemoved += toRemove.length;
        actorsTouched += 1;
        console.log(`Removed ${toRemove.length} item(s) from ${actor.name}:`, toRemove.map(i => i.name));
      } else {
        console.log(`No matching item found on ${actor.name}.`);
      }
    }

    if (totalRemoved > 0) {
      ui.notifications.info(`Removed ${totalRemoved} item(s) from ${actorsTouched} actor(s).`);
    } else {
      ui.notifications.warn("No matching items found to remove. Double-check the UUID or item name.");
    }
  }
  
  async _setDisposition() {
    new Dialog({
      title: "Set Token Disposition",
      content: `
        <div style="display: flex; flex-direction: column; gap: 10px; padding: 10px;">
          <label for="disposition-select">Select Disposition:</label>
          <select id="disposition-select" style="margin-bottom: 10px;">
            <option value="${CONST.TOKEN_DISPOSITIONS.HOSTILE}">Hostile</option>
            <option value="${CONST.TOKEN_DISPOSITIONS.NEUTRAL}">Neutral</option>
            <option value="${CONST.TOKEN_DISPOSITIONS.FRIENDLY}">Friendly</option>
          </select>
          <p>This will affect ${this.selectedTokens.length} selected token(s)</p>
        </div>
      `,
      buttons: {
        set: {
          icon: '<i class="fas fa-check"></i>',
          label: "Set Disposition",
          callback: (innerHtml) => {
            const disposition = parseInt(innerHtml.find('#disposition-select').val());
            
            const updates = this.selectedTokens.map(token => ({
              _id: token.id,
              disposition: disposition
            }));
            
            canvas.scene.updateEmbeddedDocuments('Token', updates);
            
            ui.notifications.info(`Set disposition for ${this.selectedTokens.length} token(s)`);
          }
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: "Cancel"
        }
      },
      default: "set"
    }).render(true);
  }
}

// Initialize da module (nah, thinking this hard about it is def tzeentch-pilled. ok bye!)
Hooks.once('init', () => {
  IMAATokenManager.initialize();
});

