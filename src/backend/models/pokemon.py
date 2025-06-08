# src/backend/models/pokemon.py
from sqlalchemy import Column, Integer, String
from src.backend.models import Base

class Pokemon(Base):  # ✅ Corrigir nome da classe
    __tablename__ = "pokemon"

    id_pokemon = Column(Integer, primary_key=True, index=True)
    base_image = Column(String, nullable=False)
    rare_image = Column(String, nullable=False)
    hp = Column(Integer, nullable=False)
