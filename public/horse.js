// public/horse.js

export class PlayerHorse {
    constructor(track, laneNumber = 3) {
        // Track reference
        this.track = track;
        this.laneNumber = laneNumber;
        
        // Position and movement
        this.distance = 0;           // Distance traveled along track
        this.x = 0;                  // X coordinate on canvas
        this.y = 0;                  // Y coordinate on canvas
        this.angle = 0;              // Direction horse is facing
        
        // Speed properties
        this.speed = 0;              // Current speed
        this.maxSpeed = 500;         // Maximum normal speed
        this.boostMaxSpeed = 700;    // Maximum speed when boosting
        this.acceleration = 200;     // Acceleration rate (units per second²)
        this.deceleration = 300;     // Deceleration rate when not accelerating
        
        // Stamina system
        this.stamina = 100;          // Current stamina (0-100)
        this.maxStamina = 100;       // Maximum stamina
        this.staminaDrainRate = 25;  // Stamina drain per second when boosting
        this.staminaRecoveryRate = 10; // Stamina recovery per second when not boosting
        
        // Race state
        this.finished = false;       // Whether horse has finished the race
        this.finishLineY = 0;        // Y position of finish line (set during reset)
        
        // Visual properties
        this.width = 30;
        this.height = 60;
        this.color = '#FF5733';      // Horse color
        
        // Initialize position
        this.reset();
    }
    
    reset() {
        this.distance = 0;
        this.speed = 0;
        this.stamina = this.maxStamina;
        this.finished = false;
        
        // Position horse at start line
        const startPosition = this.track.getTrackPosition(0, this.laneNumber);
        this.x = startPosition.x;
        this.y = startPosition.y;
        this.angle = startPosition.angle;
        
        // Get finish line position for later reference
        const finishPosition = this.track.getTrackPosition(0, this.laneNumber);
        this.finishLineY = finishPosition.y;
    }
    
    update(deltaTime, inputState) {
        if (this.finished) return;
        
        // Handle input and update speed
        this.handleInput(deltaTime, inputState);
        
        // Update position based on speed
        this.updatePosition(deltaTime);
        
        // Check if race is finished
        this.checkRaceCompletion();
    }
    
    handleInput(deltaTime, inputState) {
        // Handle acceleration
        if (inputState.forward) {
            // Determine max speed based on boost state
            const currentMaxSpeed = inputState.boost && this.stamina > 0 
                ? this.boostMaxSpeed 
                : this.maxSpeed;
            
            // Accelerate
            this.speed += this.acceleration * deltaTime;
            
            // Cap speed at max
            if (this.speed > currentMaxSpeed) {
                this.speed = currentMaxSpeed;
            }
            
            // Handle boost stamina drain
            if (inputState.boost && this.stamina > 0) {
                this.stamina -= this.staminaDrainRate * deltaTime;
                if (this.stamina < 0) this.stamina = 0;
            }
        } else {
            // Decelerate when not accelerating
            this.speed -= this.deceleration * deltaTime;
            if (this.speed < 0) this.speed = 0;
            
            // Recover stamina when not boosting
            if (!inputState.boost) {
                this.stamina += this.staminaRecoveryRate * deltaTime;
                if (this.stamina > this.maxStamina) this.stamina = this.maxStamina;
            }
        }
        
        // Recover stamina when not boosting (even when accelerating)
        if (!inputState.boost) {
            this.stamina += this.staminaRecoveryRate * deltaTime;
            if (this.stamina > this.maxStamina) this.stamina = this.maxStamina;
        }
    }
    
    updatePosition(deltaTime) {
        // Update distance based on speed
        this.distance += this.speed * deltaTime;
        
        // Get new position from track based on distance
        const position = this.track.getTrackPosition(this.distance, this.laneNumber);
        this.x = position.x;
        this.y = position.y;
        this.angle = position.angle;
    }
    
    checkRaceCompletion() {
        // Check if we've completed at least one lap and are crossing finish line
        if (this.distance >= this.track.totalLength) {
            this.finished = true;
        }
    }
    
    render(ctx) {
        ctx.save();
        
        // Move to horse position and rotate
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle + Math.PI/2); // Add 90 degrees to face direction of travel
        
        // Draw horse (simple rectangle for now)
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
        
        // Draw direction indicator (front of horse)
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.moveTo(0, -this.height/2);
        ctx.lineTo(-this.width/4, -this.height/2 - 10);
        ctx.lineTo(this.width/4, -this.height/2 - 10);
        ctx.closePath();
        ctx.fill();
        
        // Draw boost effect when boosting and has stamina
        if (this.speed > this.maxSpeed && this.stamina > 0) {
            ctx.fillStyle = 'rgba(255, 255, 0, 0.7)';
            ctx.beginPath();
            ctx.moveTo(-this.width/3, this.height/2);
            ctx.lineTo(0, this.height/2 + 20);
            ctx.lineTo(this.width/3, this.height/2);
            ctx.closePath();
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    // Helper method to get race progress as percentage (0-1)
    get trackProgress() {
        return this.distance / this.track.totalLength;
    }
    
    // Check if horse has finished the race
    hasFinishedRace() {
        return this.finished;
    }
    
    // Set the track this horse runs on (useful for track changes)
    setTrack(track) {
        this.track = track;
        this.reset();
    }
    
    // Change lane
    changeLane(newLane) {
        this.laneNumber = newLane;
        // Recalculate position based on new lane
        const position = this.track.getTrackPosition(this.distance, this.laneNumber);
        this.x = position.x;
        this.y = position.y;
    }
}
