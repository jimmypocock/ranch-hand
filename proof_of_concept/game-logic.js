// Card deck setup
const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const suitSymbols = {
  'hearts': '♥',
  'diamonds': '♦',
  'clubs': '♣',
  'spades': '♠'
};

// Card values for hand evaluation
const cardValues = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
  'J': 11, 'Q': 12, 'K': 13, 'A': 14
};

// Hand rankings for Texas Hold'em
const handRankings = {
  ROYAL_FLUSH: 10,
  STRAIGHT_FLUSH: 9,
  FOUR_OF_A_KIND: 8,
  FULL_HOUSE: 7,
  FLUSH: 6,
  STRAIGHT: 5,
  THREE_OF_A_KIND: 4,
  TWO_PAIR: 3,
  ONE_PAIR: 2,
  HIGH_CARD: 1
};

const REQUIRED_CARD_COUNT = 5;
const STARTING_TOKENS = 50;

// Game state variables
let deck = [];
let burnPile = [];
let players = [
  { name: 'Player 1', hand: [], tokens: 50, freeEntry: false },
  { name: 'Player 2', hand: [], tokens: 50, freeEntry: false },
  { name: 'Player 3', hand: [], tokens: 50, freeEntry: false },
  { name: 'Player 4', hand: [], tokens: 50, freeEntry: false }
];

let potTokens = 0;
let selectedCardInfo = null;
let gameStarted = false;
let gameEnded = false;
let currentPlayerTurn = null;
let needToBurn = false;
let knockingPlayer = null;
let finalRound = false;
let remainingPlayersToDraw = [];
let lastWinner = null;

// Function declarations

// Helper function to check if all players have exactly 5 cards
function allPlayersHaveExactCards() {
  return players.every(player => player.hand.length === REQUIRED_CARD_COUNT);
}

// Initialize the deck
function initializeDeck() {
  deck = [];
  burnPile = [];
  for (let suit of suits) {
    for (let value of values) {
      deck.push({ suit, value });
    }
  }
  updatePilesInfo();
}

// Shuffle the deck
function shuffleDeck() {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  updatePilesInfo();
  showStatusMessage('Deck shuffled successfully!');
}

// Start new game
function startNewGame() {
  console.log("Starting new game - initializing");

  // First ensure game is marked as started
  gameStarted = true;
  gameEnded = false;

  // Reset everything
  initializeDeck();
  shuffleDeck();

  console.log("Deck initialized with", deck.length, "cards");

  // Clear player hands
  for (let playerIndex = 0; playerIndex < players.length; playerIndex++) {
    players[playerIndex].hand = [];
  }

  console.log("Player hands cleared");

  // Only reset pot tokens if we had a winner last game
  if (lastWinner !== null) {
    potTokens = 0;
  }

  currentPlayerTurn = null;
  needToBurn = false;
  knockingPlayer = null;
  finalRound = false;
  remainingPlayersToDraw = [];

  // Hide game over screen
  document.getElementById('game-over').style.display = 'none';

  // Deal 5 cards to each player
  console.log("Dealing cards to players");
  for (let i = 0; i < REQUIRED_CARD_COUNT; i++) {
    for (let playerIndex = 0; playerIndex < players.length; playerIndex++) {
      if (deck.length > 0) {
        const card = deck.shift();
        players[playerIndex].hand.push(card);
        console.log(`Dealt ${card.value} of ${card.suit} to Player ${playerIndex + 1}`);
      }
    }
  }

  console.log("Players now have:", players.map(p => p.hand.length), "cards");

  // Each player puts 1 token in the pot (except players with free entry)
  for (let playerIndex = 0; playerIndex < players.length; playerIndex++) {
    if (!players[playerIndex].freeEntry) {
      players[playerIndex].tokens -= 1;
      potTokens += 1;
    } else {
      // Reset free entry for next game
      players[playerIndex].freeEntry = false;
    }
  }

  // Reset last winner
  lastWinner = null;

  console.log("Calling render functions");
  renderPlayerHands();
  updatePilesInfo();
  updateTokens();
  updateButtons();
  updateGameStatus();
  showStatusMessage('New game started! Players added tokens to the pot.');

  console.log("Game started successfully");
}

