/*
Real UNO - Console Version
Rules: Official UNO rules
Players: 2
*/

const readline = require("readline-sync");

// -------------------- Card --------------------
class Card {
  constructor(color, value) {
    this.color = color; // red, yellow, green, blue, wild
    this.value = value; // 0-9, skip, reverse, draw2, wild, wild4
  }

  toString() {
    return `[${this.color.toUpperCase()} ${this.value.toUpperCase()}]`;
  }
}

// -------------------- Deck --------------------
function createDeck() {
  const colors = ["red", "yellow", "green", "blue"];
  const deck = [];

  for (let color of colors) {
    deck.push(new Card(color, "0"));

    for (let i = 1; i <= 9; i++) {
      deck.push(new Card(color, i.toString()));
      deck.push(new Card(color, i.toString()));
    }

    ["skip", "reverse", "draw2"].forEach(action => {
      deck.push(new Card(color, action));
      deck.push(new Card(color, action));
    });
  }

  for (let i = 0; i < 4; i++) {
    deck.push(new Card("wild", "wild"));
    deck.push(new Card("wild", "wild4"));
  }

  return deck;
}

function shuffle(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}

// -------------------- Game Setup --------------------
function setupGame() {
  const deck = createDeck();
  shuffle(deck);

  const players = [
    { name: "Player 1", hand: [] },
    { name: "Player 2", hand: [] }
  ];

  for (let i = 0; i < 7; i++) {
    players.forEach(p => p.hand.push(deck.pop()));
  }

  let topCard;
  do {
    topCard = deck.pop();
  } while (topCard.color === "wild");

  return {
    deck,
    discard: [topCard],
    players,
    currentPlayer: 0,
    direction: 1,
    currentColor: topCard.color,
    drawCount: 0,
    skipNext: false
  };
}

// -------------------- Helpers --------------------
function canPlay(card, topCard, currentColor) {
  return (
    card.color === "wild" ||
    card.color === currentColor ||
    card.value === topCard.value
  );
}

function drawCards(player, game, count) {
  for (let i = 0; i < count; i++) {
    if (game.deck.length === 0) {
      const top = game.discard.pop();
      game.deck = game.discard;
      game.discard = [top];
      shuffle(game.deck);
    }
    player.hand.push(game.deck.pop());
  }
}

function chooseWildColor() {
  const colors = ["red", "yellow", "green", "blue"];
  let choice;

  do {
    choice = readline.question(
      "Choose a color (red, yellow, green, blue): "
    ).toLowerCase();
  } while (!colors.includes(choice));

  return choice;
}

function applyCardEffect(card, game) {
  switch (card.value) {
    case "skip":
      game.skipNext = true;
      break;
    case "reverse":
      game.direction *= -1;
      break;
    case "draw2":
      game.drawCount = 2;
      game.skipNext = true;
      break;
    case "wild4":
      game.drawCount = 4;
      game.skipNext = true;
      break;
  }
}

// -------------------- Turn Logic --------------------
function showHand(player) {
  console.log(`\n${player.name}'s hand:`);
  player.hand.forEach((c, i) => {
    console.log(`${i + 1}: ${c.toString()}`);
  });
}

function takeTurn(game) {
  const player = game.players[game.currentPlayer];
  const topCard = game.discard[game.discard.length - 1];

  console.clear();
  console.log(`Top Card: ${topCard.toString()}`);
  console.log(`Current Color: ${game.currentColor.toUpperCase()}`);
  showHand(player);

  if (game.drawCount > 0) {
    console.log(`You must draw ${game.drawCount} cards.`);
    drawCards(player, game, game.drawCount);
    game.drawCount = 0;
    return;
  }

  let playableIndexes = player.hand
    .map((c, i) => (canPlay(c, topCard, game.currentColor) ? i : -1))
    .filter(i => i !== -1);

  if (playableIndexes.length === 0) {
    console.log("No playable cards. Drawing one...");
    drawCards(player, game, 1);
    return;
  }

  let choice;
  do {
    choice = readline.questionInt(
      "\nChoose a card number to play (or 0 to draw): "
    );
  } while (choice < 0 || choice > player.hand.length);

  if (choice === 0) {
    drawCards(player, game, 1);
    return;
  }

  const card = player.hand[choice - 1];

  if (!canPlay(card, topCard, game.currentColor)) {
    console.log("Invalid move!");
    readline.question("Press Enter...");
    return;
  }

  player.hand.splice(choice - 1, 1);
  game.discard.push(card);

  if (card.color === "wild") {
    game.currentColor = chooseWildColor();
  } else {
    game.currentColor = card.color;
  }

  applyCardEffect(card, game);

  if (player.hand.length === 1) {
    console.log("UNO!");
    readline.question("Press Enter...");
  }
}

// -------------------- Next Player --------------------
function nextPlayer(game) {
  let step = game.skipNext ? 2 : 1;
  game.skipNext = false;

  game.currentPlayer =
    (game.currentPlayer + step * game.direction + game.players.length) %
    game.players.length;
}

// -------------------- Main --------------------
function main() {
  const game = setupGame();

  while (true) {
    takeTurn(game);

    const player = game.players[game.currentPlayer];
    if (player.hand.length === 0) {
      console.clear();
      console.log(`${player.name} WINS! 🏆`);
      break;
    }

    nextPlayer(game);
  }
}

main();
