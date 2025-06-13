from sanic import Sanic
from sanic_ext import Extend
from sanic_cors import CORS
from sanic_session import Session, InMemorySessionInterface

from routes.database_routes import bp
from routes.populate_routes import bp_populate
from routes.storage_routes import bp_storage
from routes.user_routes import bp_user  # 🆕 user
from models import Base
from helpers.database.database import engine

app = Sanic("pokemonAPP")
Extend(app)
CORS(app, supports_credentials=True)

Session(app, interface=InMemorySessionInterface())

# Registra Blueprints
app.blueprint(bp)
app.blueprint(bp_populate)
app.blueprint(bp_storage)
app.blueprint(bp_user)

@app.before_server_start
async def setup_database(app, _):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
