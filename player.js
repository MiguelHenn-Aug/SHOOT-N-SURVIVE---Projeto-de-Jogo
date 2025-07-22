class Player {
            constructor(x, y, color, controls, name, image = null) {
                this.x = x;
                this.y = y;
                this.radius = 15 * GAME_SCALE_FACTOR; // Increased by 50%
                this.color = color; // Base ship color
                this.speed = 3.5; // Slightly higher speed
                this.maxSpeed = 12; // Higher max speed
                this.health = 100;
                this.maxHealth = 100;
                this.damage = 19; // Initial damage changed to 19
                this.projectileCount = 1;
                this.level = 1;
                this.exp = 0;
                this.expNeeded = 10;
                this.controls = controls;
                this.lastShot = 0;
                this.shotInterval = 400; // Faster shots

                this.invincible = false;
                this.invincibleTimer = 0;
                this.invincibleDuration = 1800; // Longer invincibility duration

                // Weapon animation properties
                this.weaponAnimationTimer = 0;
                this.weaponAnimationDuration = 100; // milliseconds for shot animation
                this.weaponAnimationScale = 0; // Current scale factor for barrel expansion
                this.weaponMaxAnimationScale = 0.3; // Max 30% expansion

                // Legendary Abilities Levels and derived stats
                this.legendaryAbilitiesLevels = {
                    venom: 0,
                    ricochet_bullets: 0,
                    speedy_trigger: 0,
                    bomb_shots: 0,
                    clone_shots: 0,
                };
                // Stats derived from legendary abilities
                this.projectileSpeedMultiplier = 1.2; // Higher base Projectile speed
                this.ricochet_bulletsEnabled = false;
                this.bomb_shotsEnabled = false;
                this.clone_shotsEnabled = false;
                
                // VENOM specific properties
                this.trailEnabled = false;
                this.trailDuration = 0;
                this.trailDamage = 0;

                // Projectile attribute level (for Max.Lvl)
                // Removed to allow +1 PROJECTILE to be chosen infinitely
                // this.projectileUpgradeLevel = 0; 
                
                this.specialAbilities = {
                    push: { level: 0, timer: 0, interval: 5000 + 1000, originalInterval: 5000 + 1000, active: false, duration: 1200, baseRadius: (120 * 2) * 0.27, damageInterval: 180, lastDamageTime: 0, maxLevel: 10, description: 'Cria uma Área em volta do Atirador que causa Dano e empurra os Inimigos.' }, // maxLevel 10 // PUSH: Increased by 20%
                    plasma_explosion: { level: 0, timer: 0, interval: 3500 + 1000, originalInterval: 3500 + 1000, projectileCount: 1, baseRadius: 70 * 2, baseDuration: 3500, damageInterval: 500, lastDamageTime: 0, maxLevel: 10, description: 'Lança um Projétil que explode ao atingir um Inimigo, deixando a Área em chamas.' }, // maxLevel 10
                    letal_shot: { level: 0, timer: 0, interval: 3800 + 1000, originalInterval: 3800 + 1000, sizeMultiplier: 1, maxLevel: 10, description: 'Lança um Projétil poderoso que perfura Inimigos atingidos.' }, // maxLevel 10
                    zap: { level: 0, timer: 0, interval: 4000 + 1000, originalInterval: 4000 + 1000, maxTargets: 0, maxLevel: 10, description: 'Lança um Projétil que atinge múltiplos Inimigos em cadeia.' }, // maxTargets starts at 0 (adjusted to 3 in applySpecialUpgrade), maxLevel 10
                    tactic_boomerang: { level: 0, timer: 0, interval: 4500 + 1000, originalInterval: 4500 + 1000, projectileCount: 0, baseDistance: 300, maxLevel: 10, description: 'Lança um Projétil que viaja em uma direção e depois retorna, causando Dano a tudo que atinge.' }, // projectileCount starts at 0, maxLevel 10
                    tornado_grenade: { level: 0, timer: 0, interval: 5500 + 1000, originalInterval: 5500 + 1000, duration: 3500, originalDuration: 3500, baseRadius: (50 * 2) * 1.5, damageInterval: 180, lastDamageTime: 0, maxLevel: 10, description: 'Cria um tornado que causa Dano por segundo e puxa Inimigos para o seu centro.' } // maxLevel 10
                };
                this.cooldownsHalved = false;
                this.kills = 0;
                this.image = image; // Custom ship image
                this.name = name;
                // Adjust playerNumber based on CYAN or PURPLE color
                this.playerNumber = (color === 'rgba(0, 255, 255, 0.8)') ? 1 : 2; 

                // Set initial damage for special abilities
                this.updateSpecialAbilityDamages();

                // For sequential boomerang launches
                this.boomerangLaunchQueue = [];
                this.lastBoomerangLaunchTime = 0;

                // ZAP animation properties
                this.zapAnimationScale = 1;
                this.zapAnimationDirection = 1; // 1 for increasing, -1 for decreasing
                this.zapRotation = 0;
                this.zapAnimationSpeed = 0.05; // Base speed for scale and rotation
            }

            updateSpecialAbilityDamages() {
                // Adds a check to ensure this.specialAbilities is defined
                if (!this.specialAbilities) {
                    console.error("Erro: 'specialAbilities' está indefinido para o jogador. Não foi possível atualizar os danos da habilidade.");
                    return; // Exits the function to prevent subsequent errors
                }

                if (this.specialAbilities.tornado_grenade) {
                    this.specialAbilities.tornado_grenade.damage = calculateSpecialAbilityDamage(this, 'tornado_grenade'); 
                }
                if (this.specialAbilities.push) {
                    this.specialAbilities.push.damage = calculateSpecialAbilityDamage(this, 'push');
                }
                if (this.specialAbilities.zap) { // Added null check here
                    this.specialAbilities.zap.damage = calculateSpecialAbilityDamage(this, 'zap');
                }
                if (this.specialAbilities.tactic_boomerang) {
                    this.specialAbilities.tactic_boomerang.damage = calculateSpecialAbilityDamage(this, 'tactic_boomerang');
                }
                if (this.specialAbilities.plasma_explosion) {
                    this.specialAbilities.plasma_explosion.damage = calculateSpecialAbilityDamage(this, 'plasma_explosion');
                }
                if (this.specialAbilities.letal_shot) {
                    this.specialAbilities.letal_shot.damage = calculateSpecialAbilityDamage(this, 'letal_shot');
                }
                
                // Update trail damage based on player's current damage
                this.trailDamage = calculateSpecialAbilityDamage(this, 'venom_trail');
            }

            update(deltaTime) {
                let moveX = 0;
                let moveY = 0;

                // Applies movement and shot speed increase from the +SPEED attribute
                let currentSpeed = this.speed;
                let currentShotInterval = this.shotInterval;
                // 'projectileUpgradeLevel' is used for +Projectiles, the speed bonus is a separate basic attribute.
                // The +SPEED attribute does not have its own 'Level' associated with `projectileUpgradeLevel`.
                // The speed logic should be applied via `applyBasicUpgrade` and directly change `speed` and `shotInterval`.


                if (this.controls.up) moveY -= currentSpeed;
                if (this.controls.down) moveY += currentSpeed;
                if (this.controls.left) moveX -= currentSpeed;
                if (this.controls.right) moveX += currentSpeed;

                if (moveX !== 0 && moveY !== 0) {
                    moveX *= 0.7071; // Normalize diagonal speed
                    moveY *= 0.7071;
                }

                this.x += moveX;
                this.y += moveY;

                // Limit player within the screen
                this.x = Math.max(this.radius, Math.min(canvas.width - this.radius, this.x));
                this.y = Math.max(this.radius, Math.min(canvas.height - this.radius, this.y));

                const now = Date.now();

                // Manual Shot
                if (this.controls.shoot && now - this.lastShot > currentShotInterval) {
                    let targetEnemy = findClosestEnemy(this);
                    let baseAngle;
                    if (targetEnemy) {
                        baseAngle = Math.atan2(targetEnemy.y - this.y, targetEnemy.x - this.x);
                    } else {
                        baseAngle = Math.random() * Math.PI * 2; // Shoots randomly if no target
                    }
                    fireBasicProjectiles(this, baseAngle);
                    this.lastShot = now;
                    this.weaponAnimationTimer = this.weaponAnimationDuration; // Trigger weapon animation
                }

                // Update weapon animation timer for barrel expansion
                if (this.weaponAnimationTimer > 0) {
                    this.weaponAnimationTimer -= deltaTime;
                    // Scale from max to 0 as timer decreases
                    this.weaponAnimationScale = this.weaponMaxAnimationScale * (this.weaponAnimationTimer / this.weaponAnimationDuration);
                }
                else {
                    this.weaponAnimationScale = 0;
                }

                // Invincibility
                if (this.invincible) {
                    this.invincibleTimer += deltaTime;
                    if (this.invincibleTimer >= this.invincibleDuration) {
                        this.invincible = false;
                        this.invincibleTimer = 0;
                    }
                }

                this.updateSpecialAbilities(deltaTime);
                this.handleBoomerangLaunchQueue(now); // Handle sequential boomerang launches
            }

            takeDamage(amount) {
                if (!this.invincible) {
                    this.health -= Math.floor(amount);
                    if (this.health <= 0) {
                        this.health = 0;
                        endGameSession('defeat'); // Display Game Over screen (Defeat)
                    }
                    this.invincible = true;
                    this.invincibleTimer = 0;
                }
            }

            gainExp(amount) {
                this.exp += amount;
                if (this.exp >= this.expNeeded) {
                    this.levelUp();
                }
            }

            levelUp() {
                this.level++;
                this.exp -= this.expNeeded;

                if (this.level < 5) {
                    this.expNeeded += 3; // More EXP for initial levels
                } else if (this.level >= 5 && this.level < 10) {
                    this.expNeeded += 6;
                }
                    else if (this.level >= 10 && this.level < 20) {
                    this.expNeeded += 12; // Additional increase for higher levels
                } else {
                    this.expNeeded += 18;
                }

                this.damage += 3; // Damage per level up changed to 3
                this.maxHealth += 2; // Increases max health by 2 per Level
                this.health = Math.min(this.maxHealth, this.health + 2); // Heals the player by 2 on level up
                this.updateSpecialAbilityDamages();

                showUpgradeSelectionMenu(this);

                updateUI();
            }

            // Handles sequential boomerang launches
            handleBoomerangLaunchQueue(now) {
                if (this.boomerangLaunchQueue.length > 0 && now - this.lastBoomerangLaunchTime >= 200) { // 0.2 seconds delay
                    const nextBoomerang = this.boomerangLaunchQueue.shift();
                    projectiles.push(nextBoomerang);
                    this.lastBoomerangLaunchTime = now;
                }
            }

            updateSpecialAbilities(deltaTime) {
                const now = Date.now();
                
                // Ability: Electromagnetic Pulse (PUSH)
                if (this.specialAbilities.push.level > 0) {
                    this.specialAbilities.push.timer += deltaTime;
                    if (this.specialAbilities.push.timer >= this.specialAbilities.push.interval) {
                        this.specialAbilities.push.active = true;
                        this.specialAbilities.push.timer = 0;
                        this.specialAbilities.push.lastDamageTime = now;
                        this.specialAbilities.push.hasDamaged = false; // Reset for new activation

                        const currentRadius = this.specialAbilities.push.baseRadius * (1 + 0.15 * (this.specialAbilities.push.level - 1));
                        specialEffects.push({
                            type: 'push',
                            x: this.x,
                            y: this.y,
                            radius: currentRadius,
                            damage: this.specialAbilities.push.damage,
                            timer: 0,
                            duration: 1200, // Adjusted duration
                            player: this,
                            damageInterval: this.specialAbilities.push.damageInterval, // Corrected from specialAbabilities
                            lastDamageTime: now,
                            level: this.specialAbilities.push.level, // Pass level for Nvl.Max effect
                            hasDamaged: false // New property for one-time damage
                        });
                    }
                }

                // Ability: Explosive Missile (PLASMA EXPLOSION)
                if (this.specialAbilities.plasma_explosion.level > 0) {
                    this.specialAbilities.plasma_explosion.timer += deltaTime;
                    if (this.specialAbilities.plasma_explosion.timer >= this.specialAbilities.plasma_explosion.interval) {
                        this.specialAbilities.plasma_explosion.timer = 0;

                        let targetPosition;
                        // Prioritize boss, otherwise dense cluster within canvas
                        const closestBoss = findClosestBoss(this);
                        if (closestBoss) {
                            targetPosition = { x: closestBoss.x, y: closestBoss.y };
                        } else {
                            targetPosition = findDenseEnemyTargetInCanvas();
                        }
                        
                        if (!targetPosition) {
                            // Fallback if no enemies or dense cluster found
                            targetPosition = { x: this.x + Math.cos(Math.random() * Math.PI * 2) * (250), y: this.y + Math.sin(Math.random() * Math.PI * 2) * (250) };
                        }
                        const angle = Math.atan2(targetPosition.y - this.y, targetPosition.x - this.x);
                        
                        // PLASMA EXPLOSION - Max Level (10): Launches 3 Projectiles in the same direction with spread
                        if (this.specialAbilities.plasma_explosion.level === 10) {
                            const spreadAngle = 0.5; // Small angular spread for the 3 Projectiles
                            fireSpecialProjectile(this, 'plasma_explosion', angle - spreadAngle, targetPosition);
                            fireSpecialProjectile(this, 'plasma_explosion', angle, targetPosition);
                            fireSpecialProjectile(this, 'plasma_explosion', angle + spreadAngle, targetPosition);
                        } else {
                            fireSpecialProjectile(this, 'plasma_explosion', angle, targetPosition);
                        }
                    }
                }

                // Ability: Piercing Ray (LETHAL SHOT)
                if (this.specialAbilities.letal_shot.level > 0) {
                    this.specialAbilities.letal_shot.timer += deltaTime;
                    if (this.specialAbilities.letal_shot.timer >= this.specialAbilities.letal_shot.interval) {
                        this.specialAbilities.letal_shot.timer = 0;

                        let targetEnemy;
                        // Prioritize boss for LETHAL SHOT
                        const closestBoss = findClosestBoss(this);
                        if (closestBoss) {
                            targetEnemy = closestBoss;
                        } else {
                            // LETHAL SHOT - Target the furthest enemy INSIDE the canvas
                            targetEnemy = findFurthestEnemyInCanvas(this);
                        }
                        
                        let angle;
                        if (targetEnemy) {
                            angle = Math.atan2(targetEnemy.y - this.y, targetEnemy.x - this.x);
                        } else {
                            angle = Math.random() * Math.PI * 2; // Fallback to random if no visible enemy
                        }
                        
                        // Removes the wind trail that causes Damage. The ability should only be a Projectile that pierces everything.
                        // It should increase 20% in size at each Level, except for Level 1, this change affects Level 2 onwards.
                        const letalShotRadius = (GAME_SCALE_FACTOR * 12) * (this.specialAbilities.letal_shot.level === 1 ? 1 : 1 + (this.specialAbilities.letal_shot.level - 1) * 0.2);
                        let letalShotSpeed = (6 * this.projectileSpeedMultiplier);
                        
                        // LETHAL SHOT - Level 10: Will move much faster and launch 3 additional LETHAL SHOTS
                        if (this.specialAbilities.letal_shot.level === 10) {
                            letalShotSpeed *= 1.5; // Example: 50% faster
                            
                            // Launch 3 additional shots in cardinal/diagonal positions relative to the original attack
                            const additionalAngles = [
                                angle + Math.PI / 2,    // 90 degrees clockwise (e.g., up if original is right)
                                angle - Math.PI / 2,    // 90 degrees counter-clockwise (e.g., down if original is right)
                                angle + Math.PI         // 180 degrees (e.g., left if original is right)
                            ];

                            additionalAngles.forEach(extraAngle => {
                                projectiles.push({
                                    x: this.x,
                                    y: this.y,
                                    radius: letalShotRadius,
                                    speed: letalShotSpeed,
                                    angle: extraAngle,
                                    damage: this.specialAbilities.letal_shot.damage,
                                    color: '#FF69B4',
                                    type: 'letal_shot',
                                    isBasicProjectile: false, // Added to identify special projectiles
                                    player: this,
                                    enemiesHit: new Set(), // Changed to Set
                                    pierceCount: 999,
                                    isDuplicate: true, // Mark as duplicate
                                    spawnTime: Date.now(),
                                    isWindTrailProjectile: false, // No wind trail with Damage
                                    trailPoints: [],
                                    maxTrailPoints: 15,
                                });
                            });
                        }

                        // Always launch the main letal_shot
                        projectiles.push({
                            x: this.x,
                            y: this.y,
                            radius: letalShotRadius,
                            speed: letalShotSpeed,
                            angle: angle,
                            damage: this.specialAbilities.letal_shot.damage,
                            color: '#FF69B4', // Pink
                            type: 'letal_shot',
                            isBasicProjectile: false, // Added to identify special projectiles
                            player: this,
                            enemiesHit: new Set(), // Changed to Set
                            pierceCount: 999,
                            isDuplicate: false,
                            spawnTime: Date.now(),
                            isWindTrailProjectile: false, // No wind trail with Damage
                            trailPoints: [],
                            maxTrailPoints: 15,
                            
                        });
                    }
                }

                // Ability: Electric Shock (ZAP)
                if (this.specialAbilities.zap.level > 0) {
                    this.specialAbilities.zap.timer += deltaTime;
                    if (this.specialAbilities.zap.timer >= this.specialAbilities.zap.interval) {
                        this.specialAbilities.zap.timer = 0;
                        
                        let targetEnemy;
                        // Prioritize boss for ZAP
                        const closestBoss = findClosestBoss(this);
                        if (closestBoss) {
                            targetEnemy = closestBoss;
                        } else {
                            // Target the closest enemy for ZAP within canvas
                            targetEnemy = findClosestEnemy(this);
                        }

                        let angle;
                        if (targetEnemy) {
                            angle = Math.atan2(targetEnemy.y - this.y, targetEnemy.x - this.x);
                        } else {
                            angle = Math.random() * Math.PI * 2;
                        }

                        // Ensure maxTargets is initialized to at least 1 if not set by upgrade
                        const currentMaxTargets = this.specialAbilities.zap.maxTargets > 0 ? this.specialAbilities.zap.maxTargets : 1;

                        projectiles.push({
                            x: this.x,
                            y: this.y,
                            radius: (14 * GAME_SCALE_FACTOR), // Radius with 50% more
                            speed: (8 * this.projectileSpeedMultiplier),
                            angle: angle,
                            damage: this.specialAbilities.zap.damage,
                            color: '#87CEEB', // Light Blue
                            type: 'zap',
                            isBasicProjectile: false, // Added to identify special projectiles
                            player: this,
                            enemiesHit: new Set(), // Changed to Set
                            targetsHitCount: 0,
                            maxTargets: currentMaxTargets, 
                            lastHitEnemyId: null,
                            isDuplicate: false,
                            spawnTime: Date.now(),
                            pierceCount: 0,
                            // NEW POWER: ZAP - Level 10: Will paralyze hit Enemies
                            paralyzeOnHit: this.specialAbilities.zap.level === 10,
                            trailPoints: [], // For the new drawing trace
                            maxTrailPoints: 15,
                            zapAnimationState: 0, // 0 to 1 for scale down, 1 to 2 for scale up, 2 to 3 for scale back to normal
                            zapCurrentScale: 1,
                            zapAnimationDirection: 1, // 1: scale down, 2: scale normal, 3: scale up, 4: scale normal
                            zapRotation: 0,
                        });
                    }
                }

                // Ability: Boomerang Drone (TACTICAL BOOMERANG)
                if (this.specialAbilities.tactic_boomerang.level > 0) {
                    this.specialAbilities.tactic_boomerang.timer += deltaTime;
                    if (this.specialAbilities.tactic_boomerang.timer >= this.specialAbilities.tactic_boomerang.interval) {
                        this.specialAbilities.tactic_boomerang.timer = 0;

                        let targetEnemy;
                        // Prioritize boss for TACTICAL BOOMERANG
                        const closestBoss = findClosestBoss(this);
                        if (closestBoss) {
                            targetEnemy = closestBoss;
                        } else {
                            // Target the closest enemy for TACTICAL BOOMERANG within canvas
                            targetEnemy = findClosestEnemy(this);
                        }

                        let baseAngle;
                        if (targetEnemy) {
                            baseAngle = Math.atan2(targetEnemy.y - this.y, targetEnemy.x - this.x);
                        } else {
                            baseAngle = Math.random() * Math.PI * 2;
                        }
                        
                        const tactic_BOOMERANG_SPREAD_ANGLE = 0.1; // Small spread for drones
                        // Boomerang now has a FIXED distance, regardless of level.
                        const fixedBoomerangDistance = 300; // Fixed distance for boomerang

                        // Launch sequentially if more than one projectile
                        for (let i = 0; i < this.specialAbilities.tactic_boomerang.projectileCount; i++) {
                            const angleOffset = (i - (this.specialAbilities.tactic_boomerang.projectileCount - 1) / 2) * tactic_BOOMERANG_SPREAD_ANGLE;
                            
                            this.boomerangLaunchQueue.push({ // Add to queue instead of direct launch
                                x: this.x,
                                y: this.y,
                                radius: (12 * GAME_SCALE_FACTOR), // Drone with 50% more
                                speed: (5 * this.projectileSpeedMultiplier),
                                angle: baseAngle + angleOffset,
                                damage: calculateSpecialAbilityDamage(this, 'tactic_boomerang'),
                                color: '#36454F', // Dark Gray
                                type: 'tactic_boomerang',
                                isBasicProjectile: false, // Added to identify special projectiles
                                player: this,
                                initialX: this.x,
                                initialY: this.y,
                                maxDistance: fixedBoomerangDistance, // This is now the actual max distance before returning
                                currentDistance: 0,
                                returning: false,
                                isDuplicate: false,
                                spawnTime: Date.now(),
                                rotation: 0,
                                pierceCount: 999, // Allows piercing
                                enemiesHit: new Set(), // Using a Set for efficient tracking of hits during one pass (out or back)
                                // TACTICAL BOOMERANG - Level 10: Pushes hit Enemies
                                pushOnHit: this.specialAbilities.tactic_boomerang.level === 10,
                                // New: Explosion on hit at max level
                                explodeOnHit: this.specialAbilities.tactic_boomerang.level === 10,
                                trailPoints: [], // For the new drawing trace (will be empty since trail is removed)
                                maxTrailPoints: 0, // No trail points
                            });
                        }
                        this.lastBoomerangLaunchTime = now; // Reset for the first in queue
                    }
                }

                // Ability: Energy TORNADO GRENADE
                if (this.specialAbilities.tornado_grenade.level > 0) {
                    this.specialAbilities.tornado_grenade.timer += deltaTime;
                    if (this.specialAbilities.tornado_grenade.timer >= this.specialAbilities.tornado_grenade.interval) {
                        this.specialAbilities.tornado_grenade.timer = 0;
                        
                        let targetPosition;
                        // Prioritize boss, otherwise dense cluster within canvas
                        const closestBoss = findClosestBoss(this);
                        if (closestBoss) {
                            targetPosition = { x: closestBoss.x, y: closestBoss.y };
                        } else {
                            targetPosition = findDenseEnemyTargetInCanvas();
                        }

                        if (!targetPosition) {
                            // Fallback if no enemies or dense cluster found
                            targetPosition = { x: this.x + Math.cos(Math.random() * Math.PI * 2) * (200), y: this.y + Math.sin(Math.random() * Math.PI * 2) * (200) };
                        }

                        const initialTargetX = targetPosition.x; // Store initial target for mirrored clone
                        const initialTargetY = targetPosition.y;

                        // 65% reduction in grenade size (new radius = 35% of original)
                        const currentTornado_grenadeRadius = (this.specialAbilities.tornado_grenade.baseRadius * 0.35 * (1 + 0.15 * (this.specialAbilities.tornado_grenade.level - 1)));
                        const currentTornado_grenadeDuration = this.specialAbilities.tornado_grenade.duration;

                        fireSpecialProjectile(this, 'tornado_grenade_launcher', Math.atan2(targetPosition.y - this.y, targetPosition.x - this.x), targetPosition);

                        // NEW POWER: TORNADO GRENADE - Level 10: Launches an additional TORNADO GRENADE in the opposite, mirrored direction
                        if (this.specialAbilities.tornado_grenade.level === 10) {
                            const originalProjectileInfo = { level: 10, initialTargetX, initialTargetY };
                            fireSpecialProjectile(this, 'tornado_grenade_launcher', Math.atan2(targetPosition.y - this.y, targetPosition.x - this.x) + Math.PI, null, originalProjectileInfo); // Pass original info
                        }
                    }
                }
            }

            draw() {
                ctx.save();
                ctx.translate(this.x, this.y);

                // Draw player as a circle (default or image-filled)
                if (this.image) {
                    ctx.beginPath();
                    ctx.arc(0, 0, this.radius, 0, Math.PI * 2, false);
                    ctx.clip();
                    ctx.drawImage(this.image, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
                    ctx.restore(); // Restore context after clipping for image
                    
                    // Draw the border after restoring the context so it's not clipped
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
                    // CYAN outline for Player 1, PURPLE for Player 2 when using image
                    ctx.strokeStyle = (this.playerNumber === 1) ? '#00FFFF' : '#800080'; 
                    ctx.lineWidth = 3; // Border thickness
                    ctx.stroke();

                } else {
                    // Draw a solid circle if no image
                    ctx.beginPath();
                    ctx.arc(0, 0, this.radius, 0, Math.PI * 2, false);
                    // Player 1: CYAN BLUE, Player 2: PURPLE - Increased opacity to be more solid
                    ctx.fillStyle = (this.playerNumber === 1) ? 'rgba(0, 255, 255, 0.8)' : 'rgba(128, 0, 128, 0.8)';
                    ctx.fill();
                    // Player 1: LIGHT BLUE outline, Player 2: DEEP PINK outline
                    ctx.strokeStyle = (this.playerNumber === 1) ? '#ADD8E6' : '#FF1493'; 
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    ctx.restore(); // Restore context for consistency
                }

                ctx.save();
                ctx.translate(this.x, this.y); // Translate to player's position for weapon drawing

                // Calculate weapon position relative to player and current angle
                let weaponAngle = 0;
                let targetEnemy = findClosestEnemy(this);
                if (targetEnemy) {
                    weaponAngle = Math.atan2(targetEnemy.y - this.y, targetEnemy.x - this.x);
                } else {
                    // Default direction if no enemy, e.g., straight right or last movement direction
                    weaponAngle = Math.PI / 2; // Point weapon upwards by default
                }
                
                // Rotate to point towards target
                ctx.rotate(weaponAngle);

                // Increased weapon size slightly (from 1.7 to 1.8 for length, from 0.5 to 0.6 for width)
                const baseWeaponLength = this.radius * 1.8; 
                const baseWeaponWidth = this.radius * 0.6;
                const weaponOffset = this.radius * 0.8; // Offset from player center
                
                // Calculate barrel expansion
                const currentExpansionFactor = 1 + this.weaponAnimationScale; // Apply expansion here
                const expandedBarrelLength = baseWeaponLength * 0.7 * currentExpansionFactor;
                const expandedBarrelWidth = baseWeaponWidth / 2 * currentExpansionFactor;
                
                // Weapon Body (light grey)
                ctx.fillStyle = '#E0E0E0'; // Light gray
                ctx.strokeStyle = 'black';
                ctx.lineWidth = 2;

                // Handle (base, does not recoil)
                ctx.beginPath();
                ctx.rect(weaponOffset - baseWeaponLength * 0.2, -baseWeaponWidth / 2, baseWeaponLength * 0.3, baseWeaponWidth); // Handle
                ctx.fill();
                ctx.stroke();

                // Barrel (expands and changes color based on player)
                // Weapon barrel for PLAYER 1: LIGHT BLUE, PLAYER 2: DEEP PINK
                const barrelColor = (this.playerNumber === 1) ? '#ADD8E6' : '#FF1493'; 
                ctx.fillStyle = barrelColor;
                ctx.beginPath();
                // Barrel drawing starting from weaponOffset, expanding
                ctx.rect(weaponOffset, -expandedBarrelWidth / 2, expandedBarrelLength, expandedBarrelWidth); 
                ctx.fill();
                ctx.stroke();
                
                // Muzzle (flares up)
                if (this.weaponAnimationTimer > 0) {
                    const muzzleGlowAlpha = this.weaponAnimationTimer / this.weaponAnimationDuration;
                    ctx.fillStyle = `rgba(255, 200, 0, ${muzzleGlowAlpha})`; // Orange-yellow glow
                    ctx.beginPath();
                    ctx.arc(weaponOffset + expandedBarrelLength, 0, baseWeaponWidth * 0.6 * muzzleGlowAlpha, 0, Math.PI * 2); // Muzzle at end of expanded barrel
                    ctx.fill();
                }

                ctx.restore(); // Restore context after drawing weapon

                // CLONING: Draws the second weapon on the other side of the player, purely aesthetic
                if (this.legendaryAbilitiesLevels.clone_shots > 0) {
                    ctx.save();
                    ctx.translate(this.x, this.y);
                    // Rotate 180 degrees from the first weapon's angle
                    ctx.rotate(weaponAngle + Math.PI);

                    ctx.fillStyle = '#E0E0E0'; // Light gray
                    ctx.strokeStyle = 'black';
                    ctx.lineWidth = 2;

                    // Handle (base)
                    ctx.beginPath();
                    ctx.rect(weaponOffset - baseWeaponLength * 0.2, -baseWeaponWidth / 2, baseWeaponLength * 0.3, baseWeaponWidth);
                    ctx.fill();
                    ctx.stroke();

                    // Barrel (expands and changes color based on player)
                    ctx.fillStyle = barrelColor;
                    ctx.beginPath();
                    ctx.rect(weaponOffset, -expandedBarrelWidth / 2, expandedBarrelLength, expandedBarrelWidth);
                    ctx.fill();
                    ctx.stroke();

                    ctx.restore();
                }

                // Invincibility effect (kept because it's a game mechanic, not just visual flair)
                if (this.invincible) {
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.radius + 8 + Math.sin(gameTime / 50) * 3, 0, Math.PI * 2);
                    ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)'; // Cyan neon
                    ctx.lineWidth = 3;
                    ctx.stroke();
                }
            }
        }