// Draw a card for a specific player
function drawCardForPlayer(playerIndex) {
  console.log("Draw card for player", playerIndex);

  // Check game state
  if (!gameStarted) {
    showStatusMessage('Game has not started yet. Click "New Game" to begin.', true);
    return;
  }

  if (gameEnded) {
    showStatusMessage('Game has ended.', true);
    return;
  }

  // If player has no tokens, force them to knock
  if (!finalRound && players[playerIndex].tokens <= 0) {
    showStatusMessage(`${players[playerIndex].name} has no tokens and must knock!`, true);
    playerKnocks(playerIndex);
    return;
  }

  // Final round logic
  if (finalRound) {
    if (remainingPlayersToDraw.length === 0 || remainingPlayersToDraw[0] !== playerIndex) {
      showStatusMessage(`It's not ${players[playerIndex].name}'s turn to draw.`, true);
      return;
    }

    if (deck.length === 0) {
      showStatusMessage('No cards left in the deck!', true);
      return;
    }

    // Draw card for player in final round (no token cost)
    const drawnCard = deck.shift();
    players[playerIndex].hand.push(drawnCard);

    // Remove player from remaining list
    remainingPlayersToDraw.shift();

    renderPlayerHands();
    updatePilesInfo();
    updateButtons();

    showStatusMessage(`${players[playerIndex].name} drew a card (final round). Now must burn a card.`);

    // Set this player as needing to burn a card
    currentPlayerTurn = playerIndex;
    needToBurn = true;
    updateGameStatus();
    return;
  }

  // Regular turn logic
  // Check if player needs to burn a card first
  if (needToBurn) {
    showStatusMessage(`${players[currentPlayerTurn].name} needs to burn a card first.`, true);
    return;
  }

  // Check if it's the player's turn (skip this check if it's the first draw of the game)
  if (currentPlayerTurn !== null && (playerIndex !== (currentPlayerTurn + 1) % 4)) {
    showStatusMessage(`It's not ${players[playerIndex].name}'s turn to draw.`, true);
    return;
  }

  // Check if all players have exactly 5 cards (only enforce after first round)
  const allPlayersHaveRequiredCards = allPlayersHaveExactCards();
  if (currentPlayerTurn !== null && !allPlayersHaveRequiredCards) {
    showStatusMessage('All players must have exactly 5 cards before drawing more.', true);
    return;
  }

  if (deck.length === 0) {
    showStatusMessage('No cards left in the deck!', true);
    return;
  }

  // Check if player has tokens
  if (players[playerIndex].tokens <= 0) {
    showStatusMessage(`${players[playerIndex].name} has no tokens left!`, true);
    return;
  }

  // Take a token from the player and add to pot
  players[playerIndex].tokens -= 1;
  potTokens += 1;

  // Draw card
  const drawnCard = deck.shift();
  players[playerIndex].hand.push(drawnCard);

  // Set current player and need to burn flag
  currentPlayerTurn = playerIndex;
  needToBurn = true;

  renderPlayerHands();
  updatePilesInfo();
  updateTokens();
  updateButtons();
  updateGameStatus();
  showStatusMessage(`${players[playerIndex].name} drew a card and added 1 token to the pot.`);
}

// Player knocks
function playerKnocks(playerIndex) {
  console.log("Player knocks", playerIndex);

  // Check game state
  if (!gameStarted) {
    showStatusMessage('Game has not started yet.', true);
    return;
  }

  if (gameEnded) {
    showStatusMessage('Game has ended.', true);
    return;
  }

  // Check if it's already final round
  if (finalRound) {
    showStatusMessage('Cannot knock during final round.', true);
    return;
  }

  // Check if it's the player's turn
  if (currentPlayerTurn !== null && (playerIndex !== (currentPlayerTurn + 1) % 4)) {
    showStatusMessage(`It's not ${players[playerIndex].name}'s turn.`, true);
    return;
  }

  // Check if player needs to burn a card first
  if (needToBurn) {
    showStatusMessage(`${players[currentPlayerTurn].name} needs to burn a card first.`, true);
    return;
  }

  // Check if all players have exactly 5 cards
  if (!allPlayersHaveExactCards()) {
    showStatusMessage('All players must have exactly 5 cards before knocking.', true);
    return;
  }

  // Start final round
  knockingPlayer = playerIndex;
  finalRound = true;

  // Determine remaining players to draw in correct order
  // If player 3 knocked, the order should be players 4, 1, 2
  remainingPlayersToDraw = [];
  for (let i = 1; i <= 3; i++) {
    const nextPlayerIndex = (playerIndex + i) % 4;
    remainingPlayersToDraw.push(nextPlayerIndex);
  }

  let forcedKnock = players[playerIndex].tokens <= 0;
  let message = forcedKnock
    ? `${players[playerIndex].name} was forced to knock (no tokens left)! Final round started.`
    : `${players[playerIndex].name} knocked! Final round started.`;

  showStatusMessage(message);
  updateButtons();
  updateGameStatus();
}

