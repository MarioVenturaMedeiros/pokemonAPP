from sanic import Blueprint
from sanic.response import json
from controllers.populate_controller import populate
import threading

bp_populate = Blueprint("populate", url_prefix="/populate")

@bp_populate.get("/")
async def trigger_population(request):
    # roda em uma thread separada (sem bloquear o servidor)
    threading.Thread(target=populate).start()
    return json({"message": "População iniciada em background (thread síncrona)."})
