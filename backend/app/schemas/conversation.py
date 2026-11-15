from pydantic import BaseModel, ConfigDict, Field, StrictInt, field_validator


class CommentCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    body: str = Field(min_length=1, max_length=1000)
    parent_id: str | None = Field(default=None, min_length=1, max_length=100)

    @field_validator("body")
    @classmethod
    def nonblank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Comment cannot be blank")
        return value.strip()


class CommentEdit(CommentCreate):
    parent_id: None = None
    version: StrictInt = Field(ge=0)


class CommentVersion(BaseModel):
    model_config = ConfigDict(extra="forbid")
    version: StrictInt = Field(ge=0)
