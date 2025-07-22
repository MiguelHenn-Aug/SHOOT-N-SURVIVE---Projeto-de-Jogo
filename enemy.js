class Enemy {
            constructor(x, y, isBoss = false, subtype = 'normal') {
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

                if (isBoss) {
                    baseRadius = (25 * 3.5) * 0.8; // Larger bosses, without game scale factor, reduced by 20%
                    // Bosses: Initial health will be 700, for each boss wave they will receive +700 health.
                    baseHealth = 700 + (bossCount * 700); 
                    baseDamage = 30; // More Damage
                    baseSpeed = 0.7; // Slightly slower for bosses
                    this.bossTitle = "";
                } else {
                    // Standardized sizes for non-boss enemies
                    const sizes = {
                        'fighter': 1.1, // Medium
                        'tank': 1.2,    // Largest (changed from 'warrior')
                        'rogue': 0.9,   // Smallest
                        'normal': 1.0  // Default size
                    };
                    
                    // Apply subtype sizing
                    let subtypeRadiusFactor = sizes[subtype] || sizes['normal'];
                    baseRadius = (15 * GAME_SCALE_FACTOR) * subtypeRadiusFactor; // Base size for normal enemies, adjusted by subtype factor

                    switch(this.theme) {
                        case 'drone': baseHealth = 20; baseDamage = 9; baseSpeed = 0.8; break; // Base of 18
                        case 'robotSentinel': baseHealth = 35; baseDamage = 11; baseSpeed = 0.7; break;
                        case 'spaceThief': baseHealth = 40; baseDamage = 10; baseSpeed = 1.3; break;
                        case 'galacticPirate': baseHealth = 55; baseDamage = 13; baseSpeed = 0.6; break;
                        case 'invaderAlien': baseHealth = 60; baseDamage = 12; baseSpeed = 0.9; break;
                        case 'otherworldlyBeast': baseHealth = 75; baseDamage = 15; baseSpeed = 0.5; break;
                        case 'intergalacticHunter': baseHealth = 88; baseDamage = 14; baseSpeed = 1.0; break;
                        case 'universeSentinel': baseHealth = 95; baseDamage = 17; baseSpeed = 0.4; break;
                        case 'voidWarrior': baseHealth = 108; baseDamage = 16; baseSpeed = 0.8; break;
                        case 'voidBeast': baseHealth = 115; baseDamage = 19; baseSpeed = 0.6; break;
                        case 'chaosLord': baseHealth = 15000; baseDamage = 50; baseSpeed = 0.3; break; // Massive Final Boss
                        default: baseHealth = 18; baseDamage = 9; baseSpeed = 0.8; break;
                    }
                }
                
                const playersArray = window.players || [];
                const highestPlayerLevel = playersArray.length > 0 ? 
                    Math.max(...playersArray.map(p => p.level || 1)) : 
                    1;
                
                let playerLevelHealthContribution = highestPlayerLevel * 2; // Each player level grants +2 health to the enemy

                // Apply theme-specific adjustments
                if (!isBoss) {
                    switch(this.theme) {
                        case 'drone': break; // No base change
                        case 'robotSentinel': 
                            baseSpeed *= 0.9; 
                            baseHealth *= 1.2; 
                            break;
                        case 'spaceThief': 
                            baseSpeed *= 1.3; 
                            baseHealth *= 0.8; 
                            baseDamage *= 1.1; 
                            break;
                        case 'galacticPirate': 
                            baseSpeed *= 1.5; 
                            baseHealth *= 1.5; 
                            baseDamage *= 1.2; 
                            break;
                        case 'invaderAlien': 
                            baseSpeed *= 1.0; 
                            baseHealth *= 1.1; 
                            baseDamage *= 1.05; 
                            break;
                        case 'otherworldlyBeast': 
                            baseSpeed *= 0.4; 
                            baseHealth *= 1.8; 
                            baseDamage *= 1.3; 
                            break;
                        case 'intergalacticHunter': 
                            baseSpeed *= 1.1; 
                            baseHealth *= 0.95; 
                            baseDamage *= 1.15; 
                            break;
                        case 'universeSentinel': 
                            baseSpeed *= 0.3; 
                            baseHealth *= 2.0; 
                            baseDamage *= 1.5; 
                            break;
                        case 'voidWarrior': 
                            baseSpeed *= 0.8; 
                            baseHealth *= 1.3; 
                            baseDamage *= 1.2; 
                            break;
                        case 'voidBeast': 
                            baseSpeed *= 0.6; 
                            baseHealth *= 1.6; 
                            baseDamage *= 1.4; 
                            break;
                        case 'chaosLord': // Final boss, no adjustments here, base values are already high
                            break;
                    }
                    // Apply subtype-specific stat multipliers (after theme adjustments)
                    if (this.subtype === 'tank') {
                        baseHealth *= 2; // 2x more health for Tank
                    } else if (this.subtype === 'fighter') {
                        baseDamage *= 2; // 2x more damage for Fighter
                    } else if (this.subtype === 'rogue') {
                        baseSpeed *= 2; // 2x more speed for Rogue
                    }
                } else {
                    // Assign specific boss titles based on theme
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
                        case 'chaosLord': this.bossTitle = 'O SENHOR DO CAOS'; break; // Final boss
                        default: this.bossTitle = 'CHEFE ALIENÍGENA'; break;
                    }
                }

                // Final values: +5 health for all Enemies.
                this.health = Math.floor(baseHealth + 5 + (waveLevel * 5) + playerLevelHealthContribution); 
                this.damage = Math.floor(baseDamage + (waveLevel * 0.4));
                this.speed = baseSpeed + (waveLevel * 0.015);

                // Enemy Health Balancing per Wave
                if (!isBoss) {
                    if (waveLevel >= 6 && waveLevel < 10) {
                        this.health *= 2; // Double HEALTH
                    } else if (waveLevel >= 10 && waveLevel < 15) {
                        this.health = (this.health * 2) + 100; // Double HEALTH + 100
                    } else if (waveLevel >= 15) {
                        this.health = (this.health * 2) + 100 + 20; // Double HEALTH + 100 + 20
                    }
                }

                this.radius = baseRadius;
                this.maxHealth = this.health;
                this.isDead = false;
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

                if (closestTarget) {
                    const angle = Math.atan2(closestTarget.y - this.y, closestTarget.x - this.x);
                    
                    let currentEnemySpeed = this.speed;
                    // Enemy Speed Balancing per Wave
                    if (!this.isBoss && waveLevel >= 15) {
                        currentEnemySpeed *= 1.20; // Increases speed by 20%
                    }

                    this.x += Math.cos(angle) * currentEnemySpeed;
                    this.y += Math.sin(angle) * currentEnemySpeed;
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