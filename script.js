document.addEventListener('DOMContentLoaded', function() {
    // Customizable variables
    const submitButtonText = "Cerrar dibujo"; // Changed from "Enviar Dibujo" to "Cerrar dibujo"
    
    // Preloader component functionality
    const preloader = document.getElementById('preloader');
    const mainContent = document.getElementById('main-content');
    const submitContainer = document.getElementById('submit-container');
    const submitButton = document.getElementById('submit-drawing');
    const drawingInstructions = document.getElementById('drawing-instructions');
    
    // Set the submit button text from the variable
    submitButton.textContent = submitButtonText;
    
    // Create save button
    const saveButton = document.createElement('button');
    saveButton.id = 'save-drawing';
    saveButton.textContent = 'Guardar dibujo';
    saveButton.className = 'save-btn';
    
    // Insert save button at the top of the controls
    const controls = document.querySelector('.controls');
    controls.insertBefore(saveButton, controls.firstChild);
    
    // Add save functionality
    saveButton.addEventListener('click', saveDrawing);
    
    // Function to save the drawing as an image
    function saveDrawing() {
        const link = document.createElement('a');
        link.download = 'mi-dibujo.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    }
    
    // Show submit button after a delay with animation
    setTimeout(() => {
        submitContainer.style.display = 'block';
        submitButton.classList.add('animate-in');
    }, 5000);
    
    // Handle submit button click
    submitButton.addEventListener('click', () => {
        // Add slide-down animation class to preloader
        preloader.classList.add('slide-down');
        
        // Show main content
        setTimeout(() => {
            mainContent.classList.add('show');
        }, 500);
    });
    // Get canvas and context
    const canvas = document.getElementById('drawing-canvas');
    const ctx = canvas.getContext('2d');
    
    // Get controls
    const brushSize = document.getElementById('brush-size');
    const brushColor = document.getElementById('brush-color');
    const clearBtn = document.getElementById('clear-btn');
    const sizeValue = document.getElementById('size-value');
    
    // Drawing state
    let isDrawing = false;
    let isMouseDown = false; // Track if mouse is down globally
    
    // Create an offscreen canvas to store the actual drawing
    const offscreenCanvas = document.createElement('canvas');
    const offscreenCtx = offscreenCanvas.getContext('2d');
    
    // Set canvas size to match container
    function resizeCanvas() {
        const container = canvas.parentElement;
        const oldWidth = canvas.width;
        const oldHeight = canvas.height;
        
        // Store current drawing if canvas already has content
        let imageData = null;
        if (oldWidth > 0 && oldHeight > 0) {
            imageData = ctx.getImageData(0, 0, oldWidth, oldHeight);
        }
        
        // Resize canvas
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        
        // Restore drawing after resize
        if (imageData) {
            ctx.putImageData(imageData, 0, 0);
        }
        
        // Update offscreen canvas
        updateOffscreenCanvas();
    }
    
    // Function to update offscreen canvas size
    function updateOffscreenCanvas() {
        offscreenCanvas.width = canvas.width;
        offscreenCanvas.height = canvas.height;
        // Copy current main canvas to offscreen canvas
        offscreenCtx.drawImage(canvas, 0, 0);
    }
    
    // Initialize canvas
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Update size value display
    brushSize.addEventListener('input', function() {
        sizeValue.textContent = `${this.value}px`;
    });
    
    // Start drawing
    canvas.addEventListener('mousedown', startDrawing);
    
    // Track mouse down state globally
    document.addEventListener('mousedown', function(e) {
        // Only set mouseDown if the click started inside the canvas
        const rect = canvas.getBoundingClientRect();
        if (e.clientX >= rect.left && e.clientX <= rect.right && 
            e.clientY >= rect.top && e.clientY <= rect.bottom) {
            isMouseDown = true;
        }
    });
    canvas.addEventListener('touchstart', function(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        canvas.dispatchEvent(mouseEvent);
        
        // Set isMouseDown for touch events too
        const rect = canvas.getBoundingClientRect();
        if (touch.clientX >= rect.left && touch.clientX <= rect.right && 
            touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
            isMouseDown = true;
        }
    });
    
    // Draw
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('touchmove', function(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        canvas.dispatchEvent(mouseEvent);
    });
    
    // Stop drawing when mouse is released anywhere in the document
    document.addEventListener('mouseup', function() {
        isMouseDown = false;
        stopDrawing();
    });
    
    // When mouse leaves canvas, don't stop drawing if mouse is still down
    canvas.addEventListener('mouseout', function() {
        if (isMouseDown) {
            // Keep isDrawing true but stop the visual drawing until mouse re-enters
            // We'll continue drawing when mouse moves back into canvas
        } else {
            stopDrawing();
        }
    });
    
    // When mouse re-enters canvas while button is still pressed, continue drawing
    canvas.addEventListener('mouseenter', function(e) {
        if (isMouseDown) {
            // Resume drawing
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            ctx.beginPath();
            ctx.moveTo(x, y);
            offscreenCtx.beginPath();
            offscreenCtx.moveTo(x, y);
            
            isDrawing = true;
        }
    });
    canvas.addEventListener('touchend', function(e) {
        const mouseEvent = new MouseEvent('mouseup');
        document.dispatchEvent(mouseEvent);
    });
    
    // Clear canvas with button
    clearBtn.addEventListener('click', clearCanvas);
    
    // Clear canvas with keyboard shortcuts (Space or Esc)
    document.addEventListener('keydown', function(e) {
        if (e.key === ' ' || e.key === 'Escape') {
            clearCanvas();
        }
    });
    
    // Drawing functions
    function startDrawing(e) {
        isDrawing = true;
        isMouseDown = true;
        
        // Begin a new path before starting to draw
        ctx.beginPath();
        offscreenCtx.beginPath();
        
        // Get mouse position for the starting point
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Move to the starting point without drawing
        ctx.moveTo(x, y);
        offscreenCtx.moveTo(x, y);
        
        draw(e); // Draw a dot when clicked
    }
    
    function draw(e) {
        if (!isDrawing) return;
        
        // Get mouse position relative to canvas
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Set drawing style
        ctx.lineWidth = brushSize.value;
        ctx.lineCap = 'round';
        ctx.strokeStyle = brushColor.value;
        
        // Draw line
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
    }
    
    function stopDrawing() {
        if (!isDrawing) return;
        isDrawing = false;
        
        // End the current path
        ctx.stroke();
        ctx.closePath();
        
        offscreenCtx.stroke();
        offscreenCtx.closePath();
        
        // Update the offscreen canvas with the latest drawing
        updateOffscreenCanvas();
    }
    
    function clearCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    

    
    // Add visual feedback when drawing
    canvas.addEventListener('mousemove', function(e) {
        if (isDrawing) return; // Skip cursor preview when drawing
        
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Clear canvas and redraw from offscreen canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(offscreenCanvas, 0, 0);
        
        // Show brush preview
        ctx.beginPath();
        ctx.arc(x, y, brushSize.value / 2, 0, Math.PI * 2);
        ctx.fillStyle = brushColor.value + '40'; // Add transparency
        ctx.fill();
    });
    
    // Update drawing functions to use offscreen canvas
    function draw(e) {
        // Only draw if mouse was initially pressed inside the canvas (isMouseDown)
        // and we're currently in drawing mode (isDrawing)
        if (!isDrawing || !isMouseDown) return;
        
        // Get mouse position relative to canvas
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Check if mouse is within canvas boundaries
        const isInsideCanvas = 
            x >= 0 && x <= canvas.width && 
            y >= 0 && y <= canvas.height;
        
        // Set drawing style
        ctx.lineWidth = brushSize.value;
        ctx.lineCap = 'round';
        ctx.strokeStyle = brushColor.value;
        offscreenCtx.lineWidth = brushSize.value;
        offscreenCtx.lineCap = 'round';
        offscreenCtx.strokeStyle = brushColor.value;
        
        // Draw line on both canvases without creating a new path
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
        
        offscreenCtx.lineTo(x, y);
        offscreenCtx.stroke();
        offscreenCtx.beginPath();
        offscreenCtx.moveTo(x, y);
    }
    
    function clearCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        offscreenCtx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
    }
});