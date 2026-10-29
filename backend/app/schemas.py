from typing import Literal

from pydantic import BaseModel, Field


class ReportGenerateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=160)
    format: Literal["pdf", "csv", "xlsx"]
    sections: list[str]
    filters: dict[str, str | int] = Field(default_factory=dict)
