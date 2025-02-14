import GameEnv from './GameEnv.js';
import PlayerBase from './PlayerBase.js';
import GameControl from './GameControl.js';
import hpBar from './hpBar.js';
import GameLevel from './GameLevel.js';


/**
 * @class PlayerHills class
 * @description PlayerHills.js key objective is to eent the user-controlled character in the game.
 *
 * The Player class extends the Character class, which in turn extends the GameObject class.
 * Animations and events are activated by key presses, collisions, and gravity.
 * WASD keys are used by user to control The Player object.
 *
 * @extends PlayerBase
 */
export class PlayerGreece extends PlayerBase {
    /** GameObject instantiation: constructor for PlayerHills object
     * @extends Character
     * @param {HTMLCanvasElement} canvas - The canvas element to draw the player on.
     * @param {HTMLImageElement} image - The image to draw the player with.
     * @param {Object} data - The data object containing the player's properties.
     */
    constructor(canvas, image, data) {
        super(canvas, image, data);
        // Goomba variables, deprecate?
        this.timer = false;
        GameEnv.invincible = false; // Player is not invincible
        //Hp Bar
        this.maxHp = 70; // Maximum health points
        this.currentHp = 70; // Current health points
        this.hpBar = new hpBar(100, 15, this.canvasWidth, this.canvasHeight, this.maxHp, this.currentHp, this.x, this.y)
    }
    /**
     * @override
     * gameLoop helper: Update Player jump height, replaces PlayerBase updateJump using settings from GameEnv
     */
    updateJump() {
        let jumpHeightFactor;
        if (GameEnv.difficulty === "easy") {
            jumpHeightFactor = 0.25;
        } else if (GameEnv.difficulty === "normal") {
            jumpHeightFactor = 0.20;
        } else {
            jumpHeightFactor = 0.15;    
        }
        this.setY(this.y - (this.bottom * jumpHeightFactor));
    }

