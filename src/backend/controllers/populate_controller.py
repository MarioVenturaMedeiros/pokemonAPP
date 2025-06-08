import asyncio
import aiohttp
import os
import json
from dotenv import load_dotenv
from sqlalchemy.future import select
from sqlalchemy.exc import IntegrityError

from src.backend.models.pokemon import Pokemon
from src.backend.models.user import User
from src.backend.models.user_pokemon import UserPokemon
from src.backend.helpers.database.database import SessionLocal

load_dotenv()
HEADERS = {}
POKE_API = "https://api.pokemontcg.io/v2/cards"
pokedex = json.loads(os.getenv("POKEDEX_JSON"))

async def fetch_pokemon_cards(session, name):
    url = f"{POKE_API}?q=name:{name}&pageSize=100"
    async with session.get(url, headers=HEADERS) as resp:
        data = await resp.json()
        return data.get("data", [])

def get_best_card(cards):
    if not cards:
        return None
    cards = [c for c in cards if 'images' in c and 'hp' in c and c['hp'].isdigit()]
    if not cards:
        return None
    cards.sort(key=lambda x: (int(x['hp'])), reverse=True)
    return cards[0]

async def populate():
    async with aiohttp.ClientSession() as http_session:
        async with SessionLocal() as db:
            # Cria ou busca o usuário "burninson"
            user = User(login="burninson", currency=20)
            db.add(user)
            try:
                await db.commit()
                await db.refresh(user)
                print("✅ Usuário 'burninson' criado.")
            except IntegrityError:
                await db.rollback()
                result = await db.execute(select(User).where(User.login == "burninson"))
                user = result.scalar_one()
                print("⚠️ Usuário 'burninson' já existia.")

            # Popula todos os Pokémon no banco
            for poke_id_str, name in pokedex.items():
                poke_id = int(poke_id_str)
                cards = await fetch_pokemon_cards(http_session, name)
                best = get_best_card(cards)

                if not best:
                    print(f"❌ Nenhuma carta válida para {name}")
                    continue

                base_img = best['images']['small']
                rare_img = best['images']['small']
                hp = int(best['hp'])

                pokemon = Pokemon(
                    id_pokemon=poke_id,
                    base_image=base_img,
                    rare_image=rare_img,
                    hp=hp
                )

                db.add(pokemon)
                try:
                    await db.commit()
                    print(f"✅ Pokémon {poke_id} - {name} adicionado.")
                except IntegrityError:
                    await db.rollback()
                    print(f"⚠️ Pokémon {poke_id} - {name} já existia.")

                # Só associa Pokémon de ID 1 a 26 ao usuário
                if poke_id <= 26:
                    user_pokemon = UserPokemon(
                        id_user=user.id_user,
                        id_pokemon=poke_id,
                        rarity=0
                    )
                    db.add(user_pokemon)
                    try:
                        await db.commit()
                        print(f"🔗 {name} atribuído a 'burninson'.")
                    except IntegrityError:
                        await db.rollback()
                        print(f"⚠️ {name} já estava associado a 'burninson'.")

if __name__ == "__main__":
    asyncio.run(populate())
