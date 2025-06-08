from sanic.response import json
from helpers.database.database import SessionLocal
from models.pokemon import Pokemon
from models.user import User
from models.user_pokemon import UserPokemon
from sqlalchemy.future import select

async def get_all_pokemon(request):
    async with SessionLocal() as session:
        result = await session.execute(select(Pokemon))
        pokemons = result.scalars().all()
        return json([{
            "id_pokemon": p.id_pokemon,
            "base_image": p.base_image,
            "rare_image": p.rare_image,
            "hp": p.hp
        } for p in pokemons])

async def get_all_users(request):
    async with SessionLocal() as session:
        result = await session.execute(select(User))
        users = result.scalars().all()
        return json([{
            "id_user": u.id_user,
            "login": u.login,
            "currency": u.currency
        } for u in users])

async def get_pokemon_by_user(request, id_user):
    async with SessionLocal() as session:
        result = await session.execute(
            select(UserPokemon).where(UserPokemon.id_user == id_user)
        )
        user_pokemons = result.scalars().all()
        return json([{
            "id_pokemon": up.id_pokemon,
            "rarity": up.rarity
        } for up in user_pokemons])
