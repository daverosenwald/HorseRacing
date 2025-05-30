// public/playerControls.js

export class InputHandler {
    constructor() {
        // Input state
        this.inputState = {
            forward: false,
            boost: false
        };
        
        // Key mappings
        this.keys = {
            forward: ['ArrowUp', 'w', 'W'],
            boost: ['Space', ' ']
        };
        
        // Bound event handlers (for proper removal later)
        this.boundKeyDown = this.handleKeyDown.bind(this);
        this.boundKeyUp = this.handleKeyUp.bind(this);
        this.boundBlur = this.handleBlur.bind(this);
        this.boundVisibilityChange = this.handleVisibilityChange.bind(this);
        
        // Add event listeners
        window.addEventListener('keydown', this.boundKeyDown);
        window.addEventListener('keyup', this.boundKeyUp);
        window.addEventListener('blur', this.boundBlur);
        document.addEventListener('visibilitychange', this.boundVisibilityChange);
        
        // Initialize
        this.init();
    }
    
    init() {
        // Reset input state
        this.resetInputState();
    }
    
    resetInputState() {
        this.inputState.forward = false;
        this.inputState.boost = false;
    }
    
    handleKeyDown(event) {
        // Prevent default for space to avoid page scrolling
        if (this.keys.boost.includes(event.key)) {
            event.preventDefault();
        }
        
        // Handle forward input
        if (this.keys.forward.includes(event.key)) {
            this.inputState.forward = true;
        }
        
        // Handle boost input
        if (this.keys.boost.includes(event.key)) {
            this.inputState.boost = true;
        }
    }
    
    handleKeyUp(event) {
        // Handle forward input release
        if (this.keys.forward.includes(event.key)) {
            this.inputState.forward = false;
        }
        
        // Handle boost input release
        if (this.keys.boost.includes(event.key)) {
            this.inputState.boost = false;
        }
    }
    
    // Reset input when window loses focus
    handleBlur() {
        this.resetInputState();
    }
    
    // Reset input when tab becomes inactive
    handleVisibilityChange() {
        if (document.hidden) {
            this.resetInputState();
        }
    }
    
    // Get current input state
    getInputState() {
        return this.inputState;
    }
    
    // Clean up event listeners
    destroy() {
        window.removeEventListener('keydown', this.boundKeyDown);
        window.removeEventListener('keyup', this.boundKeyUp);
        window.removeEventListener('blur', this.boundBlur);
        document.removeEventListener('visibilitychange', this.boundVisibilityChange);
    }
}
