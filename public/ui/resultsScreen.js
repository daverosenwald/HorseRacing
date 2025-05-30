// public/ui/resultsScreen.js

export class ResultsScreen {
    constructor() {
        // Styling properties
        this.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        this.textColor = '#FFFFFF';
        this.playerHighlightColor = '#FFD700'; // Gold
        this.titleFont = 'bold 48px Arial, sans-serif';
        this.subtitleFont = 'bold 32px Arial, sans-serif';
        this.placementFont = 'bold 24px Arial, sans-serif';
        this.buttonFont = 'bold 28px Arial, sans-serif';
        
        // Button properties
        this.buttonWidth = 200;
        this.buttonHeight = 60;
        this.buttonColor = '#3498DB';
        this.buttonHoverColor = '#2980B9';
        this.buttonTextColor = '#FFFFFF';
        this.buttonCornerRadius = 10;
        
        // Layout properties
        this.titlePadding = 80;
        this.placementSpacing = 50;
        this.placementStartY = 220;
    }
    
    render(ctx, placements) {
        const canvasWidth = ctx.canvas.width;
        const canvasHeight = ctx.canvas.height;
        
        // Save context state
        ctx.save();
        
        // Reset any transformations to ensure overlay is in screen space
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        // Draw background overlay
        this.drawBackground(ctx, canvasWidth, canvasHeight);
        
        // Draw title
        this.drawTitle(ctx, canvasWidth);
        
        // Draw placements
        this.drawPlacements(ctx, placements, canvasWidth);
        
        // Draw restart button
        this.drawRestartButton(ctx, canvasWidth, canvasHeight);
        
        // Restore context state
        ctx.restore();
    }
    
    drawBackground(ctx, width, height) {
        ctx.fillStyle = this.backgroundColor;
        ctx.fillRect(0, 0, width, height);
        
        // Add decorative elements
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 5;
        
        // Top and bottom borders
        ctx.beginPath();
        ctx.moveTo(50, 50);
        ctx.lineTo(width - 50, 50);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(50, height - 50);
        ctx.lineTo(width - 50, height - 50);
        ctx.stroke();
    }
    
    drawTitle(ctx, width) {
        // Draw main title
        ctx.font = this.titleFont;
        ctx.fillStyle = this.textColor;
        ctx.textAlign = 'center';
        ctx.fillText('Race Results', width / 2, this.titlePadding);
        
        // Draw subtitle
        ctx.font = this.subtitleFont;
        ctx.fillText('Final Standings', width / 2, this.titlePadding + 60);
    }
    
    drawPlacements(ctx, placements, width) {
        const centerX = width / 2;
        let y = this.placementStartY;
        
        // Sort placements by place (just to be sure)
        const sortedPlacements = [...placements].sort((a, b) => a.place - b.place);
        
        // Draw each placement
        sortedPlacements.forEach((horse, index) => {
            const isPlayer = horse.name === 'You';
            
            // Set styles based on whether this is the player
            if (isPlayer) {
                ctx.fillStyle = this.playerHighlightColor;
                ctx.font = `bold ${parseInt(this.placementFont) + 4}px Arial, sans-serif`;
            } else {
                ctx.fillStyle = this.textColor;
                ctx.font = this.placementFont;
            }
            
            // Draw place number with ordinal suffix
            const placeText = `${horse.place}${this.getOrdinalSuffix(horse.place)}`;
            ctx.textAlign = 'right';
            ctx.fillText(placeText, centerX - 50, y);
            
            // Draw colored horse indicator
            ctx.fillStyle = horse.color;
            this.drawHorseIndicator(ctx, centerX - 30, y - 15, 30, 30);
            
            // Draw name
            ctx.fillStyle = isPlayer ? this.playerHighlightColor : this.textColor;
            ctx.textAlign = 'left';
            ctx.fillText(horse.name, centerX + 20, y);
            
            // Add a special indicator for the player
            if (isPlayer) {
                ctx.fillText('★', centerX - 80, y);
            }
            
            // Move to next placement position
            y += this.placementSpacing;
        });
    }
    
    drawHorseIndicator(ctx, x, y, width, height) {
        // Draw a simple horse silhouette or just a colored rectangle
        ctx.fillRect(x, y, width, height);
        
        // Add a border
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
    }
    
    drawRestartButton(ctx, width, height) {
        const buttonX = width / 2 - this.buttonWidth / 2;
        const buttonY = height - 150;
        
        // Draw button background
        ctx.fillStyle = this.buttonColor;
        this.roundRect(
            ctx, 
            buttonX, 
            buttonY, 
            this.buttonWidth, 
            this.buttonHeight, 
            this.buttonCornerRadius
        );
        ctx.fill();
        
        // Draw button border
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        this.roundRect(
            ctx, 
            buttonX, 
            buttonY, 
            this.buttonWidth, 
            this.buttonHeight, 
            this.buttonCornerRadius
        );
        ctx.stroke();
        
        // Draw button text
        ctx.font = this.buttonFont;
        ctx.fillStyle = this.buttonTextColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Play Again', width / 2, buttonY + this.buttonHeight / 2);
        
        // Reset text baseline
        ctx.textBaseline = 'alphabetic';
    }
    
    // Helper method to get ordinal suffix (1st, 2nd, 3rd, etc.)
    getOrdinalSuffix(num) {
        const j = num % 10;
        const k = num % 100;
        
        if (j === 1 && k !== 11) {
            return 'st';
        }
        if (j === 2 && k !== 12) {
            return 'nd';
        }
        if (j === 3 && k !== 13) {
            return 'rd';
        }
        return 'th';
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
