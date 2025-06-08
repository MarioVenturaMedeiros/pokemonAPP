from sanic import Blueprint
from sanic.response import json
import asyncio
from backend.controllers.populate_controller import populate

bp_populate = Blueprint("populate", url_prefix="/populate")

@bp_populate.get("/")
async def trigger_population(request):
    asyncio.create_task(populate())  # roda em segundo plano
    return json({"message": "População iniciada em background."})
