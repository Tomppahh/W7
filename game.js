let game;

const gameOptions = {
	playerGravity: 9000,
	playerSpeed: 300,
	enemySpeed: 100,
	bulletSpeed: 600,
};

let score = 0; 
let scoreText;
let timer; 
let timerText; 
let highScore = 0; 
let gameTime = 60; 

window.onload = function () {
	let gameConfig = {
		type: Phaser.AUTO,
		backgroundColor: "rgb(0,30,100)",
		scale: {
			mode: Phaser.Scale.FIT,
			autoCenter: Phaser.Scale.CENTER_BOTH,
			width: 800,
			height: 1000,
		},
		pixelArt: true,
		physics: {
			default: "arcade",
			arcade: {
				gravity: {
					y: 0,
				},
			},
		},
		scene: PlayGame,
	};
	game = new Phaser.Game(gameConfig);
	window.focus();
};

class PlayGame extends Phaser.Scene {
	preload() {
		this.load.image("ground", "assets/platform.png");
		this.load.image("sky", "assets/sky.png");
		this.load.spritesheet("player", "assets/dude.png", {
			frameWidth: 32,
			frameHeight: 48,
		});
		this.load.image("star", "assets/star.png");
		this.load.image("bomb", "assets/bomb.png");
		this.load.image("enemy", "assets/tomppavihu.png"); 
	}

	create() {
		this.add.image(0, 0, "sky").setOrigin(0, 0);

		// Create ground platforms
		this.groupGround = this.physics.add.group({
			immovable: true,
			allowGravity: false,
		});

		this.groupGround.create(400, 568, "ground").setScale(2).refreshBody();
		this.groupGround.create(300, 450, "ground");
		this.groupGround.create(50, 250, "ground");
		this.groupGround.create(750, 220, "ground");
		this.groupGround.create(900, 80, "ground");
		this.groupGround.create(300, 150, "ground");
		this.groupGround.create(500, 320, "ground");

		// Create player
		this.player = this.physics.add.sprite(
			game.config.width / 2,
			game.config.height / 2,
			"player"
		);
		this.player.setBounce(0.5);
		this.player.body.gravity.y = gameOptions.playerGravity;

		// collider between player and ground
		this.physics.add.collider(this.player, this.groupGround);

		// winning star
		this.groupWinstar = this.physics.add.group({
			immovable: true,
			allowGravity: false,
		});
		this.groupWinstar.create(750, 50, "star");

		// score text
		scoreText = this.add.text(16, 16, "Scores: 0", {
			fontSize: "32px",
			fill: "#fff",
		});

		// timer text
		timerText = this.add.text(300, 16, "Time: 60", {
			fontSize: "32px",
			fill: "#fff",
		});

		// Handle keyboard input
		this.cursors = this.input.keyboard.createCursorKeys();
		this.jumpsMax = 2;
		this.jumpsCount = 0;

		this.spacebar = this.input.keyboard.addKey(
			Phaser.Input.Keyboard.KeyCodes.SPACE
		);

		// Create enemies
		this.enemies = this.physics.add.group({
			immovable: false,
			allowGravity: false,
		});
		this.createEnemy(740, 420);
		this.createEnemy(90, 120);
		this.createEnemy(800, 220);
		this.createEnemy(1200, 20);
		this.createEnemy(300, 290);

		// colliders for player enemies and win star
		this.physics.add.overlap(
			this.player,
			this.groupWinstar,
			this.collectStar,
			null,
			this
		);
		this.physics.add.collider(
			this.player,
			this.enemies,
			this.hitEnemy,
			null,
			this
		);

		// Start the timer
		this.startTimer();
	}

	createEnemy(x, y) {
		let enemy = this.enemies.create(x, y, "enemy");
		enemy.body.velocity.x = gameOptions.enemySpeed; // Move the enemy to the right
		enemy.setBounce(1, 0); 
		enemy.setCollideWorldBounds(true);
	}

