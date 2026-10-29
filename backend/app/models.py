from sqlalchemy import Date, DateTime, Float, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


class Crime(Base):
    __tablename__ = "crimes"
    __table_args__ = (
        Index("ix_crimes_date", "date"),
        Index("ix_crimes_datetime", "datetime"),
        Index("ix_crimes_area", "area"),
        Index("ix_crimes_crime_type", "crime_type"),
        Index("ix_crimes_severity", "severity"),
        Index("ix_crimes_status", "status"),
        Index("ix_crimes_police_station", "police_station"),
    )

    crime_id: Mapped[str] = mapped_column(String(100), primary_key=True)
    date: Mapped[object] = mapped_column(Date, nullable=False)
    time: Mapped[str | None] = mapped_column(String(20), nullable=True)
    datetime: Mapped[object | None] = mapped_column(DateTime, nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    area: Mapped[str] = mapped_column(String(150), nullable=False)
    crime_type: Mapped[str] = mapped_column(String(150), nullable=False)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    severity: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str | None] = mapped_column(String(80), nullable=True)
    victim_age: Mapped[int | None] = mapped_column(Integer, nullable=True)
    victim_gender: Mapped[str | None] = mapped_column(String(50), nullable=True)
    weapon_used: Mapped[str | None] = mapped_column(String(150), nullable=True)
    police_station: Mapped[str | None] = mapped_column(String(150), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    source: Mapped[str | None] = mapped_column(String(100), nullable=True)
    source_record_id: Mapped[str | None] = mapped_column(String(150), nullable=True)
