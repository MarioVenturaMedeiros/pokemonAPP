from sanic import response
from sqlalchemy.future import select
from models.pokemon import Pokemon
from models.user_pokemon import UserPokemon
from models.user import User
from helpers.database.database import SessionLocal
from sqlalchemy import update, insert
from sqlalchemy.exc import IntegrityError

async def get_user_pokemons_list(user_id: int, db):
    result = await db.execute(
        select(UserPokemon, Pokemon)
        .join(Pokemon, Pokemon.id_pokemon == UserPokemon.id_pokemon)
        .where(UserPokemon.id_user == user_id)
    )

    pokemons = []
    pokemon_ids = set()
    for user_pokemon, pokemon in result.all():
        image = pokemon.base_image if user_pokemon.rarity == 0 else pokemon.rare_image
        pokemons.append({
            "id": pokemon.id_pokemon,
            "image": image,
            "hp": pokemon.hp
        })
        pokemon_ids.add(pokemon.id_pokemon)

    return pokemons, pokemon_ids

async def get_remaining_pokemons_list(pokemon_ids: set, offset: int, limit: int, db):
    stmt = (
        select(Pokemon)
        .where(Pokemon.id_pokemon.notin_(pokemon_ids))
        .order_by(Pokemon.id_pokemon)
        .offset(offset)
        .limit(limit)
    )
    result = await db.execute(stmt)
    pokemons = result.scalars().all()

    return [
        {
            "id": p.id_pokemon,
            "image": p.base_image,
            "hp": p.hp
        } for p in pokemons
    ]

async def get_combined_pokemons(request):
    user_id = request.ctx.session.get("user_id")
    if not user_id:
        return response.json({"error": "Usuário não autenticado."}, status=401)

    offset = int(request.args.get("offset", 0))
    limit = int(request.args.get("limit", 20))

    async with SessionLocal() as db:
        user_pokemons, pokemon_ids = await get_user_pokemons_list(user_id, db)
        remaining_pokemons = await get_remaining_pokemons_list(pokemon_ids, offset, limit, db)

        combined = sorted(user_pokemons + remaining_pokemons, key=lambda p: p["id"])
        return response.json(combined)

async def get_user_currency(request):
    user_id = request.ctx.session.get("user_id")
    if not user_id:
        return response.json({"error": "Usuário não autenticado."}, status=401)

    async with SessionLocal() as db:
        result = await db.execute(select(User.currency).where(User.id_user == user_id))
        currency = result.scalar_one_or_none()

        if currency is None:
            return response.json({"error": "Usuário não encontrado."}, status=404)

        return response.json({"currency": currency})

async def buy_card(request):
    user_id = request.ctx.session.get("user_id")
    if not user_id:
        return response.json({"error": "Usuário não autenticado."}, status=401)

    try:
        data = request.json
        id_pokemon = int(data.get("id_pokemon"))
    except (TypeError, ValueError):
        return response.json({"error": "ID do Pokémon inválido ou ausente."}, status=400)

    async with SessionLocal() as db:
        # Verifica saldo do usuário
        user_result = await db.execute(select(User).where(User.id_user == user_id))
        user = user_result.scalar_one_or_none()
        if not user:
            return response.json({"error": "Usuário não encontrado."}, status=404)

        # Verifica se já possui o Pokémon
        result = await db.execute(
            select(UserPokemon).where(
                UserPokemon.id_user == user_id,
                UserPokemon.id_pokemon == id_pokemon
            )
        )
        user_pokemon = result.scalar_one_or_none()

        # Compra dependendo se já tem ou não
        if user_pokemon is None:
            if user.currency < 1:
                return response.json({"error": "Saldo insuficiente."}, status=403)

            # Adiciona o Pokémon com rarity = 0
            db.add(UserPokemon(id_user=user_id, id_pokemon=id_pokemon, rarity=0))
            user.currency -= 1
            action = "Novo Pokémon adquirido!"
        else:
            if user.currency < 3:
                return response.json({"error": "Saldo insuficiente para melhorar raridade."}, status=403)

            # Atualiza rarity para 1 se ainda for 0
            if user_pokemon.rarity == 0:
                user_pokemon.rarity = 1
                action = "Raridade atualizada!"
            else:
                action = "Você já tem esse Pokémon com raridade máxima."

            user.currency -= 3

        await db.commit()
        return response.json({
            "message": action,
            "new_currency": user.currency
        })
