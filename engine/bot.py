import random
from engine.constants import PAWN, KNIGHT, BISHOP, ROOK, QUEEN, KING, WHITE, BLACK, EMPTY, GameStatus
from engine.fen import board_to_fen

PIECE_VALUES = {EMPTY : 0, PAWN: 1, KNIGHT: 3, BISHOP: 3, ROOK: 5, QUEEN: 9, KING: 1000}

def choose_bot_move(game):
    side = game.board.side
    move_list = []
    best_score = None
    alpha = float('-inf')
    beta = float('inf')

    for move in game.legal_moves:
        undo = game.board.make_move(move)
        move_score = minimax(game.board, game.move_gen, 2, alpha, beta)
        game.board.unmake_move(move, undo)

        if best_score is None:
            best_score = move_score
            move_list = [move]
        elif side == WHITE and move_score > best_score:
            best_score = move_score
            move_list = [move]
            alpha = max(alpha, best_score)
        elif side == WHITE and move_score == best_score:
            move_list.append(move)
        elif side == BLACK and move_score < best_score:
            best_score = move_score
            move_list = [move]
            beta = min(beta, best_score)
        elif side == BLACK and move_score == best_score:
            move_list.append(move)

    return random.choice(move_list)

def choose_random_move(game):
    # 1. Take mate-in-1 if available
    for move in game.legal_moves:
        game.push(move)
        is_mate = game.current_status == GameStatus.CHECKMATE
        game.pop()
        if is_mate:
            return move

    captures = [move for move in game.legal_moves if move.captured != EMPTY]
    random.shuffle(captures)
    for move in captures:
        piece_value = PIECE_VALUES[abs(move.captured)]
        if random.random() < piece_value / 10:
            return move

    return random.choice(game.legal_moves)

def evaluate(board):
    score = 0
    for p in board.squares:
        if p != EMPTY:
            side = 1 if p > 0 else -1
            score += PIECE_VALUES[abs(p)] * side
    return score

def minimax(board, gen, depth, alpha, beta):
    if depth == 0:
        return quiescence(board, gen, alpha, beta)

    side = board.side
    moves = gen.generate_moves(board)
    
    mvv_lva = sorted(moves, key=lambda move: PIECE_VALUES[abs(move.captured)] - PIECE_VALUES[abs(board.piece_at(move.from_sq))], reverse=True)

    if side == WHITE:
        score = float('-inf')
    else:
        score = float('inf')

    for move in mvv_lva:
        undo = board.make_move(move)
        move_score = minimax(board, gen, depth - 1, alpha, beta)
        board.unmake_move(move, undo)

        if side == WHITE and move_score > score:
            score = move_score
            alpha = max(alpha, score)
            if score >= beta:
                return score
        elif side == BLACK and move_score < score:
            score = move_score
            beta = min(beta, score)
            if score <= alpha:
                return score

    return score

def quiescence(board, gen, alpha, beta, depth=2):
    stand_pat = evaluate(board)

    if board.side == WHITE:
        if stand_pat >= beta:
            return stand_pat
        alpha = max(alpha, stand_pat)
    else:
        if stand_pat <= alpha:
            return stand_pat
        beta = min(beta, stand_pat)

    if depth == 0:
        return stand_pat

    captures = [move for move in gen.generate_moves(board) if move.captured != EMPTY]

    if not captures:
        return stand_pat

    side = board.side
    if side == WHITE:
        score = float('-inf')
    else:
        score = float('inf')

    for move in captures:
        undo = board.make_move(move)
        move_score = quiescence(board, gen, alpha, beta, depth - 1)
        board.unmake_move(move, undo)

        if side == WHITE and move_score > score:
            score = move_score
            alpha = max(alpha, score)
            if score >= beta:
                return score
        elif side == BLACK and move_score < score:
            score = move_score
            beta = min(beta, score)
            if score <= alpha:
                return score

    return score