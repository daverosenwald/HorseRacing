// public/track.js

export class Track {
    constructor(canvas) {
        // Track dimensions and properties
        this.canvas = canvas;
        this.centerX = canvas.width / 2;
        this.centerY = canvas.height / 2;
        
        // Flatter, wider oval with perspective effect (45% width, 30% height)
        this.outerRadiusX = canvas.width * 0.45;
        this.outerRadiusY = canvas.height * 0.30;
        this.trackWidth = 140; // Wider track for 90s aesthetic
        this.innerRadiusX = this.outerRadiusX - this.trackWidth;
        this.innerRadiusY = this.outerRadiusY - this.trackWidth;
        
        // Perspective effect (flatten top of oval)
        this.perspectiveFlattening = 0.85; // Top of oval is flattened by this factor
        
        // Track appearance - muted retro colors
        this.colors = {
            track: '#9F7B5A',        // Muted brown dirt track
            trackSpecks: '#7A5C42',  // Darker brown specks
            innerField: '#1A5D1A',   // Deep green inner field
            outerArea: '#2F4F2F',    // Muted green outer area
            rails: '#D0D0D0',        // Light gray rails
            railShadow: '#A0A0A0',   // Rail shadow
            startFinishPost: '#FFFFFF' // White for post
        };
        
        // Rail properties
        this.railWidth = 8;
        this.railPostSpacing = 80; // Space between rail posts
        
        // Scrolling and positioning
        this.scrollX = 0;
        this.scrollY = 0;
        this.followTarget = null; // Will be set to player horse
        
        // Track length calculation (approximate oval circumference)
        this.totalLength = this.calculateTrackLength();
        
        // Texture patterns
        this.dirtPattern = this.generateDirtPattern();
        this.grassPattern = this.generateGrassPattern();
        
        this.setupTrack();
    }
    
