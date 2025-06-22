import random
from sanic import response
from sqlalchemy.future import select
from helpers.database.database import SessionLocal
from models.user_pokemon import UserPokemon
from models.pokemon import Pokemon
from models.user import User

async def draw_user_cards(request):
    user_id = request.ctx.session.get("user_id")
    if not user_id:
        return response.json({"error": "Usuário não autenticado."}, 401)

    async with SessionLocal() as db:
        # coleta todos os pokémons que o usuário possui
        result = await db.execute(
            select(UserPokemon.id_pokemon, UserPokemon.rarity)
            .where(UserPokemon.id_user == user_id)
        )
        owned = result.all()
        if not owned:
            return response.json([], 200)

        # embaralha e pega até 5
        sampled = random.sample(owned, min(5, len(owned)))
        cards = []
        for pid, rarity in sampled:
            pok = await db.get(Pokemon, pid)
            img = pok.base_image if rarity == 0 else pok.rare_image
            cards.append({
                "id":     pid,
                "image":  img,
                "hp":     pok.hp,
                "rarity": rarity,
                "owned":  True
            })
        return response.json(cards)

async def draw_enemy_card(request):
    async with SessionLocal() as db:
        result = await db.execute(select(Pokemon))
        all_cards = result.scalars().all()
        if not all_cards:
            return response.json({"error": "No cards available."}, 500)

        pok = random.choice(all_cards)
        # 25% chance of rare
        rarity = 1 if random.random() < 0.25 else 0
        img = pok.base_image if rarity == 0 else pok.rare_image
        return response.json({
            "id":     pok.id_pokemon,
            "image":  img,
            "hp":     pok.hp,
            "rarity": rarity,
            "owned":  False
        })

async def resolve_combat(request):
    try:
        data   = request.json
        player = data["player"]
        enemy  = data["enemy"]
    except:
        return response.json({"error": "Dados inválidos."}, 400)

    # compara raridade
    if player["rarity"] > enemy["rarity"]:
        return response.json({"winner": "player"})
    if player["rarity"] < enemy["rarity"]:
        return response.json({"winner": "enemy"})
    # raridades iguais → compara HP
    if player["hp"] > enemy["hp"]:
        return response.json({"winner": "player"})
    if player["hp"] < enemy["hp"]:
        return response.json({"winner": "enemy"})
    # empate
    return response.json({"winner": "draw"})

async def reward_user(request):
    user_id = request.ctx.session.get("user_id")
    if not user_id:
        return response.json({"error": "Usuário não autenticado."}, 401)

    try:
        winner = request.json["winner"]
    except:
        return response.json({"error": "Dados inválidos."}, 400)

    if winner != "player":
        return response.json({"message": "Sem recompensa para derrota."}, 200)

    # recompensa fixa, ex.: 5 moedas
    reward = 5
    async with SessionLocal() as db:
        user = await db.get(User, user_id)
        if not user:
            return response.json({"error": "Usuário não encontrado."}, 404)
        user.currency += reward
        await db.commit()
        return response.json({
            "message":  f"Você ganhou {reward} moedas!",
            "currency": user.currency
        })
    
async def draw_user_one(request):
    user_id = request.ctx.session.get("user_id")
    if not user_id:
        return response.json({"error":"Usuário não autenticado."},401)

    async with SessionLocal() as db:
        result = await db.execute(
            select(UserPokemon.id_pokemon, UserPokemon.rarity)
            .where(UserPokemon.id_user==user_id)
        )
        owned = result.all()
        if not owned:
            return response.json({"error":"Sem cartas."},400)

        pid, rarity = random.choice(owned)
        pok = await db.get(Pokemon, pid)
        img = pok.base_image if rarity==0 else pok.rare_image
        return response.json({
            "id":     pid,
            "image":  img,
            "hp":     pok.hp,
            "rarity": rarity,
            "owned":  True
        })