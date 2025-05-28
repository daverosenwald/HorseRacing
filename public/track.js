// public/track.js

export class Track {
    constructor(canvas) {
        // Track dimensions and properties
        this.canvas = canvas;
        this.centerX = canvas.width / 2;
        this.centerY = canvas.height / 2;
        
        // Oval dimensions (20% inset from canvas edges)
        this.outerRadiusX = canvas.width * 0.4;
        this.outerRadiusY = canvas.height * 0.35;
        this.trackWidth = 120; // Width of the racing surface
        this.innerRadiusX = this.outerRadiusX - this.trackWidth;
        this.innerRadiusY = this.outerRadiusY - this.trackWidth;
        
        // Track appearance
        this.colors = {
            track: '#8B4513',        // Brown track surface
            innerField: '#228B22',   // Green inner field
            outerArea: '#32CD32',    // Light green outer area
            lanes: '#FFFFFF',        // White lane markings
            startFinish: '#FF0000'   // Red start/finish line
        };
        
        // Scrolling and positioning
        this.scrollX = 0;
        this.scrollY = 0;
        this.followTarget = null; // Will be set to player horse
        
        // Track length calculation (approximate oval circumference)
        this.totalLength = this.calculateTrackLength();
        
        this.setupTrack();
    }
    
    calculateTrackLength() {
        // Approximate oval circumference using Ramanujan's formula
        const a = this.outerRadiusX - this.trackWidth / 2;
        const b = this.outerRadiusY - this.trackWidth / 2;
        const h = Math.pow((a - b), 2) / Math.pow((a + b), 2);
        return Math.PI * (a + b) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)));
    }
    
    setupTrack() {
        // Initialize any track-specific setup
        this.laneCount = 6;
        this.laneSpacing = this.trackWidth / this.laneCount;
    }
    
    handleResize(canvas) {
        this.canvas = canvas;
        this.centerX = canvas.width / 2;
        this.centerY = canvas.height / 2;
        this.outerRadiusX = canvas.width * 0.4;
        this.outerRadiusY = canvas.height * 0.35;
        this.innerRadiusX = this.outerRadiusX - this.trackWidth;
        this.innerRadiusY = this.outerRadiusY - this.trackWidth;
    }
    
    update(deltaTime) {
        // Update scrolling based on follow target
        if (this.followTarget) {
            this.updateScrolling();
        }
    }
    
    updateScrolling() {
        // Smooth camera following for player horse
        const targetX = this.followTarget.x;
        const targetY = this.followTarget.y;
        
        // Calculate desired scroll position to keep player centered
        const desiredScrollX = targetX - this.canvas.width / 2;
        const desiredScrollY = targetY - this.canvas.height / 2;
        
        // Smooth scrolling with lerp
        const lerpFactor = 0.1;
        this.scrollX += (desiredScrollX - this.scrollX) * lerpFactor;
        this.scrollY += (desiredScrollY - this.scrollY) * lerpFactor;
    }
    
    render(ctx) {
        ctx.save();
        
        // Apply scrolling transformation
        ctx.translate(-this.scrollX, -this.scrollY);
        
        // Clear and fill background
        ctx.fillStyle = this.colors.outerArea;
        ctx.fillRect(
            this.scrollX - 100, 
            this.scrollY - 100, 
            this.canvas.width + 200, 
            this.canvas.height + 200
        );
        
        // Draw the track
        this.drawTrackSurface(ctx);
        this.drawLaneMarkings(ctx);
        this.drawStartFinishLine(ctx);
        this.drawInnerField(ctx);
        
        ctx.restore();
    }
    
    drawTrackSurface(ctx) {
        // Draw outer track boundary
        ctx.fillStyle = this.colors.track;
        ctx.beginPath();
        ctx.ellipse(this.centerX, this.centerY, this.outerRadiusX, this.outerRadiusY, 0, 0, 2 * Math.PI);
        ctx.fill();
    }
    
    drawInnerField(ctx) {
        // Draw inner grass field
        ctx.fillStyle = this.colors.innerField;
        ctx.beginPath();
        ctx.ellipse(this.centerX, this.centerY, this.innerRadiusX, this.innerRadiusY, 0, 0, 2 * Math.PI);
        ctx.fill();
    }
    
    drawLaneMarkings(ctx) {
        ctx.strokeStyle = this.colors.lanes;
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 10]);
        
        // Draw lane dividers
        for (let i = 1; i < this.laneCount; i++) {
            const radiusX = this.innerRadiusX + (i * this.laneSpacing);
            const radiusY = this.innerRadiusY + (i * this.laneSpacing);
            
            ctx.beginPath();
            ctx.ellipse(this.centerX, this.centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
            ctx.stroke();
        }
        
        ctx.setLineDash([]); // Reset line dash
    }
    
    drawStartFinishLine(ctx) {
        // Draw start/finish line at the bottom of the track
        ctx.strokeStyle = this.colors.startFinish;
        ctx.lineWidth = 8;
        
        // Calculate start/finish position at bottom of oval
        const angle = Math.PI / 2; // Bottom of track
        const innerX = this.centerX + this.innerRadiusX * Math.cos(angle);
        const innerY = this.centerY + this.innerRadiusY * Math.sin(angle);
        const outerX = this.centerX + this.outerRadiusX * Math.cos(angle);
        const outerY = this.centerY + this.outerRadiusY * Math.sin(angle);
        
        ctx.beginPath();
        ctx.moveTo(innerX, innerY);
        ctx.lineTo(outerX, outerY);
        ctx.stroke();
        
        // Add checkered pattern for finish line
        this.drawCheckeredFlag(ctx, innerX, innerY, outerX, outerY);
    }
    
    drawCheckeredFlag(ctx, x1, y1, x2, y2) {
        const segments = 8;
        const segmentLength = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2) / segments;
        const dx = (x2 - x1) / segments;
        const dy = (y2 - y1) / segments;
        
        ctx.lineWidth = 6;
        
        for (let i = 0; i < segments; i++) {
            ctx.strokeStyle = i % 2 === 0 ? '#FFFFFF' : '#000000';
            ctx.beginPath();
            ctx.moveTo(x1 + i * dx, y1 + i * dy);
            ctx.lineTo(x1 + (i + 1) * dx, y1 + (i + 1) * dy);
            ctx.stroke();
        }
    }
    
    // Utility method to get position on track based on distance traveled
    getTrackPosition(distance, laneNumber = 3) {
        // Convert distance to angle around the oval
        const normalizedDistance = (distance % this.totalLength) / this.totalLength;
        const angle = normalizedDistance * 2 * Math.PI + Math.PI / 2; // Start at bottom
        
        // Calculate radius for this lane
        const radiusX = this.innerRadiusX + (laneNumber * this.laneSpacing);
        const radiusY = this.innerRadiusY + (laneNumber * this.laneSpacing);
        
        return {
            x: this.centerX + radiusX * Math.cos(angle),
            y: this.centerY + radiusY * Math.sin(angle),
            angle: angle
        };
    }
    
    // Check if position is near start/finish line
    isAtFinishLine(x, y, threshold = 50) {
        const finishY = this.centerY + this.outerRadiusY * Math.sin(Math.PI / 2);
        return Math.abs(y - finishY) < threshold && 
               x > this.centerX - this.outerRadiusX && 
               x < this.centerX + this.outerRadiusX;
    }
    
    // Set target for camera following
    setFollowTarget(target) {
        this.followTarget = target;
    }
    
    // Get track boundaries for collision detection
    getTrackBounds() {
        return {
            centerX: this.centerX,
            centerY: this.centerY,
            innerRadiusX: this.innerRadiusX,
            innerRadiusY: this.innerRadiusY,
            outerRadiusX: this.outerRadiusX,
            outerRadiusY: this.outerRadiusY
        };
    }
}