    calculateTrackLength() {
        // Approximate oval circumference using Ramanujan's formula
        // Adjusted for perspective flattening
        const a = this.outerRadiusX - this.trackWidth / 2;
        const b = this.outerRadiusY - this.trackWidth / 2;
        const h = Math.pow((a - b), 2) / Math.pow((a + b), 2);
        return Math.PI * (a + b) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)));
    }
    
    setupTrack() {
        // Initialize any track-specific setup
        this.laneCount = 6; // Still track 6 lanes for positioning, but not visually distinct
        this.laneSpacing = this.trackWidth / this.laneCount;
    }
    
    handleResize(canvas) {
        this.canvas = canvas;
        this.centerX = canvas.width / 2;
        this.centerY = canvas.height / 2;
        this.outerRadiusX = canvas.width * 0.45;
        this.outerRadiusY = canvas.height * 0.30;
        this.innerRadiusX = this.outerRadiusX - this.trackWidth;
        this.innerRadiusY = this.outerRadiusY - this.trackWidth;
        
        // Regenerate textures for new size
        this.dirtPattern = this.generateDirtPattern();
        this.grassPattern = this.generateGrassPattern();
        
        // Recalculate track length after resize
        this.totalLength = this.calculateTrackLength();
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
        
        // Draw the track in proper order
        this.drawTrackSurface(ctx);
        this.drawInnerField(ctx);
        this.drawRails(ctx);
        this.drawStartFinishPost(ctx);
        
        ctx.restore();
    }
    
    drawTrackSurface(ctx) {
        // Save context for clipping
        ctx.save();
        
        // Create clipping region for track surface (between inner and outer ovals)
        this.clipToTrackArea(ctx);
        
        // Fill with base dirt color
        ctx.fillStyle = this.colors.track;
        ctx.fillRect(
            this.centerX - this.outerRadiusX - 10,
            this.centerY - this.outerRadiusY - 10,
            this.outerRadiusX * 2 + 20,
            this.outerRadiusY * 2 + 20
        );
        
        // Add dirt texture
        this.applyDirtTexture(ctx);
        
        // Add shadow gradient for curvature effect
        this.addTrackShadow(ctx);
        
        // Restore context
        ctx.restore();
    }
    
    clipToTrackArea(ctx) {
        // Clip to track area between inner and outer ovals
        ctx.beginPath();
        
        // Outer oval
        this.drawPerspectiveOval(ctx, this.centerX, this.centerY, this.outerRadiusX, this.outerRadiusY);
        
        // Inner oval (counterclockwise to create hole)
        ctx.moveTo(this.centerX + this.innerRadiusX, this.centerY);
        this.drawPerspectiveOval(ctx, this.centerX, this.centerY, this.innerRadiusX, this.innerRadiusY, true);
        
        ctx.closePath();
        ctx.clip();
    }
    
    drawPerspectiveOval(ctx, x, y, radiusX, radiusY, counterClockwise = false) {
        // Draw oval with perspective flattening at the top
        const step = Math.PI / 40; // Smaller steps for smoother curve
        
        if (!counterClockwise) {
            ctx.moveTo(x + radiusX, y);
        }
        
        for (let angle = 0; angle <= Math.PI * 2; angle += step) {
            // Apply perspective flattening to top half
            let yRadius = radiusY;
            if (angle > Math.PI / 2 && angle < Math.PI * 3 / 2) {
                // Top half - apply flattening
                const flattenFactor = Math.sin(angle - Math.PI / 2) * (1 - this.perspectiveFlattening);
                yRadius = radiusY * (this.perspectiveFlattening + flattenFactor);
            }
            
            const px = x + Math.cos(angle) * radiusX;
            const py = y + Math.sin(angle) * yRadius;
            
            ctx.lineTo(px, py);
        }
    }
    
    applyDirtTexture(ctx) {
        // Fill with dirt pattern
        ctx.fillStyle = this.dirtPattern;
        ctx.fillRect(
            this.centerX - this.outerRadiusX - 10,
            this.centerY - this.outerRadiusY - 10,
            this.outerRadiusX * 2 + 20,
            this.outerRadiusY * 2 + 20
        );
    }
    
    addTrackShadow(ctx) {
        // Add gradient shadow toward inside edge for curvature effect
        const gradient = ctx.createRadialGradient(
            this.centerX, this.centerY, this.innerRadiusX,
            this.centerX, this.centerY, this.innerRadiusX + this.trackWidth * 0.5
        );
        
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
        gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.1)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(
            this.centerX - this.outerRadiusX - 10,
            this.centerY - this.outerRadiusY - 10,
            this.outerRadiusX * 2 + 20,
            this.outerRadiusY * 2 + 20
        );
    }
    
    drawInnerField(ctx) {
        // Draw inner grass field
        ctx.save();
        
        ctx.beginPath();
        this.drawPerspectiveOval(ctx, this.centerX, this.centerY, this.innerRadiusX - this.railWidth, this.innerRadiusY - this.railWidth);
        ctx.closePath();
        
        // Fill with base green
        ctx.fillStyle = this.colors.innerField;
        ctx.fill();
        
        // Apply grass texture
        ctx.fillStyle = this.grassPattern;
        ctx.fill();
        
        ctx.restore();
    }
    
    drawRails(ctx) {
        // Draw outer rail
        ctx.strokeStyle = this.colors.rails;
        ctx.lineWidth = this.railWidth;
        ctx.beginPath();
        this.drawPerspectiveOval(ctx, this.centerX, this.centerY, this.outerRadiusX, this.outerRadiusY);
        ctx.stroke();
        
        // Draw inner rail
        ctx.beginPath();
        this.drawPerspectiveOval(ctx, this.centerX, this.centerY, this.innerRadiusX, this.innerRadiusY);
        ctx.stroke();
        
        // Draw rail posts around outer rail
        this.drawRailPosts(ctx, this.outerRadiusX, this.outerRadiusY);
        
        // Draw rail posts around inner rail
        this.drawRailPosts(ctx, this.innerRadiusX, this.innerRadiusY);
    }
    
    drawRailPosts(ctx, radiusX, radiusY) {
        const postCount = Math.floor(this.totalLength / this.railPostSpacing);
        const angleStep = (Math.PI * 2) / postCount;
        
        ctx.fillStyle = this.colors.railShadow;
        
        for (let i = 0; i < postCount; i++) {
            const angle = i * angleStep;
            
            // Apply perspective flattening to top half
            let yRadius = radiusY;
            if (angle > Math.PI / 2 && angle < Math.PI * 3 / 2) {
                // Top half - apply flattening
                const flattenFactor = Math.sin(angle - Math.PI / 2) * (1 - this.perspectiveFlattening);
                yRadius = radiusY * (this.perspectiveFlattening + flattenFactor);
            }
            
            const x = this.centerX + Math.cos(angle) * radiusX;
            const y = this.centerY + Math.sin(angle) * yRadius;
            
            // Draw post (small rectangle)
            ctx.fillRect(x - 1, y - 1, 3, 3);
        }
    }
    
    drawStartFinishPost(ctx) {
        // Draw vertical black and white start/finish post at bottom of track
        const angle = Math.PI / 2; // Bottom of track
        const outerX = this.centerX + this.outerRadiusX * Math.cos(angle);
        const outerY = this.centerY + this.outerRadiusY * Math.sin(angle);
        
        // Post dimensions
        const postWidth = 12;
        const postHeight = 60;
        
        // Draw post
        ctx.save();
        ctx.translate(outerX, outerY);
        
        // Post base
        ctx.fillStyle = '#000000';
        ctx.fillRect(-postWidth/2, 0, postWidth, postHeight);
        
        // Black and white stripes
        const stripeCount = 6;
        const stripeHeight = postHeight / stripeCount;
        
        for (let i = 0; i < stripeCount; i++) {
            ctx.fillStyle = i % 2 === 0 ? '#FFFFFF' : '#000000';
            ctx.fillRect(-postWidth/2, i * stripeHeight, postWidth, stripeHeight);
        }
        
        ctx.restore();
    }
    
    generateDirtPattern() {
        // Create an off-screen canvas for the dirt pattern
        const patternCanvas = document.createElement('canvas');
        const size = 100;
        patternCanvas.width = size;
        patternCanvas.height = size;
        
        const patternCtx = patternCanvas.getContext('2d');
        
        // Fill with base color
        patternCtx.fillStyle = this.colors.track;
        patternCtx.fillRect(0, 0, size, size);
        
        // Add random specks
        patternCtx.fillStyle = this.colors.trackSpecks;
        
        // Create a retro-style grid-based pattern with some randomness
        const gridSize = 5;
        for (let x = 0; x < size; x += gridSize) {
            for (let y = 0; y < size; y += gridSize) {
                if (Math.random() < 0.3) {
                    const speckSize = 1 + Math.random() * 2;
                    patternCtx.fillRect(
                        x + Math.random() * gridSize, 
                        y + Math.random() * gridSize, 
                        speckSize, speckSize
                    );
                }
            }
        }
        
        // Create pattern from the canvas
        return patternCtx.createPattern(patternCanvas, 'repeat');
    }
    
    generateGrassPattern() {
        // Create an off-screen canvas for the grass pattern
        const patternCanvas = document.createElement('canvas');
        const size = 100;
        patternCanvas.width = size;
        patternCanvas.height = size;
        
        const patternCtx = patternCanvas.getContext('2d');
        
        // Fill with transparent color (we'll overlay this on the base)
        patternCtx.clearRect(0, 0, size, size);
        
        // Add grass texture - small lines in various directions
        patternCtx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        patternCtx.lineWidth = 1;
        
        // Grid-based pattern with some randomness for that 90s look
        const gridSize = 8;
        for (let x = 0; x < size; x += gridSize) {
            for (let y = 0; y < size; y += gridSize) {
                if (Math.random() < 0.5) {
                    const length = 3 + Math.random() * 4;
                    const angle = Math.random() * Math.PI;
                    
                    patternCtx.save();
                    patternCtx.translate(x + gridSize/2, y + gridSize/2);
                    patternCtx.rotate(angle);
                    
                    patternCtx.beginPath();
                    patternCtx.moveTo(-length/2, 0);
                    patternCtx.lineTo(length/2, 0);
                    patternCtx.stroke();
                    
                    patternCtx.restore();
                }
            }
        }
        
        // Create pattern from the canvas
        return patternCtx.createPattern(patternCanvas, 'repeat');
    }
    
    // Utility method to get position on track based on distance traveled
    getTrackPosition(distance, laneNumber = 3) {
        // Convert distance to angle around the oval
        const normalizedDistance = (distance % this.totalLength) / this.totalLength;
        const angle = normalizedDistance * 2 * Math.PI + Math.PI / 2; // Start at bottom
        
        // Calculate radius for this lane
        const radiusX = this.innerRadiusX + (laneNumber * this.laneSpacing);
        const radiusY = this.innerRadiusY + (laneNumber * this.laneSpacing);
        
        // Apply perspective flattening to top half
        let yRadius = radiusY;
        if (angle > Math.PI / 2 && angle < Math.PI * 3 / 2) {
            // Top half - apply flattening
            const flattenFactor = Math.sin(angle - Math.PI / 2) * (1 - this.perspectiveFlattening);
            yRadius = radiusY * (this.perspectiveFlattening + flattenFactor);
        }
        
        return {
            x: this.centerX + radiusX * Math.cos(angle),
            y: this.centerY + yRadius * Math.sin(angle),
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
            outerRadiusY: this.outerRadiusY,
            perspectiveFlattening: this.perspectiveFlattening
        };
    }
}
