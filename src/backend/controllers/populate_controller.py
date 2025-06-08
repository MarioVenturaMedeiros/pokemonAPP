import asyncio
import aiohttp
import os
import json
from urllib.parse import quote
from dotenv import load_dotenv
from sqlalchemy.future import select
from sqlalchemy.exc import IntegrityError

from models.pokemon import Pokemon
from models.user import User
from models.user_pokemon import UserPokemon
from helpers.database.database import SessionLocal

load_dotenv()
HEADERS = {}
POKE_API = "https://api.pokemontcg.io/v2/cards"
pokedex = json.loads(os.getenv("POKEDEX_JSON"))
MAX_RETRIES = 3

async def fetch_pokemon_cards(session, name):
    encoded_name = quote(f'"{name}"')
    url = f"{POKE_API}?q=name:{encoded_name}&pageSize=100"
    print(f"🔍 Buscando: {url}")
    try:
        async with session.get(url, headers=HEADERS) as resp:
            if resp.status != 200:
                print(f"❌ Falha ao buscar {name} — Status HTTP: {resp.status}")
                return []
            try:
                data = await resp.json()
                return data.get("data", [])
            except aiohttp.ContentTypeError:
                print(f"❌ Erro ao decodificar JSON para {name}")
                return []
    except aiohttp.ClientError as e:
        print(f"❌ Erro de rede ao buscar {name}: {e}")
        return []

def get_best_card(cards):
    if not cards:
        return None
    cards = [c for c in cards if 'images' in c and 'hp' in c and c['hp'].isdigit()]
    if not cards:
        return None
    cards.sort(key=lambda x: int(x['hp']), reverse=True)
    return cards[0]

async def process_pokemon(db, http_session, user, poke_id, name):
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            cards = await fetch_pokemon_cards(http_session, name)
            best = get_best_card(cards)

            if not best:
                print(f"❌ Nenhuma carta válida para {name}")
                return False

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

            return True  # sucesso
        except Exception as e:
            print(f"⚠️ Tentativa {attempt} falhou para {name}: {e}")
            await asyncio.sleep(1)
    print(f"💥 Todas as tentativas falharam para {name}")
    return False

async def populate():
    async with aiohttp.ClientSession() as http_session:
        async with SessionLocal() as db:
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

            for poke_id_str, name in pokedex.items():
                poke_id = int(poke_id_str)
                await process_pokemon(db, http_session, user, poke_id, name)

if __name__ == "__main__":
    asyncio.run(populate())
