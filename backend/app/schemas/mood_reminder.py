from zoneinfo import ZoneInfo, ZoneInfoNotFoundError
from pydantic import BaseModel, ConfigDict, Field, field_validator


class MoodReminderRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    timezone: str = Field(min_length=1, max_length=64)

    @field_validator("timezone")
    @classmethod
    def valid_zone(cls, value: str) -> str:
        try:
            ZoneInfo(value)
        except (ZoneInfoNotFoundError, ValueError):
            raise ValueError("Invalid timezone")
        return value
