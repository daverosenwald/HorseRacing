// public/ui/hud.js

export class HUD {
    constructor() {
        // HUD styling properties
        this.padding = 20;
        this.barHeight = 15;
        this.barWidth = 200;
        this.cornerRadius = 5;
        this.spacing = 10;
        this.fontSize = 16;
        this.fontFamily = 'Arial, sans-serif';
        
        // Colors
        this.colors = {
            background: 'rgba(0, 0, 0, 0.5)',
            text: '#FFFFFF',
            staminaFull: '#32CD32',  // Green
            staminaLow: '#FF0000',   // Red
            staminaBg: '#333333',    // Dark gray
            progressFill: '#3498DB', // Blue
            progressBg: '#333333',   // Dark gray
            boostFlame: '#FF9900'    // Orange
        };
    }
    
    render(ctx, playerHorse) {
        // Save context to restore later
        ctx.save();
        
        // Reset transformation to ensure HUD is in screen space
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        // Get canvas dimensions
        const canvasWidth = ctx.canvas.width;
        const canvasHeight = ctx.canvas.height;
        
        // Draw HUD background
        this.drawHUDBackground(ctx);
        
        // Current Y position for drawing elements
        let y = this.padding;
        
        // Draw stamina bar
        this.drawStaminaBar(ctx, playerHorse.stamina, playerHorse.maxStamina, this.padding, y);
        y += this.barHeight + this.spacing;
        
        // Draw speed indicator
        this.drawSpeedIndicator(ctx, playerHorse.speed, this.padding, y);
        y += this.fontSize + this.spacing;
        
        // Draw race progress bar (at bottom of screen)
        this.drawProgressBar(ctx, playerHorse.trackProgress, canvasWidth, canvasHeight);
        
        // Draw boost indicator if boosting
        if (playerHorse.speed > playerHorse.maxSpeed && playerHorse.stamina > 0) {
            this.drawBoostIndicator(ctx, this.padding + this.barWidth + this.spacing, this.padding);
        }
        
        // Restore context
        ctx.restore();
    }
    
    drawHUDBackground(ctx) {
        ctx.fillStyle = this.colors.background;
        this.roundRect(
            ctx, 
            this.padding - 10, 
            this.padding - 10, 
            this.barWidth + 20, 
            this.barHeight * 2 + this.fontSize + this.spacing * 2 + 20,
            this.cornerRadius
        );
        ctx.fill();
    }
    
    drawStaminaBar(ctx, stamina, maxStamina, x, y) {
        // Draw label
        ctx.font = `${this.fontSize}px ${this.fontFamily}`;
        ctx.fillStyle = this.colors.text;
        ctx.fillText('Stamina', x, y - 5);
        
        // Draw background
        ctx.fillStyle = this.colors.staminaBg;
        this.roundRect(ctx, x, y, this.barWidth, this.barHeight, this.cornerRadius);
        ctx.fill();
        
        // Calculate fill width
        const fillWidth = (stamina / maxStamina) * this.barWidth;
        
        // Determine color based on stamina level
        const ratio = stamina / maxStamina;
        if (ratio <= 0.3) {
            ctx.fillStyle = this.colors.staminaLow;
        } else {
            ctx.fillStyle = this.colors.staminaFull;
        }
        
        // Draw fill
        if (fillWidth > 0) {
            this.roundRect(ctx, x, y, fillWidth, this.barHeight, this.cornerRadius);
            ctx.fill();
        }
        
        // Draw stamina text
        ctx.fillStyle = this.colors.text;
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.floor(stamina)}%`, x + this.barWidth / 2, y + this.barHeight / 2 + 5);
        ctx.textAlign = 'left';
    }
    
    drawSpeedIndicator(ctx, speed, x, y) {
        // Format speed
        const speedText = `Speed: ${Math.floor(speed)} px/s`;
        
        // Draw speed text
        ctx.font = `${this.fontSize}px ${this.fontFamily}`;
        ctx.fillStyle = this.colors.text;
        ctx.fillText(speedText, x, y + this.fontSize);
    }
    
    drawProgressBar(ctx, progress, canvasWidth, canvasHeight) {
        // Position at bottom of screen
        const y = canvasHeight - this.padding - this.barHeight;
        const x = this.padding;
        const width = canvasWidth - (this.padding * 2);
        
        // Draw background
        ctx.fillStyle = this.colors.progressBg;
        this.roundRect(ctx, x, y, width, this.barHeight, this.cornerRadius);
        ctx.fill();
        
        // Calculate fill width
        const fillWidth = progress * width;
        
        // Draw fill
        if (fillWidth > 0) {
            ctx.fillStyle = this.colors.progressFill;
            this.roundRect(ctx, x, y, fillWidth, this.barHeight, this.cornerRadius);
            ctx.fill();
        }
        
        // Draw progress text
        ctx.fillStyle = this.colors.text;
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.floor(progress * 100)}%`, x + width / 2, y + this.barHeight / 2 + 5);
        ctx.textAlign = 'left';
    }
    
    drawBoostIndicator(ctx, x, y) {
        // Draw a simple flame icon
        ctx.fillStyle = this.colors.boostFlame;
        
        // Flame base
        ctx.beginPath();
        ctx.moveTo(x, y + 30);
        ctx.quadraticCurveTo(x - 5, y + 20, x, y + 15);
        ctx.quadraticCurveTo(x + 5, y + 5, x + 10, y + 10);
        ctx.quadraticCurveTo(x + 15, y + 5, x + 20, y + 15);
        ctx.quadraticCurveTo(x + 25, y + 20, x + 20, y + 30);
        ctx.closePath();
        ctx.fill();
        
        // Flame inner (lighter color)
        ctx.fillStyle = '#FFCC00';
        ctx.beginPath();
        ctx.moveTo(x + 10, y + 30);
        ctx.quadraticCurveTo(x + 5, y + 20, x + 10, y + 15);
        ctx.quadraticCurveTo(x + 15, y + 10, x + 20, y + 20);
        ctx.quadraticCurveTo(x + 15, y + 25, x + 10, y + 30);
        ctx.closePath();
        ctx.fill();
        
        // Draw "BOOST" text
        ctx.fillStyle = this.colors.text;
        ctx.font = `bold ${this.fontSize}px ${this.fontFamily}`;
        ctx.fillText('BOOST!', x + 30, y + 20);
    }
    
    // Helper method to draw rounded rectangles
    roundRect(ctx, x, y, width, height, radius) {
        if (width < 2 * radius) radius = width / 2;
        if (height < 2 * radius) radius = height / 2;
        
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.arcTo(x + width, y, x + width, y + height, radius);
        ctx.arcTo(x + width, y + height, x, y + height, radius);
        ctx.arcTo(x, y + height, x, y, radius);
        ctx.arcTo(x, y, x + width, y, radius);
        ctx.closePath();
    }
}