    /**
     * @override
     * gameLoop: Watch for Player collision events
     */
    handleCollisionStart() {
        super.handleCollisionStart(); // calls the super class method
        // adds additional collision events
        this.handleCollisionEvent("minifinishline");
        this.handleCollisionEvent("finishline");
        this.handleCollisionEvent("cerberus");
        this.handleCollisionEvent("flyingIsland");
        this.handleCollisionEvent("lava");
    }
    update() {
        // player methods
        this.updateAnimation();
        this.updateMovement();
        this.hpBar.updateHpBar(this.currentHp, this.x, this.y, this.canvasWidth, this.canvasHeight)
        // super actions need to be after; this is to preserve player order of operations
        super.update();
    }
    /**
     * @override
     * gameloop: Handles additional Player reaction / state updates to the collision for game level
     */
    handlePlayerReaction() {
        super.handlePlayerReaction(); // calls the super class method
        // handles additional player reactions
        switch (this.state.collision) {
            case "minifinishline":
                // 1. Caught in finishline
                if (this.collisionData.touchPoints.this.onTopofOther  || this.state.isFinishing ) {
                    // Position player in the center of the finishline 
                    this.x = this.collisionData.newX;
                    this.state.movement = { up: false, down: false, left: false, right: false, falling: false};
                    this.state.isFinishing = true;
                    this.gravityEnabled = true;
                    // Using natural gravity wait for player to reach floor
                    if (Math.abs(this.y - this.bottom) <= GameEnv.gravity) {
                        const indexMini = GameEnv.levels.findIndex(level => level.tag === "Greece Lava")
                        GameControl.transitionToLevel(GameEnv.levels[indexMini]);
                        //console.log(indexMini)  
                        // Force end of level condition
                        // this.x = GameEnv.innerWidth + 1;
                        return
                    }
                // 2. Collision between player right and finishline   
                } else if (this.collisionData.touchPoints.this.right) {
                    this.state.movement.right = false;
                    this.state.movement.left = true;
                // 3. Collision between player left and finishline
                } else if (this.collisionData.touchPoints.this.left) {
                    this.state.movement.left = false;
                    this.state.movement.right = true;
                }
                break;
            case "finishline":
                console.log("finish line checks")
                        for (let obj of GameEnv.gameObjects) {
                        if (obj.jsonifiedElement.id === "coin") {
                            console.log("coin not collected not advancing to next lvl")
                            return;
                        }
                }
                  console.log("player has item to exit lvl")
                //FindNextLevelID(this.jsonifiedElement.tag)//the input is the current level tag

                // Transition to the next level when touching the flag
                const index = FindNextLevelID(this.jsonifiedElement.tag)//the input is the current level tag
                GameControl.transitionToLevel(GameEnv.levels[index]);
                break;
            case "cerberus": // Note: Goomba.js and Player.js could be refactored
                // 1. Player jumps on goomba, interaction with Goomba.js
                if (this.collisionData.touchPoints.this.top && this.collisionData.touchPoints.other.bottom && this.state.isDying == false) {
                    // GoombaBounce deals with player.js and goomba.js
                    if (GameEnv.goombaBounce === true) {
                        GameEnv.goombaBounce = false;
                        this.y = this.y - 100;
                    }
                    if (GameEnv.goombaBounce1 === true) {
                        GameEnv.goombaBounce1 = false;
                        this.y = this.y - 250
                    }
                // 2. Player touches goomba sides of goomba
                } else if (this.collisionData.touchPoints.this.right || this.collisionData.touchPoints.this.left) {
                    if (GameEnv.difficulty === "normal" || GameEnv.difficulty === "hard") {
                        if (this.state.isDying == false) {
                            this.state.isDying = true;
                            this.canvas.style.transition = "transform 0.5s";
                            this.canvas.style.transform = "rotate(-90deg) translate(-26px, 0%)";
                            GameEnv.playSound("PlayerDeath");
                            setTimeout(async() => {
                                await GameControl.transitionToLevel(GameEnv.levels[GameEnv.levels.indexOf(GameEnv.currentLevel)]);
                            }, 900);
                        }
                    } else if (GameEnv.difficulty === "easy" && this.collisionData.touchPoints.this.right) {
                        this.x -= 20;
                    } else if (GameEnv.difficulty === "easy" && this.collisionData.touchPoints.this.left) {
                       this.x += 20;
                    }
                }
                break;
                case "lava": // Note: Goomba.js and Player.js could be refactored

                if (this.collisionData.touchPoints.other.id === "lava") {
                    if (GameEnv.difficulty === "normal" || GameEnv.difficulty === "hard") {
                        if (this.state.isDying == false) {
                            this.setY(this.y - (this.bottom * 0.6));
                            this.currentHp -= 60;
                            this.hpBar.updateHpBar(this.currentHp, this.x, this.y, this.canvasWidth, this.canvasHeight)
                            if(this.currentHp == 0 || this.currentHp < 0){///death of the player
                                this.hpBar.updateHpBar(this.currentHp, this.x, this.y, this.canvasWidth, this.canvasHeight)
                                this.state.isDying = true;
                                this.canvas.style.transition = "transform 0.5s";
                                this.canvas.style.transform = "rotate(-90deg) translate(-26px, 0%)";
                                GameEnv.playSound("PlayerDeath");
                                GameControl.transitionToLevel(GameEnv.levels[GameEnv.levels.indexOf(GameEnv.currentLevel)]);
                                console.log(GameEnv.gameObjects)
                            }
                        }
                    } else if (GameEnv.difficulty === "easy" && this.collisionData.touchPoints.this.right) {
                        this.x -= 10;
                    } else if (GameEnv.difficulty === "easy" && this.collisionData.touchPoints.this.left) {
                       this.x += 10;
                    }
                }
                break;
                case "flyingIsland":
                    // Player is on top of the island
                    if (this.collisionData.touchPoints.this.onTopofOther) {
                        this.state.movement = { up: false, down: false, left: true, right: true, falling: false};
                        this.gravityEnabled = false;
                    // Player is touching the wall with right side
                    } else if (this.collisionData.touchPoints.this.right) {
                        this.state.movement = { up: false, down: false, left: true, right: false, falling: false};
                        this.y -= 4;
                    // Player is touching the wall with left side
                    } else if (this.collisionData.touchPoints.this.left) {
                        this.state.movement = { up: false, down: false, left: false, right: true, falling: false};
                        this.y -= 4;
                    }
                break;
        }
    }
}


function FindNextLevelID(currentLvlTag) {
    let nextLvlIndex = 1;// this is a default value if the level tag is not found
    let NextLvl = null
    for(let i = 0; i < GameEnv.levels.length; i++){
        if(GameEnv.levels[i].tag == currentLvlTag){
            function checkLoop(){
                if(i + 1 < GameEnv.levels.length){
                    NextLvl = GameEnv.levels[i + 1];
                    //console.log(NextLvl)
                    //console.log(NextLvl.subLvl)
    
                    if(NextLvl.subLvl == false){
                        nextLvlIndex = i + 1;
                    }else{
                        i++;
                        checkLoop()
                    }
                }
            }
            checkLoop()
        }
    }
    return nextLvlIndex //retuens the index of the next level wich is a number value
}

export default PlayerGreece;