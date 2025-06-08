# src/backend/models/user_pokemon.py
from sqlalchemy import Column, Integer, ForeignKey, PrimaryKeyConstraint
from src.backend.models import Base

class UserPokemon(Base):
    __tablename__ = "user_pokemon"

    id_user = Column(Integer, ForeignKey("user.id_user", ondelete="CASCADE"), nullable=False)
    id_pokemon = Column(Integer, ForeignKey("pokemon.id_pokemon", ondelete="CASCADE"), nullable=False)
    rarity = Column(Integer, nullable=False)

    __table_args__ = (
        PrimaryKeyConstraint('id_user', 'id_pokemon'),
    )
