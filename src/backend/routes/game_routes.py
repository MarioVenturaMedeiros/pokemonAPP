from sanic import Blueprint
from controllers.game_controller import (
    draw_user_cards,
    draw_user_one,
    draw_enemy_card,
    resolve_combat,
    reward_user
)

bp_game = Blueprint("game", url_prefix="/game")

bp_game.add_route(draw_user_cards, "/draw",   methods=["GET"])
bp_game.add_route(draw_user_one,   "/draw_one",methods=["GET"])
bp_game.add_route(draw_enemy_card, "/enemy",  methods=["GET"])
bp_game.add_route(resolve_combat,  "/resolve",methods=["POST"])
bp_game.add_route(reward_user,     "/reward", methods=["POST"])