	hitEnemy(player) {
		this.physics.pause();
		player.setTint(0xff0000); 
		this.add.text(200, 400, "Game Over!", {
			fontSize: "32px",
			fill: "rgb(255,255,255)",
		});

		let playAgainBg = this.add.graphics();
		playAgainBg.fillStyle(0x000000, 0.7); 
		playAgainBg.fillRect(100, 350, 600, 200);

		// Add 'Yes' and 'No' text options
		let yesText = this.add
			.text(200, 450, "Yes", {
				fontSize: "32px",
				fill: "rgb(255,255,255)",
			})
			.setInteractive();
		let noText = this.add
			.text(400, 450, "No", {
				fontSize: "32px",
				fill: "rgb(255,255,255)",
			})
			.setInteractive();

		// Update high score 
		if (score > highScore) {
			highScore = score; // Update high score
		}

		// Show thanks for playing and high score after 2 seconds
		yesText.on("pointerdown", () => {
			this.scene.restart(); 
		});

		noText.on("pointerdown", () => {
			this.add
				.text(150, 700, "Thanks for playing!", {
					fontSize: "48px",
					fill: "#fff",
				})
				.setOrigin(0, 0); 
			this.add
				.text(150, 760, "Your High Score: " + highScore, {
					fontSize: "32px",
					fill: "#fff",
				})
				.setOrigin(0, 0); 
			setTimeout(() => {
				this.scene.stop();
			}, 2000); // Wait for 2 seconds before stopping the game
		});
	}

	startTimer() {
		timer = gameTime; // Reset timer to game time
		timerText.setText("Time: " + timer);

		this.time.addEvent({
			delay: 1000,
			callback: () => {
				timer--;
				timerText.setText("Time: " + timer);
				if (timer <= 0) {
					this.endGame();
				}
			},
			callbackScope: this,
			loop: true,
		});
	}

	// collect star
	collectStar(player, star) {
		if (star) {
			star.destroy(); // Remove the star
			score += 1; // Increase the score by 1
			scoreText.setText("Scores: " + score); // Update the score display

			// Reset player's position
			this.player.setPosition(
				game.config.width / 2,
				game.config.height / 2
			); 
			this.player.setVelocity(0); // Reset player's velocity
			this.createStar(); // Create a new star
		}
	}

	
	createStar() {
		// code to make sure stars spawn on platforms
		const platforms = this.groupGround.getChildren();

		if (platforms.length > 0) {
			// Choose a random platform
			const randomPlatform = Phaser.Math.RND.pick(platforms);

			// Calculate the star's position (on top of the platform)
			const starX = randomPlatform.x; 
			const starY =
				randomPlatform.y - randomPlatform.displayHeight / 2 - 16; 

			this.groupWinstar.create(starX, starY, "star");
		}
	}

	
	endGame() {
		this.physics.pause(); 
	
		if (score > highScore) {
			highScore = score; 
			this.add.text(200, 350, "New High Score: " + highScore, {
				fontSize: "32px",
				fill: "#fff",
			});
		}

		this.add.text(200, 400, "Game Over! Play Again?", {
			fontSize: "32px",
			fill: "rgb(255,255,255)",
		});

		let playAgainBg = this.add.graphics();
		playAgainBg.fillStyle(0x000000, 0.7); 
		playAgainBg.fillRect(100, 350, 600, 200);

		// Add yes no
		let yesText = this.add
			.text(200, 450, "Yes", {
				fontSize: "32px",
				fill: "rgb(255,255,255)",
			})
			.setInteractive();
		let noText = this.add
			.text(400, 450, "No", {
				fontSize: "32px",
				fill: "rgb(255,255,255)",
			})
			.setInteractive();

		yesText.on("pointerdown", () => {
			this.scene.restart(); // if yes ressu
		});

		noText.on("pointerdown", () => {
			this.add
				.text(150, 700, "Thanks for playing!", {
					fontSize: "48px",
					fill: "#fff",
				})
				.setOrigin(0, 0);
			setTimeout(() => {
				this.playAgainBg.clear();
				this.scene.stop();
			}, 2000);
		});
	}

	jumpFunction() {
		if (this.player.body.onFloor()) {
			this.jumpsCount = 0;
		}

		if (this.jumpsCount === 0) {
			this.player.setVelocityY(-1600);
			this.jumpsCount = 1;
		} else if (this.jumpsCount === 1) {
			this.player.setVelocityY(-1200);
			this.jumpsCount = 2;
		}
	}

	update() {
		if (this.cursors.left.isDown) {
			this.player.body.velocity.x = -gameOptions.playerSpeed;
		} else if (this.cursors.right.isDown) {
			this.player.body.velocity.x = gameOptions.playerSpeed;
		} else {
			this.player.body.velocity.x = 0;
		}

		if (Phaser.Input.Keyboard.JustDown(this.spacebar)) {
			this.jumpFunction();
		}

		// Move enemies
		this.enemies.children.iterate(function (enemy) {
			if (enemy.body.velocity.x === 0) {
				enemy.body.velocity.x = gameOptions.enemySpeed;
			}
		});
	}
}
