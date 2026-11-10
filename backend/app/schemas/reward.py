from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, StringConstraints, field_validator, model_validator

Title=Annotated[str,StringConstraints(strip_whitespace=True,min_length=1,max_length=80)]


class RewardInput(BaseModel):
    model_config=ConfigDict(extra='forbid')
    title_vi: Title
    title_en: Title
    description_vi: str=Field(default='',max_length=500)
    description_en: str=Field(default='',max_length=500)
    price_points: int=Field(gt=0,le=1000000,strict=True)
    stock: int=Field(ge=0,le=1000000,strict=True)
    fanpage_url: HttpUrl
    active: bool=True

    @field_validator('fanpage_url')
    @classmethod
    def safe_url(cls,value):
        if value.scheme!='https' or value.username or value.password or len(str(value))>2048:
            raise ValueError('An HTTPS URL without credentials is required')
        return value


class RewardUpdate(RewardInput):
    revision: int=Field(ge=0,strict=True)


class RedemptionInput(BaseModel):
    model_config=ConfigDict(extra='forbid')
    reward_id: str=Field(min_length=1,max_length=120)
    expected_price: int=Field(gt=0,le=1000000,strict=True)


class FulfillmentInput(BaseModel):
    model_config=ConfigDict(extra='forbid')
    status: Literal['shipped','delivered']
    fulfillment_reference: str|None=Field(default=None,min_length=1,max_length=120)

    @model_validator(mode='after')
    def require_reference(self):
        if self.status=='shipped' and not (self.fulfillment_reference or '').strip():
            raise ValueError('An actual fulfillment reference is required')
        return self


class MissionRulesInput(BaseModel):
    model_config=ConfigDict(extra='forbid')
    individual_points: int=Field(ge=1,le=100,strict=True)
    shared_points: int=Field(ge=1,le=200,strict=True)
    weekly_target: int=Field(ge=1,le=28,strict=True)
    weekly_bonus: int=Field(ge=0,le=1000,strict=True)
    monthly_target: int=Field(ge=1,le=124,strict=True)
    monthly_bonus: int=Field(ge=0,le=5000,strict=True)
