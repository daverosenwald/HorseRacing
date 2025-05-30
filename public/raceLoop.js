// public/raceLoop.js

import { Track } from './track.js';
import { PlayerHorse } from './horse.js';
import { AIManager } from './ai.js';
import { InputHandler } from './playerControls.js';
import { HUD } from './ui/hud.js';
import { ResultsScreen } from './ui/resultsScreen.js';

// Game states
const GAME_STATE = {
    LOADING: 'loading',
    MENU: 'menu',
    COUNTDOWN: 'countdown',
    RACING: 'racing',
    FINISHED: 'finished'
};

export class RaceGame {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Initialize game state
        this.gameState = GAME_STATE.LOADING;
        
        // Initialize game components
        this.track = new Track(canvas);
        this.playerHorse = new PlayerHorse(this.track, 3); // Player in lane 3
        this.aiManager = new AIManager(this.track, 5); // 5 AI horses
        this.inputHandler = new InputHandler();
        this.hud = new HUD();
        this.resultsScreen = new ResultsScreen();
        this.finalPlacements = [];
        
        // Set player horse as track's follow target
        this.track.setFollowTarget(this.playerHorse);
        
        // Game timing
        this.lastTimestamp = 0;
        this.countdownTime = 3; // 3 seconds countdown
        this.countdownTimer = this.countdownTime;
        
        // Bind methods
        this.gameLoop = this.gameLoop.bind(this);
        this.handleResize = this.handleResize.bind(this);
        
        // Add event listeners
        window.addEventListener('resize', this.handleResize);
        
        // Start the game loop
        this.init();
    }
    
    init() {
        // Initialize game
        this.reset();
        
        // Start with loading state
        this.gameState = GAME_STATE.MENU;
        
        // Start game loop
        requestAnimationFrame(this.gameLoop);
    }
    
    reset() {
        // Reset game components
        this.track.handleResize(this.canvas);
        this.playerHorse.reset();
        this.aiManager.reset();
        
        // Reset game state
        this.gameState = GAME_STATE.MENU;
        this.countdownTimer = this.countdownTime;
        this.finalPlacements = [];
        this.resultsScreen.visible = false;
    }
    
    handleResize() {
        // Adjust canvas size
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        // Update track dimensions
        this.track.handleResize(this.canvas);
    }
    
    gameLoop(timestamp) {
        // Calculate delta time
        const deltaTime = (timestamp - this.lastTimestamp) / 1000;
        this.lastTimestamp = timestamp;
        
        // Cap delta time to prevent large jumps
        const cappedDeltaTime = Math.min(deltaTime, 0.1);
        
        // Update and render based on game state
        this.update(cappedDeltaTime);
        this.render();
        
        // Continue game loop
        requestAnimationFrame(this.gameLoop);
    }
    
    update(deltaTime) {
        switch (this.gameState) {
            case GAME_STATE.LOADING:
                // Handle loading logic (assets, etc.)
                this.gameState = GAME_STATE.MENU;
                break;
                
            case GAME_STATE.MENU:
                // Handle menu logic
                if (this.inputHandler.getInputState().forward) {
                    this.gameState = GAME_STATE.COUNTDOWN;
                }
                break;
                
            case GAME_STATE.COUNTDOWN:
                // Update countdown timer
                this.countdownTimer -= deltaTime;
                if (this.countdownTimer <= 0) {
                    this.gameState = GAME_STATE.RACING;
                }
                break;
                
            case GAME_STATE.RACING:
                // Update track
                this.track.update(deltaTime);
                
                // Get input state for player
                const inputState = this.inputHandler.getInputState();
                
                // Update player horse
                this.playerHorse.update(deltaTime, inputState);
                
                // Update AI horses
                this.aiManager.update(deltaTime);
                
                // Check if player has finished
                if (this.playerHorse.hasFinishedRace() && !this.resultsScreen.visible) {
                    const allHorses = [this.playerHorse, ...this.aiManager.aiHorses];
                    const placements = allHorses
                        .map((horse, index) => ({
                            name: horse === this.playerHorse ? 'You' : `AI ${index}`,
                            color: horse.color,
                            progress: horse.trackProgress
                        }))
                        .sort((a, b) => b.progress - a.progress)
                        .map((entry, i) => ({ ...entry, place: i + 1 }));

                    this.finalPlacements = placements;
                    this.resultsScreen.visible = true;
                    this.gameState = GAME_STATE.FINISHED;
                }
                
                // Check if all horses have finished
                if (this.aiManager.allFinished() && this.playerHorse.hasFinishedRace()) {
                    this.gameState = GAME_STATE.FINISHED;
                }
                break;
                
            case GAME_STATE.FINISHED:
                // Handle finished state
                if (this.inputHandler.getInputState().forward && this.resultsScreen.visible) {
                    // Restart race
                    this.reset();
                    this.gameState = GAME_STATE.COUNTDOWN;
                }
                break;
        }
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Render track (always render regardless of state)
        this.track.render(this.ctx);
        
        switch (this.gameState) {
            case GAME_STATE.LOADING:
                this.renderLoadingScreen();
                break;
                
            case GAME_STATE.MENU:
                this.renderMenu();
                break;
                
            case GAME_STATE.COUNTDOWN:
                // Render horses
                this.aiManager.render(this.ctx);
                this.playerHorse.render(this.ctx);
                
                // Render countdown
                this.renderCountdown();
                break;
                
            case GAME_STATE.RACING:
                // Render horses
                this.aiManager.render(this.ctx);
                this.playerHorse.render(this.ctx);
                
                // Render HUD
                this.hud.render(this.ctx, this.playerHorse);
                break;
                
            case GAME_STATE.FINISHED:
                // Render horses
                this.aiManager.render(this.ctx);
                this.playerHorse.render(this.ctx);
                
                // Render HUD
                this.hud.render(this.ctx, this.playerHorse);
                
                // Render results screen
                if (this.resultsScreen.visible) {
                    this.resultsScreen.render(this.ctx, this.finalPlacements);
                }
                break;
        }
    }
    
    renderLoadingScreen() {
        // Render loading screen
        this.ctx.fillStyle = 'black';
        this.ctx.font = '30px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Loading...', this.canvas.width / 2, this.canvas.height / 2);
    }
    
    renderMenu() {
        // Render menu screen
        this.ctx.fillStyle = 'black';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Horse Racing Championship', this.canvas.width / 2, this.canvas.height / 2 - 50);
        
        this.ctx.font = '24px Arial';
        this.ctx.fillText('Press UP or W to start', this.canvas.width / 2, this.canvas.height / 2 + 50);
    }
    
    renderCountdown() {
        // Render countdown
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 120px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(Math.ceil(this.countdownTimer), this.canvas.width / 2, this.canvas.height / 2);
    }
}

// Initialize game when window loads
window.addEventListener('load', () => {
    const canvas = document.getElementById('gameCanvas');
    if (canvas) {
        // Set canvas size
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        // Create game instance
        const game = new RaceGame(canvas);
    } else {
        console.error('Canvas element not found!');
    }
});
