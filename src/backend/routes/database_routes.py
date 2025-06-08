# src/backend/routes/user_routes.py
from sanic import Blueprint
from backend.controllers.database_controller import (
    get_all_pokemon,
    get_all_users,
    get_pokemon_by_user
)

bp = Blueprint("database_routes")

bp.add_route(get_all_pokemon, "/pokemon", methods=["GET"])
bp.add_route(get_all_users, "/user", methods=["GET"])
bp.add_route(get_pokemon_by_user, "/user/<id_user:int>/pokemon", methods=["GET"])