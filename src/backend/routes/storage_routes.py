from sanic import Blueprint
from controllers.storage_controller import (
    get_combined_pokemons,
    get_user_currency,
    buy_card
)

bp_storage = Blueprint("storage_routes")

bp_storage.add_route(get_combined_pokemons, "/storage/pokemons", methods=["GET"])
bp_storage.add_route(get_user_currency, "/storage/currency", methods=["GET"])
bp_storage.add_route(buy_card, "/storage/buy", methods=["POST"])