from sanic import Sanic
from sanic_ext import Extend
from sanic_cors import CORS

from backend.routes.database_routes import bp  # corrigido
from backend.models import Base
from backend.helpers.database.database import engine

app = Sanic("pokemonAPP")
Extend(app)
CORS(app)

app.blueprint(bp)

@app.before_server_start
async def setup_database(app, _):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
