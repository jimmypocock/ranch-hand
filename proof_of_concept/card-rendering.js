// Create a card element
function createCardElement(card) {
  const cardElement = document.createElement('div');
  cardElement.className = `card ${card.suit}`;

  const suitElement = document.createElement('div');
  suitElement.className = 'suit';
  suitElement.textContent = suitSymbols[card.suit];

  const valueElement = document.createElement('div');
  valueElement.className = 'value';
  valueElement.textContent = card.value;

  cardElement.appendChild(suitElement);
  cardElement.appendChild(valueElement);

  return cardElement;
}

// Render player hands
function renderPlayerHands() {
  console.log("Rendering player hands", players.map(p => p.hand.length));

  players.forEach((player, playerIndex) => {
    const playerElement = document.getElementById(`player${playerIndex}`);
    const handElement = playerElement.querySelector('.hand');
    const countElement = playerElement.querySelector('.count');

    // Update card count
    countElement.textContent = player.hand.length;

    // Apply red border if card count is not 5
    if (player.hand.length !== REQUIRED_CARD_COUNT) {
      playerElement.classList.add('invalid-count');
    } else {
      playerElement.classList.remove('invalid-count');
    }

    // Apply green border to active player
    playerElement.classList.remove('active-turn');

    if (finalRound && remainingPlayersToDraw.length > 0 && playerIndex === remainingPlayersToDraw[0]) {
      // Final round - highlight next player to draw
      playerElement.classList.add('active-turn');
    } else if (needToBurn && playerIndex === currentPlayerTurn) {
      // Player needs to burn
      playerElement.classList.add('active-turn');
    } else if (!finalRound && !needToBurn && currentPlayerTurn !== null && playerIndex === (currentPlayerTurn + 1) % 4) {
      // Next player's turn
      playerElement.classList.add('active-turn');
    }

    // Clear existing cards
    handElement.innerHTML = '';

    console.log(`Rendering ${player.hand.length} cards for Player ${playerIndex + 1}`);

    // Add each card to the hand
    player.hand.forEach((card, cardIndex) => {
      const cardElement = createCardElement(card);
      console.log(`Created card element for ${card.value} of ${card.suit}`);

      // Add click event to cards in hand
      cardElement.addEventListener('click', function () {
        selectedCardInfo = { playerIndex, cardIndex };

        // Display card action modal
        const modal = document.getElementById('card-action-modal');
        const cardDisplay = document.getElementById('selected-card-display');

        cardDisplay.innerHTML = '';
        cardDisplay.appendChild(createCardElement(card));

        modal.style.display = 'block';
      });

      handElement.appendChild(cardElement);
    });
  });

  console.log("Player hands rendered successfully");
}

// Update tokens display
function updateTokens() {
  console.log("Updating tokens display. Players: ", players.map(p => p.tokens));

  // Update player tokens
  players.forEach((player, index) => {
    const playerElement = document.getElementById(`player${index}`);
    const tokenElement = playerElement.querySelector('.tokens');
    // Ensure the display shows the actual value from the player object
    tokenElement.textContent = player.tokens;

    // Display free entry indicator if applicable
    const statsElement = playerElement.querySelector('.player-stats');
    const existingIndicator = statsElement.querySelector('.free-entry');

    if (player.freeEntry && !existingIndicator) {
      const freeEntryIndicator = document.createElement('span');
      freeEntryIndicator.className = 'free-entry';
      freeEntryIndicator.textContent = 'Free Entry';
      statsElement.appendChild(freeEntryIndicator);
    } else if (!player.freeEntry && existingIndicator) {
      statsElement.removeChild(existingIndicator);
    }
  });

  // Update pot tokens
  document.getElementById('pot-tokens').textContent = potTokens;
}

// Update all buttons based on game state
function updateButtons() {
  updateDrawButtons();
  updateKnockButtons();
}

