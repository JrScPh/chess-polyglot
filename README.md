# Chess Engine (Python)

A chess engine built from scratch in Python, with a Django backend and a vanilla JS/HTML/CSS frontend. Move generation, rules enforcement, and game state are handled entirely server-side; the frontend is a thin rendering layer with no game logic of its own. Visit https://jrscph-chess-engine.onrender.com/ to play now in your browser.

## Features

- Full move generation from scratch (no chess libraries) — all piece types, castling, en passant, promotion (including underpromotion)
- Check, checkmate, and stalemate detection
- Draw detection: threefold repetition, fifty-move rule, insufficient material
- FEN parsing and serialization
- Perft-validated move generator (starting position to depth 5, Kiwipete to depth 4)
- Session-based game state — no database required
- Click-to-move web UI with legal move highlighting and captured-piece tracking
- Bot opponent (see below)

## Bot

The bot selects moves using minimax search with alpha-beta pruning.

- **Evaluation:** material count only (standard piece values, signed by color)
- **Move ordering:** MVV-LVA (Most Valuable Victim, Least Valuable Attacker) — captures are searched before quiet moves, ordered by the value of the piece being captured relative to the capturing piece, so that pruning cuts off more of the tree
- **Quiescence search:** at the end of the main search, capture sequences are extended (depth-limited) until the position is "quiet," to avoid misjudging positions mid-exchange
- Ties in evaluated score are broken randomly among the tied moves, rather than always picking the first one found

The bot reconstructs game state from session data on every request rather than persisting a live object in memory, consistent with how the rest of the app handles state.

## Tech Stack

- **Engine:** Python
- **Backend:** Django
- **Frontend:** Vanilla JavaScript, HTML, CSS
- **Testing:** pytest

## Project Structure

```
chess-engine/
├── engine/          # Core chess engine (board, moves, rules, FEN)
├── engine/bot.py    # Move evaluation and search (minimax, alpha-beta, quiescence)
├── chess_app/       # Django app (views, urls)
├── webapp/          # Django project settings
├── frontend/
│   ├── templates/   # HTML
│   └── static/      # CSS, JS
├── tests/           # pytest test suite
├── perft.py         # Standalone perft script (not part of pytest suite)
└── manage.py
```

## Setup

```bash
git clone https://github.com/JrScPh/chess-engine.git
cd chess-engine
pip install django pytest
python manage.py migrate
python manage.py runserver
```

Visit `http://127.0.0.1:8000/` to play.

## Running Tests

```bash
pytest
```

For perft verification:

```bash
python perft.py <depth>
python perft.py <depth> -k   # Kiwipete position
```

## Status

Core engine, playable web UI, and a working bot opponent are complete.