// Evaluate a hand and return its rank and high cards
function evaluateHand(hand) {
  // Sort cards by value (high to low)
  const sortedHand = [...hand].sort((a, b) => cardValues[b.value] - cardValues[a.value]);

  // Count cards by value
  const valueCounts = {};
  const suitCounts = {};

  for (const card of sortedHand) {
    valueCounts[card.value] = (valueCounts[card.value] || 0) + 1;
    suitCounts[card.suit] = (suitCounts[card.suit] || 0) + 1;
  }

  // Check for flush (all cards of same suit)
  const isFlush = Object.values(suitCounts).some(count => count === 5);

  // Check for straight (5 consecutive values)
  let isStraight = false;
  const uniqueValues = [...new Set(sortedHand.map(card => cardValues[card.value]))].sort((a, b) => b - a);

  if (uniqueValues.length >= 5) {
    // Regular straight check
    for (let i = 0; i <= uniqueValues.length - 5; i++) {
      if (uniqueValues[i] - uniqueValues[i + 4] === 4) {
        isStraight = true;
        break;
      }
    }
  }

  // Special case: A-5-4-3-2 straight
  if (!isStraight && uniqueValues.includes(14)) { // Has an Ace
    const lowStraightValues = [14, 5, 4, 3, 2]; // Ace is high in this case
    if (lowStraightValues.every(value =>
      sortedHand.some(card => cardValues[card.value] === value))) {
      isStraight = true;
    }
  }

  // Get pairs, trips, quads
  const pairs = Object.entries(valueCounts).filter(([_, count]) => count === 2);
  const trips = Object.entries(valueCounts).filter(([_, count]) => count === 3);
  const quads = Object.entries(valueCounts).filter(([_, count]) => count === 4);

  // Determine hand rank
  let handRank;
  let highCards = [];

  // Royal flush
  if (isFlush && isStraight && sortedHand[0].value === 'A' && sortedHand[4].value === '10') {
    handRank = handRankings.ROYAL_FLUSH;
    highCards = [14]; // Ace high
  }
  // Straight flush
  else if (isFlush && isStraight) {
    handRank = handRankings.STRAIGHT_FLUSH;
    highCards = [Math.max(...uniqueValues)];
  }
  // Four of a kind
  else if (quads.length === 1) {
    handRank = handRankings.FOUR_OF_A_KIND;
    const quadValue = quads[0][0];
    highCards = [cardValues[quadValue]];
    // Add kicker
    const kicker = sortedHand.find(card => card.value !== quadValue);
    if (kicker) highCards.push(cardValues[kicker.value]);
  }
  // Full house
  else if (trips.length === 1 && pairs.length === 1) {
    handRank = handRankings.FULL_HOUSE;
    highCards = [cardValues[trips[0][0]], cardValues[pairs[0][0]]];
  }
  // Flush
  else if (isFlush) {
    handRank = handRankings.FLUSH;
    highCards = sortedHand.slice(0, 5).map(card => cardValues[card.value]);
  }
  // Straight
  else if (isStraight) {
    handRank = handRankings.STRAIGHT;
    highCards = [Math.max(...uniqueValues)];
  }
  // Three of a kind
  else if (trips.length === 1) {
    handRank = handRankings.THREE_OF_A_KIND;
    highCards = [cardValues[trips[0][0]]];
    // Add kickers
    const kickers = sortedHand.filter(card => card.value !== trips[0][0]).slice(0, 2);
    highCards.push(...kickers.map(card => cardValues[card.value]));
  }
  // Two pair
  else if (pairs.length === 2) {
    handRank = handRankings.TWO_PAIR;
    const pairValues = pairs.map(pair => cardValues[pair[0]]).sort((a, b) => b - a);
    highCards = [...pairValues];
    // Add kicker
    const kicker = sortedHand.find(card =>
      !pairs.some(pair => card.value === pair[0]));
    if (kicker) highCards.push(cardValues[kicker.value]);
  }
  // One pair
  else if (pairs.length === 1) {
    handRank = handRankings.ONE_PAIR;
    highCards = [cardValues[pairs[0][0]]];
    // Add kickers
    const kickers = sortedHand.filter(card => card.value !== pairs[0][0]).slice(0, 3);
    highCards.push(...kickers.map(card => cardValues[card.value]));
  }
  // High card
  else {
    handRank = handRankings.HIGH_CARD;
    highCards = sortedHand.slice(0, 5).map(card => cardValues[card.value]);
  }

  return { rank: handRank, highCards };
}

