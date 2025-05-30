// public/ai.js

import { PlayerHorse } from './horse.js';

// AIHorse extends PlayerHorse but simulates AI input
class AIHorse extends PlayerHorse {
    constructor(track, laneNumber, color, difficulty = 1.0) {
        super(track, laneNumber);
        
        // Override color with provided color
        this.color = color;
        
        // AI specific properties
        this.difficulty = difficulty; // 0.5 (easy) to 1.5 (hard)
        
        // Randomize horse characteristics based on difficulty
        this.maxSpeed = 400 + Math.random() * 200 * difficulty; // 400-600 base, adjusted by difficulty
        this.boostMaxSpeed = this.maxSpeed * 1.4;
        this.acceleration = 180 + Math.random() * 40 * difficulty;
        
        // AI behavior properties
        this.boostProbability = 0.01 + (Math.random() * 0.03 * difficulty); // Chance to start boost per frame
        this.boostDuration = 1 + Math.random() * 3; // How long boost lasts (seconds)
        this.boostTimer = 0; // Current boost timer
        this.isBoosting = false;
        
        // Strategic boosting
        this.strategicBoostPoints = [
            0.3 + Math.random() * 0.1,  // First strategic boost point (30-40% of race)
            0.7 + Math.random() * 0.1   // Second strategic boost point (70-80% of race)
        ];
        this.usedStrategicBoosts = [false, false];
        
        // Race strategy
        this.conserveStaminaThreshold = 30 + Math.random() * 40; // Won't boost below this stamina unless near finish
    }
    
    update(deltaTime) {
        // Simulate AI input
        const inputState = this.determineInputState(deltaTime);
        
        // Use parent update method with simulated input
        super.update(deltaTime, inputState);
    }
    
    determineInputState(deltaTime) {
        // AI always moves forward
        const inputState = {
            forward: true,
            boost: false
        };
        
        // Update boost timer if currently boosting
        if (this.isBoosting) {
            this.boostTimer -= deltaTime;
            if (this.boostTimer <= 0) {
                this.isBoosting = false;
            } else {
                inputState.boost = true;
            }
        }
        
        // Don't boost if stamina is too low (unless near finish line)
        const nearFinish = this.trackProgress > 0.85;
        if (this.stamina < this.conserveStaminaThreshold && !nearFinish) {
            return inputState;
        }
        
        // Strategic boosting at certain points of the race
        for (let i = 0; i < this.strategicBoostPoints.length; i++) {
            if (!this.usedStrategicBoosts[i] && 
                this.trackProgress >= this.strategicBoostPoints[i] && 
                this.trackProgress <= this.strategicBoostPoints[i] + 0.1 &&
                this.stamina > 40) {
                
                this.isBoosting = true;
                this.boostTimer = this.boostDuration;
                this.usedStrategicBoosts[i] = true;
                inputState.boost = true;
                return inputState;
            }
        }
        
        // Random boosting
        if (!this.isBoosting && 
            Math.random() < this.boostProbability * deltaTime * 60 && // Adjust for framerate
            this.stamina > 30) {
            
            this.isBoosting = true;
            this.boostTimer = this.boostDuration;
            inputState.boost = true;
        }
        
        // Always boost in final stretch if we have stamina
        if (nearFinish && this.stamina > 20) {
            inputState.boost = true;
        }
        
        return inputState;
    }
    
    reset() {
        super.reset();
        this.isBoosting = false;
        this.boostTimer = 0;
        this.usedStrategicBoosts = [false, false];
    }
}

export class AIManager {
    constructor(track, count = 5) {
        this.track = track;
        this.aiCount = count;
        this.aiHorses = [];
        
        // Horse colors - distinct for each AI
        this.colors = [
            '#3498DB', // Blue
            '#2ECC71', // Green
            '#9B59B6', // Purple
            '#F1C40F', // Yellow
            '#E74C3C', // Red
            '#1ABC9C', // Turquoise
            '#D35400'  // Orange
        ];
        
        // Create AI horses
        this.createAIHorses();
    }
    
    createAIHorses() {
        this.aiHorses = [];
        
        for (let i = 0; i < this.aiCount; i++) {
            // Assign lane (1-5, avoiding lane 3 which is typically the player's lane)
            let lane = i + 1;
            if (lane >= 3) lane++; // Skip lane 3 (player lane)
            
            // Difficulty increases slightly for each AI
            const difficulty = 0.8 + (i * 0.1);
            
            // Create AI horse with unique color and lane
            const horse = new AIHorse(
                this.track,
                lane,
                this.colors[i % this.colors.length],
                difficulty
            );
            
            this.aiHorses.push(horse);
        }
    }
    
    update(deltaTime) {
        // Update all AI horses
        for (let horse of this.aiHorses) {
            horse.update(deltaTime);
        }
    }
    
    render(ctx) {
        // Render all AI horses
        for (let horse of this.aiHorses) {
            horse.render(ctx);
        }
    }
    
    reset() {
        // Reset all AI horses
        for (let horse of this.aiHorses) {
            horse.reset();
        }
    }
    
    // Get horses that have finished the race
    getFinishedHorses() {
        return this.aiHorses.filter(horse => horse.hasFinishedRace());
    }
    
    // Get all horses sorted by progress (for placement/rankings)
    getHorsesByProgress() {
        return [...this.aiHorses].sort((a, b) => b.trackProgress - a.trackProgress);
    }
    
    // Check if all AI horses have finished
    allFinished() {
        return this.aiHorses.every(horse => horse.hasFinishedRace());
    }
    
    // Get race placement including a player horse
    getRacePlacements(playerHorse) {
        // Combine AI horses and player horse
        const allHorses = [...this.aiHorses, playerHorse];
        
        // Sort by progress in descending order
        return allHorses.sort((a, b) => {
            // If both finished, sort by who finished first
            if (a.hasFinishedRace() && b.hasFinishedRace()) {
                return a.finishTime - b.finishTime;
            }
            // If only one finished, they're ahead
            if (a.hasFinishedRace()) return -1;
            if (b.hasFinishedRace()) return 1;
            // Otherwise sort by progress
            return b.trackProgress - a.trackProgress;
        });
    }
    
    // Set track (useful when track changes)
    setTrack(track) {
        this.track = track;
        for (let horse of this.aiHorses) {
            horse.setTrack(track);
        }
    }
}
