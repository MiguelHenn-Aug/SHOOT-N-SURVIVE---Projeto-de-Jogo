class Enemy {
            constructor(x, y, isBoss = false, subtype = 'normal', forcedTheme = null, initialVel = {vx:0, vy:0}, spawnOrbitDuration = 1000) {
                this.x = x;
                this.y = y;
                this.id = Date.now() + Math.random();
                this.isBoss = isBoss;
                this.type = isBoss ? 'boss' : 'normal';
                this.subtype = isBoss ? 'boss' : subtype;
                this.expValue = isBoss ? 50 : 1;
                this.lastHitProjectileColor = 'rgba(150, 150, 150, 0.8)'; // Default impact color
                this.animationTimer = Math.random() * 1000; // Still used for random starting positions of static elements
                this.paralyzed = false;
                this.paralyzeTimer = 0;
                this.paralyzeDuration = 1500; // 1.5 seconds paralysis
                this.originalX = x; // Store original position for collision check after push
                this.originalY = y;

                // Updated enemy themes based on wave level
                if (waveLevel >= 1 && waveLevel <= 5) {
                    this.theme = 'drone';
                } else if (waveLevel >= 6 && waveLevel <= 10) {
                    this.theme = 'robotSentinel';
                } else if (waveLevel >= 11 && waveLevel <= 15) {
                    this.theme = 'spaceThief';
                } else if (waveLevel >= 16 && waveLevel <= 20) {
                    this.theme = 'galacticPirate';
                } else if (waveLevel >= 21 && waveLevel <= 25) {
                    this.theme = 'invaderAlien';
                } else if (waveLevel >= 26 && waveLevel <= 30) {
                    this.theme = 'otherworldlyBeast';
                } else if (waveLevel >= 31 && waveLevel <= 35) {
                    this.theme = 'intergalacticHunter';
                } else if (waveLevel >= 36 && waveLevel <= 40) {
                    this.theme = 'universeSentinel';
                } else if (waveLevel >= 41 && waveLevel <= 45) {
                    this.theme = 'voidWarrior';
                } else if (waveLevel >= 46 && waveLevel <= 49) { // Waves 46-49 lead up to the final boss
                    this.theme = 'voidBeast';
                } else if (waveLevel === 50) { // Final boss wave
                    this.theme = 'chaosLord';
                    this.isBoss = true; // Ensure it's a boss
                } else {
                    this.theme = 'defaultSpace'; // Fallback
                }

                // Random colors for ships/parts (more neutral, with some vibrant touches)
                this.hullColor = this.getRandomShipColors(0.7); // More neutral
                this.engineColor = this.getRandomShipColors(0.9); // More vibrant
                this.weaponColor = this.getRandomShipColors(0.9); // More vibrant
                this.shieldColor = this.getRandomShipColors(0.8); // Slightly more neutral
                this.sensorColor = this.getRandomShipColors(0.95); // Very vibrant

                // Base stats before subtype/boss adjustments
                let baseRadius, baseHealth, baseDamage, baseSpeed;

                // Reasonable base values for themes (kept modest so wave scaling matters)
                const THEME_BASE = {
                    drone: {hp: 18, dmg: 6, spd: 0.9, radius: 12},
                    robotSentinel: {hp: 30, dmg: 9, spd: 0.7, radius: 16},
                    spaceThief: {hp: 22, dmg: 7, spd: 1.3, radius: 11},
                    galacticPirate: {hp: 40, dmg: 10, spd: 0.8, radius: 18},
                    invaderAlien: {hp: 45, dmg: 11, spd: 0.95, radius: 17},
                    otherworldlyBeast: {hp: 65, dmg: 14, spd: 0.5, radius: 22},
                    intergalacticHunter: {hp: 55, dmg: 13, spd: 1.05, radius: 16},
                    universeSentinel: {hp: 80, dmg: 16, spd: 0.45, radius: 26},
                    voidWarrior: {hp: 95, dmg: 15, spd: 0.7, radius: 24},
                    voidBeast: {hp: 120, dmg: 18, spd: 0.6, radius: 28},
                    chaosLord: {hp: 5000, dmg: 45, spd: 0.35, radius: 80},
                    defaultSpace: {hp: 20, dmg: 7, spd: 0.8, radius: 14}
                };

                if (isBoss) {
                    // Bosses are significantly tougher but scaled reasonably with bossCount
                    const base = THEME_BASE[this.theme] || THEME_BASE.defaultSpace;
                    baseRadius = (base.radius * GAME_SCALE_FACTOR) * 1.6;
                    baseHealth = base.hp * 10 + (bossCount * 800); // Boss base multiplied
                    baseDamage = Math.max(12, base.dmg * 2);
                    baseSpeed = Math.max(0.25, base.spd * 0.9);
                    this.bossTitle = this.bossTitle || '';
                } else {
                    // Standardized sizes for non-boss enemies by subtype
                    const SUBTYPE_FACTOR = { normal: 1.0, fighter: 0.95, tank: 1.35, rogue: 0.8 };
                    const base = THEME_BASE[this.theme] || THEME_BASE.defaultSpace;
                    baseRadius = Math.max(8, Math.floor((base.radius * GAME_SCALE_FACTOR) * (SUBTYPE_FACTOR[subtype] || 1)));
                    baseHealth = base.hp;
                    baseDamage = base.dmg;
                    baseSpeed = base.spd;

                    // Apply mild subtype effects
                    if (subtype === 'tank') baseHealth *= 1.6;
                    if (subtype === 'fighter') baseDamage *= 1.4;
                    if (subtype === 'rogue') baseSpeed *= 1.6;
                }

                // Factor in highest player level to slightly increase enemy hp
                const playersArray = window.players || [];
                const highestPlayerLevel = playersArray.length > 0 ? Math.max(...playersArray.map(p => p.level || 1)) : 1;
                const playerLevelHealthContribution = highestPlayerLevel * 1.5;

                // Wave scaling: linear + small exponential factor to increase with hordes
                const waveLinear = 1 + waveLevel * 0.06; // ~6% more HP per wave
                const waveExponential = Math.pow(1.01, Math.max(0, waveLevel - 1)); // gentle scaling

                // Final stats
                if (!isBoss) {
                    this.health = Math.max(5, Math.floor(baseHealth * waveLinear * waveExponential + playerLevelHealthContribution));
                    this.damage = Math.max(1, Math.floor(baseDamage * (1 + waveLevel * 0.03)));
                    this.speed = Math.min(3.5, baseSpeed * (1 + waveLevel * 0.004));
                } else {
                    this.health = Math.max(200, Math.floor(baseHealth * (1 + waveLevel * 0.08) + bossCount * 300));
                    this.damage = Math.max(8, Math.floor(baseDamage * (1 + waveLevel * 0.05)));
                    this.speed = Math.max(0.2, baseSpeed * (1 + waveLevel * 0.002));
                    // Assign boss title based on theme for display
                    switch(this.theme) {
                        case 'drone': this.bossTitle = 'NÚCLEO DRONE MESTRE'; break;
                        case 'robotSentinel': this.bossTitle = 'LÍDER DA GUARDA ROBÓTICA'; break;
                        case 'spaceThief': this.bossTitle = 'CHEFE DA GANGUE ESPACIAL'; break;
                        case 'galacticPirate': this.bossTitle = 'CAPITÃO GALAXY'; break;
                        case 'invaderAlien': this.bossTitle = 'COMANDANTE ZORG'; break;
                        case 'otherworldlyBeast': this.bossTitle = 'MÃE BESTIAL'; break;
                        case 'intergalacticHunter': this.bossTitle = 'UR-DRAZ, O LÍDER CAÇADOR'; break;
                        case 'universeSentinel': this.bossTitle = 'GRANDE MESTRE UNIVERSAL'; break;
                        case 'voidWarrior': this.bossTitle = 'GRANDE GUERREIRO DO VAZIO'; break;
                        case 'voidBeast': this.bossTitle = 'A BESTA SOMBRIA'; break;
                        case 'chaosLord': this.bossTitle = 'O SENHOR DO CAOS'; break;
                        default: this.bossTitle = 'CHEFE ALIENÍGENA'; break;
                    }
                }

                // Set radius and clamp
                this.radius = Math.min(120, Math.max(8, Math.floor(baseRadius)));
                this.maxHealth = this.health;
                this.isDead = false;
                // Optional initial velocity applied for a short spawn-orbit phase
                this.vx = (initialVel && initialVel.vx) || 0;
                this.vy = (initialVel && initialVel.vy) || 0;
                this.spawnOrbitTimer = 0;
                this.spawnOrbitDuration = spawnOrbitDuration || 0;

                this.attackTimer = Math.random() * 1200;
                this.attackCooldown = 1500 + Math.random() * 1200;
                this.attackRange = this.isBoss ? 220 : 140;
                this.attackTypes = this.chooseAttackTypes();
                this.attackType = this.attackTypes[Math.floor(Math.random() * this.attackTypes.length)];
                this.attackCharge = 0;
            }

            // Function to get more neutral colors, with options for more vibrant colors
            getRandomShipColors(neutralityFactor = 1) {
                // Define a base color palette that includes neutral and some vibrant colors
                const baseColors = [
                    // Neutral/Technological
                    [150, 150, 150], // Gray
                    [100, 100, 120], // Dark bluish-gray
                    [80, 80, 80],   // Dark gray
                    [180, 180, 180], // Light gray
                    [60, 70, 80],   // Grayish navy blue

                    // Vibrant/Accentuated
                    [0, 255, 255],   // Cyan (vibrant)
                    [255, 0, 255],   // Magenta (vibrant)
                    [255, 255, 0],   // Yellow (vibrant)
                    [0, 255, 0],     // Green (vibrant)
                    [255, 165, 0],   // Orange (vibrant)
                    [128, 0, 128],   // Purple (vibrant)
                    [255, 69, 0]     // Orange-red (vibrant)
                ];

                const chosenColor = baseColors[Math.floor(Math.random() * baseColors.length)];

                // Apply the neutrality factor: the smaller it is, the closer the color gets to gray
                // This is done by mixing the original color with a neutral gray
                const neutralGray = 128; // A medium gray value
                const r = chosenColor[0] * neutralityFactor + neutralGray * (1 - neutralityFactor);
                const g = chosenColor[1] * neutralityFactor + neutralGray * (1 - neutralityFactor);
                const b = chosenColor[2] * neutralityFactor + neutralGray * (1 - neutralityFactor);

                return `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
            }

            chooseAttackTypes() {
                if (this.isBoss) {
                    const bossOptions = ['melee', 'poison', 'slow', 'push', 'stun', 'pierce'];
                    const selected = [];
                    const count = 2 + Math.floor(Math.random() * 2);
                    while (selected.length < count) {
                        const candidate = bossOptions[Math.floor(Math.random() * bossOptions.length)];
                        if (!selected.includes(candidate)) selected.push(candidate);
                    }
                    return selected;
                }

                const subtypeAttackMap = {
                    normal: ['melee', 'poison'],
                    fighter: ['pierce', 'melee'],
                    tank: ['push', 'slow'],
                    rogue: ['melee', 'slow'],
                };
                return subtypeAttackMap[this.subtype] || ['melee'];
            }

            performAttack(target, allTargets) {
                if (!target || target.health <= 0) return;
                const dx = target.x - this.x;
                const dy = target.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const dirX = dist === 0 ? 0 : dx / dist;
                const dirY = dist === 0 ? 0 : dy / dist;
                const baseDamage = Math.max(1, Math.floor(this.damage * (this.isBoss ? 1.15 : 1.0)));
                const attackRange = this.attackRange + (this.attackType === 'pierce' ? 20 : 0);
                if (dist > attackRange) return;

                switch (this.attackType) {
                    case 'poison':
                        target.takeDamage(Math.floor(baseDamage * 0.9));
                        if (typeof target.applyStatusEffect === 'function') {
                            target.applyStatusEffect({ type: 'poison', damage: Math.max(1, Math.floor(baseDamage * 0.25)), duration: 4000, interval: 1000 });
                        }
                        break;
                    case 'slow':
                        target.takeDamage(Math.floor(baseDamage * 0.85));
                        if (typeof target.applyStatusEffect === 'function') {
                            target.applyStatusEffect({ type: 'slow', factor: 0.52, duration: 2600 });
                        }
                        break;
                    case 'push':
                        target.takeDamage(Math.floor(baseDamage * 0.95));
                        if (typeof target.applyStatusEffect === 'function') {
                            target.applyStatusEffect({ type: 'push', powerX: dirX * 7, powerY: dirY * 7 });
                        }
                        break;
                    case 'stun':
                        target.takeDamage(Math.floor(baseDamage * 0.8));
                        if (typeof target.applyStatusEffect === 'function') {
                            target.applyStatusEffect({ type: 'paralyze', duration: 1200 });
                        }
                        break;
                    case 'pierce':
                        for (const player of allTargets) {
                            const pDist = Math.sqrt((player.x - this.x) ** 2 + (player.y - this.y) ** 2);
                            if (pDist <= attackRange * 1.2) {
                                player.takeDamage(baseDamage);
                            }
                        }
                        break;
                    case 'melee':
                    default:
                        target.takeDamage(baseDamage);
                        break;
                }
            }

            update(targets, deltaTime) {
                this.animationTimer += 1;
                if (this.paralyzed) {
                    this.paralyzeTimer += deltaTime;
                    if (this.paralyzeTimer >= this.paralyzeDuration) {
                        this.paralyzed = false;
                        this.paralyzeTimer = 0;
                    }
                    return; // Do not move if paralyzed
                }

                const validTargets = Array.isArray(targets) ? targets.filter(t => t && t.health > 0) : [];
                
                if (validTargets.length === 0) return;

                let closestTarget = null;
                let minDist = Infinity;

                for (const target of validTargets) {
                    const dx = target.x - this.x;
                    const dy = target.y - this.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < minDist) {
                        minDist = dist;
                        closestTarget = target;
                    }
                }

                if (this.spawnOrbitTimer < this.spawnOrbitDuration) {
                    // Apply initial orbital velocity on spawn
                    this.x += this.vx;
                    this.y += this.vy;
                    this.spawnOrbitTimer += deltaTime;
                    // Slight damping so it eases into normal movement
                    this.vx *= 0.98;
                    this.vy *= 0.98;
                    return; // skip normal targeting while orbiting
                }

                if (closestTarget) {
                    const angle = Math.atan2(closestTarget.y - this.y, closestTarget.x - this.x);
                    
                    let currentEnemySpeed = this.speed;
                    // Enemy Speed Balancing per Wave
                    if (!this.isBoss && waveLevel >= 15) {
                        currentEnemySpeed *= 1.20; // Increases speed by 20%
                    }

                    // If enemy is offscreen for all players, make it move faster to catch up to the playable map.
                    const isOffscreen = this.x < window.viewLeft || this.x > window.viewRight || this.y < window.viewTop || this.y > window.viewBottom;
                    if (isOffscreen) {
                        currentEnemySpeed *= 1.45 + Math.min(0.35, waveLevel * 0.01);
                    }

                    this.x += Math.cos(angle) * currentEnemySpeed;
                    this.y += Math.sin(angle) * currentEnemySpeed;
                }

                this.attackTimer += deltaTime;
                this.attackCharge = Math.min(1, this.attackTimer / Math.max(1, this.attackCooldown));
                if (this.attackTimer >= this.attackCooldown) {
                    this.attackTimer = 0;
                    this.attackCooldown = 1500 + Math.random() * 1200;
                    this.performAttack(closestTarget, validTargets);
                }
            }

            takeDamage(amount) {
                this.health -= Math.floor(amount);
                if (this.health < 0) this.health = 0;
                if (this.isBoss) {
                    console.log(`Chefe ${this.bossTitle} sofreu ${amount} de dano. Vida restante: ${this.health}`);
                }
                return this.health <= 0;
            }

            draw() {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.strokeStyle = 'black'; // Set global stroke style for all enemy parts
                ctx.lineWidth = 2; // Set global line width for outlines

                ctx.save();
                // Adapt drawing for new themes
                switch (this.theme) {
                    case 'drone': this.drawDrone(); break;
                    case 'robotSentinel': this.drawRobotSentinel(); break;
                    case 'spaceThief': this.drawSpaceThief(); break;
                    case 'galacticPirate': this.drawGalacticPirate(); break;
                    case 'invaderAlien': this.drawInvaderAlien(); break;
                    case 'otherworldlyBeast': this.drawOtherworldlyBeast(); break;
                    case 'intergalacticHunter': this.drawIntergalacticHunter(); break;
                    case 'universeSentinel': this.drawUniverseSentinel(); break;
                    case 'voidWarrior': this.drawVoidWarrior(); break;
                    case 'voidBeast': this.drawVoidBeast(); break;
                    case 'chaosLord': this.drawChaosLord(); break;
                    default: this.drawDefaultSpaceEnemy(); break;
                }
                ctx.restore(); // Restore after theme-specific drawing to prevent double stroke or style leakage

                // Health Bar (Energy Bar) - drawn after restoring context so it's not rotated
                const healthPercentage = this.health / this.maxHealth;
                const healthBarWidth = this.radius * 2;
                const healthBarHeight = this.isBoss ? 6 : 4;

                let healthBarYOffset;
                switch (this.theme) {
                    case 'drone': healthBarYOffset = this.radius * 1.5; break;
                    case 'robotSentinel': healthBarYOffset = this.radius * 1.5; break;
                    case 'spaceThief': healthBarYOffset = this.radius * 1.2; break;
                    case 'galacticPirate': healthBarYOffset = this.radius * 2.0; break;
                    case 'invaderAlien': healthBarYOffset = this.radius * 1.8; break;
                    case 'otherworldlyBeast': healthBarYOffset = this.radius * 2.5; break;
                    case 'intergalacticHunter': healthBarYOffset = this.radius * 2.0; break;
                    case 'universeSentinel': healthBarYOffset = this.radius * 2.5; break;
                    case 'voidWarrior': healthBarYOffset = this.radius * 2.2; break;
                    case 'voidBeast': healthBarYOffset = this.radius * 2.8; break;
                    case 'chaosLord': healthBarYOffset = this.radius * 3.0; break;
                    default: healthBarYOffset = this.radius + 10; break;
                }

                ctx.fillStyle = '#8B0000'; // Dark red for health bar background
                ctx.fillRect(-healthBarWidth / 2, healthBarYOffset, healthBarWidth, healthBarHeight);
                ctx.strokeRect(-healthBarWidth / 2, healthBarYOffset, healthBarWidth, healthBarHeight); // Outline for health bar

                ctx.fillStyle = '#00FF00'; // Neon green for fill
                ctx.fillRect(-healthBarWidth / 2, healthBarYOffset, healthBarWidth * healthPercentage, healthBarHeight);

                if (this.isBoss) {
                    ctx.font = '14px "Press Start 2P"'; // Larger font for boss title
                    ctx.fillStyle = '#FFD700'; // Gold neon
                    ctx.textAlign = 'center';
                    ctx.fillText(this.bossTitle, 0, healthBarYOffset + 20);
                }

                // Attack charge effect
                if (this.attackCharge > 0.1) {
                    ctx.beginPath();
                    ctx.arc(0, 0, this.radius + 4 + this.attackCharge * 8, 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(255, 210, 120, ${0.16 + this.attackCharge * 0.28})`;
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }

                // Paralysis visual effect
                if (this.paralyzed) {
                    ctx.beginPath();
                    ctx.arc(0, 0, this.radius + 5 + Math.sin(gameTime / 100) * 2, 0, Math.PI * 2);
                    ctx.strokeStyle = 'rgba(0, 200, 255, 0.9)'; // Light blue/cyan for paralysis
                    ctx.lineWidth = 4;
                    ctx.stroke();
                }
                ctx.restore();
            }

            drawDrone() {
                const size = this.radius * 1.2; // Slightly smaller base size
                const bodyColor = this.hullColor;
                const detailColor = 'rgba(150, 150, 150, 0.9)'; // Metallic gray
                const lightColor = this.sensorColor; // Cyan neon, now uses dynamic color

                ctx.rotate(this.animationTimer * 0.005); // ONLY DRONE HAS ROTATION

                // Main body (hexagon)
                ctx.fillStyle = bodyColor;
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const angle = (Math.PI / 3) * i;
                    ctx.lineTo(size * Math.cos(angle), size * Math.sin(angle));
                }
                ctx.closePath();
                ctx.fill();
                ctx.stroke(); // Outline for main body

                // Central eye / sensor
                ctx.fillStyle = lightColor;
                ctx.beginPath();
                ctx.arc(0, 0, size * 0.2, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke(); // Outline for eye

                // Propellers (small rectangles)
                ctx.fillStyle = detailColor;
                const propSize = size * 0.3; // Proportionally smaller
                const propOffset = size * 0.9; // Further out
                
                ctx.fillRect(-propOffset, -propSize / 2, propSize, propSize);
                ctx.strokeRect(-propOffset, -propSize / 2, propSize, propSize); // Outline
                
                ctx.fillRect(propOffset - propSize, -propSize / 2, propSize, propSize);
                ctx.strokeRect(propOffset - propSize, -propSize / 2, propSize, propSize); // Outline
                
                ctx.fillRect(-propSize / 2, -propOffset, propSize, propSize);
                ctx.strokeRect(-propSize / 2, -propOffset, propSize, propSize); // Outline
                
                ctx.fillRect(-propSize / 2, propOffset - propSize, propSize, propSize);
                ctx.strokeRect(-propSize / 2, propOffset - propSize, propSize, propSize); // Outline
            }

            drawRobotSentinel() {
                const size = this.radius * 1.5;
                const bodyColor = this.hullColor;
                const accentColor = this.sensorColor; // Green neon, now uses dynamic color

                // Main body (square)
                ctx.fillStyle = bodyColor;
                ctx.fillRect(-size * 0.6, -size * 0.6, size * 1.2, size * 1.2);
                ctx.strokeRect(-size * 0.6, -size * 0.6, size * 1.2, size * 1.2); // Outline
                
                // Head (circle)
                ctx.fillStyle = accentColor;
                ctx.beginPath();
                ctx.arc(0, -size * 0.7, size * 0.3, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke(); // Outline
                // Eyes (two small squares)
                ctx.fillStyle = this.engineColor; // Now uses engine color (more vibrant)
                ctx.fillRect(-size * 0.2, -size * 0.75, size * 0.1, size * 0.1);
                ctx.strokeRect(-size * 0.2, -size * 0.75, size * 0.1, size * 0.1); // Outline
                ctx.fillRect(size * 0.1, -size * 0.75, size * 0.1, size * 0.1);
                ctx.strokeRect(size * 0.1, -size * 0.75, size * 0.1, size * 0.1); // Outline

                // Arms (rectangles) - segmented
                ctx.fillStyle = bodyColor;
                const armLength = size * 0.8;
                const armWidth = size * 0.2;
                const segmentHeight = armLength / 2;

                // Left arm
                ctx.fillRect(-size * 0.8, -size * 0.4, armWidth, segmentHeight);
                ctx.strokeRect(-size * 0.8, -size * 0.4, armWidth, segmentHeight);
                ctx.fillRect(-size * 0.8, -size * 0.4 + segmentHeight, armWidth, segmentHeight);
                ctx.strokeRect(-size * 0.8, -size * 0.4 + segmentHeight, armWidth, segmentHeight);

                // Right arm
                ctx.fillRect(size * 0.6, -size * 0.4, armWidth, segmentHeight);
                ctx.strokeRect(size * 0.6, -size * 0.4, armWidth, segmentHeight);
                ctx.fillRect(size * 0.6, -size * 0.4 + segmentHeight, armWidth, segmentHeight);
                ctx.strokeRect(size * 0.6, -size * 0.4 + segmentHeight, armWidth, segmentHeight);

                // Legs (rectangles) - segmented
                const legLength = size * 0.4;
                const legWidth = size * 0.2;
                const legSegmentHeight = legLength / 2;

                // Left leg
                ctx.fillRect(-size * 0.4, size * 0.6, legWidth, legSegmentHeight);
                ctx.strokeRect(-size * 0.4, size * 0.6, legWidth, legSegmentHeight);
                ctx.fillRect(-size * 0.4, size * 0.6 + legSegmentHeight, legWidth, legSegmentHeight);
                ctx.strokeRect(-size * 0.4, size * 0.6 + legSegmentHeight, legWidth, legSegmentHeight);

                // Right leg
                ctx.fillRect(size * 0.2, size * 0.6, legWidth, legSegmentHeight);
                ctx.strokeRect(size * 0.2, size * 0.6, legWidth, legSegmentHeight);
                ctx.fillRect(size * 0.2, size * 0.6 + legSegmentHeight, legWidth, legSegmentHeight);
                ctx.strokeRect(size * 0.2, size * 0.6 + legSegmentHeight, legWidth, legSegmentHeight);
            }

            drawSpaceThief() {
                const size = this.radius * 1.4;
                const bodyColor = this.hullColor;
                const accentColor = this.sensorColor; // Yellow/orange neon, now dynamic

                // Main body (jagged, asymmetric shape)
                ctx.fillStyle = bodyColor;
                ctx.beginPath();
                ctx.moveTo(0, -size * 1.0);
                ctx.lineTo(size * 0.8, -size * 0.2);
                ctx.lineTo(size * 0.4, size * 0.8);
                ctx.lineTo(-size * 0.6, size * 0.5);
                ctx.lineTo(-size * 0.9, -size * 0.5);
                ctx.closePath();
                ctx.fill();
                ctx.stroke(); // Outline

                // Cockpit (triangle)
                ctx.fillStyle = accentColor;
                ctx.beginPath();
                ctx.moveTo(0, -size * 0.8);
                ctx.lineTo(size * 0.3, -size * 0.4);
                ctx.lineTo(-size * 0.3, -size * 0.4);
                ctx.closePath();
                ctx.fill();
                ctx.stroke(); // Outline

                // Engine exhaust (small rectangles at back)
                ctx.fillStyle = this.engineColor; // Orange, now dynamic
                ctx.fillRect(size * 0.2, size * 0.7, size * 0.15, size * 0.2);
                ctx.strokeRect(size * 0.2, size * 0.7, size * 0.15, size * 0.2); // Outline
                ctx.fillRect(-size * 0.4, size * 0.6, size * 0.15, size * 0.2);
                ctx.strokeRect(-size * 0.4, size * 0.6, size * 0.15, size * 0.2); // Outline

                // Side fins/weapons
                ctx.fillStyle = bodyColor;
                ctx.beginPath();
                ctx.moveTo(size * 0.9, -size * 0.1);
                ctx.lineTo(size * 1.2, -size * 0.3);
                ctx.lineTo(size * 0.9, -size * 0.4);
                ctx.closePath();
                ctx.fill();
                ctx.stroke(); // Outline

                ctx.beginPath();
                ctx.moveTo(-size * 0.9, -size * 0.1);
                ctx.lineTo(-size * 1.2, -size * 0.3);
                ctx.lineTo(-size * 0.9, -size * 0.4);
                ctx.closePath();
                ctx.fill();
                ctx.stroke(); // Outline
            }

            drawGalacticPirate() {
                const size = this.radius * 1.7;
                const bodyColor = this.hullColor;
                const weaponColor = this.weaponColor; // Red, now dynamic
                const sailColor = this.shieldColor; // Blueish transparent, now dynamic

                // Main body (boat-like shape)
                ctx.fillStyle = bodyColor;
                ctx.beginPath();
                ctx.moveTo(-size * 0.8, size * 0.4);
                ctx.lineTo(size * 0.8, size * 0.4);
                ctx.lineTo(size * 0.6, -size * 0.2);
                ctx.lineTo(-size * 0.6, -size * 0.2);
                ctx.closePath();
                ctx.fill();
                ctx.stroke(); // Outline

                // Mast
                ctx.fillStyle = this.engineColor; // Gray, now dynamic
                ctx.fillRect(-size * 0.05, -size * 0.8, size * 0.1, size * 1.2);
                ctx.strokeRect(-size * 0.05, -size * 0.8, size * 0.1, size * 1.2); // Outline

                // Sail (triangle) - more defined lines
                ctx.fillStyle = sailColor;
                ctx.beginPath();
                ctx.moveTo(0, -size * 0.8);
                ctx.lineTo(size * 0.5, size * 0.0);
                ctx.lineTo(-size * 0.5, size * 0.0);
                ctx.closePath();
                ctx.fill();
                ctx.stroke(); // Outline

                // Cannon (front) - more detail
                ctx.fillStyle = weaponColor;
                ctx.fillRect(-size * 0.15, -size * 0.3, size * 0.3, size * 0.1);
                ctx.strokeRect(-size * 0.15, -size * 0.3, size * 0.3, size * 0.1); // Outline
                
                // Cannons on sides (small rectangles)
                ctx.fillStyle = weaponColor;
                ctx.fillRect(size * 0.7, size * 0.1, size * 0.15, size * 0.05);
                ctx.strokeRect(size * 0.7, size * 0.1, size * 0.15, size * 0.05);
                ctx.fillRect(-size * 0.85, size * 0.1, size * 0.15, size * 0.05);
                ctx.strokeRect(-size * 0.85, size * 0.1, size * 0.15, size * 0.05);
            }

            drawInvaderAlien() {
                const size = this.radius * 1.6;
                const bodyColor = this.hullColor;
                const eyeColor = this.sensorColor; // Bright green, now dynamic
                const tentacleColor = this.weaponColor; // Purple, now dynamic

                // Main body (blob/oval) - more organic shape
                ctx.fillStyle = bodyColor;
                ctx.beginPath();
                ctx.ellipse(0, 0, size * 0.7, size * 0.9, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke(); // Outline
                
                ctx.fillStyle = 'black'; // Pupil
                ctx.beginPath();
                ctx.arc(0, -size * 0.2, size * 0.1, 0, Math.PI * 2);
                ctx.fill();

                // Tentacles (simple lines) - thicker and more
                ctx.strokeStyle = tentacleColor;
                ctx.lineWidth = 3; // Thicker lines
                for (let i = 0; i < 5; i++) { // More tentacles
                    const angle = (Math.PI / 3) * i + Math.PI / 2;
                    ctx.beginPath();
                    ctx.moveTo(0, size * 0.6);
                    ctx.lineTo(Math.cos(angle) * size * 0.8, Math.sin(angle) * size * 0.8);
                    ctx.stroke();
                }
            }

            drawOtherworldlyBeast() {
                const size = this.radius * 1.9;
                const bodyColor = this.hullColor;
                const fangColor = this.sensorColor; // White, now dynamic
                const hornColor = this.engineColor; // Brown, now dynamic
                const glowColor = this.weaponColor.replace(')', ', 0.5)'); // Red glow, now dynamic

                // Main body (rough, irregular shape) - more jagged
                ctx.fillStyle = bodyColor;
                ctx.beginPath();
                ctx.moveTo(0, -size * 0.8);
                ctx.lineTo(size * 0.6, -size * 0.4);
                ctx.lineTo(size * 0.8, size * 0.2);
                ctx.lineTo(size * 0.4, size * 0.9);
                ctx.lineTo(-size * 0.4, size * 0.9);
                ctx.lineTo(-size * 0.8, size * 0.2);
                ctx.lineTo(-size * 0.6, -size * 0.4);
                ctx.closePath();
                ctx.fill();
                ctx.stroke(); // Outline

                // Eyes (two glowing circles) - more intense glow
                ctx.fillStyle = glowColor;
                ctx.beginPath();
                ctx.arc(-size * 0.25, -size * 0.3, size * 0.18, 0, Math.PI * 2); // Slightly larger
                ctx.arc(size * 0.25, -size * 0.3, size * 0.18, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = this.weaponColor; // Inner red part, now dynamic
                ctx.beginPath();
                ctx.arc(-size * 0.25, -size * 0.3, size * 0.1, 0, Math.PI * 2);
                ctx.arc(size * 0.25, -size * 0.3, size * 0.1, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke(); // Outline for eyes

                // Fangs - sharper
                ctx.fillStyle = fangColor;
                ctx.beginPath();
                ctx.moveTo(-size * 0.2, size * 0.2);
                ctx.lineTo(-size * 0.35, size * 0.55); // More pointed
                ctx.lineTo(-size * 0.1, size * 0.4);
                ctx.closePath();
                ctx.fill();
                ctx.stroke(); // Outline

                ctx.beginPath();
                ctx.moveTo(size * 0.2, size * 0.2);
                ctx.lineTo(size * 0.35, size * 0.55); // More pointed
                ctx.lineTo(size * 0.1, size * 0.4);
                ctx.closePath();
                ctx.fill();
                ctx.stroke(); // Outline

                // Horns - more prominent
                ctx.fillStyle = hornColor;
                ctx.beginPath();
                ctx.moveTo(-size * 0.3, -size * 0.7);
                ctx.lineTo(-size * 0.45, -size * 1.1); // Longer
                ctx.lineTo(-size * 0.1, -size * 0.7);
                ctx.closePath();
                ctx.fill();
                ctx.stroke(); // Outline
                ctx.beginPath();
                ctx.moveTo(size * 0.3, -size * 0.7);
                ctx.lineTo(size * 0.45, -size * 1.1); // Longer
                ctx.lineTo(size * 0.1, -size * 0.7);
                ctx.closePath();
                ctx.fill();
                ctx.stroke(); // Outline
            }

            drawIntergalacticHunter() {
                const size = this.radius * 1.7;
                const bodyColor = this.hullColor;
                const lightColor = this.sensorColor; // Cyan, now dynamic
                const weaponColor = this.weaponColor; // Red, now dynamic

                // Main body (sleek, triangular) - more defined angles
                ctx.fillStyle = bodyColor;
                ctx.beginPath();
                ctx.moveTo(0, -size);
                ctx.lineTo(size * 0.9, size * 0.5);
                ctx.lineTo(-size * 0.9, size * 0.5);
                ctx.closePath();
                ctx.fill();
                ctx.stroke(); // Outline

                // Cockpit (small triangle at front) - more defined
                ctx.fillStyle = lightColor;
                ctx.beginPath();
                ctx.moveTo(0, -size * 0.8);
                ctx.lineTo(size * 0.2, -size * 0.5);
                ctx.lineTo(-size * 0.2, -size * 0.5);
                ctx.closePath();
                ctx.fill();
                ctx.stroke(); // Outline

                // Wing guns (small rectangles at wing tips) - more pronounced
                ctx.fillStyle = weaponColor;
                ctx.fillRect(size * 0.8, size * 0.4, size * 0.2, size * 0.1);
                ctx.strokeRect(size * 0.8, size * 0.4, size * 0.2, size * 0.1); // Outline
                ctx.fillRect(-size * 1.0, size * 0.4, size * 0.2, size * 0.1);
                ctx.strokeRect(-size * 1.0, size * 0.4, size * 0.2, size * 0.1); // Outline

                // Rear thrusters (triangles)
                ctx.fillStyle = this.engineColor; // Orange, now dynamic
                ctx.beginPath();
                ctx.moveTo(size * 0.4, size * 0.5);
                ctx.lineTo(size * 0.2, size * 0.7);
                ctx.lineTo(size * 0.6, size * 0.7);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(-size * 0.4, size * 0.5);
                ctx.lineTo(-size * 0.2, size * 0.7);
                ctx.lineTo(-size * 0.6, size * 0.7);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            }

            drawUniverseSentinel() {
                const size = this.radius * 2.0;
                const bodyColor = this.hullColor;
                const energyColor = this.sensorColor; // Magenta, now dynamic
                const accentColor = this.engineColor; // Silver, now dynamic

                // Main body (large, circular core with extensions) - more layered
                ctx.fillStyle = bodyColor;
                ctx.beginPath();
                ctx.arc(0, 0, size * 0.7, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke(); // Outline
                
                ctx.fillStyle = accentColor; // Inner ring
                ctx.beginPath();
                ctx.arc(0, 0, size * 0.6, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke(); // Outline

                // Energy core (pulsating circle, fixed)
                ctx.fillStyle = energyColor;
                ctx.beginPath();
                ctx.arc(0, 0, size * 0.4, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke(); // Outline

                // Extensions (rectangles) - more intricate connections
                ctx.fillStyle = bodyColor;
                ctx.fillRect(-size * 0.2, -size * 1.0, size * 0.4, size * 0.2); // Top
                ctx.strokeRect(-size * 0.2, -size * 1.0, size * 0.4, size * 0.2); // Outline
                ctx.fillRect(-size * 0.2, size * 0.8, size * 0.4, size * 0.2); // Bottom
                ctx.strokeRect(-size * 0.2, size * 0.8, size * 0.4, size * 0.2); // Outline
                ctx.fillRect(-size * 1.0, -size * 0.2, size * 0.2, size * 0.4); // Left
                ctx.strokeRect(-size * 1.0, -size * 0.2, size * 0.2, size * 0.4); // Outline
                ctx.fillRect(size * 0.8, -size * 0.2, size * 0.2, size * 0.4); // Right
                ctx.strokeRect(size * 0.8, -size * 0.2, size * 0.2, size * 0.4); // Outline

                // Connecting lines/details
                ctx.strokeStyle = accentColor;
                ctx.beginPath();
                ctx.moveTo(size * 0.2, -size * 0.8);
                ctx.lineTo(size * 0.5, -size * 0.5);
                ctx.moveTo(-size * 0.2, -size * 0.8);
                ctx.lineTo(-size * 0.5, -size * 0.5);
                ctx.moveTo(size * 0.2, size * 0.8);
                ctx.lineTo(size * 0.5, size * 0.5);
                ctx.moveTo(-size * 0.2, size * 0.8);
                ctx.lineTo(-size * 0.5, size * 0.5);
                ctx.stroke();
            }

            drawVoidWarrior() {
                const size = this.radius * 1.8;
                const bodyColor = this.hullColor; // Dark, shadowy, now dynamic
                const eyeColor = this.sensorColor; // Glowing eyes, now dynamic
                const glowColor = this.sensorColor.replace(')', ', 0.4)'); // Yellow glow, now dynamic

                // Main body (abstract, shadowy shape - multi-pointed star/crystal)
                ctx.fillStyle = bodyColor;
                ctx.beginPath();
                ctx.moveTo(0, -size);
                ctx.lineTo(size * 0.4, -size * 0.4);
                ctx.lineTo(size, 0);
                ctx.lineTo(size * 0.4, size * 0.4);
                ctx.lineTo(0, size);
                ctx.lineTo(-size * 0.4, size * 0.4);
                ctx.lineTo(-size, 0);
                ctx.lineTo(-size * 0.4, -size * 0.4);
                ctx.closePath();
                ctx.fill();
                ctx.stroke(); // Outline

                // Central glowing eye - more pronounced glow
                ctx.fillStyle = glowColor;
                ctx.beginPath();
                ctx.arc(0, 0, size * 0.3, 0, Math.PI * 2); // Larger glow area
                ctx.fill();
                ctx.fillStyle = eyeColor;
                ctx.beginPath();
                ctx.arc(0, 0, size * 0.2, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke(); // Outline for eye

                // Subtle cracks/patterns
                ctx.strokeStyle = this.engineColor; // Darker lines, now dynamic
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(-size * 0.3, -size * 0.8);
                ctx.lineTo(size * 0.3, -size * 0.8);
                ctx.moveTo(-size * 0.8, -size * 0.3);
                ctx.lineTo(size * 0.8, -size * 0.3);
                ctx.moveTo(0, -size * 0.6);
                ctx.lineTo(0, size * 0.6);
                ctx.stroke();
            }

            drawVoidBeast() {
                const size = this.radius * 2.2;
                const bodyColor = this.hullColor; // Dark, amorphous, now dynamic
                const eyeColor = this.sensorColor; // Red, now dynamic
                const spikeColor = this.engineColor; // Gray, now dynamic
                const glowColor = this.sensorColor.replace(')', ', 0.3)'); // Red glow, now dynamic

                // Main body (large, amorphous blob) - more organic, less defined ellipse
                ctx.fillStyle = bodyColor;
                ctx.beginPath();
                ctx.moveTo(0, -size * 1.1);
                ctx.quadraticCurveTo(size * 0.9, -size * 0.8, size * 1.0, 0);
                ctx.quadraticCurveTo(size * 0.8, size * 0.9, 0, size * 1.1);
                ctx.quadraticCurveTo(-size * 0.8, size * 0.9, -size * 1.0, 0);
                ctx.quadraticCurveTo(-size * 0.9, -size * 0.8, 0, -size * 1.1);
                ctx.closePath();
                ctx.fill();
                ctx.stroke(); // Outline

                // Multiple eyes - more intense glow
                ctx.fillStyle = glowColor;
                ctx.beginPath();
                ctx.arc(-size * 0.3, -size * 0.4, size * 0.18, 0, Math.PI * 2);
                ctx.arc(size * 0.3, -size * 0.4, size * 0.18, 0, Math.PI * 2);
                ctx.arc(0, size * 0.3, size * 0.18, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = eyeColor;
                ctx.beginPath();
                ctx.arc(-size * 0.3, -size * 0.4, size * 0.1, 0, Math.PI * 2);
                ctx.arc(size * 0.3, -size * 0.4, size * 0.1, 0, Math.PI * 2);
                ctx.arc(0, size * 0.3, size * 0.1, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke(); // Outline for eyes

                // Spikes/protrusions - more numerous and jagged
                ctx.fillStyle = spikeColor;
                ctx.beginPath();
                ctx.moveTo(-size * 0.8, -size * 0.1); ctx.lineTo(-size * 1.1, -size * 0.3); ctx.lineTo(-size * 0.8, -size * 0.5); ctx.closePath(); ctx.fill(); ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(size * 0.8, -size * 0.1); ctx.lineTo(size * 1.1, -size * 0.3); ctx.lineTo(size * 0.8, -size * 0.5); ctx.closePath(); ctx.fill(); ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(-size * 0.5, size * 0.8); ctx.lineTo(-size * 0.7, size * 1.1); ctx.lineTo(-size * 0.3, size * 0.8); ctx.closePath(); ctx.fill(); ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(size * 0.5, size * 0.8); ctx.lineTo(size * 0.7, size * 1.1); ctx.lineTo(size * 0.3, size * 0.8); ctx.closePath(); ctx.fill(); ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(0, -size * 1.2); ctx.lineTo(size * 0.1, -size * 1.4); ctx.lineTo(-size * 0.1, -size * 1.4); ctx.closePath(); ctx.fill(); ctx.stroke();
            }

            drawChaosLord() { // Final Boss
                const size = this.radius * 0.8; // Base for this massive entity
                const coreColor = this.hullColor; // Darkred, now dynamic
                const tendrilColor = this.weaponColor; // Purple, now dynamic
                const eyeColor = this.sensorColor; // Lime, now dynamic
                const secondaryColor = this.engineColor; // Gray, for armor plates, now dynamic
                const glowStrength = 0.5 + Math.sin(gameTime / 200) * 0.2; // Pulsating glow

                // Main central core (large, jagged circle)
                ctx.fillStyle = coreColor;
                ctx.beginPath();
                ctx.arc(0, 0, size * 3.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke(); // Outline for core

                // Layered armor plates
                ctx.fillStyle = secondaryColor;
                for (let i = 0; i < 6; i++) {
                    const angle = (Math.PI / 3) * i + (this.animationTimer * 0.001); // Slowly rotating
                    ctx.beginPath();
                    ctx.moveTo(Math.cos(angle) * size * 2.8, Math.sin(angle) * size * 2.8);
                    ctx.lineTo(Math.cos(angle + 0.5) * size * 3.2, Math.sin(angle + 0.5) * size * 3.2);
                    ctx.lineTo(Math.cos(angle + 0.3) * size * 3.8, Math.sin(angle + 0.3) * size * 3.8);
                    ctx.lineTo(Math.cos(angle - 0.2) * size * 3.8, Math.sin(angle - 0.2) * size * 3.8);
                    ctx.lineTo(Math.cos(angle - 0.5) * size * 3.2, Math.sin(angle - 0.5) * size * 3.2);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                }

                // Glowing central eye
                ctx.fillStyle = eyeColor.replace(')', `, ${glowStrength})`); // Dynamically set alpha
                ctx.beginPath();
                ctx.arc(0, 0, size * 1.2, 0, Math.PI * 2); // Larger glow
                ctx.fill();
                ctx.fillStyle = eyeColor;
                ctx.beginPath();
                ctx.arc(0, 0, size * 0.8, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke(); // Outline for eye

                // Tendrils/spikes - more complex and numerous
                ctx.fillStyle = tendrilColor;
                for (let i = 0; i < 12; i++) {
                    const angle = (Math.PI / 6) * i + (this.animationTimer * 0.002); // Faster rotation
                    const outerRadius = size * (4.0 + Math.sin(angle * 3 + this.animationTimer / 50) * 0.3); // Pulsating effect
                    ctx.beginPath();
                    ctx.moveTo(Math.cos(angle) * size * 2.5, Math.sin(angle) * size * 2.5);
                    ctx.lineTo(Math.cos(angle) * outerRadius, Math.sin(angle) * outerRadius);
                    ctx.lineTo(Math.cos(angle + 0.1) * size * 3.5, Math.sin(angle + 0.1) * size * 3.5);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                }

                // Energy conduits/lines on the core
                ctx.strokeStyle = this.shieldColor.replace(')', `, ${glowStrength * 0.8})`); // Dynamically set alpha
                ctx.lineWidth = 3;
                for (let i = 0; i < 4; i++) {
                    const angleOffset = (Math.PI / 2) * i;
                    ctx.beginPath();
                    ctx.arc(0, 0, size * 1.5, angleOffset, angleOffset + Math.PI / 3);
                    ctx.stroke();
                }
            }


            drawDefaultSpaceEnemy() {
                let currentRadius = this.radius;
                const bodyColor = this.hullColor;
                const lightColor = this.sensorColor.replace(')', ', 0.6)'); // Red default, now dynamic and less opaque

                // Main body (circle)
                ctx.fillStyle = bodyColor;
                ctx.beginPath();
                ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke(); // Outline
                
                // Small side thrusters (rectangles)
                ctx.fillStyle = lightColor;
                ctx.fillRect(currentRadius * 0.8, -currentRadius * 0.1, currentRadius * 0.3, currentRadius * 0.2);
                ctx.strokeRect(currentRadius * 0.8, -currentRadius * 0.1, currentRadius * 0.3, currentRadius * 0.2); // Outline
                ctx.fillRect(-currentRadius * 1.1, -currentRadius * 0.1, currentRadius * 0.3, currentRadius * 0.2);
                ctx.strokeRect(-currentRadius * 1.1, -currentRadius * 0.1, currentRadius * 0.3, currentRadius * 0.2); // Outline

                if (this.isBoss) {
                    // Energy rings for bosses (static)
                    ctx.beginPath();
                    ctx.arc(0, 0, currentRadius + 5, 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(255, 255, 255, 0.3)`; // white
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
            }
        }