// Compare two hands and return the winner
function compareHands(hand1, hand2) {
  const evaluation1 = evaluateHand(hand1);
  const evaluation2 = evaluateHand(hand2);

  // First compare hand ranks
  if (evaluation1.rank > evaluation2.rank) {
    return 1; // hand1 wins
  } else if (evaluation1.rank < evaluation2.rank) {
    return -1; // hand2 wins
  } else {
    // If ranks are equal, compare high cards
    for (let i = 0; i < evaluation1.highCards.length; i++) {
      if (evaluation1.highCards[i] > evaluation2.highCards[i]) {
        return 1; // hand1 wins
      } else if (evaluation1.highCards[i] < evaluation2.highCards[i]) {
        return -1; // hand2 wins
      }
    }
    return 0; // It's a tie
  }
}

// Get hand type as string for display
function getHandTypeString(handRank) {
  switch (handRank) {
    case handRankings.ROYAL_FLUSH: return "Royal Flush";
    case handRankings.STRAIGHT_FLUSH: return "Straight Flush";
    case handRankings.FOUR_OF_A_KIND: return "Four of a Kind";
    case handRankings.FULL_HOUSE: return "Full House";
    case handRankings.FLUSH: return "Flush";
    case handRankings.STRAIGHT: return "Straight";
    case handRankings.THREE_OF_A_KIND: return "Three of a Kind";
    case handRankings.TWO_PAIR: return "Two Pair";
    case handRankings.ONE_PAIR: return "One Pair";
    case handRankings.HIGH_CARD: return "High Card";
    default: return "Unknown";
  }
}

// End the game
function endGame() {
  // Ensure all players have exactly 5 cards
  if (!allPlayersHaveExactCards()) {
    return; // Don't end game if not all players have exactly 5 cards
  }

  gameEnded = true;

  // Evaluate all hands
  const playerEvaluations = players.map((player, index) => {
    const evaluation = evaluateHand(player.hand);
    return {
      playerIndex: index,
      name: player.name,
      rank: evaluation.rank,
      highCards: evaluation.highCards,
      handType: getHandTypeString(evaluation.rank)
    };
  });

  // Find the winning player(s)
  let winners = [playerEvaluations[0]];

  for (let i = 1; i < playerEvaluations.length; i++) {
    const comparison = compareHands(
      players[winners[0].playerIndex].hand,
      players[playerEvaluations[i].playerIndex].hand
    );

    if (comparison < 0) {
      // New player is better
      winners = [playerEvaluations[i]];
    } else if (comparison === 0) {
      // It's a tie
      winners.push(playerEvaluations[i]);
    }
  }

  // Apply rewards
  const winningPlayerIndex = winners[0].playerIndex;
  lastWinner = winningPlayerIndex;

  // If the knocking player won, they get all the tokens
  if (knockingPlayer === winningPlayerIndex) {
    players[winningPlayerIndex].tokens += potTokens;
    potTokens = 0;
  } else {
    // Otherwise, the winner gets free entry next game
    players[winningPlayerIndex].freeEntry = true;
  }

  // Hide game status and show game over screen
  document.getElementById('game-status').style.display = 'none';
  document.getElementById('game-over').style.display = 'block';

  // Display game result
  const resultElement = document.getElementById('game-result');
  resultElement.innerHTML = `
        <p>Game has ended! ${players[winningPlayerIndex].name} wins with a ${winners[0].handType}!</p>
        <p>Player hands:</p>
        <ul>
            ${playerEvaluations.map(eval =>
    `<li>${eval.name}: ${eval.handType} ${eval.playerIndex === winningPlayerIndex ? '(WINNER)' : ''}</li>`
  ).join('')}
        </ul>
        <p>${knockingPlayer === winningPlayerIndex ?
      `${players[winningPlayerIndex].name} knocked and won! They collected ${potTokens} tokens from the pot.` :
      `${players[winningPlayerIndex].name} wins! They get free entry next game.`}</p>
        <p>Player tokens: ${players.map(player => `${player.name}: ${player.tokens}`).join(', ')}</p>
    `;

  // Disable all action buttons
  document.querySelectorAll('.draw-card, .knock-button').forEach(button => {
    button.disabled = true;
    button.classList.add('disabled');
  });
}

