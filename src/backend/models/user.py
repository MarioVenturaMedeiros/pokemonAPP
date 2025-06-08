from sqlalchemy import Column, Integer, String, CheckConstraint
from models import Base

class User(Base):
    __tablename__ = "user"

    id_user = Column(Integer, primary_key=True, autoincrement=True)
    login = Column(String, unique=True, nullable=False, index=True)
    currency = Column(Integer, nullable=False, default=0)

    __table_args__ = (
        CheckConstraint('currency >= 0', name='check_currency_non_negative'),
    )
