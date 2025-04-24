// Event listeners for game controls and user interactions
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM loaded, initializing game...");
    
    // Check if functions are available
    console.log("Checking if functions are available:");
    console.log("startNewGame available:", typeof window.startNewGame === 'function' ? 'Yes' : 'No');
    console.log("shuffleDeck available:", typeof window.shuffleDeck === 'function' ? 'Yes' : 'No');
    console.log("resetGame available:", typeof window.resetGame === 'function' ? 'Yes' : 'No');
    
    // Directly assign onclick handlers instead of using addEventListener
    document.getElementById('new-game').addEventListener('click', function() {
        console.log("New Game button clicked");
        if (typeof startNewGame === 'function') {
            startNewGame();
        } else {
            console.error("startNewGame function not found");
            alert("Game initialization error: startNewGame function not found");
        }
    });
    
    document.getElementById('new-game-end').addEventListener('click', function() {
        console.log("New Game End button clicked");
        if (typeof startNewGame === 'function') {
            startNewGame();
        } else {
            console.error("startNewGame function not found");
        }
    });
    
    document.getElementById('shuffle').addEventListener('click', function() {
        console.log("Shuffle button clicked");
        if (typeof shuffleDeck === 'function') {
            shuffleDeck();
        } else {
            console.error("shuffleDeck function not found");
        }
    });
    
    document.getElementById('reset').addEventListener('click', function() {
        console.log("Reset button clicked");
        if (typeof resetGame === 'function') {
            resetGame();
        } else {
            console.error("resetGame function not found");
        }
    });
    
    // Draw card buttons
    document.querySelectorAll('.draw-card').forEach(button => {
        button.addEventListener('click', function() {
            if (this.disabled) return;
            
            const playerIndex = parseInt(this.getAttribute('data-player'));
            console.log("Draw card clicked for player", playerIndex);
            
            if (typeof drawCardForPlayer === 'function') {
                drawCardForPlayer(playerIndex);
            } else {
                console.error("drawCardForPlayer function not found");
            }
        });
    });
    
    // Knock buttons
    document.querySelectorAll('.knock-button').forEach(button => {
        button.addEventListener('click', function() {
            if (this.disabled) return;
            
            const playerIndex = parseInt(this.getAttribute('data-player'));
            console.log("Knock clicked for player", playerIndex);
            
            if (typeof playerKnocks === 'function') {
                playerKnocks(playerIndex);
            } else {
                console.error("playerKnocks function not found");
            }
        });
    });
    
    // Card action buttons (in the modal)
    document.getElementById('burn-selected').addEventListener('click', function() {
        console.log("Burn selected clicked");
        if (typeof burnSelectedCard === 'function') {
            burnSelectedCard();
        } else {
            console.error("burnSelectedCard function not found");
        }
    });
    
    document.getElementById('cancel-card-action').addEventListener('click', function() {
        console.log("Cancel card action clicked");
        if (typeof closeCardActionModal === 'function') {
            selectedCardInfo = null;
            closeCardActionModal();
        } else {
            console.error("closeCardActionModal function not found");
            // Fallback: try to close modal directly
            document.getElementById('card-action-modal').style.display = 'none';
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(event) {
        // Escape key closes modal
        if (event.key === 'Escape') {
            const modal = document.getElementById('card-action-modal');
            if (modal.style.display === 'block') {
                console.log("Escape key pressed - closing modal");
                selectedCardInfo = null;
                if (typeof closeCardActionModal === 'function') {
                    closeCardActionModal();
                } else {
                    modal.style.display = 'none';
                }
            }
        }
    });
    
    // Modal backdrop click to close
    document.getElementById('card-action-modal').addEventListener('click', function(event) {
        // Close only if clicking outside the modal content
        if (event.target === this) {
            console.log("Modal backdrop clicked - closing modal");
            selectedCardInfo = null;
            if (typeof closeCardActionModal === 'function') {
                closeCardActionModal();
            } else {
                this.style.display = 'none';
            }
        }
    });
    
    // Initialize the game
    console.log("Initializing game from ui-handlers");
    if (typeof initializeDeck === 'function') {
        initializeDeck();
        if (typeof shuffleDeck === 'function') {
            shuffleDeck();
        }
        if (typeof updateButtons === 'function') {
            updateButtons();
        }
    } else {
        console.error("Game initialization functions not available");
    }
});