// Reset game
function resetGame() {
  console.log("Reset game called, starting tokens: ", STARTING_TOKENS);
  gameStarted = false;
  initializeDeck();
  shuffleDeck();

  // Explicitly reset all player data with the correct token value
  players = [
    { name: 'Player 1', hand: [], tokens: 50, freeEntry: false },
    { name: 'Player 2', hand: [], tokens: 50, freeEntry: false },
    { name: 'Player 3', hand: [], tokens: 50, freeEntry: false },
    { name: 'Player 4', hand: [], tokens: 50, freeEntry: false }
  ];

  potTokens = 0;
  currentPlayerTurn = null;
  needToBurn = false;
  knockingPlayer = null;
  finalRound = false;
  remainingPlayersToDraw = [];
  lastWinner = null;

  // Hide game over screen
  document.getElementById('game-over').style.display = 'none';

  renderPlayerHands();
  updatePilesInfo();
  updateTokens();
  updateButtons();
  updateGameStatus();

  console.log("After reset, player tokens: ", players.map(p => p.tokens));
  showStatusMessage('Game reset successfully! Each player now has 50 tokens.');
}

// Update game status display
function updateGameStatus() {
  const statusElement = document.getElementById('game-status');

  if (gameEnded) {
    statusElement.style.display = 'none';
    return;
  }

  if (!gameStarted) {
    statusElement.textContent = 'Game not started yet. Click "New Game" to begin.';
    return;
  }

  if (finalRound) {
    if (remainingPlayersToDraw.length > 0) {
      const nextPlayerName = players[remainingPlayersToDraw[0]].name;
      statusElement.textContent = `Final round: ${nextPlayerName}'s turn to draw.`;
    } else if (needToBurn) {
      const playerName = players[currentPlayerTurn].name;
      statusElement.textContent = `Final round: ${playerName} needs to burn a card from their hand.`;
    } else {
      statusElement.textContent = 'Final round complete. Game over!';
    }
  } else if (needToBurn) {
    const playerName = players[currentPlayerTurn].name;
    statusElement.textContent = `${playerName} needs to burn a card from their hand.`;
  } else if (currentPlayerTurn !== null) {
    const nextPlayer = (currentPlayerTurn + 1) % 4;
    const nextPlayerName = players[nextPlayer].name;
    statusElement.textContent = `It's ${nextPlayerName}'s turn to draw or knock.`;
  } else {
    statusElement.textContent = 'New round started. Any player can draw or knock first.';
  }

  statusElement.style.display = 'block';
}

// Show status message
function showStatusMessage(message, isError = false) {
  const statusElement = document.getElementById('status-message');
  statusElement.textContent = message;
  statusElement.style.display = 'block';
  statusElement.style.backgroundColor = isError ? '#ffe6e6' : '#e6ffe6';

  // Hide message after 3 seconds
  setTimeout(() => {
    statusElement.style.display = 'none';
  }, 3000);
}

// Update piles information display
function updatePilesInfo() {
  // Update draw pile
  document.getElementById('remaining-count').textContent = deck.length;
  const topCardElement = document.getElementById('top-card');

  topCardElement.innerHTML = deck.length > 0
    ? `Top card: ${deck[0].value} of ${deck[0].suit} (${suitSymbols[deck[0].suit]})`
    : 'No cards remaining';

  // Update burn pile
  document.getElementById('burned-count').textContent = burnPile.length;
  const topBurnedElement = document.getElementById('top-burned-card');

  topBurnedElement.innerHTML = burnPile.length > 0
    ? `Top card: ${burnPile[burnPile.length - 1].value} of ${burnPile[burnPile.length - 1].suit} (${suitSymbols[burnPile[burnPile.length - 1].suit]})`
    : 'No burned cards';
}

// Close the card action modal
function closeCardActionModal() {
  document.getElementById('card-action-modal').style.display = 'none';
}

// Make functions globally available
window.allPlayersHaveExactCards = allPlayersHaveExactCards;
window.initializeDeck = initializeDeck;
window.shuffleDeck = shuffleDeck;
window.startNewGame = startNewGame;
window.drawCardForPlayer = drawCardForPlayer;
window.playerKnocks = playerKnocks;
window.evaluateHand = evaluateHand;
window.compareHands = compareHands;
window.endGame = endGame;
window.resetGame = resetGame;
window.updateGameStatus = updateGameStatus;
window.showStatusMessage = showStatusMessage;
window.updatePilesInfo = updatePilesInfo;
window.closeCardActionModal = closeCardActionModal;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function () {
  console.log("Game logic initialization");
  initializeDeck();
  shuffleDeck();
});