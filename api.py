import requests
import json
import os
import re
from dotenv import load_dotenv
from flask import Flask, request as flask_request, jsonify
from flask_cors import CORS

load_dotenv()

API_URL = os.getenv("API_URL")
API_KEY = os.getenv("API_KEY")

app = Flask(__name__)
CORS(app)

def ask_hackclub(prompt):
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "model": "openai/gpt-oss-120b",
        "messages": [{"role": "user", "content": prompt}]
    }
    response = requests.post(API_URL, headers=headers, data=json.dumps(data))
    response.raise_for_status()
    return response.json()["choices"][0]["message"]["content"]

@app.route('/ai-move', methods=['POST'])
def ai_move():
    body = flask_request.get_json()
    hand = body.get('hand', [])
    top_card = body.get('top_card', {})
    current_color = body.get('current_color', top_card.get('color', ''))

    print(f"\n=== AI MOVE REQUEST ===")
    print(f"Hand: {json.dumps(hand)}")
    print(f"Top card: {json.dumps(top_card)}")
    print(f"Current color: {current_color}")
    print(f"API_URL: {API_URL}")
    print(f"API_KEY set: {bool(API_KEY)}")

    prompt = (
        f"You are playing Uno. Your hand is: {json.dumps(hand)}. "
        f"The top card on the discard pile is: {json.dumps(top_card)}. "
        f"The current color is: {current_color}. "
        f"A card can be played if it matches the current color, matches the top card's value, or is a wild card. "
        f"Pick the best card to play from your hand. "
        f"Respond with ONLY a JSON object like {{\"color\": \"red\", \"value\": \"5\"}} for the card you want to play. "
        f"If you cannot play any card, respond with {{\"action\": \"draw\"}}. "
        f"Do not include any other text, just the JSON."
    )

    try:
        ai_response = ask_hackclub(prompt)
        print(f"AI raw response: {ai_response}")
    except Exception as e:
        print(f"ERROR calling Hack Club API: {e}")
        return jsonify({"action": "draw"})

    # Try to parse the AI response as JSON
    try:
        # Remove markdown code fences if present
        cleaned = re.sub(r'```json?\s*', '', ai_response)
        cleaned = re.sub(r'```', '', cleaned)
        cleaned = cleaned.strip()
        move = json.loads(cleaned)
    except json.JSONDecodeError:
        # Fallback: try to find JSON in the response
        match = re.search(r'\{[^}]+\}', ai_response)
        if match:
            try:
                move = json.loads(match.group())
            except json.JSONDecodeError:
                move = {"action": "draw"}
        else:
            move = {"action": "draw"}

    return jsonify(move)

if __name__ == "__main__":
    print("Starting AI server on http://localhost:5000")
    print(f"API_URL = {API_URL}")
    print(f"API_KEY set = {bool(API_KEY)}")
    app.run(port=5000, debug=True)