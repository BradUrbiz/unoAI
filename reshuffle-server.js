const express = require('express');
const fs = require('fs');
const app = express();
const PORT = 3001;

// Card and deck logic from test.js
class Card {
  constructor(color, value) {
    this.color = color;
    this.value = value;
  }
}

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

app.use(express.static('.'));

app.post('/reshuffle', (req, res) => {
  const deck = createDeck();
  shuffle(deck);
  const hand = [];
  for (let i = 0; i < 7; i++) hand.push(deck.pop());
  const opponentHand = [];
  for (let i = 0; i < 7; i++) opponentHand.push(deck.pop());
  let topCard;
  do {
    topCard = deck.pop();
  } while (topCard.color === 'wild');
  fs.writeFileSync('hand.json', JSON.stringify(hand, null, 2));
  fs.writeFileSync('opponent_hand.json', JSON.stringify(opponentHand, null, 2));
  fs.writeFileSync('topcard.json', JSON.stringify(topCard, null, 2));
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Reshuffle server running on http://localhost:${PORT}`);
});
