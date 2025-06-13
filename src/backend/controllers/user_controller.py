from sanic import response
from sqlalchemy.future import select
from sqlalchemy.exc import IntegrityError
from models.user import User
from models.user_pokemon import UserPokemon
from helpers.database.database import SessionLocal
import traceback

async def create_user(request):
    try:
        data = request.json
        login = data.get("login")

        if not login:
            return response.json({"error": "Login é obrigatório."}, status=400)

        async with SessionLocal() as db:
            user = User(login=login, currency=10)
            db.add(user)
            try:
                await db.commit()
                await db.refresh(user)
            except IntegrityError:
                await db.rollback()
                return response.json({"error": "Login já existe."}, status=409)

            # Adiciona os 26 primeiros Pokémon
            for poke_id in range(1, 27):
                user_pokemon = UserPokemon(
                    id_user=user.id_user,
                    id_pokemon=poke_id,
                    rarity=0
                )
                db.add(user_pokemon)
            await db.commit()

            # Salva na sessão
            request.ctx.session["user_id"] = user.id_user
            return response.json({"message": "Usuário criado com sucesso!", "user_id": user.id_user})

    except Exception as e:
        return response.json({"error": str(e)}, status=500)

async def login_user(request):
    try:
        data = request.json
        login = data.get("login")

        if not login:
            return response.json({"error": "Login é obrigatório."}, status=400)

        async with SessionLocal() as db:
            result = await db.execute(select(User).where(User.login == login))
            user = result.scalar_one_or_none()
            if not user:
                return response.json({"error": "Usuário não encontrado."}, status=404)

            request.ctx.session["user_id"] = user.id_user
            return response.json({"message": "Login realizado com sucesso!", "user_id": user.id_user})

    except Exception as e:
        print("💥 Erro em login_user:")
        traceback.print_exc()  # ✅ mostra o erro real no terminal
        return response.json({"error": str(e)}, status=500)
