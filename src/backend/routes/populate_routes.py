from sanic import Blueprint
from sanic.response import json
import asyncio

from controllers.populate_controller import populate

bp_populate = Blueprint("populate", url_prefix="/populate")

@bp_populate.get("/")
async def trigger_population(request):
    # Inicia a função populate de forma assíncrona em background
    asyncio.create_task(populate())
    return json({"message": "População iniciada em background (async)."})