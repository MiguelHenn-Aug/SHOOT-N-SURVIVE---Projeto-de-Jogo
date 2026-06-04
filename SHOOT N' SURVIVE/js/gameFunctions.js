// Game settings
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');

        // Adjust canvas size to window
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // Game variables
        let gameRunning = false;
        let gamePaused = false;
        let singlePlayer = true;
        let players = [];
        let enemies = [];
        let projectiles = [];
        let particles = []; // This array is for all types of particles (visual and trail damage)
        let expOrbs = [];
        let specialEffects = [];
        let enemySpawnTimer = 0;
        let enemySpawnInterval = 1200; // Enemies appear faster
        let currentEnemiesPerBatch = 1;
        
        let gameTime = 0;
        let enemiesDefeated = 0;
        let enemiesDefeatedSinceLastPotion = 0;
        let lastTime = 0;
        let upgradeSelectionMenuVisible = false;
        let upgradingPlayer = null;
        let waveLevel = 1;
        let waveTimer = 0;
        let waveDuration = 30000; // Waves last less (more action)
        let bossSpawned = false;
        let bossCount = 0;
        let finalBossDefeated = false; // New flag for final boss
        let gameTimerIntervalId = null; // ID for the setInterval for game time UI

        let currentMusic = null; // User-selected music
        let currentScene = 'menu'; // To track current game state for default music
        const mainMenuMusic = document.getElementById('mainMenuMusic');
        const gameMusic = document.getElementById('gameMusic');
        const gameOverMusic = document.getElementById('gameOverMusic');
        let currentDefaultMusicTrack = null; // To keep track of which default music is playing

        let player1Image = null;
        let player2Image = null;

        let player1CustomName = "ATIRADOR 1";
        let player2CustomName = "ATIRADOR 2";

        // Variáveis para navegação por teclado nos menus
        let currentActiveMenu = null;
        let selectedMenuOptionIndex = 0;

        // Constant for the angular spread of basic Projectiles (lasers)
        const PROJECTILE_SPREAD_ANGLE = 0.03; // More focused

        // Global variables to track boomerang drone animation state
        let tactic_boomerangAnimationState = 0;
        const tactic_BOOMERANG_ROTATION_SPEED = 0.15; // Faster rotation

        // Scale factor to increase player, enemy, and projectile sizes by 50%
        const GAME_SCALE_FACTOR = 1.5;

                // World and camera settings (allow world larger than viewport)
                let worldWidth = canvas.width * 3;
                let worldHeight = canvas.height * 3;
                let cameraX = canvas.width / 2;
                let cameraY = canvas.height / 2;
                const CAMERA_LERP = 0.12; // smoothing
                let backgroundAnimationTime = 0; // ms used for animated stars/planets
                const galaxyStars = [];
                const galaxyPlanets = [];
                let bigGalaxy = null;
                const galaxyStarCount = 440;
                const galaxyPlanetCount = 10;
                // Viewport helpers (updated by updateCamera)
                window.viewLeft = cameraX - canvas.width / 2;
                window.viewRight = cameraX + canvas.width / 2;
                window.viewTop = cameraY - canvas.height / 2;
                window.viewBottom = cameraY + canvas.height / 2;

                function updateCamera() {
                    if (players.length === 0) return;
                    let targetX, targetY;
                    const hw = canvas.width / 2;
                    const hh = canvas.height / 2;

                    if (singlePlayer || players.length === 1) {
                        targetX = players[0].x;
                        targetY = players[0].y;
                        cameraX += (targetX - cameraX) * CAMERA_LERP;
                        cameraY += (targetY - cameraY) * CAMERA_LERP;
                    } else {
                        // Compute span between players
                        const p1 = players[0];
                        const p2 = players[1];
                        const minX = Math.min(p1.x, p2.x);
                        const maxX = Math.max(p1.x, p2.x);
                        const minY = Math.min(p1.y, p2.y);
                        const maxY = Math.max(p1.y, p2.y);

                        // If players fit inside viewport, center on midpoint
                        const spanX = maxX - minX;
                        const spanY = maxY - minY;
                        const midX = (minX + maxX) / 2;
                        const midY = (minY + maxY) / 2;

                        // If players are farther apart than viewport, we avoid moving camera further
                        if (spanX > canvas.width - 4 || spanY > canvas.height - 4) {
                            // If both players are near the screen edges (both touching same edge), freeze camera
                            const bothTouchLeft = (p1.x - (cameraX - hw) < 8) && (p2.x - (cameraX - hw) < 8);
                            const bothTouchRight = ((cameraX + hw) - p1.x < 8) && ((cameraX + hw) - p2.x < 8);
                            const bothTouchTop = (p1.y - (cameraY - hh) < 8) && (p2.y - (cameraY - hh) < 8);
                            const bothTouchBottom = ((cameraY + hh) - p1.y < 8) && ((cameraY + hh) - p2.y < 8);

                            if (bothTouchLeft || bothTouchRight || bothTouchTop || bothTouchBottom) {
                                // Do not move camera to avoid moving past world edges and keep both visible
                            } else {
                                // Move camera slowly toward midpoint but limited so it doesn't try to include impossible span
                                cameraX += (midX - cameraX) * CAMERA_LERP;
                                cameraY += (midY - cameraY) * CAMERA_LERP;
                            }
                        } else {
                            // Players fit comfortably in viewport: ensure camera keeps both in view
                            // Compute allowed camera ranges that include both players
                            const allowedMinX = maxX - hw;
                            const allowedMaxX = minX + hw;
                            const allowedMinY = maxY - hh;
                            const allowedMaxY = minY + hh;

                            // Choose target within allowed ranges (prefer midpoint)
                            targetX = Math.min(allowedMaxX, Math.max(allowedMinX, midX));
                            targetY = Math.min(allowedMaxY, Math.max(allowedMinY, midY));

                            cameraX += (targetX - cameraX) * CAMERA_LERP;
                            cameraY += (targetY - cameraY) * CAMERA_LERP;
                        }
                    }

                    // Clamp camera within world bounds so we don't show empty space
                    cameraX = Math.max(canvas.width / 2, Math.min(worldWidth - canvas.width / 2, cameraX));
                    cameraY = Math.max(canvas.height / 2, Math.min(worldHeight - canvas.height / 2, cameraY));

                    window.viewLeft = cameraX - canvas.width / 2;
                    window.viewRight = cameraX + canvas.width / 2;
                    window.viewTop = cameraY - canvas.height / 2;
                    window.viewBottom = cameraY + canvas.height / 2;
                    // Expose world size to other scripts
                    window.worldWidth = worldWidth;
                    window.worldHeight = worldHeight;
                }

        // Utility function to calculate distance between two points
        function distance(x1, y1, x2, y2) {
            const dx = x2 - x1;
            const dy = y2 - y1;
            return Math.sqrt(dx * dx + dy * dy);
        }

        function drawGalaxyBackground() {
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = 1;
            // Outer galaxy gradient background
            const bgGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            bgGradient.addColorStop(0, '#05020f');
            bgGradient.addColorStop(0.25, '#0c0830');
            bgGradient.addColorStop(0.6, '#120a3c');
            bgGradient.addColorStop(1, '#04010b');
            ctx.fillStyle = bgGradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const screenCenterX = canvas.width / 2;
            const screenCenterY = canvas.height / 2;
            const offsetX = cameraX - worldWidth / 2;
            const offsetY = cameraY - worldHeight / 2;

            // Draw the single large central galaxy.
            if (bigGalaxy) {
                const gx = ((bigGalaxy.worldX - cameraX) * bigGalaxy.parallax) + screenCenterX;
                const gy = ((bigGalaxy.worldY - cameraY) * bigGalaxy.parallax) + screenCenterY;
                const galaxyRotation = bigGalaxy.rotationOffset + backgroundAnimationTime / 14500;
                const baseRadius = bigGalaxy.radius;

                ctx.save();
                ctx.translate(gx, gy);
                ctx.rotate(galaxyRotation);

                // Core glow
                const coreGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, baseRadius * 0.58);
                coreGradient.addColorStop(0, 'rgba(225, 235, 255, 0.95)');
                coreGradient.addColorStop(0.5, 'rgba(150, 190, 255, 0.45)');
                coreGradient.addColorStop(1, 'rgba(40, 40, 80, 0)');
                ctx.fillStyle = coreGradient;
                ctx.beginPath();
                ctx.arc(0, 0, baseRadius * 0.58, 0, Math.PI * 2);
                ctx.fill();

                // Galaxy spiral arms
                for (let arm = 0; arm < bigGalaxy.armCount; arm++) {
                    const armOffset = arm * (Math.PI * 2 / bigGalaxy.armCount);
                    const armHue = 220 + (arm * 12);
                    ctx.strokeStyle = `rgba(${210 - arm * 6}, ${220 - arm * 4}, 255, 0.16)`;
                    ctx.lineWidth = 2.4;
                    ctx.beginPath();
                    for (let t = 0; t <= 1; t += 0.02) {
                        const radius = baseRadius * t;
                        const angle = t * Math.PI * 3 + armOffset;
                        const jitter = Math.sin(t * Math.PI * 8 + gameTime / 600 + arm) * 8;
                        const x = Math.cos(angle) * (radius + jitter);
                        const y = Math.sin(angle) * (radius + jitter) * 0.55;
                        if (t === 0) ctx.moveTo(x, y);
                        else ctx.lineTo(x, y);
                    }
                    ctx.stroke();
                }

                // Central pixelated swirl
                const pixelCount = 120;
                for (let i = 0; i < pixelCount; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const distanceFromCenter = Math.random() * baseRadius * 0.4;
                    const size = Math.random() * 2 + 1;
                    ctx.fillStyle = `rgba(255, 255, 255, ${0.2 + Math.random() * 0.45})`;
                    ctx.fillRect(Math.cos(angle) * distanceFromCenter, Math.sin(angle) * distanceFromCenter, size, size);
                }

                ctx.restore();
            }

            // Draw stars with low parallax for depth
            for (const star of galaxyStars) {
                const px = ((star.worldX - cameraX) * star.parallax) + screenCenterX;
                const py = ((star.worldY - cameraY) * star.parallax) + screenCenterY;
                const twinklePhase = Math.sin((backgroundAnimationTime / 900) + star.twinkle) * 0.4 + 0.6;
                const opacity = Math.max(0.18, Math.min(1, star.brightness * twinklePhase));
                ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
                ctx.fillRect(px, py, star.radius, star.radius);
            }

            // Draw orbiting and scattered planets
            for (const planet of galaxyPlanets) {
                let px;
                let py;
                let baseRadius = planet.size;
                let planetAngle = 0;

                if (planet.type === 'orbit') {
                    const orbitAngle = planet.angleOffset + backgroundAnimationTime * planet.orbitSpeed;
                    const worldX = bigGalaxy.worldX + Math.cos(orbitAngle) * planet.orbitRadius;
                    const worldY = bigGalaxy.worldY + Math.sin(orbitAngle) * planet.orbitRadius;
                    px = ((worldX - cameraX) * planet.parallax) + screenCenterX;
                    py = ((worldY - cameraY) * planet.parallax) + screenCenterY;
                    planetAngle = orbitAngle * 0.9;
                    baseRadius = planet.size * (0.85 + 0.12 * Math.sin(planetAngle));
                } else {
                    px = ((planet.worldX - cameraX) * planet.parallax) + screenCenterX;
                    py = ((planet.worldY - cameraY) * planet.parallax) + screenCenterY;
                    baseRadius = planet.size * (0.95 + 0.08 * Math.sin(backgroundAnimationTime * 0.0009));
                }

                // Subtle aura
                ctx.fillStyle = `rgba(160, 190, 255, ${planet.alpha * 0.2})`;
                ctx.beginPath();
                ctx.arc(px, py, baseRadius * 1.35, 0, Math.PI * 2);
                ctx.fill();

                // Core planet body
                ctx.fillStyle = `hsla(${planet.hue}, 70%, 60%, 0.96)`;
                ctx.beginPath();
                ctx.arc(px, py, baseRadius, 0, Math.PI * 2);
                ctx.fill();

                // Outer shell and highlight
                ctx.fillStyle = `hsla(${(planet.hue + 25) % 360}, 70%, 52%, 0.9)`;
                ctx.beginPath();
                ctx.arc(px, py, baseRadius * 0.9, 0, Math.PI * 2);
                ctx.fill();

                if (planet.hasRing) {
                    ctx.strokeStyle = `hsla(${(planet.hue + 30) % 360}, 75%, 85%, 0.3)`;
                    ctx.lineWidth = planet.ringThickness;
                    ctx.beginPath();
                    ctx.ellipse(px, py, baseRadius * 1.4, baseRadius * 0.4, planetAngle * 0.4, 0, Math.PI * 2);
                    ctx.stroke();
                }

                // Pixelated surface details
                const pixelDetail = 3;
                for (let x = -baseRadius * 0.75; x <= baseRadius * 0.75; x += pixelDetail) {
                    for (let y = -baseRadius * 0.75; y <= baseRadius * 0.75; y += pixelDetail) {
                        if (distance(0, 0, x, y) < baseRadius * 0.82 && Math.random() < 0.12) {
                            ctx.fillStyle = `hsla(${(planet.hue + 15) % 360}, 65%, 45%, ${0.2 + Math.random() * 0.2})`;
                            ctx.fillRect(px + x, py + y, pixelDetail, pixelDetail);
                        }
                    }
                }

                // No moons, asteroids, or comets are drawn in this refined starfield.
            }

            // Add subtle layered haze for depth and variation
            const hazeGradient = ctx.createRadialGradient(screenCenterX, screenCenterY, canvas.width * 0.2, screenCenterX, screenCenterY, canvas.width * 0.8);
            hazeGradient.addColorStop(0, 'rgba(25, 20, 50, 0.0)');
            hazeGradient.addColorStop(1, 'rgba(10, 6, 20, 0.25)');
            ctx.fillStyle = hazeGradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.restore();
        }

        // Helper function to fire basic projectiles

        // Helper function to fire basic projectiles
        function fireBasicProjectiles(player, baseAngle, isDuplicateProjectile = false) {
            let finalDamage = player.damage;
            
            let projectileRicochet_bulletsMaxTargets = 0;
            if (player.ricochet_bulletsEnabled) {
                // Fixed ricochet_bullets targets for Ricochet Bullets (Legendary Ability)
                projectileRicochet_bulletsMaxTargets = 5; // Fixed at 5 targets
            }

            for (let i = 0; i < player.projectileCount; i++) {
                const angleOffset = (i - (player.projectileCount - 1) / 2) * PROJECTILE_SPREAD_ANGLE;
                projectiles.push({
                    x: player.x,
                    y: player.y,
                    radius: (4 * GAME_SCALE_FACTOR * 1.1), // Slightly increased by 10%
                    speed: (6 * player.projectileSpeedMultiplier), // Base speed, adjusted by multiplier
                    angle: baseAngle + angleOffset,
                    damage: finalDamage,
                    // PLAYER 1: LIGHT BLUE, PLAYER 2: DEEP PINK
                    color: player.playerNumber === 1 ? '#ADD8E6' : '#FF1493', 
                    trailColor: player.legendaryAbilitiesLevels.venom > 0 ? 'rgba(80, 255, 80, 1)' : (player.playerNumber === 1 ? 'rgba(173, 216, 230, 1)' : 'rgba(255, 20, 147, 1)'),
                    type: 'basic',
                    isBasicProjectile: true, // Added to identify basic projectiles
                    player: player,
                    enemiesHit: new Set(), // Changed to Set
                    ricochet_bulletsEnabled: player.ricochet_bulletsEnabled,
                    maxRicochet_bulletss: projectileRicochet_bulletsMaxTargets,
                    targetsHitCount: 0,
                    lastHitEnemyId: null,
                    pierceCount: 0,
                    isDuplicate: isDuplicateProjectile,
                    spawnTime: Date.now(),
                    
                    // Trail properties for "drawing" trace
                    trailPoints: [], // Stores past positions for the outline
                    maxTrailPoints: 15, // Number of points in the trail

                    // NEW: Wind trail for basic projectiles - visual only, no particles released
                    isWindTrailProjectile: true,
                    windTrailSpawnTime: Date.now(),
                    windTrailMaxDuration: 500, // Short duration for visual trail
                    windTrailParticleDamage: 0, // No damage from this trail
                    windTrailLastParticleTime: Date.now(),
                    windTrailParticleInterval: 30, // Frequent drawing points for smooth trail
                    windTrailRadius: 10, // Small radius for visual trail
                });
            }

            // CLONING: Launches an identical attack in the opposite direction
            if (player.legendaryAbilitiesLevels.clone_shots > 0 && !isDuplicateProjectile) {
                fireBasicProjectiles(player, baseAngle + Math.PI, true);
            }
        }

        // Helper to fire a specific type of special projectile/effect
        function fireSpecialProjectile(player, type, angle, targetPosition = null, originalProjectileInfo = null) {
            const now = Date.now();
            if (type === 'plasma_explosion') {
                projectiles.push({
                    x: player.x,
                    y: player.y,
                    radius: (10 * GAME_SCALE_FACTOR),
                    speed: (4 * player.projectileSpeedMultiplier),
                    angle: angle,
                    damage: player.specialAbilities.plasma_explosion.damage,
                    color: 'rgba(255, 120, 0, 0.9)', // Orange fireball
                    type: 'explosive',
                    isBasicProjectile: false, // Added to identify special projectiles
                    player: player,
                    enemiesHit: new Set(), // Changed to Set
                    isDuplicate: true, // Mark as duplicate to avoid infinite recursion
                    spawnTime: now,
                    pierceCount: 0,
                    trailPoints: [],
                    maxTrailPoints: 15,
                });
            } else if (type === 'tornado_grenade_launcher') {
                let targetX = targetPosition ? targetPosition.x : player.x + Math.cos(angle) * (200);
                let targetY = targetPosition ? targetPosition.y : player.y + Math.sin(angle) * (200);

                // GRANADA VORTEX: When it reaches MAX LVL, the clone will be launched at the exact location of the original but in the opposite direction, and will explode mirrored.
                if (originalProjectileInfo && originalProjectileInfo.level === 10) { // Only for the max level clone (now 10)
                    // Calculate mirrored target position relative to the center of the canvas
                    targetX = canvas.width - originalProjectileInfo.initialTargetX;
                    targetY = canvas.height - originalProjectileInfo.initialTargetY;
                }

                const currentTornado_grenadeRadius = (player.specialAbilities.tornado_grenade.baseRadius * 0.35 * (1 + 0.15 * (player.specialAbilities.tornado_grenade.level - 1)));
                const currentTornado_grenadeDuration = player.specialAbilities.tornado_grenade.duration;
                
                projectiles.push({
                    x: player.x,
                    y: player.y,
                    radius: (8),
                    speed: (10 * player.projectileSpeedMultiplier),
                    angle: angle,
                    damage: 0,
                    color: '#FFFFFF', // White for the grenade itself
                    type: 'tornado_grenade_launcher',
                    isBasicProjectile: false, // Added to identify special projectiles
                    player: player,
                    enemiesHit: new Set(), // Changed to Set
                    pierceCount: 999,
                    isDuplicate: true, // Mark as duplicate
                    spawnTime: now,
                    targetX: targetX, // Use calculated targetX
                    targetY: targetY, // Use calculated targetY
                    tornadoProperties: {
                        radius: currentTornado_grenadeRadius,
                        damage: calculateSpecialAbilityDamage(player, 'tornado_grenade'),
                        duration: currentTornado_grenadeDuration,
                        player: player,
                        damageInterval: player.specialAbilities.tornado_grenade.damageInterval, // Corrected from specialAbabilities
                        lastDamageTime: now,
                        hitEnemies: new Set(),
                        // Store the level of the tornado grenade at spawn for animation speed adjustment
                        level: player.specialAbilities.tornado_grenade.level
                    },
                    trailPoints: [],
                    maxTrailPoints: 15,
                });
            }
        }


        // Helper to find the center of an enemy cluster WITHIN THE CANVAS
        function findDenseEnemyTargetInCanvas() {
            // Filter enemies to only include those within or near the current viewport bounds
            const enemiesInCanvas = enemies.filter(enemy => 
                !enemy.isDead && enemy.x > window.viewLeft - 200 && enemy.x < window.viewRight + 200 && enemy.y > window.viewTop - 200 && enemy.y < window.viewBottom + 200
            );

            if (enemiesInCanvas.length === 0) return null;

            let bestClusterCenter = null;
            let maxDensity = -1;
            const clusterCheckRadius = 180; // Radius for clusters

            if (enemiesInCanvas.length < 5) { // If there are too few enemies, just target the closest one.
                if (players.length === 0) return null;
                // findClosestEnemy already targets within canvas/visible area implicitly by checking distances
                return findClosestEnemy(players[0]); 
            }

            for (let i = 0; i < enemiesInCanvas.length; i++) {
                const currentEnemy = enemiesInCanvas[i];
                let density = 0;
                let sumX = currentEnemy.x;
                let sumY = currentEnemy.y;
                let count = 1;

                for (let j = i + 1; j < enemiesInCanvas.length; j++) {
                    const otherEnemy = enemiesInCanvas[j];
                    if (distance(currentEnemy.x, currentEnemy.y, otherEnemy.x, otherEnemy.y) < clusterCheckRadius) {
                        density++;
                        sumX += otherEnemy.x;
                        sumY += otherEnemy.y;
                        count++;
                    }
                }

                if (density > maxDensity) {
                    maxDensity = density;
                    bestClusterCenter = { x: sumX / count, y: sumY / count };
                }
            }
            return bestClusterCenter;
        }

        // Helper to find the closest enemy WITHIN the VISIBLE CANVAS
        function findClosestEnemy(origin) {
            let closestEnemy = null;
            let minDist = Infinity;
            for (const enemy of enemies) {
                // Ensure enemy is alive and roughly within a reasonable search area around the viewport
                if (!enemy.isDead && enemy.x > window.viewLeft - 200 && enemy.x < window.viewRight + 200 && enemy.y > window.viewTop - 200 && enemy.y < window.viewBottom + 200) {
                    const dist = distance(origin.x, origin.y, enemy.x, enemy.y);
                    if (dist < minDist) {
                        minDist = dist;
                        closestEnemy = enemy;
                    }
                }
            }
            return closestEnemy;
        }

        // Helper to find the furthest enemy WITHIN the canvas
        function findFurthestEnemyInCanvas(origin) {
            let furthestEnemy = null;
            let maxDist = -1;
            for (const enemy of enemies) {
                // Consider enemies inside or near the viewport
                if (!enemy.isDead && enemy.x > window.viewLeft - 200 && enemy.x < window.viewRight + 200 && enemy.y > window.viewTop - 200 && enemy.y < window.viewBottom + 200) {
                    const dist = distance(origin.x, origin.y, enemy.x, enemy.y);
                    if (dist > maxDist) {
                        maxDist = dist;
                        furthestEnemy = enemy;
                    }
                }
            }
            return furthestEnemy;
        }

        // Helper to find the closest Boss
        function findClosestBoss(origin) {
            let closestBoss = null;
            let minDist = Infinity;
            for (const enemy of enemies) {
                if (!enemy.isDead && enemy.isBoss) {
                    const dist = distance(origin.x, origin.y, enemy.x, enemy.y);
                    if (dist < minDist) {
                        minDist = dist;
                        closestBoss = enemy;
                    }
                }
            }
            return closestBoss;
        }

        // Function to calculate special ability damage based on hierarchy
        function calculateSpecialAbilityDamage(player, abilityType) {
            let playerDamage = player.damage;

            // Base fixed damage values for each special ability.
            // The hierarchy from highest to lowest is: TIRO LETAL, EXPLOSÃO DE PLASMA,
            // BUMERANGUE TÁTICO, EMPURRÃO, GRANADA VORTEX, ZAP.
            const baseDamageByAbility = {
                letal_shot: 72,
                plasma_explosion: 56,
                tactic_boomerang: 48,
                push: 40,
                tornado_grenade: 32,
                zap: 22,
                plasma_area: 32,
                wind_trail: 24,
                venom_trail: 18
            };

            const baseDamage = baseDamageByAbility[abilityType] ?? 20;
            let level = 0;

            switch (abilityType) {
                case 'tornado_grenade':
                    level = player.specialAbilities.tornado_grenade?.level || 0;
                    break;
                case 'push':
                    level = player.specialAbilities.push?.level || 0;
                    break;
                case 'zap':
                    level = player.specialAbilities.zap?.level || 0;
                    break;
                case 'tactic_boomerang':
                    level = player.specialAbilities.tactic_boomerang?.level || 0;
                    break;
                case 'plasma_explosion':
                    level = player.specialAbilities.plasma_explosion?.level || 0;
                    break;
                case 'letal_shot':
                    level = player.specialAbilities.letal_shot?.level || 0;
                    break;
                case 'plasma_area':
                    level = player.specialAbilities.plasma_explosion?.level || 0;
                    break;
                case 'wind_trail':
                    level = player.specialAbilities.letal_shot?.level || 0;
                    break;
                case 'venom_trail':
                    level = player.legendaryAbilitiesLevels.venom > 0 ? 1 : 0;
                    break;
                default:
                    level = 0;
                    break;
            }

            return Math.floor(baseDamage + (level * 10) + (playerDamage * 0.5));
        }

        const controls = {
            player1: {
                up: false,
                down: false,
                left: false,
                right: false
            },
            player2: {
                up: false,
                down: false,
                left: false,
                right: false
            }
        };

        // Event listeners for controls
        window.addEventListener('keydown', (e) => {
            // Player 1 (WASD)
            if (e.key === 'w' || e.key === 'W') controls.player1.up = true;
            if (e.key === 's' || e.key === 'S') controls.player1.down = true;
            if (e.key === 'a' || e.key === 'A') controls.player1.left = true;
            if (e.key === 'd' || e.key === 'D') controls.player1.right = true;

            // Player 2 (Arrows)
            if (e.key === 'ArrowUp') controls.player2.up = true;
            if (e.key === 'ArrowDown') controls.player2.down = true;
            if (e.key === 'ArrowLeft') controls.player2.left = true;
            if (e.key === 'ArrowRight') controls.player2.right = true;

            // Handle title screen dismissal
            if (document.getElementById('title-screen').style.display === 'flex') {
                hideTitleScreen();
                return; // Stop further keydown processing if on title screen
            }

            // Menu navigation (W, S, ArrowUp, ArrowDown, Enter)
            if (!gameRunning || gamePaused || upgradeSelectionMenuVisible) { // Only allow navigation if a menu is open
                const activeMenuElement = document.querySelector('.overlay[style*="display: flex"]');
                if (!activeMenuElement) return;

                let options = [];
                // Special handling for input elements within music and player image menus
                if (activeMenuElement.id === 'music-menu') {
                    // Include the range input for volume
                    options = Array.from(activeMenuElement.querySelectorAll('.menu-option, .menu-button, .file-input, #music-volume'));
                } else if (activeMenuElement.id === 'player-image-menu') {
                    options = Array.from(activeMenuElement.querySelectorAll('.menu-option, .file-input, .name-input'));
                } else {
                    options = Array.from(activeMenuElement.querySelectorAll('.menu-option, .menu-button, .upgrade-option-item'));
                }
                
                // Filter out non-interactive elements or those that shouldn't be tabbed to
                options = options.filter(option => 
                    option.offsetParent !== null && // Check if element is visible
                    !option.disabled && // Check if button is not disabled
                    (option.tagName !== 'INPUT' || (option.type !== 'text' && option.type !== 'file')) // Exclude text and file inputs from key navigation
                );


                if (options.length === 0) return;

                // Added 'a'/'A' and 'ArrowLeft' as aliases for 'W'/'ArrowUp'
                if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp' || e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
                    e.preventDefault(); // Prevent scrolling the page
                    selectedMenuOptionIndex = (selectedMenuOptionIndex - 1 + options.length) % options.length;
                    updateSelectedMenuOption(options);
                }
                // Added 'd'/'D' and 'ArrowRight' as aliases for 'S'/'ArrowDown'
                else if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown' || e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
                    e.preventDefault(); // Prevent scrolling the page
                    selectedMenuOptionIndex = (selectedMenuOptionIndex + 1) % options.length;
                    updateSelectedMenuOption(options);
                } else if (e.key === 'Enter') {
                    e.preventDefault(); // Prevent any default Enter key behavior
                    if (options[selectedMenuOptionIndex]) {
                        // Simulate click on the selected option
                        options[selectedMenuOptionIndex].click();
                        // Special handling for input elements
                        if (options[selectedMenuOptionIndex].tagName === 'INPUT' && (options[selectedMenuOptionIndex].type === 'text' || options[selectedMenuOptionIndex].type === 'file' || options[selectedMenuOptionIndex].type === 'range')) {
                            options[selectedMenuOptionIndex].focus(); // Focus input field on Enter
                        }
                    }
                } else if (activeMenuElement.id === 'music-menu' && options[selectedMenuOptionIndex] && options[selectedMenuOptionIndex].id === 'music-volume') {
                    // Handle volume control with A/D or Left/Right arrows
                    if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
                        e.preventDefault();
                        let currentVolume = parseFloat(musicVolumeSlider.value);
                        musicVolumeSlider.value = Math.max(0, currentVolume - 0.1).toFixed(1);
                        musicVolumeSlider.dispatchEvent(new Event('input')); // Trigger input event
                    } else if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
                        e.preventDefault();
                        let currentVolume = parseFloat(musicVolumeSlider.value);
                        musicVolumeSlider.value = Math.min(1, currentVolume + 0.1).toFixed(1);
                        musicVolumeSlider.dispatchEvent(new Event('input')); // Trigger input event
                    }
                }
            }

            // Handle ESC and DELETE keys for menus and pausing
            if (e.key === 'Escape' || e.key === 'Delete') {
                e.preventDefault(); // Prevent default browser behavior

                const activeMenuElement = document.querySelector('.overlay[style*="display: flex"]');
                
                if (activeMenuElement) {
                    // Specific menu handling
                    switch (activeMenuElement.id) {
                        case 'music-menu':
                            document.getElementById('back-to-main-from-music').click();
                            break;
                        case 'confirm-end-session-menu':
                            document.getElementById('cancel-end-session').click();
                            break;
                        case 'pause-menu':
                            document.getElementById('resume-game-option').click();
                            break;
                        case 'player-select-menu':
                            document.getElementById('back-to-main-from-player-select').click();
                            break;
                        case 'player-image-menu':
                            document.getElementById('back-to-main-from-player-image').click();
                            break;
                        case 'game-over':
                            document.getElementById('back-to-main-from-final-screen').click();
                            break;
                        case 'upgrade-selection-menu':
                            hideUpgradeSelectionMenu();
                            gamePaused = false;
                            break;
                        case 'how-to-play-menu': // New case for How to Play menu
                            document.getElementById('back-to-main-from-how-to-play').click();
                            break;
                        default:
                            // No action for other active menus, or new menus not listed here
                            break;
                    }
                } else if (gameRunning && !upgradeSelectionMenuVisible) {
                    // If no specific menu is open, and game is running, toggle pause
                    if (document.getElementById('pause-menu').style.display === 'flex') {
                        hidePauseMenu();
                    } else {
                        showPauseMenu();
                    }
                }
            }
        });

        window.addEventListener('keyup', (e) => {
            // Player 1 (WASD)
            if (e.key === 'w' || e.key === 'W') controls.player1.up = false;
            if (e.key === 's' || e.key === 'S') controls.player1.down = false;
            if (e.key === 'a' || e.key === 'A') controls.player1.left = false;
            if (e.key === 'd' || e.key === 'D') controls.player1.right = false;

            // Player 2 (Arrows)
            if (e.key === 'ArrowUp') controls.player2.up = false;
            if (e.key === 'ArrowDown') controls.player2.down = false;
            if (e.key === 'ArrowLeft') controls.player2.left = false;
            if (e.key === 'ArrowRight') controls.player2.right = false;
        });

        // Function to update the visual selection in menus
        function updateSelectedMenuOption(options) {
            options.forEach((option, index) => {
                option.classList.remove('selected');
                // Remove focus from input elements when navigating with keys
                if (option.tagName === 'INPUT' && (option.type === 'file' || option.type === 'text' || option.type === 'range')) {
                    option.blur();
                }
            });
            if (options[selectedMenuOptionIndex]) {
                options[selectedMenuOptionIndex].classList.add('selected');
                // Ensure the selected option is visible if the menu is scrollable
                options[selectedMenuOptionIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
        }

        // Function to reset and set up menu navigation when a menu is shown
        function setupMenuNavigation(menuElement) {
            currentActiveMenu = menuElement;
            selectedMenuOptionIndex = 0; // Default to first option

            // Add mouseover listeners to update selected index on mouse move
            const options = Array.from(menuElement.querySelectorAll('.menu-option, .menu-button, .upgrade-option-item, .file-input, .name-input, #music-volume'));
            options.forEach((option, index) => {
                option.addEventListener('mouseover', () => {
                    selectedMenuOptionIndex = index;
                    updateSelectedMenuOption(options);
                });
                // Remove mouseout to avoid issues when transitioning from mouse to keyboard
                option.addEventListener('mouseout', () => {
                    option.classList.remove('selected');
                });
            });
            updateSelectedMenuOption(options.filter(option => 
                option.offsetParent !== null && !option.disabled && (option.tagName !== 'INPUT' || (option.type !== 'text' && option.type !== 'file'))
            ));
        }

        // Event listeners for menus
        document.getElementById('play-game-option').addEventListener('click', () => {
            hideAllMenus();
            showPlayerSelectMenu();
        });

        // New event listener for "Como Jogar" option
        document.getElementById('how-to-play-option').addEventListener('click', () => {
            hideAllMenus();
            showHowToPlayMenu(false); // Pass false as coming from main menu
        });

        document.getElementById('music-option').addEventListener('click', () => {
            hideAllMenus();
            showMusicMenu(false); // Pass false as coming from main menu
        });

        document.getElementById('players-option').addEventListener('click', () => {
            hideAllMenus();
            showPlayerImageMenu();
        });

        document.getElementById('single-player').addEventListener('click', () => {
            singlePlayer = true;
            startGame();
        });

        document.getElementById('multi-player').addEventListener('click', () => { // Corrected from .addEventListener(() => {
            singlePlayer = false;
            startGame();
        });

        document.getElementById('back-to-main-from-player-select').addEventListener('click', () => {
            hideAllMenus();
            showMainMenu(); // Show main menu without forcing music restart
        });

        // New event listener for "back from how to play"
        document.getElementById('back-to-main-from-how-to-play').addEventListener('click', () => {
            hideAllMenus();
            // Check if the game is running (meaning we came from the pause menu)
            if (gameRunning) { 
                showPauseMenu(); // Go back to pause menu
            } else {
                showMainMenu(); // Otherwise, go back to main menu
            }
        });

        document.getElementById('back-to-main-from-music').addEventListener('click', () => {
            // Determine if returning to main menu from pause menu or main menu
            if (gameRunning) { 
                hideAllMenus();
                showPauseMenu();
            } else {
                hideAllMenus();
                showMainMenu(); // Show main menu without forcing music restart
            }
        });

        document.getElementById('back-to-main-from-player-image').addEventListener('click', () => {
            hideAllMenus();
            showMainMenu(); // Show main menu without forcing music restart
        });

        document.getElementById('pause-button').addEventListener('click', () => {
            if (gameRunning && !upgradeSelectionMenuVisible) {
                showPauseMenu();
            }
        });

        document.getElementById('resume-game-option').addEventListener('click', () => {
            hidePauseMenu();
        });

        // NEW: Event listener for "Como Jogar" option in pause menu
        document.getElementById('pause-menu-how-to-play-option').addEventListener('click', () => {
            hideAllMenus();
            showHowToPlayMenu(true); // Pass true as coming from pause menu
        });

        document.getElementById('pause-menu-music-option').addEventListener('click', () => {
            showMusicMenu(true); // Pass true as coming from pause menu
        });

        document.getElementById('pause-menu-end-session-option').addEventListener('click', () => {
            hidePauseMenu();
            showConfirmEndSessionMenu();
        });

        document.getElementById('cancel-end-session').addEventListener('click', () => {
            hideConfirmEndSessionMenu();
            showPauseMenu();
        });

        document.getElementById('proceed-end-session').addEventListener('click', () => {
            endGameSession('end_session'); // Pass 'end_session' type
        });


        document.getElementById('back-to-main-from-final-screen').addEventListener('click', () => {
            resetGame();
            showMainMenu(); // Show main menu
            playDefaultMusic('menu', true); // Force restart main menu music after reset
        });


        // Music functionality
        const musicFileInput = document.getElementById('music-file-input');
        const currentMusicInfo = document.getElementById('current-music-info');
        const playMusicButton = document.getElementById('play-music');
        const pauseMusicButton = document.getElementById('pause-music');
        const clearMusicButton = document.getElementById('clear-music');
        const musicVolumeSlider = document.getElementById('music-volume'); // New volume slider
        const toggleMusicButton = document.getElementById('toggle-music'); // New toggle music button

        /**
         * Pauses all default background music tracks.
         */
        function stopAllDefaultMusic() {
            mainMenuMusic.pause();
            gameMusic.pause();
            gameOverMusic.pause();
            mainMenuMusic.currentTime = 0;
            gameMusic.currentTime = 0;
            gameOverMusic.currentTime = 0;
        }

        /**
         * Plays the appropriate default background music based on the current game scene.
         * @param {string} scene - The current game scene ('menu', 'game', 'gameOver').
         * @param {boolean} forceRestart - If true, forces the current track to restart from beginning.
         */
        function playDefaultMusic(scene, forceRestart = false) {
            console.log(`playDefaultMusic: scene=${scene}, forceRestart=${forceRestart}`);
            if (toggleMusicButton.textContent === 'LIGAR MÚSICA') {
                console.log("Music is toggled OFF. Not playing.");
                return;
            }

            const targetMusic = (scene === 'menu') ? mainMenuMusic : (scene === 'game' ? gameMusic : gameOverMusic);

            // If custom music is loaded and playing, just ensure its state, don't touch default music
            if (currentMusic && !currentMusic.paused) {
                console.log("Custom music is playing. Not touching default music.");
                updateMusicButtonsState();
                return;
            }

            // Stop currently playing default music ONLY if it's different from target or forceRestart is true
            if (currentDefaultMusicTrack && currentDefaultMusicTrack !== targetMusic) {
                console.log("Stopping different default track.");
                currentDefaultMusicTrack.pause();
                currentDefaultMusicTrack.currentTime = 0;
            }
            
            // If forceRestart is true, stop and reset the target music as well
            if (forceRestart && targetMusic) {
                console.log("Force restarting target music.");
                targetMusic.pause();
                targetMusic.currentTime = 0;
            }

            currentScene = scene;

            if (targetMusic && targetMusic.paused) {
                console.log(`Playing ${scene} music.`);
                targetMusic.play();
                currentDefaultMusicTrack = targetMusic; // Set the currently playing default track
            } else if (targetMusic && !targetMusic.paused) {
                console.log(`${scene} music already playing. Not restarting.`);
                // If it's already playing, do nothing, don't restart
            } else {
                console.log(`No target music found for scene: ${scene}`);
            }

            updateMusicButtonsState();
        }

        /**
         * Stops all currently playing music (custom and default).
         */
        function stopAllMusic() {
            console.log("stopAllMusic called.");
            if (currentMusic) {
                currentMusic.pause();
                currentMusic.currentTime = 0;
                currentMusic = null; // Clear custom music
            }
            stopAllDefaultMusic(); // This already handles resetting default tracks currentTime to 0
            currentDefaultMusicTrack = null; // Clear the current default track
        }

        // New event listener for volume slider
        musicVolumeSlider.addEventListener('input', (event) => {
            const volume = event.target.value;
            mainMenuMusic.volume = volume;
            gameMusic.volume = volume;
            gameOverMusic.volume = volume;
            if (currentMusic) {
                currentMusic.volume = volume;
            }
        });

        // New event listener for toggle music button
        toggleMusicButton.addEventListener('click', () => {
            if (toggleMusicButton.textContent === 'LIGAR MÚSICA') {
                console.log("Toggling music OFF.");
                stopAllMusic();
                toggleMusicButton.textContent = 'LIGAR MÚSICA';
            } else {
                console.log("Toggling music ON. Playing default music for current scene.");
                playDefaultMusic(currentScene); // Resume music for current scene
                toggleMusicButton.textContent = 'DESLIGAR MÚSICA';
            }
            updateMusicButtonsState();
        });


        musicFileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                // If music was disabled, re-enable it when a new file is loaded
                if (toggleMusicButton.textContent === 'LIGAR MÚSICA') {
                    toggleMusicButton.textContent = 'DESLIGAR MÚSICA';
                }

                stopAllDefaultMusic(); // Stop default music when custom is selected
                if (currentMusic) {
                    currentMusic.pause();
                    currentMusic.currentTime = 0;
                }
                currentMusic = new Audio(URL.createObjectURL(file));
                currentMusic.loop = true;
                currentMusic.volume = musicVolumeSlider.value; // Set volume from slider
                currentMusic.play();
                currentMusicInfo.textContent = `Tocando: ${file.name}`;
                updateMusicButtonsState();
            }
        });

        playMusicButton.addEventListener('click', () => {
            // If music was disabled, re-enable it when play is clicked
            if (toggleMusicButton.textContent === 'LIGAR MÚSICA') {
                toggleMusicButton.textContent = 'DESLIGAR MÚSICA';
            }

            if (currentMusic && currentMusic.paused) {
                stopAllDefaultMusic(); // Stop default music if custom is played
                currentMusic.play();
                updateMusicButtonsState();
            } else if (!currentMusic) { // If no custom music, play default based on scene
                playDefaultMusic(currentScene);
            }
        });

        pauseMusicButton.addEventListener('click', () => {
            if (currentMusic && !currentMusic.paused) {
                currentMusic.pause();
                updateMusicButtonsState();
            } else if (!currentMusic && (mainMenuMusic.paused || gameMusic.paused || gameOverMusic.paused)) {
                 // Do nothing if default music is already paused
            } else {
                 stopAllDefaultMusic(); // Pause default music if playing
                 updateMusicButtonsState();
            }
        });

        clearMusicButton.addEventListener('click', () => {
            if (currentMusic) {
                currentMusic.pause();
                currentMusic.currentTime = 0;
                currentMusic = null;
                musicFileInput.value = '';
                currentMusicInfo.textContent = 'Nenhuma trilha selecionada';
                // Only resume default music if the toggle is "DESLIGAR MÚSICA" (i.e., music is enabled)
                if (toggleMusicButton.textContent === 'DESLIGAR MÚSICA') {
                    playDefaultMusic('menu', true); // Force restart to play default menu music
                }
                updateMusicButtonsState();
            }
        });

        function updateMusicButtonsState() {
            const musicEnabled = toggleMusicButton.textContent === 'DESLIGAR MÚSICA';

            musicVolumeSlider.disabled = !musicEnabled;
            musicFileInput.disabled = !musicEnabled;
            clearMusicButton.disabled = !musicEnabled || (!currentMusic && !musicFileInput.value);

            // Disable Play and Pause buttons if no custom music is loaded OR if music is disabled
            if (!currentMusic || !musicEnabled) {
                playMusicButton.disabled = true;
                pauseMusicButton.disabled = true;
                currentMusicInfo.textContent = !musicEnabled ? 'MÚSICA DESABILITADA' : 'Nenhuma trilha selecionada';
            } else { // Custom music is loaded and music is enabled
                playMusicButton.disabled = !currentMusic.paused;
                pauseMusicButton.disabled = currentMusic.paused;
                currentMusicInfo.textContent = currentMusic.src ? `Tocando: ${decodeURIComponent(currentMusic.src.split('/').pop().split('?')[0])}` : 'Nenhuma trilha selecionada';
            }
        }


        // Player image and name functionality
        const player1ImageInput = document.getElementById('player1-image-input');
        const player1Preview = document.getElementById('player1-preview');
        const player2ImageInput = document.getElementById('player2-image-input');
        const player2Preview = document.getElementById('player2-preview');
        const player1NameInput = document.getElementById('player1-name-input');
        const player2NameInput = document.getElementById('player2-name-input');

        player1ImageInput.addEventListener('change', (event) => {
            loadPlayerImage(event, 'player1');
        });

        player2ImageInput.addEventListener('change', (event) => {
            loadPlayerImage(event, 'player2');
        });

        player1NameInput.addEventListener('input', (event) => {
            player1CustomName = event.target.value;
        });

        player2NameInput.addEventListener('input', (event) => {
            player2CustomName = event.target.value;
        });


        function loadPlayerImage(event, playerNum) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = new Image();
                    img.onload = () => {
                        if (playerNum === 'player1') {
                            player1Image = img;
                            player1Preview.src = e.target.result;
                            // CYAN outline for Player 1 with image
                            player1Preview.classList.add('player1-border'); 
                            player1Preview.classList.remove('player2-border');
                            player1Preview.style.display = 'block';
                            if (players[0]) players[0].image = player1Image;
                        } else if (playerNum === 'player2') {
                            player2Image = img;
                            player2Preview.src = e.target.result;
                            // PURPLE outline for Player 2 with image
                            player2Preview.classList.add('player2-border'); 
                            player2Preview.classList.remove('player1-border');
                            player2Preview.style.display = 'block';
                            if (players[1]) players[1].image = player2Image;
                        }
                    };
                    img.onerror = () => {
                        console.error("Failed to load image.");
                        if (playerNum === 'player1') player1Image = null;
                        if (playerNum === 'player2') player2Image = null;
                    };
                    img.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        }


        document.getElementById('upgrade-selection-menu').addEventListener('click', (event) => {
            const clickedOption = event.target.closest('.upgrade-option-item');
            if (clickedOption) {
                const upgradeType = clickedOption.getAttribute('data-upgrade');
                const category = clickedOption.getAttribute('data-category');
                
                if (category === 'basic') {
                    applyBasicUpgrade(upgradeType);
                } else if (category === 'special') {
                    applySpecialUpgrade(upgradeType);
                } else if (category === 'legendary') {
                    applyLegendaryCommand(upgradeType);
                }
                
                hideUpgradeSelectionMenu();
                gamePaused = false;
            }
        });

        function startGame() {
            console.log('startGame called.');
            hideAllMenus();
            showGameUI();

            players = [];
            players.push(new Player(
                canvas.width / 2 - (singlePlayer ? 0 : 50),
                canvas.height / 2,
                // Player 1: CYAN BLUE, light blue outline
                'rgba(0, 255, 255, 0.8)', 
                controls.player1,
                player1CustomName,
                player1Image
            ));

            if (!singlePlayer) {
                players.push(new Player(
                    canvas.width / 2 + 50,
                    canvas.height / 2,
                    // Player 2: PURPLE, deep pink outline
                    'rgba(128, 0, 128, 0.8)', 
                    controls.player2,
                    player2CustomName,
                    player2Image
                ));
            }

            enemies = [];
            projectiles = [];
            particles = [];
            expOrbs = [];
            specialEffects = [];
            enemySpawnTimer = 0;
            enemySpawnInterval = 1200; // Reset to default
            currentEnemiesPerBatch = 1;
            
            gameTime = 0;
            enemiesDefeated = 0;
            enemiesDefeatedSinceLastPotion = 0;
            gameRunning = true;
            gamePaused = false; // Ensure game is not paused when starting
            waveLevel = 1;
            waveTimer = 0;
            waveDuration = 35000; // Reset wave duration for new game to 35s
            bossSpawned = false;
            bossCount = 0; // NEW: Reset boss count for new game
            finalBossDefeated = false; // Reset final boss flag

            playDefaultMusic('game'); // Play game music when starting

            updateUI();
            document.getElementById('wave-level').textContent = waveLevel;

            // Start the game timer interval
            if (gameTimerIntervalId) {
                clearInterval(gameTimerIntervalId);
            }
            gameTimerIntervalId = setInterval(() => {
                if (!gamePaused) {
                    gameTime += 1000; // Increment gameTime by 1 second (1000 ms)
                    updateTimeUI();
                }
            }, 1000); // Update every 1 second

            lastTime = Date.now();
            // Initialize world and camera for the new game
            worldWidth = canvas.width * 3;
            worldHeight = canvas.height * 3;
            // Position players roughly in the center of the world
            cameraX = (players[0].x + (players[1]?.x || players[0].x)) / 2;
            cameraY = (players[0].y + (players[1]?.y || players[0].y)) / 2;
            updateCamera();
            window.worldWidth = worldWidth;
            window.worldHeight = worldHeight;

            console.log('startGame: players=', players.length, 'enemySpawnInterval=', enemySpawnInterval, 'world=', worldWidth, 'x', worldHeight);
            if (enemies.length === 0 && waveLevel < 50) {
                spawnEnemy();
            }

            // Initialize galaxy background stars and planets
            backgroundAnimationTime = 0;
            galaxyStars.length = 0;
            galaxyPlanets.length = 0;
            bigGalaxy = null;

            bigGalaxy = {
                worldX: worldWidth / 2,
                worldY: worldHeight / 2,
                radius: 230 + Math.random() * 60,
                hue: 220,
                parallax: 0.06,
                armCount: 5,
                rotationOffset: Math.random() * Math.PI * 2,
            };

            const starCols = 22;
            const starRows = 16;
            const starCellWidth = worldWidth / starCols;
            const starCellHeight = worldHeight / starRows;
            for (let row = 0; row < starRows; row++) {
                for (let col = 0; col < starCols; col++) {
                    if (galaxyStars.length >= galaxyStarCount) break;
                    galaxyStars.push({
                        worldX: Math.min(worldWidth - 1, col * starCellWidth + 8 + Math.random() * (starCellWidth - 16)),
                        worldY: Math.min(worldHeight - 1, row * starCellHeight + 8 + Math.random() * (starCellHeight - 16)),
                        radius: Math.random() * 1.6 + 0.8,
                        twinkle: Math.random() * Math.PI * 2,
                        brightness: 0.5 + Math.random() * 0.5,
                        parallax: 0.06 + Math.random() * 0.14,
                    });
                }
            }
            while (galaxyStars.length < galaxyStarCount) {
                galaxyStars.push({
                    worldX: Math.random() * worldWidth,
                    worldY: Math.random() * worldHeight,
                    radius: Math.random() * 1.6 + 0.8,
                    twinkle: Math.random() * Math.PI * 2,
                    brightness: 0.5 + Math.random() * 0.5,
                    parallax: 0.06 + Math.random() * 0.14,
                });
            }

            const orbitPlanetCount = Math.floor(galaxyPlanetCount * 0.55);
            const scatteredPlanetCount = galaxyPlanetCount - orbitPlanetCount;

            for (let i = 0; i < orbitPlanetCount; i++) {
                const orbitRadius = 240 + i * 36 + Math.random() * 42;
                const hue = Math.floor(Math.random() * 360);
                const hasRing = Math.random() < 0.4;
                galaxyPlanets.push({
                    type: 'orbit',
                    orbitRadius,
                    orbitSpeed: 0.00022 + Math.random() * 0.00012,
                    angleOffset: Math.random() * Math.PI * 2,
                    hue,
                    size: 12 + Math.random() * 10,
                    alpha: 0.16 + Math.random() * 0.26,
                    parallax: 0.16 + Math.random() * 0.1,
                    hasRing,
                    ringThickness: 2 + Math.floor(Math.random() * 3),
                });
            }

            for (let i = 0; i < scatteredPlanetCount; i++) {
                const hue = Math.floor(Math.random() * 360);
                galaxyPlanets.push({
                    type: 'scattered',
                    worldX: Math.random() * worldWidth,
                    worldY: Math.random() * worldHeight,
                    hue,
                    size: 10 + Math.random() * 10,
                    alpha: 0.12 + Math.random() * 0.18,
                    parallax: 0.08 + Math.random() * 0.08,
                    hasRing: Math.random() < 0.25,
                    ringThickness: 1 + Math.floor(Math.random() * 3),
                });
            }

            // No comets or asteroids are used in this refined galaxy background.

            console.log('Game started. gameRunning:', gameRunning, 'gamePaused:', gamePaused);
            requestAnimationFrame(gameLoop);
        }

        function resetGame() {
            console.log('resetGame called.');
            gameRunning = false;
            if (gameTimerIntervalId) {
                clearInterval(gameTimerIntervalId); // Clear the timer when resetting
                gameTimerIntervalId = null;
            }
            players = [];
            enemies = [];
            projectiles = [];
            particles = [];
            expOrbs = [];
            specialEffects = [];
            currentEnemiesPerBatch = 1;
            bossCount = 0; // Reset boss count
            finalBossDefeated = false; // Reset final boss flag

            // Stop any custom music and ensure default music for menu plays next
            stopAllMusic();
            
            // Reset UI for time if not already handled
            document.getElementById('game-time').textContent = '00:00';
            document.getElementById('enemies-defeated').textContent = '0';
            document.getElementById('wave-level').textContent = '1';
            console.log('Game reset. gameRunning:', gameRunning, 'gamePaused:', gamePaused);
        }

        function gameLoop() {
            // console.log('Game loop running. gameRunning:', gameRunning, 'gamePaused:', gamePaused); // Too much spam, enable if needed
            if (!gameRunning) {
                console.log('Game not running, stopping loop.');
                return;
            }

            const now = Date.now();
            const deltaTime = now - lastTime;
            lastTime = now;

            if (!gamePaused) { // Only update if game is NOT paused
                backgroundAnimationTime += deltaTime;
                try {
                    update(deltaTime);
                } catch (error) {
                    console.error('Game update error:', error);
                }
            }

            try {
                draw();
            } catch (error) {
                console.error('Game draw error:', error);
            }

            requestAnimationFrame(gameLoop);
        }

        function update(deltaTime) {
            // console.log('Update called.'); // Too much spam, enable if needed
            // Removed gameTime += deltaTime; from here as it's now handled by setInterval
            waveTimer += deltaTime;
            
            // ENEMIES, SPAWN RATE should increase by 7%
            let spawnRateMultiplier = 1.07; 
            // IN 2 PLAYERS MODE, enemy spawn rate should increase by 1.5x FROM THE 1ST WAVE.
            if (!singlePlayer) { 
                spawnRateMultiplier *= 1.5;
            }

            if (waveLevel <= 10) {
                currentEnemiesPerBatch = Math.floor((waveLevel - 1) / 2) + 1;
                // Adjust enemySpawnInterval with the multiplier
                enemySpawnInterval = (1200 / spawnRateMultiplier); 
            } else {
                currentEnemiesPerBatch = 5 + Math.floor((waveLevel - 10) * 0.8);
                // Adjust enemySpawnInterval with the multiplier
                enemySpawnInterval = (1200 / spawnRateMultiplier); 
            }
            currentEnemiesPerBatch = Math.max(1, currentEnemiesPerBatch);
            
            // From wave 15 onwards, enemy spawn rate should decrease by 20%
            if (waveLevel >= 15) {
                enemySpawnInterval /= 0.8; // Increase interval to reduce rate by 20% (1 / 0.8 = 1.25)
            }


            if (waveTimer >= waveDuration) {
                nextWave();
            }

            for (const player of players) {
                player.update(deltaTime);
            }

            // Update camera after player positions change
            updateCamera();

            let nextProjectiles = [];
            for (let i = 0; i < projectiles.length; i++) {
                const projectile = projectiles[i];
                let removedThisFrame = false;
                const now = Date.now(); // Get current time for projectile lifetime

                // Update trail points for projectile (for the "drawing" trace)
                // Only update if maxTrailPoints is greater than 0 (i.e., not for boomerang)
                if (projectile.maxTrailPoints > 0) {
                    projectile.trailPoints.push({ x: projectile.x, y: projectile.y });
                    // Limit the number of points to keep the trail from getting too long
                    if (projectile.trailPoints.length > projectile.maxTrailPoints) {
                        projectile.trailPoints.shift();
                    }
                }

                // Remove projectiles that go far outside the current viewport, EXCEPT tactic_boomerangs and tornado_grenade_launcher
                const MARGIN = 200; // allow some offscreen persistence
                if (projectile.type !== 'tactic_boomerang' && projectile.type !== 'tornado_grenade_launcher') {
                    if (projectile.x < window.viewLeft - MARGIN ||
                        projectile.x > window.viewRight + MARGIN ||
                        projectile.y < window.viewTop - MARGIN ||
                        projectile.y > window.viewBottom + MARGIN) {
                        removedThisFrame = true;
                    }
                }

                // Handle specific projectile types
                if (projectile.type === 'tactic_boomerang') {
                    // Boomerang logic (doesn't return on hit, only on max distance)
                    if (!projectile.returning) {
                        projectile.x += Math.cos(projectile.angle) * projectile.speed;
                        projectile.y += Math.sin(projectile.angle) * projectile.speed;
                        projectile.currentDistance = distance(projectile.initialX, projectile.initialY, projectile.x, projectile.y);
                        if (projectile.currentDistance >= projectile.maxDistance) {
                            projectile.returning = true;
                            projectile.returnTargetX = projectile.player.x;
                            projectile.returnTargetY = projectile.player.y;
                            // Reset enemiesHit when tactic_boomerang starts returning so it can hit them again
                            projectile.enemiesHit = new Set(); // Use Set for efficient clear
                        }
                    } else {
                        projectile.returnTargetX = projectile.player.x;
                        projectile.returnTargetY = projectile.player.y;
                        projectile.angle = Math.atan2(projectile.returnTargetY - projectile.y, projectile.returnTargetX - projectile.x);
                        projectile.x += Math.cos(projectile.angle) * projectile.speed;
                        projectile.y += Math.sin(projectile.angle) * projectile.speed;

                        if (distance(projectile.x, projectile.y, projectile.player.x, projectile.player.y) < projectile.radius * 2) {
                            removedThisFrame = true; // Boomerang disappears when it reaches the player
                        }
                    }
                    projectile.rotation = (projectile.rotation + tactic_BOOMERANG_ROTATION_SPEED) % (Math.PI * 2); // Keep rotating
                } else if (projectile.type === 'tornado_grenade_launcher') {
                    // Move the launcher projectile
                    const moveStep = projectile.speed * (deltaTime / 16.6667); // Adjust speed by deltaTime
                    const dx = projectile.targetX - projectile.x;
                    const dy = projectile.targetY - projectile.y; // Corrected from targetY - projectile.y to dy
                    const distToTarget = Math.sqrt(dx * dx + dy * dy);

                    if (distToTarget <= moveStep) { // If close enough, snap to target and explode
                        projectile.x = projectile.targetX;
                        projectile.y = projectile.targetY;
                        // Spawn the tornado special effect
                        specialEffects.push({
                            type: 'tornado_grenade',
                            x: projectile.targetX,
                            y: projectile.targetY,
                            radius: projectile.tornadoProperties.radius,
                            damage: projectile.tornadoProperties.damage,
                            timer: 0,
                            duration: projectile.tornadoProperties.duration,
                            player: projectile.player,
                            damageInterval: projectile.tornadoProperties.damageInterval, // Corrected from specialAbabilities
                            lastDamageTime: now,
                            hitEnemies: new Set(),
                            // Store the level of the tornado grenade at spawn for animation speed adjustment
                            level: projectile.player.specialAbilities.tornado_grenade.level
                        });
                        removedThisFrame = true; // Remove the launcher projectile
                    } else {
                        // Move towards the target
                        const angleToTarget = Math.atan2(dy, dx);
                        projectile.x += Math.cos(angleToTarget) * moveStep;
                        projectile.y += Math.sin(angleToTarget) * moveStep;
                    }
                }
                else if (projectile.type === 'zap') {
                    // Update Zap animation
                    projectile.zapRotation = (projectile.zapRotation + 0.1) % (Math.PI * 2); // Continuous rotation

                    const scaleFactor = 0.005; // Adjust this for animation speed
                    if (projectile.zapAnimationDirection === 1) { // Scale down to 80%
                        projectile.zapCurrentScale -= scaleFactor;
                        if (projectile.zapCurrentScale <= 0.8) {
                            projectile.zapCurrentScale = 0.8;
                            projectile.zapAnimationDirection = 2;
                        }
                    } else if (projectile.zapAnimationDirection === 2) { // Scale back to normal 100%
                        projectile.zapCurrentScale += scaleFactor;
                        if (projectile.zapCurrentScale >= 1.0) {
                            projectile.zapCurrentScale = 1.0;
                            projectile.zapAnimationDirection = 3;
                        }
                    } else if (projectile.zapAnimationDirection === 3) { // Scale up to 120%
                        projectile.zapCurrentScale += scaleFactor;
                        if (projectile.zapCurrentScale >= 1.2) {
                            projectile.zapCurrentScale = 1.2;
                            projectile.zapAnimationDirection = 4;
                        }
                    } else if (projectile.zapAnimationDirection === 4) { // Scale back to normal 100%
                        projectile.zapCurrentScale -= scaleFactor;
                        if (projectile.zapCurrentScale <= 1.0) {
                            projectile.zapCurrentScale = 1.0;
                            projectile.zapAnimationDirection = 1; // Loop back
                        }
                    }

                    // Move the projectile
                    projectile.x += Math.cos(projectile.angle) * projectile.speed;
                    projectile.y += Math.sin(projectile.angle) * projectile.speed;

                } else {
                    projectile.x += Math.cos(projectile.angle) * projectile.speed;
                    projectile.y += Math.sin(projectile.angle) * projectile.speed;
                }


                for (let j = enemies.length - 1; j >= 0; j--) {
                    const enemy = enemies[j];
                    if (enemy.isDead) continue;

                    const dx = projectile.x - enemy.x;
                    const dy = projectile.y - enemy.y;
                    const distanceToEnemy = Math.sqrt(dx * dx + dy * dy);

                    if (distanceToEnemy < projectile.radius + enemy.radius) {
                        // Defensive check: ensure enemiesHit is an array before using includes
                        // For boomerang, use Set.has
                        // Now, we've ensured enemiesHit is always a Set.
                        const alreadyHit = projectile.enemiesHit.has(enemy.id);

                        if (!alreadyHit) {
                             // Apply damage and mark enemy as hit by this projectile
                            const enemyDied = enemy.takeDamage(projectile.damage); // Use projectile.damage here
                            projectile.enemiesHit.add(enemy.id); // Add enemy to the hit list
                            enemy.lastHitProjectileColor = projectile.color; // Store color for death effect

                            // VENOM: Legendary ability that leaves a venom trail.
                            // Only left by PLAYER'S BASIC PROJECTILES.
                            if (projectile.isBasicProjectile && projectile.player.legendaryAbilitiesLevels.venom > 0) {
                                specialEffects.push({
                                    type: 'venom_trail',
                                    x: enemy.x, // Trail at the position of the hit enemy
                                    y: enemy.y,
                                    radius: 40, // Radius of the venom trail
                                    damage: projectile.player.trailDamage, // Continuous damage
                                    timer: 0,
                                    duration: 2000, // 2-second duration
                                    player: projectile.player,
                                    damageInterval: 100, // Applies damage every 100ms
                                    lastDamageTime: now,
                                    hitEnemies: new Set(), // Enemies already hit by this trail in this "tick"
                                });
                            }

                            // --- Projectile specific hit behavior (removal or continued action) ---
                            if (projectile.type === 'explosive') {
                                specialEffects.push({ type: 'plasma_explosion', x: projectile.x, y: projectile.y, radius: (projectile.player.specialAbilities.plasma_explosion.baseRadius * 0.35 * (1 + 0.15 * projectile.player.specialAbilities.plasma_explosion.level)), damage: projectile.damage, timer: 0, duration: 300, player: projectile.player });
                                specialEffects.push({ type: 'plasma', x: projectile.x, y: projectile.y, radius: (projectile.player.specialAbilities.plasma_explosion.baseRadius * 0.35 * (1 + 0.15 * projectile.player.specialAbilities.plasma_explosion.level)), damage: calculateSpecialAbilityDamage(projectile.player, 'plasma_area'), timer: 0, duration: projectile.player.specialAbilities.plasma_explosion.baseDuration + (projectile.player.specialAbilities.plasma_explosion.level - 1) * 1000, player: projectile.player, damageInterval: 500, lastDamageTime: now, hitEnemies: new Set() });
                                removedThisFrame = true; // Explosive projectiles always disappear on hit
                            } else if (projectile.type === 'zap') {
                                // ZAP ricochet logic
                                projectile.targetsHitCount++;
                                projectile.lastHitEnemyId = enemy.id; // Update last hit enemy for ricochet
                                
                                // NEW POWER: ZAP - Level 10: Will paralyze hit Enemies, if they survive
                                if (projectile.paralyzeOnHit && !enemyDied) {
                                    enemy.paralyzed = true;
                                    enemy.paralyzeTimer = 0; // Reset timer for fresh paralysis
                                }

                                let foundNextTarget = false;
                                // If current hits are less than max allowed hits
                                if (projectile.targetsHitCount < projectile.maxTargets) { 
                                    let nextTarget = null;
                                    let minNextDist = Infinity;
                                    for (const nextEnemy of enemies) {
                                        // Find a new, unhit, alive target that is NOT the current enemy
                                        if (!nextEnemy.isDead && !projectile.enemiesHit.has(nextEnemy.id) && nextEnemy.id !== enemy.id) { // Use Set.has
                                            const nextDist = distance(projectile.x, projectile.y, nextEnemy.x, nextEnemy.y);
                                            if (nextDist < minNextDist) {
                                                minNextDist = nextDist; // Should be minNextDist = nextDist
                                                nextTarget = nextEnemy;
                                            }
                                        }
                                    }
                                    if (nextTarget) {
                                        // Update projectile angle to the new target
                                        projectile.angle = Math.atan2(nextTarget.y - projectile.y, nextTarget.x - projectile.x);
                                        foundNextTarget = true;
                                    }
                                }
                                if (!foundNextTarget) {
                                    removedThisFrame = true; // No more targets for ricochet, or max ricochets reached
                                }
                            } else if (projectile.type === 'letal_shot') {
                                // These types are NOT removed on hit; they continue to pierce/return.
                                // If the enemy died, the letal_shot projectile still continues
                                if (enemyDied) {
                                    // No additional 'removedThisFrame = true' here for these types
                                    // if an enemy dies, they just keep going.
                                } else {
                                    // If not dead and still letal_shot, do nothing to removedThisFrame
                                }
                            } else if (projectile.type === 'tactic_boomerang') {
                                // TACTICAL BOOMERANG - Level 10: Pushes hit Enemies
                                if (projectile.pushOnHit) {
                                    const pushMagnitude = 15; // Increased push for boomerang
                                    const pushAngle = Math.atan2(enemy.y - projectile.y, enemy.x - projectile.x);
                                    enemy.x += Math.cos(pushAngle) * pushMagnitude;
                                    enemy.y += Math.sin(pushAngle) * pushMagnitude;
                                }

                                // TACTICAL BOOMERANG (Max.Lvl): Each hit enemy generates an explosion (does not ignite the ground, only causes damage in a medium area).
                                if (projectile.explodeOnHit) {
                                    const explosionRadius = 40; // Medium area damage
                                    const explosionDamage = calculateSpecialAbilityDamage(projectile.player, 'tactic_boomerang') * 0.5; // Half of boomerang's damage for explosion

                                    // Add immediate explosion visual effect
                                    specialEffects.push({
                                        type: 'plasma_explosion', // Reusing plasma_explosion visual effect
                                        x: enemy.x, // Explosion center at enemy hit
                                        y: enemy.y,
                                        radius: explosionRadius, // Use the new medium radius
                                        damage: explosionDamage, // Immediate explosion damage
                                        timer: 0,
                                        duration: 300, // Short duration for immediate visual
                                        player: projectile.player
                                    });

                                    // Apply area damage
                                    for (const nearbyEnemy of enemies) {
                                        if (!nearbyEnemy.isDead && nearbyEnemy.id !== enemy.id && distance(enemy.x, enemy.y, nearbyEnemy.x, nearbyEnemy.y) < explosionRadius + nearbyEnemy.radius) {
                                            const nearbyEnemyDied = nearbyEnemy.takeDamage(Math.floor(explosionDamage));
                                            if (nearbyEnemyDied) {
                                                nearbyEnemy.isDead = true;
                                                handleEnemyDefeat(nearbyEnemy, projectile.player);
                                            }
                                        }
                                    }
                                }

                                // Tactical Boomerang: No longer returns on hit. It will continue its path
                                // until maxDistance, then return. Damage still applies on hit.
                                // No 'removedThisFrame = true;' here for this type on enemy hit.
                            } else if (projectile.type === 'tornado_grenade_launcher') {
                                // Tornado Grenade launcher projectile does NOT disappear on hitting enemies.
                                // It continues until it reaches its target location, then spawns the tornado.
                                // No 'removedThisFrame = true;' here for this type on enemy hit.
                            } else if (projectile.isBasicProjectile && projectile.ricochet_bulletsEnabled) {
                                // Ricochet Bullets Logic
                                projectile.targetsHitCount++;
                                projectile.lastHitEnemyId = enemy.id;

                                let nextTarget = null;
                                let minNextDist = Infinity;
                                // Find the next closest enemy that has not been hit by this projectile and is not the current enemy
                                for (const nextEnemy of enemies) {
                                    if (!nextEnemy.isDead && !projectile.enemiesHit.has(nextEnemy.id) && nextEnemy.id !== enemy.id) {
                                        const nextDist = distance(projectile.x, projectile.y, nextEnemy.x, nextEnemy.y);
                                        if (nextDist < minNextDist) {
                                            minNextDist = nextDist;
                                            nextTarget = nextEnemy;
                                        }
                                    }
                                }

                                if (projectile.targetsHitCount < projectile.maxRicochet_bulletss && nextTarget) {
                                    // Ricochet to the next target
                                    projectile.angle = Math.atan2(nextTarget.y - projectile.y, nextTarget.x - projectile.x);
                                    // The projectile is NOT removed this frame, it continues to the next target
                                } else {
                                    // Max ricochets reached or no more targets, remove projectile
                                    removedThisFrame = true;
                                }
                            } else {
                                // For all other types that don't pierce, ricochet, or explode (e.g., basic without ricochet)
                                removedThisFrame = true; // Remove after a single hit
                            }
                            // End Projectile specific hit behavior
                            // If the enemy died, handle its defeat
                            if (enemyDied) {
                                enemy.isDead = true; // Mark as dead
                                handleEnemyDefeat(enemy, projectile.player);
                            }

                            // Powerful Shots - Push Enemies and cause small Area Damage (applies to first hit of projectile)
                            // BOMB SHOTS: This LEGENDARY ABILITY should ONLY affect BASIC PROJECTILES, it cannot affect SPECIAL ABILITIES.
                            if (projectile.isBasicProjectile && projectile.player && projectile.player.bomb_shotsEnabled) {
                                // Original push logic
                                const pushMagnitude = 5; // Fixed push for Bomb Shots
                                const pushAngle = Math.atan2(enemy.y - projectile.y, enemy.x - projectile.x);
                                enemy.x += Math.cos(pushAngle) * pushMagnitude;
                                enemy.y += Math.sin(pushAngle) * pushMagnitude;

                                // Bomb Shots Explosion Logic
                                const bombShotExplosionRadius = 30; // Reduced to be VERY small

                                // Add immediate explosion visual effect
                                specialEffects.push({
                                    type: 'plasma_explosion', // Reusing plasma_explosion visual effect
                                    x: enemy.x, // Explosion center at enemy hit
                                    y: enemy.y,
                                    radius: bombShotExplosionRadius, // Use the new small radius
                                    damage: projectile.damage * 0.3, // Immediate explosion damage, can be adjusted
                                    timer: 0,
                                    duration: 300, // Short duration for immediate visual
                                    player: projectile.player
                                });

                                // Existing area damage (this might be redundant if the plasma effect handles all damage)
                                // The prompt states "besides pushing Enemies, COMMON PROJECTILES should also explode",
                                // so the immediate area damage should still happen.
                                const areaDamageRadius = bombShotExplosionRadius; // Use the same radius for consistency
                                const areaDamage = projectile.damage * 0.3; // Base on projectile's damage

                                for (const nearbyEnemy of enemies) {
                                    if (!nearbyEnemy.isDead && nearbyEnemy.id !== enemy.id && distance(enemy.x, enemy.y, nearbyEnemy.x, nearbyEnemy.y) < areaDamageRadius + nearbyEnemy.radius) {
                                        const nearbyEnemyDied = nearbyEnemy.takeDamage(Math.floor(areaDamage));
                                        if (nearbyEnemyDied) {
                                            nearbyEnemy.isDead = true;
                                            handleEnemyDefeat(nearbyEnemy, projectile.player);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                if (!removedThisFrame) {
                    nextProjectiles.push(projectile);
                }
            }
            projectiles = nextProjectiles;

            // Filter out dead enemies
            enemies = enemies.filter(enemy => !enemy.isDead);

            // Safety caps to avoid runaway arrays and freezes
            const MAX_PROJECTILES = 600;
            const MAX_PARTICLES = 800;
            const MAX_ENEMIES = 220;
            const MAX_SPECIAL_EFFECTS = 120;
            const MAX_EXPORBS = 80;

            if (projectiles.length > MAX_PROJECTILES) projectiles.length = MAX_PROJECTILES;
            if (particles.length > MAX_PARTICLES) particles.length = MAX_PARTICLES;
            if (enemies.length > MAX_ENEMIES) enemies.length = MAX_ENEMIES;
            if (specialEffects.length > MAX_SPECIAL_EFFECTS) specialEffects.length = MAX_SPECIAL_EFFECTS;
            if (expOrbs.length > MAX_EXPORBS) expOrbs.length = MAX_EXPORBS;
            for (let i = enemies.length - 1; i >= 0; i--) {
                const enemy = enemies[i];
                // Store original positions for collision detection after push
                enemy.originalX = enemy.x;
                enemy.originalY = enemy.y;
                enemy.update(players, deltaTime); // Pass delta time to enemy update for animation

                for (const player of players) {
                    // Only apply damage if enemy is not dead and player is alive
                    if (enemy.health > 0 && player.health > 0) {
                        const dx = player.x - enemy.x;
                        const dy = player.y - enemy.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);

                        if (distance < player.radius + enemy.radius) {
                            player.takeDamage(Math.floor(enemy.damage)); // Ensure damage applied to player is integer
                            updateUI();
                        }
                    }
                }
            }

            for (let i = expOrbs.length - 1; i >= 0; i--) {
                const orb = expOrbs[i];

                let closestPlayer = null;
                let minDist = Infinity;

                for (const player of players) {
                    if (player.health > 0) {
                        const dx = player.x - orb.x;
                        const dy = player.y - orb.y; // Corrected to dx and dy for proper distance calculation
                        const dist = Math.sqrt(dx * dx + dy * dy);

                        if (dist < minDist) {
                            minDist = dist;
                            closestPlayer = player;
                        }
                    }
                }

                if (closestPlayer) {
                    const angle = Math.atan2(closestPlayer.y - orb.y, closestPlayer.x - orb.x);
                    orb.x += Math.cos(angle) * 5;
                    orb.y += Math.sin(angle) * 5;

                    const dx = closestPlayer.x - orb.x;
                    const dy = closestPlayer.y - orb.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < closestPlayer.radius + orb.radius) {
                        if (orb.type === 'exp') {
                            closestPlayer.gainExp(orb.value);
                        } else if (orb.type === 'healthPotion') {
                            closestPlayer.health = Math.min(closestPlayer.maxHealth, closestPlayer.health + orb.value);
                        }
                        expOrbs.splice(i, 1);
                        updateUI();
                    }
                }
            }
            // Update tactic_boomerang animation state outside of individual projectile update loop
            tactic_boomerangAnimationState = (tactic_boomerangAnimationState + tactic_BOOMERANG_ROTATION_SPEED) % (Math.PI * 2);

            for (let i = specialEffects.length - 1; i >= 0; i--) {
                const effect = specialEffects[i];
                effect.timer += deltaTime;
                const now = Date.now(); // Get current time for damage interval checks

                if (effect.timer >= effect.duration) {
                    specialEffects.splice(i, 1);
                    continue;
                }

                // Apply damage based on interval for continuous effects (plasma, venom_trail)
                // Push does one-time damage at lower levels and continuous damage at max level.
                if ((effect.type === 'plasma' || effect.type === 'venom_trail' || (effect.type === 'push' && effect.level === effect.player.specialAbilities.push.maxLevel)) && now - effect.lastDamageTime >= effect.damageInterval) {
                    for (let j = enemies.length - 1; j >= 0; j--) {
                        const enemy = enemies[j];
                        if (enemy.isDead) continue;

                        const dx = effect.x - enemy.x;
                        const dy = effect.y - enemy.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);

                        if (distance < effect.radius + enemy.radius) {
                             if ((effect.type === 'plasma' || effect.type === 'venom_trail') && effect.hitEnemies.has(enemy.id)) {
                                continue;
                            }
                            const enemyDied = enemy.takeDamage(effect.damage);
                            if (enemyDied) {
                                enemy.isDead = true;
                                handleEnemyDefeat(enemy, effect.player);
                            }
                            if (effect.type === 'plasma' || effect.type === 'venom_trail') {
                                effect.hitEnemies.add(enemy.id);
                            }
                        }
                    }
                    effect.lastDamageTime = now;
                    if (effect.type === 'plasma' || effect.type === 'venom_trail') {
                        effect.hitEnemies.clear(); 
                    }
                } else if (effect.type === 'tornado_grenade') {
                    for (let j = enemies.length - 1; j >= 0; j--) {
                        const enemy = enemies[j];
                        if (enemy.isDead) continue;

                        const dx = effect.x - enemy.x;
                        const dy = effect.y - enemy.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);

                        if (distance < effect.radius + enemy.radius && !effect.hitEnemies.has(enemy.id)) {
                            const enemyDied = enemy.takeDamage(effect.damage);
                            if (enemyDied) {
                                enemy.isDead = true;
                                handleEnemyDefeat(enemy, effect.player);
                            }
                            effect.hitEnemies.add(enemy.id);
                        }
                    }
                } else if (effect.type === 'push' && effect.level < effect.player.specialAbilities.push.maxLevel && !effect.hasDamaged) {
                    // One-time damage for Push at lower levels
                    for (let j = enemies.length - 1; j >= 0; j--) {
                        const enemy = enemies[j];
                        if (enemy.isDead) continue;

                        const dx = effect.x - enemy.x;
                        const dy = effect.y - enemy.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);

                        if (distance < effect.radius + enemy.radius) {
                            const enemyDied = enemy.takeDamage(effect.damage);
                            if (enemyDied) {
                                enemy.isDead = true;
                                handleEnemyDefeat(enemy, effect.player);
                            }
                        }
                    }
                    effect.hasDamaged = true; // Mark as having dealt damage
                }

                // Apply push/TORNADO GRENADE specific physics (pull/push)
                if (effect.type === 'push') {
                    for (let j = enemies.length - 1; j >= 0; j--) {
                        const enemy = enemies[j];
                        if (enemy.isDead) continue;

                        const dx = effect.x - enemy.x;
                        const dy = effect.y - enemy.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);

                        if (distance < effect.radius + enemy.radius) {
                            const angle = Math.atan2(enemy.y - effect.y, enemy.x - effect.x);
                            let forceMagnitude;
                            const gridSize = 30;
                            const targetPushDistance = 2.5 * gridSize;

                            const baseForce = 15;
                            const increasedBaseForce = baseForce * 1.30;

                            if (effect.level === 10) {
                                forceMagnitude = targetPushDistance;
                            } else {
                                const levelScale = (effect.level - 1) / (effect.player.specialAbilities.push.maxLevel - 1);
                                forceMagnitude = increasedBaseForce + (targetPushDistance - increasedBaseForce) * levelScale;
                            }
                            enemy.x += Math.cos(angle) * forceMagnitude;
                            enemy.y += Math.sin(angle) * forceMagnitude;
                        }
                    }
                     // NEW POWER: PUSH - Level 10: paralyze if Enemies hit each other
                    if (effect.type === 'push' && effect.level === effect.player.specialAbilities.push.maxLevel) {
                        for (let j = 0; j < enemies.length; j++) {
                            const enemy1 = enemies[j];
                            // Check if enemy1 was affected by the current push and moved from its original position
                            if (!enemy1.isDead && distance(effect.x, effect.y, enemy1.originalX, enemy1.originalY) < effect.radius + enemy1.radius &&
                                distance(enemy1.x, enemy1.y, enemy1.originalX, enemy1.originalY) > 5) { // Moved at least 5px
                                for (let k = j + 1; k < enemies.length; k++) {
                                    const enemy2 = enemies[k];
                                    // Check if enemy2 was also affected by push AND they are colliding after push
                                    if (!enemy2.isDead && distance(effect.x, effect.y, enemy2.originalX, enemy2.originalY) < effect.radius + enemy2.radius &&
                                        distance(enemy2.x, enemy2.y, enemy2.originalX, enemy2.originalY) > 5 && // Moved at least 5px
                                        distance(enemy1.x, enemy1.y, enemy2.x, enemy2.y) < enemy1.radius + enemy2.radius) {
                                        
                                        enemy1.paralyzed = true;
                                        enemy1.paralyzeTimer = 0;
                                        enemy2.paralyzed = true;
                                        enemy2.paralyzeTimer = 0;
                                    }
                                }
                            }
                        }
                    }
                } else if (effect.type === 'tornado_grenade') {
                    for (let j = enemies.length - 1; j >= 0; j--) {
                        const enemy = enemies[j];
                        if (enemy.isDead) continue;

                        const dx = effect.x - enemy.x;
                        const dy = effect.y - enemy.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);

                        if (distance < effect.radius + enemy.radius) {
                            // Bosses are immune to TORNADO GRENADE pull, but still take Damage (damage applied above with interval)
                            if (!enemy.isBoss) { 
                                const angleToTornado_grenade = Math.atan2(effect.y - enemy.y, effect.x - enemy.x);
                                const pullForce = (1 - (distance / (effect.radius + enemy.radius))) * 3;
                                enemy.x += Math.cos(angleToTornado_grenade) * pullForce;
                                enemy.y += Math.sin(angleToTornado_grenade) * pullForce;
                            }
                        }
                    }
                }

                // Visual particles for GRANADA VORTEX (Black, White, and Gray)
                if (effect.type === 'tornado_grenade' && Math.random() < 0.52) { // Reduced by 35% (was 0.8)
                    const particleAngle = Math.random() * Math.PI * 2;
                    const particleDistance = Math.random() * effect.radius;
                    let particleColor;
                    const rand = Math.random();
                    if (rand < 0.33) {
                        particleColor = `rgba(0, 0, 0, ${Math.random() * 0.5 + 0.5})`; // Black
                    }
                     else if (rand < 0.66) {
                        particleColor = `rgba(150, 150, 150, ${Math.random() * 0.5 + 0.5})`; // Gray
                    } else {
                        particleColor = `rgba(255, 255, 255, ${Math.random() * 0.5 + 0.5})`; // White
                    }

                    particles.push({
                        x: effect.x + Math.cos(particleAngle) * particleDistance,
                        y: effect.y + Math.sin(particleAngle) * particleDistance,
                        radius: Math.random() * 1.5 + 0.5,
                        color: particleColor,
                        alpha: 1,
                        decay: 0.03 + Math.random() * 0.02,
                        speedX: (Math.random() - 0.5) * 0.5,
                        speedY: (Math.random() - 0.5) * 0.5,
                        isTrailDamage: false, // Not a damage particle
                        hitEnemies: new Set()
                    });
                }
                 // Visual particles for plasma
                else if (effect.type === 'plasma' && Math.random() < 0.455) { // Reduced by 35% (was 0.7)
                    const particleX = effect.x + (Math.random() - 0.5) * effect.radius * 2;
                    const particleY = effect.y + (Math.random() - 0.5) * effect.radius * 2;
                    let plasmaColor;
                    const rand = Math.random();
                    if (rand < 0.33) {
                        plasmaColor = `rgba(255, 0, 0, ${Math.random() * 0.5 + 0.5})`; // Red
                    } else if (rand < 0.66) {
                        plasmaColor = `rgba(255, 100, 0, ${Math.random() * 0.5 + 0.5})`; // Orange
                    } else {
                        plasmaColor = `rgba(255, 200, 0, ${Math.random() * 0.5 + 0.5})`; // Yellow
                    }

                    particles.push({
                        x: particleX,
                        y: particleY,
                        radius: Math.random() * 3 + 1,
                        color: plasmaColor,
                        alpha: 1,
                        decay: 0.02 + Math.random() * 0.02,
                        speedX: (Math.random() - 0.5) * 1,
                        speedY: (Math.random() - 0.5) * 1 - 0.5, // Rise upwards slightly
                        isTrailDamage: false, // Visual only
                        hitEnemies: new Set()
                    });
                }
                // Visual particles for venom_trail
                else if (effect.type === 'venom_trail' && Math.random() < 0.6) { // Adjust particle spawn rate
                    const particleX = effect.x + (Math.random() - 0.5) * effect.radius * 2;
                    const particleY = effect.y + (Math.random() - 0.5) * effect.radius * 2;
                    let venomColor;
                    const rand = Math.random();
                    if (rand < 0.33) {
                        venomColor = `rgba(50, 205, 50, ${Math.random() * 0.5 + 0.5})`; // LimeGreen
                    } else if (rand < 0.66) {
                        venomColor = `rgba(0, 128, 0, ${Math.random() * 0.5 + 0.5})`; // Green
                    } else {
                        venomColor = `rgba(0, 100, 0, ${Math.random() * 0.5 + 0.5})`; // DarkGreen
                    }

                    particles.push({
                        x: particleX,
                        y: particleY,
                        radius: Math.random() * 2 + 1,
                        color: venomColor,
                        alpha: 1,
                        decay: 0.03 + Math.random() * 0.02,
                        speedX: (Math.random() - 0.5) * 0.8,
                        speedY: (Math.random() - 0.5) * 0.8,
                        isTrailDamage: false, // Visual only, damage handled by the effect itself
                        hitEnemies: new Set()
                    });
                }
            }
            // plasma_Explosion visual effect is handled inside the projectile hit logic.
            // Boss plasma_explosion visual effect is handled in handleEnemyDefeat.

            for (let i = particles.length - 1; i >= 0; i--) {
                const particle = particles[i];
                particle.x += particle.speedX;
                particle.y += particle.speedY;
                particle.alpha -= particle.decay;

                // Handle damage for trail particles
                if (particle.isTrailDamage) {
                    for (let j = enemies.length - 1; j >= 0; j--) {
                        const enemy = enemies[j];
                        if (enemy.isDead) continue;

                        const dist = distance(particle.x, particle.y, enemy.x, enemy.y);
                        if (dist < particle.radius + enemy.radius) {
                            // Check if this particle has already hit this specific enemy
                            if (!particle.hitEnemies.has(enemy.id)) {
                                const enemyDied = enemy.takeDamage(Math.floor(particle.damage));
                                particle.hitEnemies.add(enemy.id); // Mark enemy as hit by this particle
                                if (enemyDied) {
                                    enemy.isDead = true;
                                    handleEnemyDefeat(enemy, particle.player);
                                }
                            }
                        }
                    }
                }

                if (particle.alpha <= 0) {
                    particles.splice(i, 1);
                }
            }

            enemySpawnTimer += deltaTime;
            // Stop spawning regular enemies when wave 50 is reached and final boss hasn't been spawned yet
            if (waveLevel < 50 || (waveLevel === 50 && !bossSpawned)) {
                if (enemySpawnTimer >= enemySpawnInterval) {
                    enemySpawnTimer = 0;
                    // If on Wave 50, only spawn the boss after clearing all remaining common enemies
                    if (waveLevel === 50 && enemies.length > 0) {
                        // Do nothing, wait for remaining enemies to be defeated
                    } else {
                        for (let i = 0; i < currentEnemiesPerBatch; i++) {
                            spawnEnemy();
                        }
                    }
                }
            }
            
            // Check if on Wave 50, all regular enemies are defeated, and the final boss hasn't spawned yet
            if (waveLevel === 50 && !bossSpawned && enemies.length === 0) {
                console.log("Onda 50 alcançada! Preparando-se para O SENHOR DO CAOS.");
                // Stop spawning regular enemies
                currentEnemiesPerBatch = 0;
                // Clear all existing enemies to prepare for boss fight
                enemies = []; 
                projectiles = [];
                expOrbs = [];
                specialEffects = []; // Clear existing effects too
                
                // The actual boss spawning is now handled in the update loop when enemies.length becomes 0
                document.getElementById('wave-level').textContent = "CHEFE FINAL"; // Update UI for wave
                waveDuration = Infinity; // Stop wave timer
                spawnEnemy(true, 'chaosLord'); // Spawn the final boss
                bossSpawned = true; // Mark boss as spawned
            } else if (waveLevel === 50 && bossSpawned && enemies.length === 0 && !finalBossDefeated) {
                // If final boss spawned and no more enemies, and boss not defeated yet, do nothing (wait for boss to be defeated)
            }
        }

        function nextWave() {
            waveLevel++;
            waveTimer = 0;

            // Special behavior for Wave 50
            if (waveLevel === 50) {
                console.log("Onda 50 alcançada! Preparando-se para O SENHOR DO CAOS.");
                // Stop spawning regular enemies
                currentEnemiesPerBatch = 0;
                // Clear all existing enemies to prepare for boss fight
                enemies = []; 
                projectiles = [];
                expOrbs = [];
                specialEffects = []; // Clear existing effects too
                
                // The actual boss spawning is now handled in the update loop when enemies.length becomes 0
                document.getElementById('wave-level').textContent = "CHEFE FINAL"; // Update UI for wave
                waveDuration = Infinity; // Stop wave timer
            } else if (waveLevel > 10) {
                waveDuration = 30000; // 30 seconds
            } else {
                waveDuration = 35000; // 35 seconds
            }

            // Enemies: As waves progreSsam, they should become more resilient.
            // This is already handled in the Enemy constructor through `baseHealth + (waveLevel * 5)`.

            // Spawn regular bosses for waves divisible by 5 (excluding wave 50 now)
            if (waveLevel % 5 === 0 && waveLevel < 50) {
                bossCount++;
                spawnEnemy(true);
            }
            
            // Only update wave level UI if not the final boss stage
            if (waveLevel < 50) {
                document.getElementById('wave-level').textContent = waveLevel;
            }
        }

        function spawnEnemy(isBoss = false, forcedTheme = null) {
            // Spawn enemies around players (or single player) but NEVER inside the current visible viewport
            let anchorX, anchorY;
            if (players.length === 0) {
                anchorX = cameraX;
                anchorY = cameraY;
            } else if (players.length === 1) {
                anchorX = players[0].x;
                anchorY = players[0].y;
            } else {
                anchorX = (players[0].x + players[1].x) / 2;
                anchorY = (players[0].y + players[1].y) / 2;
            }

            const maxAttempts = 12;
            let x = 0, y = 0;
            // Allow min distance to slightly shrink at higher waves so spawns feel more immediate
            const minDistFactor = Math.max(0.38, 0.55 - Math.min(0.12, waveLevel * 0.002));
            const minDist = Math.max(canvas.width, canvas.height) * minDistFactor + 80; // ensure offscreen but not far
            const maxDist = minDist + 300; // don't spawn too far

            let chosenAngle = 0;
            for (let attempt = 0; attempt < maxAttempts; attempt++) {
                const angle = Math.random() * Math.PI * 2;
                chosenAngle = angle;
                const radius = minDist + Math.random() * (maxDist - minDist);
                x = anchorX + Math.cos(angle) * radius;
                y = anchorY + Math.sin(angle) * radius;

                // Ensure spawn is inside world bounds
                x = Math.max(0 + 10, Math.min(window.worldWidth - 10, x));
                y = Math.max(0 + 10, Math.min(window.worldHeight - 10, y));

                // Reject if the spawn sits inside the current view
                if (x < window.viewLeft || x > window.viewRight || y < window.viewTop || y > window.viewBottom) {
                    break; // acceptable spawn
                }
                // otherwise retry
            }

            let subtype = 'normal';
            if (!isBoss) {
                const subtypes = ['normal', 'fighter', 'tank', 'rogue']; // Changed 'warrior' to 'tank'
                subtype = subtypes[Math.floor(Math.random() * subtypes.length)];
            }

            // Compute a tangential velocity so the enemy orbits briefly around the anchor before homing
            let initialVel = { vx: 0, vy: 0 };
            let spawnOrbitDuration = 0;
            if (!isBoss) {
                // Tangential (perpendicular) direction to vector from anchor to spawn
                const orbitSpeedBase = 1.0 + Math.random() * 1.2; // base tangential speed
                const waveSpeedFactor = 1 + Math.min(0.35, waveLevel * 0.01);
                const orbitSpeed = orbitSpeedBase * waveSpeedFactor * (GAME_SCALE_FACTOR * 0.6);
                initialVel.vx = -Math.sin(chosenAngle) * orbitSpeed;
                initialVel.vy = Math.cos(chosenAngle) * orbitSpeed;
                spawnOrbitDuration = 700 + Math.floor(Math.random() * 900); // 700-1600 ms
            }

            enemies.push(new Enemy(x, y, isBoss, subtype, forcedTheme, initialVel, spawnOrbitDuration)); // Pass initial velocity and duration
            console.log(`Spawned enemy: ${isBoss ? 'Boss' : 'Normal'} (Subtype: ${subtype}, Theme: ${forcedTheme || 'N/A'}) at (${x.toFixed(0)}, ${y.toFixed(0)})`);
        }

        function handleEnemyDefeat(enemy, playerWhoKilled) {
            enemiesDefeated++;
            enemiesDefeatedSinceLastPotion++;
            playerWhoKilled.kills++;

            // Particles with the color of the projectile that eliminated it
            const particleColor = enemy.lastHitProjectileColor || 'rgba(100, 100, 100, 0.8)';
            for (let i = 0; i < 10; i++) { // Reduced particle count from 15 to 10
                particles.push({
                    x: enemy.x + (Math.random() - 0.5) * enemy.radius,
                    y: enemy.y + (Math.random() - 0.5) * enemy.radius,
                    radius: Math.random() * 3 + 1,
                    color: particleColor, // Use the stored color
                    alpha: 1,
                    decay: 0.03 + Math.random() * 0.02,
                    speedX: (Math.random() - 0.5) * 2,
                    speedY: (Math.random() - 0.5) * 2,
                    isTrailDamage: false, // Not a damage particle
                    hitEnemies: new Set()
                });
            }

            if (enemy.isBoss) {
                // Reduction of 65% in boss death plasma explosion radius
                const plasma_explosionRadius = (enemy.radius * 3 * 0.35); // 65% reduction
                const plasma_explosionDamage = 100;

                specialEffects.push({
                    type: 'bossDeathDamage',
                    x: enemy.x,
                    y: enemy.y,
                    radius: plasma_explosionRadius,
                    timer: 0,
                    duration: 800,
                });

                for (const targetEnemy of enemies) {
                    // Check if the targetEnemy is already marked as dead
                    if (targetEnemy !== enemy && !targetEnemy.isDead) {
                        const dx = enemy.x - targetEnemy.x;
                        const dy = enemy.y - targetEnemy.y; // Corrected to dx and dy for proper distance calculation
                        const distanceToTarget = Math.sqrt(dx * dx + dy * dy);

                        if (distanceToTarget < plasma_explosionRadius + targetEnemy.radius) {
                            const targetEnemyDied = targetEnemy.takeDamage(Math.floor(plasma_explosionDamage)); // Ensure damage is integer
                            if (targetEnemyDied) {
                                targetEnemy.isDead = true;
                                handleEnemyDefeat(targetEnemy, playerWhoKilled);
                            }
                        }
                    }
                }
            }

            expOrbs.push({
                x: enemy.x,
                y: enemy.y,
                radius: (enemy.isBoss ? 8 : 5),
                color: enemy.isBoss ? 'gold' : 'yellow',
                value: enemy.expValue,
                type: 'exp'
            });

            if (enemiesDefeatedSinceLastPotion >= 55) { // Changed from 50 to 55
                expOrbs.push({
                    x: enemy.x,
                    y: enemy.y,
                    radius: 7,
                    color: 'lime',
                    value: 15, // HEALING POTION now restores 15 HEALTH
                    type: 'healthPotion'
                });
                enemiesDefeatedSinceLastPotion = 0;
            }

            // Only level up player if the enemy was a boss and was actually killed by a player
            if (enemy.isBoss && playerWhoKilled && enemy.health <= 0) {
                // If it's the final boss, mark it as defeated and end the game
                if (enemy.theme === 'chaosLord') {
                    finalBossDefeated = true;
                    endGameSession('victory'); // End game with victory state
                } else {
                    // Regular boss level up
                    playerWhoKilled.levelUp();
                }
            }
        }

        function draw() {
            // console.log('Draw called.'); // Uncomment this if canvas drawing issues persist.
            ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset any previous transform before drawing
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = 1;
            ctx.imageSmoothingEnabled = false;
            drawGalaxyBackground();

            // Prepare world-to-screen transform based on camera
            ctx.save();
            ctx.translate(Math.floor(canvas.width / 2 - cameraX), Math.floor(canvas.height / 2 - cameraY));

            // Removed meteor boundary chain to keep the world focused on galaxy and planets.

            for (const effect of specialEffects) {
                if (effect.type === 'push') {
                    ctx.save();
                    ctx.translate(effect.x, effect.y);
                    const progress = effect.timer / effect.duration;
                    const alpha = 0.88 * (1 - progress);
                    const numWaves = 5;
                    const waveSpacing = effect.radius / numWaves;
                    const lineWidth = 4 * (1 - progress) + 1.5;

                    ctx.shadowBlur = 24;
                    ctx.shadowColor = 'rgba(180, 100, 255, 0.9)';

                    for (let i = 0; i < numWaves; i++) {
                        const currentWaveRadius = (i * waveSpacing) + (effect.radius * progress * 0.9);
                        const waveAlpha = alpha * (1 - (i / numWaves)) * 0.95;
                        ctx.strokeStyle = `rgba(170, 80, 255, ${waveAlpha})`;
                        ctx.lineWidth = Math.max(1, lineWidth * (1 - (i / numWaves)));
                        ctx.beginPath();
                        ctx.arc(0, 0, currentWaveRadius, 0, Math.PI * 2);
                        ctx.stroke();
                    }

                    const innerCoreRadius = effect.radius * 0.18 * (1 - progress);
                    const pixelSize = 4;
                    ctx.fillStyle = `rgba(210, 150, 255, ${alpha * 0.45})`;
                    for (let x = -innerCoreRadius; x <= innerCoreRadius; x += pixelSize) {
                        for (let y = -innerCoreRadius; y <= innerCoreRadius; y += pixelSize) {
                            if (distance(0, 0, x, y) < innerCoreRadius) {
                                ctx.fillRect(x, y, pixelSize, pixelSize);
                            }
                        }
                    }

                    const glowRadius = effect.radius * (0.6 + progress * 0.6);
                    const glowAlpha = alpha * 0.75;
                    ctx.fillStyle = `rgba(220, 180, 255, ${glowAlpha})`;
                    ctx.beginPath();
                    ctx.arc(0, 0, glowRadius, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.restore();
                } else if (effect.type === 'plasma_explosion') {
                    const progress = effect.timer / effect.duration;
                    const alpha = 0.9 * (1 - progress); // Increased alpha for more solid fire
                    const currentRadius = effect.radius * (1 + progress * 1.5); // Expand faster and further

                    ctx.save();
                    ctx.translate(effect.x, effect.y);
                    ctx.rotate(backgroundAnimationTime / 900 + progress * 2.2);

                    // Main fiery core - most intense, yellow-white
                    ctx.fillStyle = `rgba(255, 240, 0, ${alpha * 0.95})`; // Brighter yellow-white center
                    ctx.beginPath();
                    ctx.arc(0, 0, currentRadius * 0.28, 0, Math.PI * 2);
                    ctx.fill();

                    // Middle fiery layer - bright orange
                    ctx.fillStyle = `rgba(255, 165, 0, ${alpha * 0.75})`; // Bright Orange
                    ctx.beginPath();
                    ctx.arc(0, 0, currentRadius * 0.58, 0, Math.PI * 2);
                    ctx.fill();

                    // Outer fiery layer - vibrant red
                    ctx.fillStyle = `rgba(255, 69, 0, ${alpha * 0.55})`; // Vibrant Red (Orange-Red)
                    ctx.beginPath();
                    ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
                    ctx.fill();

                    // Pixelated rotating fire bits
                    const particleCount = 32; // More particles for a denser fire effect
                    const pixelSize = 3; // For pixelated fire
                    for (let i = 0; i < particleCount; i++) {
                        const angle = i * (Math.PI * 2 / particleCount) + backgroundAnimationTime / 300;
                        const pDist = currentRadius * 0.5 + Math.sin(backgroundAnimationTime / 600 + i) * 4;
                        const particleAlpha = (0.3 + Math.random() * 0.4) * alpha;
                        let fireParticleColor;
                        const randColor = Math.random();
                        if (randColor < 0.33) {
                            fireParticleColor = `rgba(255, 255, 180, ${particleAlpha})`; // Yellow
                        } else if (randColor < 0.66) {
                            fireParticleColor = `rgba(255, 150, 40, ${particleAlpha})`; // Orange
                        } else {
                            fireParticleColor = `rgba(255, 80, 0, ${particleAlpha})`; // Red
                        }
                        ctx.fillStyle = fireParticleColor;
                        ctx.fillRect(Math.cos(angle) * pDist - pixelSize / 2, Math.sin(angle) * pDist - pixelSize / 2, pixelSize, pixelSize);
                    }

                    // Add a twinkling ring of stars around
                    ctx.strokeStyle = `rgba(255, 210, 120, ${alpha * 0.45})`;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(0, 0, currentRadius * 1.2, 0, Math.PI * 2);
                    ctx.stroke();

                    ctx.shadowBlur = 0; // Reset shadow
                    ctx.restore(); // Restore context after drawing plasma_explosion
                } else if (effect.type === 'bossDeathDamage') {
                    const progress = effect.timer / effect.duration;
                    const alpha = 1 - progress;
                    // Current radius should be based on initial boss radius or a fixed large radius
                    const currentRadius = effect.radius * (1 + progress * 2); // Expanding for visual effect

                    ctx.fillStyle = `rgba(255, 255, 150, ${alpha * 0.8})`;
                    ctx.beginPath();
                    ctx.arc(effect.x, effect.y, currentRadius * 0.3, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.fillStyle = `rgba(255, 69, 0, ${alpha * 0.7})`;
                    ctx.beginPath();
                    ctx.arc(effect.x, effect.y, currentRadius, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.strokeStyle = `rgba(255, 0, 0, ${alpha})`;
                    ctx.lineWidth = 5 * (1 - progress);
                    ctx.beginPath();
                    ctx.arc(effect.x, effect.y, currentRadius * 0.8, 0, Math.PI * 2);
                    ctx.stroke();

                    ctx.strokeStyle = `rgba(255, 165, 0, ${alpha * 0.6})`;
                    ctx.lineWidth = 3 * (1 - progress);
                    ctx.beginPath();
                    ctx.arc(effect.x, effect.y, currentRadius * 1.1, 0, Math.PI * 2);
                    ctx.stroke();
                } else if (effect.type === 'tornado_grenade') {
                    const progress = effect.timer / effect.duration;
                    const alpha = 0.8 * (1 - progress);
                    const currentRadius = effect.radius;
                    const pixelDensity = 5; // Smaller value = more pixels

                    // Outer swirling lines - white/gray vortex style
                    ctx.strokeStyle = `rgba(230, 230, 230, ${alpha * 0.9})`; // Brighter gray-white for lines
                    ctx.lineWidth = 3; // Thicker lines
                    for (let i = 0; i < 6; i++) { // More lines
                        // Vortex Grenade: The VORTEX animation should be faster to show the vortex's strength,
                        // at each Level this rotation should be even faster!
                        const rotationSpeed = 0.5 + (effect.level * 0.2); // Base 0.5, Increased to 0.2 per level
                        const startAngle = (gameTime / (400 / rotationSpeed)) + i * (Math.PI * 2 / 6); // Faster rotation based on level
                        const endAngle = startAngle + Math.PI * 1.6; // Longer arcs
                        ctx.beginPath();
                        ctx.arc(effect.x, effect.y, currentRadius * 0.5 + i * (currentRadius * 0.08), startAngle, endAngle);
                        ctx.stroke();
                    }

                    // Central pixelated core - denser, more varied
                    ctx.fillStyle = `rgba(210, 210, 210, ${alpha * 0.9})`; // Soft gray-white for core
                    const innerPulseRadius = currentRadius * 0.4;
                    for (let x = -innerPulseRadius; x <= innerPulseRadius; x += pixelDensity) {
                        for (let y = -innerPulseRadius; y <= innerPulseRadius; y += pixelDensity) {
                            if (distance(0, 0, x, y) < innerPulseRadius) {
                                ctx.fillRect(x, y, pixelDensity, pixelDensity);
                            }
                        }
                    }

                    // Subtle inner glow
                    ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.2 + Math.sin(gameTime / 200) * 0.1})`; // Pulsating white glow
                    ctx.beginPath();
                    ctx.arc(effect.x, effect.y, innerPulseRadius * 0.5, 0, Math.PI * 2);
                    ctx.fill();

                } else if (effect.type === 'plasma') {
                    // Just draw the area, particles are handled separately
                    const progress = effect.timer / effect.duration;
                    const alpha = 0.5 * (1 - progress);
                    // Updated drawing for Plasma Area effect
                    ctx.save();
                    ctx.translate(effect.x, effect.y);

                    const currentPlasmaRadius = effect.radius * (0.8 + 0.5 * progress); // Slightly expand and fade out
                    const pixelSize = 4;

                    // Inner, more solid orange plasma
                    ctx.fillStyle = `rgba(255, 140, 0, ${alpha})`; // Dark orange
                    for (let x = -currentPlasmaRadius * 0.6; x <= currentPlasmaRadius * 0.6; x += pixelSize) {
                        for (let y = -currentPlasmaRadius * 0.6; y <= currentPlasmaRadius * 0.6; y += pixelSize) {
                            if (distance(0, 0, x, y) < currentPlasmaRadius * 0.6) {
                                ctx.fillRect(x, y, pixelSize, pixelSize);
                            }
                        }
                    }

                    // Outer, more diffuse red plasma
                    ctx.fillStyle = `rgba(255, 0, 0, ${alpha * 0.6})`; // Red
                    for (let x = -currentPlasmaRadius; x <= currentPlasmaRadius; x += pixelSize) {
                        for (let y = -currentPlasmaRadius; y <= currentPlasmaRadius; y += pixelSize) {
                            if (distance(0, 0, x, y) < currentPlasmaRadius) {
                                ctx.fillRect(x, y, pixelSize, pixelSize);
                            }
                        }
                    }

                    // Subtle yellow core pulsating glow
                    ctx.fillStyle = `rgba(255, 255, 0, ${alpha * 0.4 + Math.sin(gameTime / 150) * 0.2})`; // Yellow
                    ctx.beginPath();
                    ctx.arc(0, 0, currentPlasmaRadius * 0.3, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.restore();
                } else if (effect.type === 'venom_trail') {
                    const progress = effect.timer / effect.duration;
                    const alpha = 0.7 * (1 - progress); // Starts with higher opacity
                    const currentRadius = effect.radius * (0.8 + 0.5 * progress); // Expands slightly

                    ctx.save();
                    ctx.translate(effect.x, effect.y);

                    // Inner, denser green-yellow core
                    ctx.fillStyle = `rgba(173, 255, 47, ${alpha})`; // GreenYellow
                    ctx.beginPath();
                    ctx.arc(0, 0, currentRadius * 0.4, 0, Math.PI * 2);
                    ctx.fill();

                    // Outer, more diffuse green-black area
                    ctx.fillStyle = `rgba(0, 100, 0, ${alpha * 0.6})`; // DarkGreen
                    for (let x = -currentRadius; x <= currentRadius; x += 5) { // Pixelated effect
                        for (let y = -currentRadius; y <= currentRadius; y += 5) {
                            if (distance(0, 0, x, y) < currentRadius) {
                                ctx.fillRect(x, y, 5, 5);
                            }
                        }
                    }

                    // Pulsating outline
                    ctx.strokeStyle = `rgba(0, 255, 0, ${alpha * 0.8 + Math.sin(gameTime / 100) * 0.2})`; // Bright Green
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(0, 0, currentRadius * 0.8, 0, Math.PI * 2);
                    ctx.stroke();

                    ctx.restore();
                }
            }

            for (const orb of expOrbs) {
                ctx.beginPath();
                ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
                ctx.fillStyle = orb.color;
                ctx.fill();
                ctx.stroke(); // Outline for orbs

                if (orb.value > 1 || orb.type === 'healthPotion') {
                    ctx.beginPath();
                    ctx.arc(orb.x, orb.y, orb.radius * 1.5 + Math.sin(gameTime / 150) * 2, 0, Math.PI * 2);
                    ctx.strokeStyle = orb.color.replace(')', ', 0.5)');
                    ctx.lineWidth = 3;
                    ctx.stroke();
                }
            }

            for (const particle of particles) {
                ctx.beginPath();
                ctx.rect(particle.x - particle.radius, particle.y - particle.radius, particle.radius * 2, particle.radius * 2); // Draw as square for pixelated look
                ctx.fillStyle = particle.color.replace(')', `, ${particle.alpha})`);
                ctx.fill();
            }

            for (const projectile of projectiles) {
                // Draw projectile trail (the "drawing" trace)
                if (projectile.maxTrailPoints > 0) { // Only draw if trail is enabled (i.e. not boomerang)
                    for (let i = projectile.trailPoints.length - 1; i > 0; i--) {
                        const point1 = projectile.trailPoints[i];
                        const point2 = projectile.trailPoints[i - 1];
                        
                        const alphaFactor = (i / projectile.trailPoints.length);
                        const trailAlpha = Math.max(0, Math.min(1, alphaFactor));

                        // Main trail color (fading)
                        ctx.beginPath();
                        ctx.moveTo(point1.x, point1.y);
                        ctx.lineTo(point2.x, point2.y);
                        
                        // Use a dedicated trail color for basic projectiles so the hue remains consistent
                        if (projectile.type === 'basic') {
                            const trailColor = projectile.trailColor || projectile.color;
                            ctx.strokeStyle = trailColor.replace(')', `, ${trailAlpha * 0.9})`);
                            ctx.lineWidth = (projectile.radius * 0.45) * trailAlpha;
                        } else {
                            ctx.strokeStyle = projectile.color.replace(')', `, ${trailAlpha * 0.8})`);
                            ctx.lineWidth = (projectile.radius * 0.5) * trailAlpha;
                        }
                        ctx.stroke();

                        if (projectile.type !== 'basic') {
                            ctx.beginPath(); // New path for outline
                            ctx.moveTo(point1.x, point1.y);
                            ctx.lineTo(point2.x, point2.y);
                            ctx.strokeStyle = `rgba(0, 0, 0, ${trailAlpha * 0.5})`;
                            ctx.lineWidth = ((projectile.radius * 0.5) + 2) * trailAlpha;
                            ctx.stroke();
                        }
                    }
                }

                ctx.save();
                ctx.translate(projectile.x, projectile.y);
                
                // tactic_Boomerang always rotates while active
                if (projectile.type === 'tactic_boomerang') {
                    ctx.rotate(projectile.angle + tactic_boomerangAnimationState); // Use global state
                } else if (projectile.type === 'zap') {
                    // Apply ZAP specific rotation and scaling
                    ctx.rotate(projectile.angle + projectile.zapRotation);
                    ctx.scale(projectile.zapCurrentScale, projectile.zapCurrentScale);
                } else {
                    ctx.rotate(projectile.angle);
                }

                if (projectile.type === 'basic') {
                    const length = projectile.radius * 6; // Longer for laser
                    const width = projectile.radius * 0.6; // Thinner for laser

                    ctx.fillStyle = projectile.color;
                    ctx.shadowBlur = 25; // Increased glow for laser (was 12)
                    ctx.shadowColor = projectile.color;

                    // Draw the main body of the laser as a single filled rectangle
                    // Adjusted to start slightly behind center to give space for the point
                    ctx.fillRect(-length * 0.4, -width / 2, length * 0.8, width);

                    // Draw a pointed, triangular tip for laser effect at the front
                    ctx.beginPath();
                    ctx.moveTo(length * 0.4, 0); // Point of the laser
                    ctx.lineTo(length * 0.4 - width, -width / 2); // Top base of triangle
                    ctx.lineTo(length * 0.4 - width, width / 2); // Bottom base of triangle
                    ctx.closePath();
                    ctx.fill();

                    // Optional: Draw a rounded back for the laser (small arc)
                    ctx.beginPath();
                    ctx.arc(-length * 0.4, 0, width / 2, Math.PI / 2, 3 * Math.PI / 2, false);
                    ctx.closePath();
                    ctx.fill();

                    ctx.shadowBlur = 0; // Reset shadow
                } else if (projectile.type === 'tactic_boomerang') {
                    const visualSize = projectile.radius * 2.4;
                    const thickness = projectile.radius * 0.9;

                    ctx.fillStyle = projectile.color; // Golden boomerang
                    ctx.strokeStyle = '#333333'; // Dark outline
                    ctx.lineWidth = 2;
                    ctx.shadowBlur = 12;
                    ctx.shadowColor = 'rgba(255, 215, 80, 0.9)';

                    // Draw the distinctive boomerang loop
                    ctx.beginPath();
                    ctx.arc(0, 0, visualSize, -Math.PI * 0.45, Math.PI * 0.45);
                    ctx.lineTo(visualSize * 0.28, thickness);
                    ctx.arc(0, 0, visualSize * 0.62, Math.PI * 0.45, -Math.PI * 0.45, true);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();

                    // Add pixel detail to emphasize the drone effect
                    const detailPixelSize = 2;
                    for (let i = 0; i < 32; i++) {
                        const xOffset = (Math.random() - 0.5) * visualSize * 1.8;
                        const yOffset = (Math.random() - 0.5) * visualSize * 1.8;
                        if (ctx.isPointInPath(xOffset, yOffset)) {
                            ctx.fillStyle = `rgba(255, 248, 180, ${Math.random() * 0.35 + 0.2})`;
                            ctx.fillRect(xOffset, yOffset, detailPixelSize, detailPixelSize);
                        }
                    }
                    ctx.shadowBlur = 0;

                } else if (projectile.type === 'explosive') {
                    // Refactored PLASMA EXPLOSION appearance completely, keeping original color (Orange)
                    const radius = projectile.radius * 1.5; // Overall size
                    const numSegments = 6; // Number of "petals" or segments
                    const innerRadius = radius * 0.4;
                    const outerRadius = radius * 1.0;
                    const jitter = radius * 0.1; // Randomness for jagged edges

                    ctx.shadowBlur = 20;
                    ctx.shadowColor = projectile.color; // Orange glow

                    ctx.fillStyle = projectile.color.replace(')', ', 0.9)'); // Solid orange for main body

                    ctx.beginPath();
                    ctx.moveTo(innerRadius, 0);
                    for (let i = 0; i <= numSegments; i++) {
                        const angle = i * (Math.PI * 2 / numSegments);
                        const nextAngle = (i + 0.5) * (Math.PI * 2 / numSegments);

                        // Outer point (petal tip) with jitter
                        const currentOuterRadius = outerRadius + (Math.random() - 0.5) * jitter;
                        ctx.lineTo(Math.cos(angle) * currentOuterRadius, Math.sin(angle) * currentOuterRadius);

                        // Inner point (between petals) with jitter
                        const currentInnerRadius = innerRadius + (Math.random() - 0.5) * jitter;
                        ctx.lineTo(Math.cos(nextAngle) * currentInnerRadius, Math.sin(nextAngle) * currentInnerRadius);
                    }
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke(); // Outline

                    // Central glowing core
                    ctx.fillStyle = `rgba(255, 255, 0, ${0.8 + Math.sin(gameTime / 100) * 0.2})`; // Yellow core, pulsating
                    ctx.beginPath();
                    ctx.arc(0, 0, radius * 0.3, 0, Math.PI * 2);
                    ctx.fill();

                    // Small fire particles within
                    const particleCount = 15;
                    for (let i = 0; i < particleCount; i++) {
                        const pAngle = Math.random() * Math.PI * 2;
                        const pDist = Math.random() * radius * 0.8;
                        const pSize = 2 + Math.random() * 3;
                        ctx.fillStyle = `rgba(255, ${Math.floor(100 + Math.random() * 155)}, 0, ${0.5 + Math.random() * 0.5})`;
                        ctx.fillRect(Math.cos(pAngle) * pDist, Math.sin(pAngle) * pDist, pSize, pSize);
                    }
                    ctx.shadowBlur = 0;

                } else if (projectile.type === 'letal_shot') {
                    ctx.fillStyle = projectile.color; // Pink
                    ctx.strokeStyle = 'black'; // Black outline
                    ctx.lineWidth = 2;
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = projectile.color;

                    const length = projectile.radius * 6; // Longer laser
                    const width = projectile.radius * 0.6;

                    // Draw as a pixelated pink arrow with outline
                    const tipX = length / 2;
                    const tipY = 0;
                    const backX = -length / 2;
                    const halfWidth = width / 2;

                    ctx.beginPath();
                    // Top line of arrow
                    ctx.moveTo(tipX, tipY);
                    ctx.lineTo(backX, -halfWidth);
                    // Bottom line of arrow
                    ctx.lineTo(backX, halfWidth);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke(); // Outline for letal_shot

                    ctx.shadowBlur = 0;

                } else if (projectile.type === 'zap') {
                    const visualSize = projectile.radius * 2.2;
                    ctx.fillStyle = projectile.color; // Neon cyan
                    ctx.strokeStyle = '#004466'; // Dark blue outline
                    ctx.lineWidth = 2;
                    ctx.shadowBlur = 18;
                    ctx.shadowColor = '#00FFFF';

                    const boltWidth = visualSize * 0.25;
                    const boltHeight = visualSize * 1.7;

                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(boltWidth * 0.3, -boltHeight * 0.18);
                    ctx.lineTo(-boltWidth * 0.23, -boltHeight * 0.45);
                    ctx.lineTo(boltWidth * 0.75, -boltHeight * 0.55);
                    ctx.lineTo(boltWidth * 0.2, -boltHeight * 0.85);
                    ctx.lineTo(-boltWidth * 0.65, -boltHeight * 0.6);
                    ctx.lineTo(-boltWidth * 0.1, -boltHeight * 0.4);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();

                    // White core line for additional contrast
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.moveTo(0, -visualSize * 0.05);
                    ctx.lineTo(boltWidth * 0.28, -boltHeight * 0.2);
                    ctx.lineTo(-boltWidth * 0.15, -boltHeight * 0.4);
                    ctx.lineTo(boltWidth * 0.55, -boltHeight * 0.5);
                    ctx.stroke();

                    const sparkCount = 12;
                    const sparkSize = 1.8;
                    for (let i = 0; i < sparkCount; i++) {
                        const pAngle = Math.random() * Math.PI * 2;
                        const pDist = Math.random() * visualSize * 0.9;
                        ctx.fillStyle = `rgba(255, 255, 255, ${0.45 + Math.random() * 0.35})`;
                        ctx.fillRect(Math.cos(pAngle) * pDist, Math.sin(pAngle) * pDist, sparkSize, sparkSize);
                    }
                    ctx.shadowBlur = 0;

                } else if (projectile.type === 'tornado_grenade_launcher') {
                     ctx.fillStyle = projectile.color; // Cyan grenade
                     ctx.strokeStyle = '#004D66'; // Dark teal outline
                     ctx.lineWidth = 2;
                     const grenadeSize = projectile.radius * 2;
                     ctx.shadowBlur = 18;
                     ctx.shadowColor = projectile.color;

                     // Draw a swirling orb body with pixel texture
                     const pixelSize = 2;
                     for (let x = -grenadeSize / 2; x <= grenadeSize / 2; x += pixelSize) {
                         for (let y = -grenadeSize / 2; y <= grenadeSize / 2; y += pixelSize) {
                             if (distance(0, 0, x, y) < grenadeSize * 0.45) {
                                 if (Math.random() < 0.65) {
                                     ctx.fillRect(x, y, pixelSize, pixelSize);
                                 }
                             }
                         }
                     }

                     // Outline and ring
                     ctx.beginPath();
                     ctx.arc(0, 0, grenadeSize / 2, 0, Math.PI * 2);
                     ctx.stroke();
                     ctx.beginPath();
                     ctx.ellipse(0, 0, grenadeSize * 0.55, grenadeSize * 0.35, Math.PI / 6, 0, Math.PI * 2);
                     ctx.stroke();

                     // Draw the pin/handle
                     ctx.fillStyle = '#FFFFFF';
                     ctx.fillRect(-2, -grenadeSize / 2 - 4, 4, 4);
                     ctx.fillRect(-4, -grenadeSize / 2 - 6, 8, 2);
                     ctx.strokeStyle = '#004D66';
                     ctx.strokeRect(-2, -grenadeSize / 2 - 4, 4, 4);
                     ctx.strokeRect(-4, -grenadeSize / 2 - 6, 8, 2);
                     ctx.shadowBlur = 0;

                } else {
                    // Default behavior for other projectiles (if any, still pixelated)
                    ctx.fillStyle = projectile.color;
                    ctx.strokeStyle = 'black'; // Black outline for general projectiles
                    ctx.lineWidth = 2;
                    ctx.shadowBlur = 5;
                    ctx.shadowColor = projectile.color;
                    // Draw as square for pixelated look
                    ctx.fillRect(-projectile.radius, -projectile.radius, projectile.radius * 2, projectile.radius * 2);
                    ctx.strokeRect(-projectile.radius, -projectile.radius, projectile.radius * 2, projectile.radius * 2); // Outline
                    ctx.shadowBlur = 0;
                }

                ctx.restore();
            }

            for (const enemy of enemies) {
                enemy.draw();
            }

            for (const player of players) {
                player.draw();
            }

            // restore to screen space for HUD
            ctx.restore();

            // Only draw wave progress if not on the final boss wave
            if (waveLevel < 50) {
                const waveProgress = waveTimer / waveDuration;
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.fillRect(20, canvas.height - 30, canvas.width - 40, 10);

                ctx.fillStyle = 'rgba(255, 255, 0, 0.7)';
                ctx.fillRect(20, canvas.height - 30, (canvas.width - 40) * waveProgress, 10);

                ctx.strokeStyle = 'white';
                ctx.lineWidth = 1;
                ctx.strokeRect(20, canvas.height - 30, canvas.width - 40, 10);

                ctx.font = '12px "Press Start 2P"';
                ctx.fillStyle = 'white';
                ctx.textAlign = 'center';
                // Wave text moved up by 10px (from canvas.height - 15 to canvas.height - 25)
                ctx.fillText(`NÍVEL DE AMEAÇA ${waveLevel}`, canvas.width / 2, canvas.height - 25);
            } else {
                ctx.font = '16px "Press Start 2P"';
                ctx.fillStyle = '#FFD700'; // Gold color for final boss indicator
                ctx.textAlign = 'center';
                ctx.fillText(`AMEAÇA UNIVERSAL: ${enemies.length > 0 ? enemies[0].bossTitle : 'AGUARDANDO...'}`, canvas.width / 2, canvas.height - 25);
            }


            updateUI();
        }

        function updateUI() {
            const p1 = players[0];
            document.getElementById('p1-name-display').textContent = p1.name;
            document.getElementById('p1-health').textContent = p1.health;
            document.getElementById('p1-health-bar').style.width = `${(p1.health / p1.maxHealth) * 100}%`;
            document.getElementById('p1-level').textContent = p1.level;
            document.getElementById('p1-exp').textContent = p1.exp;
            document.getElementById('p1-exp-needed').textContent = p1.expNeeded;
            document.getElementById('p1-exp-bar').style.width = `${(p1.exp / p1.expNeeded) * 100}%`;
            document.getElementById('p1-projectiles').textContent = p1.projectileCount;
            document.getElementById('p1-damage').textContent = p1.damage;
            // Display current fire rate
            // Corrected: Uses ID directly for 'p1-fire-rate'
            document.getElementById('p1-fire-rate').textContent = `${(1000 / p1.shotInterval).toFixed(1)}/s`;


            let abilitiesHTML_p1 = '';
            for (const abilityId in p1.specialAbilities) {
                const ability = p1.specialAbilities[abilityId];
                if (ability.level > 0) {
                    const levelText = ability.level === ability.maxLevel ? 'Nvl.Max' : `Nvl.${ability.level}`;
                    abilitiesHTML_p1 += `<div style="color: ${getAbilityColor(abilityId)};"><div class="ability-icon" style="background-color: ${getAbilityColor(abilityId)};"></div> ${getAbilityDisplayName(abilityId)} ${levelText}</div>`;
                }
            }
            // Updated: 'automatic' to 'venom'
            if (p1.legendaryAbilitiesLevels.venom > 0) {
                 abilitiesHTML_p1 += `<div style="color: ${getAbilityColor('venom')};"><div class="ability-icon" style="background-color: ${getAbilityColor('venom')};"></div> ${getAbilityDisplayName('venom')}</div>`;
            }
            if (p1.legendaryAbilitiesLevels.ricochet_bullets > 0) {
                abilitiesHTML_p1 += `<div style="color: ${getAbilityColor('ricochet_bullets')};"><div class="ability-icon" style="background-color: ${getAbilityColor('ricochet_bullets')};"></div> ${getAbilityDisplayName('ricochet_bullets')}</div>`;
            }
            if (p1.legendaryAbilitiesLevels.speedy_trigger > 0) {
                abilitiesHTML_p1 += `<div style="color: ${getAbilityColor('speedy_trigger')};"><div class="ability-icon" style="background-color: ${getAbilityColor('speedy_trigger')};"></div> ${getAbilityDisplayName('speedy_trigger')}</div>`;
            }
            if (p1.legendaryAbilitiesLevels.bomb_shots > 0) {
                abilitiesHTML_p1 += `<div style="color: ${getAbilityColor('bomb_shots')};"><div class="ability-icon" style="background-color: ${getAbilityColor('bomb_shots')};"></div> ${getAbilityDisplayName('bomb_shots')}</div>`;
            }
            if (p1.legendaryAbilitiesLevels.clone_shots > 0) {
                abilitiesHTML_p1 += `<div style="color: ${getAbilityColor('clone_shots')};"><div class="ability-icon" style="background-color: ${getAbilityColor('clone_shots')};"></div> ${getAbilityDisplayName('clone_shots')}</div>`;
            }

            document.getElementById('p1-abilities').innerHTML = abilitiesHTML_p1 || '<div style="color: #aaa;">Nenhuma Habilidade</div>';

            if (players.length > 1) {
                const p2 = players[1];
                document.getElementById('p2-name-display').textContent = p2.name;
                document.getElementById('p2-health').textContent = p2.health;
                document.getElementById('p2-health-bar').style.width = `${(p2.health / p2.maxHealth) * 100}%`;
                document.getElementById('p2-level').textContent = p2.level;
                document.getElementById('p2-exp').textContent = p2.exp;
                document.getElementById('p2-exp-needed').textContent = p2.expNeeded;
                document.getElementById('p2-exp-bar').style.width = `${(p2.exp / p2.expNeeded) * 100}%`;
                document.getElementById('p2-projectiles').textContent = p2.projectileCount;
                document.getElementById('p2-damage').textContent = p2.damage;
                 // Display current fire rate
                // Corrected: Uses ID directly for 'p2-fire-rate'
                document.getElementById('p2-fire-rate').textContent = `${(1000 / p2.shotInterval).toFixed(1)}/s`;


                let abilitiesHTML_p2 = '';
                for (const abilityId in p2.specialAbilities) {
                    const ability = p2.specialAbilities[abilityId];
                    if (ability.level > 0) {
                        const levelText = ability.level === ability.maxLevel ? 'Nvl.Max' : `Nvl.${ability.level}`;
                        abilitiesHTML_p2 += `<div style="color: ${getAbilityColor(abilityId)};"><div class="ability-icon" style="background-color: ${getAbilityColor(abilityId)};"></div> ${getAbilityDisplayName(abilityId)} ${levelText}</div>`;
                    }
                }
                // Updated: 'automatic' to 'venom'
                if (p2.legendaryAbilitiesLevels.venom > 0) {
                    abilitiesHTML_p2 += `<div style="color: ${getAbilityColor('venom')};"><div class="ability-icon" style="background-color: ${getAbilityColor('venom')};"></div> ${getAbilityDisplayName('venom')}</div>`;
                }
                if (p2.legendaryAbilitiesLevels.ricochet_bullets > 0) {
                    abilitiesHTML_p2 += `<div style="color: ${getAbilityColor('ricochet_bullets')};"><div class="ability-icon" style="background-color: ${getAbilityColor('ricochet_bullets')};"></div> ${getAbilityDisplayName('ricochet_bullets')}</div>`;
                }
                if (p2.legendaryAbilitiesLevels.speedy_trigger > 0) {
                    abilitiesHTML_p2 += `<div style="color: ${getAbilityColor('speedy_trigger')};"><div class="ability-icon" style="background-color: ${getAbilityColor('speedy_trigger')};"></div> ${getAbilityDisplayName('speedy_trigger')}</div>`;
                }
                if (p2.legendaryAbilitiesLevels.bomb_shots > 0) {
                    abilitiesHTML_p2 += `<div><div class="ability-icon" style="background-color: ${getAbilityColor('bomb_shots')};"></div> ${getAbilityDisplayName('bomb_shots')}</div>`;
                }
                if (p2.legendaryAbilitiesLevels.clone_shots > 0) {
                    abilitiesHTML_p2 += `<div><div class="ability-icon" style="background-color: ${getAbilityColor('clone_shots')};"></div> ${getAbilityDisplayName('clone_shots')}</div>`;
                }
                document.getElementById('p2-abilities').innerHTML = abilitiesHTML_p2 || '<div style="color: #aaa;">Nenhuma Habilidade</div>';
            }

            document.getElementById('enemies-defeated').textContent = enemiesDefeated;
        }

        function updateTimeUI() {
            const seconds = Math.floor(gameTime / 1000);
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;

            document.getElementById('game-time').textContent =
                `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        }

        function hideAllMenus() {
            document.getElementById('title-screen').style.display = 'none'; // Ensure title screen is hidden
            document.getElementById('main-menu').style.display = 'none';
            document.getElementById('player-select-menu').style.display = 'none';
            document.getElementById('how-to-play-menu').style.display = 'none'; // Hide new how to play menu
            document.getElementById('music-menu').style.display = 'none';
            document.getElementById('player-image-menu').style.display = 'none';
            document.getElementById('upgrade-selection-menu').style.display = 'none'; // Unified menu
            document.getElementById('game-over').style.display = 'none';
            document.getElementById('pause-menu').style.display = 'none';
            document.getElementById('confirm-end-session-menu').style.display = 'none';
            upgradeSelectionMenuVisible = false; // Reset visibility flag
            currentActiveMenu = null; // Clear active menu
            gamePaused = false; // Ensure game is not paused when all menus are hidden
            console.log('hideAllMenus called. gamePaused set to false.');
        }

        // Function to show the title screen
        function showTitleScreen() {
            document.getElementById('title-screen').style.display = 'flex';
            // Add event listeners to dismiss the title screen
            window.addEventListener('click', hideTitleScreen, { once: true });
            window.addEventListener('keydown', hideTitleScreen, { once: true });
            console.log('showTitleScreen called.');
        }

        // Function to hide the title screen and show the main menu
        function hideTitleScreen() {
            const titleScreen = document.getElementById('title-screen');
            // Remove the fade-out class immediately to ensure the element can be hidden
            // Even if the animation itself is not working for some reason.
            titleScreen.classList.remove('fade-out-effect'); 
            titleScreen.style.display = 'none'; // Directly hide the title screen
            showMainMenu(); // Show the main menu immediately
            playDefaultMusic('menu', true); // Force restart main menu music here
            console.log('hideTitleScreen completed. Main Menu displayed, music restarted.');

            // Remove click/keydown event listeners from window.
            // These were set with {once: true} but explicit removal is good practice.
            window.removeEventListener('click', hideTitleScreen);
            window.removeEventListener('keydown', hideTitleScreen);
        }

        function showMainMenu() {
            console.log('showMainMenu called.');
            hideAllMenus(); // This will set gamePaused = false
            const menuElement = document.getElementById('main-menu');
            menuElement.style.display = 'flex';
            document.getElementById('player1-name-input').value = player1CustomName;
            document.getElementById('player2-name-input').value = player2CustomName;
            updateMusicButtonsState();
            setupMenuNavigation(menuElement);
            // Music is now played explicitly from hideTitleScreen or back-to-main-from-final-screen
            // DO NOT call playDefaultMusic('menu') here to avoid resetting.
        }

        function showPlayerSelectMenu() {
            console.log('showPlayerSelectMenu called.');
            const menuElement = document.getElementById('player-select-menu');
            menuElement.style.display = 'flex';
            setupMenuNavigation(menuElement);
        }

        // New function to show How to Play menu
        function showHowToPlayMenu(fromPause = false) { // Added fromPause parameter
            console.log(`showHowToPlayMenu called. fromPause: ${fromPause}`);
            hideAllMenus();
            const menuElement = document.getElementById('how-to-play-menu');
            menuElement.style.display = 'flex';
            // Pause the game only if coming from the pause menu
            if (fromPause && gameRunning) {
                gamePaused = true;
                console.log('Game paused from How to Play Menu.');
            } else {
                gamePaused = false; // Ensures it's not paused if not coming from pause menu
            }
            setupMenuNavigation(menuElement);
        }

        function showMusicMenu(fromPause = false) {
            console.log(`showMusicMenu called. fromPause: ${fromPause}`);
            hideAllMenus();
            const menuElement = document.getElementById('music-menu');
            menuElement.style.display = 'flex';
            // Pause the game only if coming from the pause menu
            if (fromPause && gameRunning) {
                gamePaused = true;
                console.log('Game paused from Music Menu.');
            } else {
                gamePaused = false; // Ensures it's not paused if not coming from pause menu
            }
            // Set initial volume slider value
            if (currentMusic) {
                musicVolumeSlider.value = currentMusic.volume;
            } else {
                musicVolumeSlider.value = mainMenuMusic.volume; // Use main menu music volume as default
            }
            updateMusicButtonsState();
            setupMenuNavigation(menuElement);
        }

        function showPlayerImageMenu() {
            console.log('showPlayerImageMenu called.');
            const menuElement = document.getElementById('player-image-menu');
            menuElement.style.display = 'flex';
            setupMenuNavigation(menuElement);
        }

        function showGameUI() {
            console.log('showGameUI called.');
            document.getElementById('game-ui').style.display = 'block';
            document.getElementById('center-stats').style.display = 'block';
            document.getElementById('end-session-button-container').style.display = 'block';
            document.getElementById('controls-info').style.display = 'block';
            if (!singlePlayer) {
                document.getElementById('game-ui-right').style.display = 'block';
            }
        }

        function hideGameUI() {
            console.log('hideGameUI called.');
            document.getElementById('game-ui').style.display = 'none';
            document.getElementById('game-ui-right').style.display = 'none';
            document.getElementById('center-stats').style.display = 'none';
            document.getElementById('end-session-button-container').style.display = 'none';
            document.getElementById('controls-info').style.display = 'none';
        }

        // Function to get display description for special abilities
        function getSpecialAbilityDisplayDescription(abilityId, currentLevelOfAbility) {
            // Note: currentLevelOfAbility here is the player's current level of the ability
            // before the upgrade is applied.
            const ability = upgradingPlayer.specialAbilities[abilityId];
            if (!ability) return '';

            let baseDescription = '';
            let maxPowerDescription = '';
            let currentDamage = calculateSpecialAbilityDamage(upgradingPlayer, abilityId);
            let nextLevel = currentLevelOfAbility + 1;
            const maxLevelReached = nextLevel > (ability.maxLevel || Infinity);

            // Calculate potential max power (assuming max level is 10 for specials)
            let maxDamage = currentDamage; // Start with current damage
            let maxEffect = '';

            // Temporarily set ability level to max to calculate max power
            const originalLevel = ability.level;
            ability.level = ability.maxLevel;
            maxDamage = calculateSpecialAbilityDamage(upgradingPlayer, abilityId);

            switch(abilityId) {
                case 'push':
                    baseDescription = `<br> Cria uma barreira que causa ${currentDamage} de Dano em Área e EMPURRA Inimigos próximos ao Atirador. Cada Nível aumenta o Tamanho da Barreira em 20%.<br>`;
                    maxPowerDescription = `Libera várias ondas de choque, Inimigos que colidem são PARALISADOS.<br>`;
                    break;
                case 'plasma_explosion':
                    baseDescription = `<br> Lança um Projétil que explode e causa ${currentDamage} de Dano em Área, INCENDIANDO o local por 2 segundos. Cada Nível aumenta o Tamanho da Explosão em 25% e a duração das chamas em 0.5 segundos.<br>`;
                    maxPowerDescription = `Dispara 2 Explosões de Plasma adicionais para cobrir uma Área maior.<br>`;
                    break;
                case 'letal_shot':
                    baseDescription = `<br> Lança um Projétil que causa ${currentDamage} de Dano em Área e PERFURA Inimigos. Cada Nível aumenta o Tamanho do Projétil em 20%.<br>`;
                    maxPowerDescription = `Dispara 3 Tiros Letais adicionais em direções cardeais ao Projétil original.<br>`;
                    break;
                case 'zap':
                    baseDescription = `<br> Lança um Projétil que causa ${currentDamage} de Dano e RICOCHETEIA em até ${3 + currentLevelOfAbility} Inimigos. Cada Nível aumenta o Número de Inimigos atingidos em 1.<br>`;
                    maxPowerDescription = `Inimigos atingidos são PARALISADOS.<br>`;
                    break;
                case 'tactic_boomerang':
                    baseDescription = `<br> Lança um Projétil que causa ${currentDamage} de Dano em Área e RETORNA ao Atirador. Cada Nível aumenta o Número de Projéteis disparados em 1.<br>`;
                    // TACTICAL BOOMERANG: Now its X POWER (Max.Lvl) will grant, in addition to the ability to push targets, a new ability: each hit enemy generates an explosion (does not ignite the ground, only causes damage in a medium area).
                    maxPowerDescription = `Inimigos atingidos são EMPURRADOS e causam uma explosão de dano em área.<br>`;
                    break;
                case 'tornado_grenade':
                    baseDescription = `<br> Cria uma área que causa ${currentDamage} de Dano Contínuo em Área e PUXA Inimigos por 3 segundos. Cada Nível aumenta o Tamanho em 20% e a Duração em 0.5 segundos.<br>`;
                    maxPowerDescription = `Dispara uma Granada Vortex adicional na direção oposta.<br>`;
                    break;
                default:
                    baseDescription = `<br> ${ability.description} que causa ${currentDamage} de Dano. Descrição do que aumenta por Nível.<br>`;
                    maxPowerDescription = `Efeito máximo.<br>`;
            }

            // Restore original level
            ability.level = originalLevel;

            let levelInfo = '';
            if (maxLevelReached) {
                levelInfo = `Nvl.Max. ${maxPowerDescription}`;
            } else {
                levelInfo = `${baseDescription}`;
                if (ability.maxLevel > 0) { // Only show max power if it's a leveled ability
                    levelInfo += `<br><b>PODER X:</b> ${maxPowerDescription}`;
                }
            }

            return levelInfo;
        }


        function showUpgradeSelectionMenu(player) {
            console.log('showUpgradeSelectionMenu called.');
            upgradingPlayer = player;
            gamePaused = true;
            upgradeSelectionMenuVisible = true;
            const menu = document.getElementById('upgrade-selection-menu');
            const optionsContainer = menu;

            // Determine border color and text color based on player number
            let borderColor;
            let textColor;
            let playerDisplayName = player.name.toUpperCase();

            if (player.playerNumber === 1) {
                borderColor = '#00FFFF'; // Blue for player 1
                textColor = '#FFFFFF'; // Force white text for clarity
            } else { // Player 2
                borderColor = '#800080'; // Purple for player 2
                textColor = '#FFFFFF'; // Force white text for clarity
            }

            // Set menu border and shadow
            menu.style.borderColor = borderColor;
            menu.style.boxShadow = `0 0 25px ${borderColor}, 0 0 40px rgba(${parseInt(borderColor.slice(1,3), 16)}, ${parseInt(borderColor.slice(3,5), 16)}, ${parseInt(borderColor.slice(5,7), 16)}, 0.3)`;
            menu.style.backgroundColor = `rgba(${parseInt(borderColor.slice(1,3), 16) * 0.1}, ${parseInt(borderColor.slice(3,5), 16) * 0.1}, ${parseInt(borderColor.slice(5,7), 16) * 0.1}, 0.95)`;


            let titleText = `${playerDisplayName} ALCANÇOU O NÍVEL ${player.level}`;
            let subtitleText = 'ESCOLHA SUA MELHORIA:';

            // Check if it's a legendary upgrade level (multiples of 10)
            if (player.level >= 10 && player.level % 10 === 0) {
                subtitleText = 'ESCOLHA SUA MELHORIA LENDÁRIA:';
            }

            optionsContainer.innerHTML = `
                <div id="upgrade-selection-title" style="color: ${textColor}; text-shadow: 0 0 10px ${textColor};">${titleText}</div>
                <div id="upgrade-selection-subtitle">${subtitleText}</div>
            `;

            // Decide which type of upgrades to show
            let upgradesToShow = [];

            // Add Legendary Abilities if player Level is a multiple of 10
            if (player.level >= 10 && player.level % 10 === 0) {
                let availableLegendaries = [];
                for (const legendaryAbility of LEGENDARY_ABILITIES) {
                    if (player.legendaryAbilitiesLevels[legendaryAbility.id] === 0) { // Only show if not picked yet
                        availableLegendaries.push({
                            type: 'legendary',
                            id: legendaryAbility.id,
                            name: legendaryAbility.displayName,
                            description: legendaryToDisplayDescription(legendaryAbility.id, player.legendaryAbilitiesLevels[legendaryAbility.id]),
                            color: getAbilityColor(legendaryAbility.id)
                        });
                    }
                }
                const shuffledAvailableLegendaries = shuffleArray(availableLegendaries);
                // Add up to 3 unique legendary abilities if available
                upgradesToShow = shuffledAvailableLegendaries.slice(0, Math.min(3, shuffledAvailableLegendaries.length));
            } else {
                // Add Basic Upgrades
                // Logic for +1 Projectile vs +10 Health (no longer conditional)
                upgradesToShow.push({ type: 'basic', id: 'projectile', name: '+1 PROJÉTIL', description: `<br> Aumenta o número de Projéteis disparados em 1.<br>` });
                upgradesToShow.push({ type: 'basic', id: 'health', name: '+10 VIDA', description: '<br> Aumenta sua Vida em 10 pontos.<br>' });

                // Always show damage and speed if not maxed out (if applicable)
                upgradesToShow.push({ type: 'basic', id: 'damage', name: '+5 DANO', description: '<br> Aumenta seu Dano em 5 pontos.<br>' });
                // +SPEED ATTRIBUTE: Increases the Shooter's MOVEMENT and BASIC PROJECTILE speed by 15% (Does not affect ABILITIES) and now will also make it SHOOT FASTER.
                upgradesToShow.push({ type: 'basic', id: 'speed', name: '+VELOCIDADE', description: '<br> Aumenta sua Velocidade de Movimento, Cadência de Tiro e Velocidade de Projétil em 12%.<br>' });


                // Add Special Abilities
                for (const abilityName in player.specialAbilities) {
                    const ability = player.specialAbilities[abilityName];
                    if (ability.level < ability.maxLevel) { // Only show if not max level
                        const displayName = SPECIAL_ABILITIES.find(sa => sa.id === abilityName)?.displayName || abilityName.replace(/_/g, ' ').toUpperCase();
                        upgradesToShow.push({
                            type: 'special',
                            id: abilityName,
                            name: displayName, // Use the proper display name
                            description: getSpecialAbilityDisplayDescription(abilityName, ability.level), // Use helper for description
                            color: getAbilityColor(abilityName)
                        });
                    }
                }
            }


            const shuffledUpgrades = shuffleArray(upgradesToShow);
            const chosenUpgrades = [];

            // Ensure we pick unique upgrades up to 3 (or less if not enough unique options)
            let uniqueUpgradesAdded = new Set();
            for (let i = 0; i < shuffledUpgrades.length && chosenUpgrades.length < 3; i++) {
                const upgrade = shuffledUpgrades[i];
                const upgradeKey = `${upgrade.type}-${upgrade.id}`; // Unique key for Set
                if (!uniqueUpgradesAdded.has(upgradeKey)) {
                    chosenUpgrades.push(upgrade);
                    uniqueUpgradesAdded.add(upgradeKey);
                }
            }
            
            chosenUpgrades.forEach(upgrade => {
                const optionDiv = document.createElement('div');
                optionDiv.classList.add('upgrade-option-item');
                optionDiv.setAttribute('data-upgrade', upgrade.id);
                optionDiv.setAttribute('data-category', upgrade.type);

                let iconHtml = '';
                if (upgrade.type === 'special' || upgrade.type === 'legendary') {
                    const color = upgrade.color || getAbilityColor(upgrade.id); // Use specific color or default
                    optionDiv.classList.add(upgrade.type); // Add type class for CSS styling
                    iconHtml = `<div class="ability-icon" style="background-color: ${color};"></div> `;
                }

                let displayLevel = '';
                // No level display for basic attributes or legendary abilities
                if (upgrade.type === 'special') {
                    const currentAbility = player.specialAbilities[upgrade.id];
                    if (currentAbility && currentAbility.level === currentAbility.maxLevel) {
                        displayLevel = ' (Nvl.Max)';
                    }
                }
                // Ensure the background color of the option contrasts with text
                const abilityColor = upgrade.color || getAbilityColor(upgrade.id) || '#404040';
                // Convert hex like #RRGGBB to RGB components
                function hexToRgb(hex) {
                    const m = hex.replace('#','');
                    const r = parseInt(m.substring(0,2),16);
                    const g = parseInt(m.substring(2,4),16);
                    const b = parseInt(m.substring(4,6),16);
                    return {r,g,b};
                }
                function luminance(r,g,b){ return 0.2126*r + 0.7152*g + 0.0722*b; }
                let bgColor = 'rgba(20,30,40,0.8)';
                try {
                    const rgb = hexToRgb(abilityColor);
                    // make a darker translucent background based on ability color
                    bgColor = `rgba(${Math.floor(rgb.r*0.12)}, ${Math.floor(rgb.g*0.12)}, ${Math.floor(rgb.b*0.12)}, 0.9)`;
                    // Force white text for all upgrade menu entries for readability
                    optionDiv.style.color = '#FFFFFF';
                } catch (e) {
                    optionDiv.style.color = '#90EE90';
                }

                optionDiv.style.backgroundColor = bgColor;

                optionDiv.innerHTML = `
                    ${iconHtml}${upgrade.name}${displayLevel}
                    <div style="font-size: 12px; margin-top: 5px; color: inherit;">${upgrade.description}</div>
                `;
                optionsContainer.appendChild(optionDiv);
            });
            menu.style.display = 'flex'; // Changed to flex for centering
            // Force fixed positioning and high z-index so the menu always appears centered
            menu.style.position = 'fixed';
            menu.style.top = '50%';
            menu.style.left = '50%';
            menu.style.transform = 'translate(-50%, -50%)';
            menu.style.zIndex = 9999;
            setupMenuNavigation(menu); // Setup navigation for upgrade menu
        }

        function hideUpgradeSelectionMenu() {
            console.log('hideUpgradeSelectionMenu called.');
            document.getElementById('upgrade-selection-menu').style.display = 'none';
            upgradingPlayer = null;
            upgradeSelectionMenuVisible = false;
            currentActiveMenu = null; // Clear active menu
        }

        function getAbilityColor(abilityName) {
            switch(abilityName) {
                case 'push': return '#C71585'; // Purple-red for EMPURRÃO
                case 'plasma_explosion': return '#ff9900';
                case 'letal_shot': return '#ff00ff'; // Pink for TIRO LETAL
                case 'zap': return '#87CEEB'; // Light blue/cyan for ZAP
                case 'tactic_boomerang': return '#36454F'; // Dark gray for BUMERANGUE TÁTICO
                case 'tornado_grenade': return '#EDEDED'; // White/gray for GRANADA VORTEX
                case 'venom': return '#FFD700'; // Gold for legendary
                case 'ricochet_bullets': return '#FFD700'; // Gold for legendary
                case 'speedy_trigger': return '#FFD700'; // Gold for legendary
                case 'bomb_shots': return '#FFD700'; // Gold for legendary
                case 'clone_shots': return '#FFD700'; // Gold for legendary
                default: return '#ccc';
            }
        }

        function shuffleArray(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
        }

        function applyBasicUpgrade(type) {
            if (!upgradingPlayer) return;

            if (type === 'damage') {
                upgradingPlayer.damage += 5; // Damage per Level to 5
            } else if (type === 'projectile') {
                // No more level limit for +1 PROJECTILE
                upgradingPlayer.projectileCount += 1;
            } else if (type === 'speed') {
                // +SPEED ATTRIBUTE: Increases the Shooter's MOVEMENT and BASIC PROJECTILE speed by 15%
                // (Does not affect ABILITIES) and now will also make it SHOOT FASTER.
                upgradingPlayer.speed *= 1.2; // 12% movement speed increase
                upgradingPlayer.projectileSpeedMultiplier *= 1.2; // 12% basic Projectile speed increase
                upgradingPlayer.shotInterval /= 1.2; // 12% faster (divide by 1.2)
            } else if (type === 'health') { // New +10 HEALTH upgrade
                upgradingPlayer.maxHealth += 10;
                upgradingPlayer.health = Math.min(upgradingPlayer.maxHealth, upgradingPlayer.health + 10); // Also heal for the new health
            }
            upgradingPlayer.updateSpecialAbilityDamages(); // Recalculate damage after player's base damage or projectile speed increases
            updateUI();
        }

        function applySpecialUpgrade(type) {
            if (!upgradingPlayer) return;

            const ability = upgradingPlayer.specialAbilities[type];
            if (ability && ability.level < ability.maxLevel) {
                ability.level += 1;
                
                // Base interval increased by 1 second (1000ms) for all
                // The interval calculation remains the same, but the base value is higher
                if (type === 'push') {
                    ability.interval = ability.originalInterval / (1 + 0.1 * ability.level);
                } else if (type === 'plasma_explosion') {
                    ability.projectileCount = 1 + (ability.level - 1);
                    ability.interval = Math.max(1000, ability.originalInterval / (1 + 0.1 * ability.level));
                } else if (type === 'letal_shot') {
                    ability.interval = Math.max(1000, ability.originalInterval / (1 + 0.1 * ability.level));
                    // TIRO LETAL - Level 10: Irá se mover muito mais rápido
                    if (ability.level === 10) {
                        // Further speed increase for letal_shot projectiles at max level
                        upgradingPlayer.projectileSpeedMultiplier *= 1.1; // Small boost
                    }
                } else if (type === 'zap') {
                    // ZAP: Ele não está ricocheteando! o ZAP deve acertar 3 ALVOS no NVL.1, e agora acertará 1 a mais a cada Nível da habilidade (nvl.2 acertará 4, nvl.3 acertará 5, etc)
                    ability.maxTargets = 3 + (ability.level - 1); 
                    ability.interval = Math.max(1000, ability.originalInterval / (1 + 0.1 * ability.level));
                } else if (type === 'tactic_boomerang') {
                    ability.projectileCount = ability.level; // Level 1 is 1 boomerang, Level 10 is 10 boomerangs
                    ability.interval = Math.max(1000, ability.originalInterval / (1 + 0.1 * ability.level));
                } else if (type === 'tornado_grenade') {
                    ability.duration = (ability.originalDuration || 3500) + ability.level * 500; // Original duration might need to be stored
                    ability.interval = Math.max(1000, ability.originalInterval / (1 + 0.1 * ability.level));
                }
            }
            upgradingPlayer.updateSpecialAbilityDamages(); // Recalculate damage after ability levels increase
            updateUI();
        }

        const LEGENDARY_ABILITIES = [ // Renamed from legendaryAbilities to LEGENDARY_ABILITIES to avoid conflict if already defined in main script scope
            {
                id: 'venom', // Internal ID of the ability
                name: 'VENENO', // Internal name of the ability in the code
                displayName: 'VENENO', // Name for display in the user interface (UI)
                description: '<br> Seus Projéteis deixam um rastro de veneno que causa Dano Contínuo aos Inimigos. Não afeta Habilidades Especiais.<br>',
                maxLevel: 1 // Only one level
            },
            {
                id: 'ricochet_bullets',
                name: 'BALAS-RICOCHETE',
                displayName: 'BALAS-RICOCHETE',
                description: '<br> Seus Projéteis RICOCHETEIAM em até 5 Inimigos. Não afeta Habilidades Especiais. <br>',
                maxLevel: 1 // Only one level
            },
            {
                id: 'speedy_trigger',
                name: 'GATILHO VELOZ',
                displayName: 'GATILHO VELOZ',
                description: '<br> Aumenta sua Velocidade de Disparo em 50%, a Velocidade de todos os seus Projéteis em 100% e diminui a recarga de todas as habilidades em 1.5 segundos.<br>',
                maxLevel: 1 // Only one level
            },
            {
                id: 'bomb_shots',
                name: 'TIROS-BOMBA',
                displayName: 'TIROS-BOMBA',
                description: '<br> Seus Projéteis explodem ao contato, causando Dano em Área e EMPURRANDO os Inimigos. Não afeta Habilidades Especiais.<br>',
                maxLevel: 1 // Only one level
            },
            {
                id: 'clone_shots',
                name: 'CLONAGEM',
                displayName: 'CLONAGEM',
                description: '<br> O Atirador recebe uma arma clone que dispara na direção oposta. Não afeta Habilidades Especiais.<br>',
                maxLevel: 1 // Only one level
            },
            // ...adicione ou mantenha outras habilidades lendárias aqui conforme seu game.js original
        ];

        // --- Special Ability Definitions ---
        // Special abilities now have their names and display names updated.
        const SPECIAL_ABILITIES = [ // Renamed from specialAbilities to SPECIAL_ABILITIES
            {
                id: 'push',
                name: 'push', // Internal name
                displayName: 'EMPURRÃO',
                description: 'Cria uma Área em volta do Atirador que causa Dano e empurra os Inimigos.',
                // ...
            },
            {
                id: 'plasma_explosion',
                name: 'plasma_explosion', // Internal name
                displayName: 'EXPLOSÃO DE PLASMA',
                description: 'Lança um Projétil que explode e cria uma Área em chamas.',
                // ...
            },
            {
                id: 'tactic_boomerang',
                name: 'tactic_boomerang', // Internal name
                displayName: 'BUMERANGUE TÁTICO',
                description: 'Lança um bumerangue que retorna ao jogador, atingindo Inimigos na ida e na volta.',
                // ...
            },
            {
                id: 'letal_shot',
                name: 'letal_shot', // Internal name
                displayName: 'TIRO LETAL',
                description: 'Lança um Projétil de alta potência que perfura múltiplos Inimigos.',
                // ...
            },
            {
                id: 'tornado_grenade',
                name: 'tornado_grenade', // Internal name
                displayName: 'GRANADA VORTEX',
                description: 'Arremessa uma granada que cria um vórtice de energia pixel art, puxando e danificando Inimigos.',
                // ...
            },
            {
                id: 'zap',
                name: 'zap', // Internal name
                displayName: 'ZAP',
                description: 'Libera um raio que atinge Inimigos em cadeia.',
                // ...
            },
            // ...adicione ou mantenha outras habilidades especiais aqui conforme seu original game.js
        ];

        // --- Example of how you can access and display names ---
        // This function is an example of how you would use 'displayName' to show the ability name.
        function getAbilityDisplayName(abilityId) {
            // Check in SPECIAL_ABILITIES first
            const foundSpecialAbility = SPECIAL_ABILITIES.find(ability => ability.id === abilityId);
            if (foundSpecialAbility) {
                return foundSpecialAbility.displayName;
            }

            // If not found in SPECIAL_ABILITIES, check in LEGENDARY_ABILITIES
            const foundLegendaryAbility = LEGENDARY_ABILITIES.find(ability => ability.id === abilityId);
            if (foundLegendaryAbility) {
                return foundLegendaryAbility.displayName;
            }

            return 'Habilidade Desconhecida';
        }

        // Modified legendaryToDisplayDescription to remove level information
        function legendaryToDisplayDescription(abilityId, currentLevel) {
            const ability = LEGENDARY_ABILITIES.find(a => a.id === abilityId);
            if (!ability) return '';

            // The description now comes directly from the ability object, without level scaling
            return ability.description;
        }

        function applyLegendaryCommand(type) {
            if (!upgradingPlayer) return;

            // Increment the level to mark it as acquired (level will be 1 after picking)
            upgradingPlayer.legendaryAbilitiesLevels[type]++;

            // Apply fixed effects, ignoring 'level - 1' scaling
            if (type === 'venom') {
                upgradingPlayer.trailEnabled = true;
                upgradingPlayer.trailDuration = 3000; // Fixed 3 seconds
            } else if (type === 'ricochet_bullets') {
                upgradingPlayer.ricochet_bulletsEnabled = true;
            } else if (type === 'speedy_trigger') {
                // GATILHO VELOZ: Agora ele aumenta a velocidade de tiro do Atirador em 50%
                // e DOBRA a velocidade de TODOS os PROJÉTEIS (BÁSICOS OU HABILIDADES),
                // além de diminuir o tempo de espera de todas as habilidades em 1.5 segundos.
                
                // Aumenta velocidade de tiro do Atirador em 50%
                upgradingPlayer.shotInterval /= 1.50; // Diminui o intervalo para aumentar a taxa de tiro em 50%
                
                // Dobra a velocidade de TODOS os PROJÉTEIS (BÁSICOS OU HABILIDADES)
                upgradingPlayer.projectileSpeedMultiplier *= 2; 

                // Diminuir o tempo de espera de todas as habilidades em 1.5 segundos.
                // Isso será tratado na lógica de cooldowns de habilidades, que deve subtrair 1.5 segundos
                // do cooldown base para cada Nível de "Gatilho Veloz" (assumindo 1 Nível para lendária)
                for (const abilityId in upgradingPlayer.specialAbilities) {
                    const ability = upgradingPlayer.specialAbilities[abilityId];
                    // Reduzir cooldown em 1.5 segundos (1500 ms)
                    // Garantir que o cooldown não se torne negativo.
                    ability.interval = Math.max(1000, ability.originalInterval - 1500); 
                }

            } else if (type === 'bomb_shots') {
                upgradingPlayer.bomb_shotsEnabled = true;
            } else if (type === 'clone_shots') {
                upgradingPlayer.clone_shotsEnabled = true;
            }
            upgradingPlayer.updateSpecialAbilityDamages(); // Recalculate damage after legendary levels might affect it
            updateUI();
        }

        // Modified endGameSession to accept type of session end
        function endGameSession(type) {
            console.log(`endGameSession called with type: ${type}`);
            gameRunning = false;
            if (gameTimerIntervalId) {
                clearInterval(gameTimerIntervalId); // Stop the timer when game ends
                gameTimerIntervalId = null;
            }
            displayFinalStats(type);
        }

        // Modified displayFinalStats to use sessionEndT
        // Modified displayFinalStats to use sessionEndType
        function displayFinalStats(sessionEndType) {
            console.log('displayFinalStats called.');
            gameRunning = false;
            gamePaused = true;
            hideGameUI();
            hideConfirmEndSessionMenu();

            const finalScreenTitle = document.getElementById('final-screen-title');
            if (sessionEndType === 'defeat') {
                finalScreenTitle.textContent = 'GAME OVER';
                finalScreenTitle.style.color = '#B22222'; /* Firebrick red */
                finalScreenTitle.style.textShadow = '0 0 5px #B22222';
            } else if (sessionEndType === 'victory') {
                finalScreenTitle.textContent = 'FIM DE JOGO'; // Changed to FIM DE JOGO
                finalScreenTitle.style.color = '#00FF00'; /* Green */
                finalScreenTitle.style.textShadow = '0 0 5px #00FF00';
            } else if (sessionEndType === 'end_session') {
                finalScreenTitle.textContent = 'SESSÃO ENCERRADA';
                finalScreenTitle.style.color = '#FFD700'; /* Gold */
                finalScreenTitle.style.textShadow = '0 0 5px #FFD700';
            }


            const seconds = Math.floor(gameTime / 1000);
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;

            document.getElementById('final-time').textContent =
                `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;

            document.getElementById('final-enemies').textContent = enemiesDefeated;
            document.getElementById('final-wave').textContent = waveLevel === 50 && finalBossDefeated ? '50 (FINAL)' : waveLevel; // Display 50 (FINAL) for final boss defeat

            const finalPlayerStatsContainer = document.getElementById('final-player-stats');
            finalPlayerStatsContainer.innerHTML = ''; // Clear previous stats

            players.forEach(player => {
                const playerStatsDiv = document.createElement('div');
                playerStatsDiv.classList.add('player-final-stats');
                
                let playerAbilitiesHtml = '';
                for (const abilityId in player.specialAbilities) {
                    const ability = player.specialAbilities[abilityId];
                    if (ability.level > 0) {
                        const levelText = ability.level === ability.maxLevel ? 'Nvl.Max' : `Nv.${ability.level}`;
                        playerAbilitiesHtml += `
                            <div style="color: ${getAbilityColor(abilityId)}; display: flex; align-items: center; margin-bottom: 3px;">
                                <div class="ability-icon" style="background-color: ${getAbilityColor(abilityId)};"></div>
                                ${getAbilityDisplayName(abilityId)} ${levelText}
                            </div>
                        `;
                    }
                }
                 for (const legendaryAbilityId in player.legendaryAbilitiesLevels) {
                    if (player.legendaryAbilitiesLevels[legendaryAbilityId] > 0) {
                        playerAbilitiesHtml += `
                            <div style="color: ${getAbilityColor(legendaryAbilityId)}; display: flex; align-items: center; margin-bottom: 3px;">
                                <div class="ability-icon" style="background-color: ${getAbilityColor(legendaryAbilityId)};"></div>
                                ${getAbilityDisplayName(legendaryAbilityId)}
                            </div>
                        `;
                    }
                }

                playerStatsDiv.innerHTML = `
                    <h3>${player.name.toUpperCase()}</h3>
                    <div>NÍVEL ATINGIDO: ${player.level}</div>
                    <div>DANO: ${player.damage}</div>
                    <div>VELOCIDADE: ${player.speed.toFixed(1)}</div>
                    <div>VELOCIDADE DE TIRO: ${(1000 / player.shotInterval).toFixed(1)}/s</div>
                    <div>INIMIGOS DERROTADOS: ${player.kills}</div>
                    <div class="player-final-abilities">HABILIDADES: ${playerAbilitiesHtml || '<span style="color: #aaa;">Nenhuma</span>'}</div>
                `;
                finalPlayerStatsContainer.appendChild(playerStatsDiv);
            });

            document.getElementById('game-over').style.display = 'flex';
            console.log('Final stats displayed.');
        }

        function showPauseMenu() {
            console.log('showPauseMenu called.');
            gamePaused = true;
            document.getElementById('pause-menu').style.display = 'flex';
            hideGameUI();
        }

        function hidePauseMenu() {
            console.log('hidePauseMenu called.');
            gamePaused = false;
            document.getElementById('pause-menu').style.display = 'none';
            showGameUI();
        }

        function showConfirmEndSessionMenu() {
            console.log('showConfirmEndSessionMenu called.');
            gamePaused = true;
            document.getElementById('confirm-end-session-menu').style.display = 'flex';
        }

        function hideConfirmEndSessionMenu() {
            console.log('hideConfirmEndSessionMenu called.');
            document.getElementById('confirm-end-session-menu').style.display = 'none';
        }

        window.addEventListener('resize', () => {
            console.log('Window resized.');
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            players.forEach(player => {
                player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));
                player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));
            });
        });

        // Modificação no window.onload para mostrar a tela de título primeiro
        window.onload = () => {
            console.log('Window loaded. Showing title screen.');
            showTitleScreen();
            // Ensure initial volume is set for all audio elements
            const initialVolume = musicVolumeSlider.value;
            mainMenuMusic.volume = initialVolume;
            gameMusic.volume = initialVolume;
            gameOverMusic.volume = initialVolume;
            // Also update button states initially
            updateMusicButtonsState();
        };