// Update draw buttons based on game state
function updateDrawButtons() {
  const drawButtons = document.querySelectorAll('.draw-card');

  drawButtons.forEach((button, playerIndex) => {
    let enabled = false;
    let tooltip = '';

    if (gameEnded) {
      tooltip = 'Game has ended';
    } else if (!gameStarted) {
      tooltip = 'Game has not started yet';
    } else if (finalRound) {
      if (remainingPlayersToDraw.length > 0 && remainingPlayersToDraw[0] === playerIndex) {
        enabled = true;
        tooltip = 'Draw a card (final round)';
      } else {
        tooltip = 'Not your turn to draw in final round';
      }
    } else if (needToBurn) {
      tooltip = `${players[currentPlayerTurn].name} needs to burn a card first`;
    } else if (currentPlayerTurn !== null && !allPlayersHaveExactCards()) {
      tooltip = 'All players must have exactly 5 cards before drawing more';
    } else if (deck.length === 0) {
      tooltip = 'No cards left in the deck';
    } else if (players[playerIndex].tokens <= 0) {
      tooltip = `${players[playerIndex].name} has no tokens left and must knock`;
    } else if (currentPlayerTurn !== null && playerIndex !== (currentPlayerTurn + 1) % 4) {
      tooltip = `It's not ${players[playerIndex].name}'s turn to draw`;
    } else {
      enabled = true;
      tooltip = 'Draw a card for this player';
    }

    button.disabled = !enabled;
    button.classList.toggle('disabled', !enabled);
    button.title = tooltip;
  });
}

// Update knock buttons based on game state
function updateKnockButtons() {
  const allPlayersHaveRequiredCards = allPlayersHaveExactCards();
  const knockButtons = document.querySelectorAll('.knock-button');

  knockButtons.forEach((button, playerIndex) => {
    let enabled = false;
    let tooltip = '';

    if (gameEnded) {
      tooltip = 'Game has ended';
    } else if (!gameStarted) {
      tooltip = 'Game has not started yet';
    } else if (finalRound) {
      tooltip = 'Final round already in progress';
    } else if (needToBurn) {
      tooltip = `${players[currentPlayerTurn].name} needs to burn a card first`;
    } else if (!allPlayersHaveRequiredCards) {
      tooltip = 'All players must have exactly 5 cards before knocking';
    } else if (currentPlayerTurn !== null && playerIndex !== (currentPlayerTurn + 1) % 4) {
      tooltip = `It's not ${players[playerIndex].name}'s turn`;
    } else {
      // Force knock if player has no tokens
      enabled = true;

      if (players[playerIndex].tokens <= 0) {
        tooltip = 'You must knock (no tokens left)';
      } else {
        tooltip = 'Knock to end the game after one more round';
      }
    }

    button.disabled = !enabled;
    button.classList.toggle('disabled', !enabled);
    button.title = tooltip;
  });
}

// Close the card action modal
function closeCardActionModal() {
  document.getElementById('card-action-modal').style.display = 'none';
}

// Burn a card from a player's hand
function burnSelectedCard() {
  if (!selectedCardInfo) return;

  const { playerIndex, cardIndex } = selectedCardInfo;

  // Validate that it's the player's turn to burn
  if (needToBurn && playerIndex !== currentPlayerTurn) {
    showStatusMessage(`It's ${players[currentPlayerTurn].name}'s turn to burn a card.`, true);
    closeCardActionModal();
    return;
  }

  // Only allow burning if player has 6 cards
  if (players[playerIndex].hand.length !== REQUIRED_CARD_COUNT + 1) {
    showStatusMessage(`You can only burn a card if you have 6 cards.`, true);
    closeCardActionModal();
    return;
  }

  const burnedCard = players[playerIndex].hand.splice(cardIndex, 1)[0];
  burnPile.push(burnedCard);
  selectedCardInfo = null;

  // If the player was required to burn, update game state
  if (needToBurn && playerIndex === currentPlayerTurn) {
    needToBurn = false;

    // Check if we need to end the game (all players have 5 cards after burning in final round)
    if (finalRound && remainingPlayersToDraw.length === 0 && allPlayersHaveExactCards()) {
      closeCardActionModal();
      renderPlayerHands();
      updatePilesInfo();
      updateButtons();
      updateGameStatus();
      showStatusMessage(`${players[playerIndex].name} burned: ${burnedCard.value} of ${burnedCard.suit}`);

      // End the game after a short delay
      setTimeout(endGame, 1000);
      return;
    }
  }

  closeCardActionModal();
  renderPlayerHands();
  updatePilesInfo();
  updateButtons();
  updateGameStatus();
  showStatusMessage(`${players[playerIndex].name} burned: ${burnedCard.value} of ${burnedCard.suit}`);
}

// Make functions globally available
window.createCardElement = createCardElement;
window.renderPlayerHands = renderPlayerHands;
window.updateTokens = updateTokens;
window.updateButtons = updateButtons;
window.updateDrawButtons = updateDrawButtons;
window.updateKnockButtons = updateKnockButtons;
window.closeCardActionModal = closeCardActionModal;
window.burnSelectedCard = burnSelectedCard;
