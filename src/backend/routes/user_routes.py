from sanic import Blueprint
from controllers.user_controller import create_user, login_user

bp_user = Blueprint("user", url_prefix="/user")

bp_user.add_route(create_user, "/register", methods=["POST"])
bp_user.add_route(login_user, "/login", methods=["POST"])
