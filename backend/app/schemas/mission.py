from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from pydantic import BaseModel, ConfigDict, Field, field_validator


class MissionChangeRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')
    version: int = Field(ge=0, strict=True)


class MissionTimezoneRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')
    timezone: str = Field(min_length=1, max_length=100)

    @field_validator('timezone')
    @classmethod
    def valid_timezone(cls, value):
        try:
            ZoneInfo(value)
        except (ValueError, ZoneInfoNotFoundError):
            raise ValueError('Invalid IANA timezone') from None
        return value
