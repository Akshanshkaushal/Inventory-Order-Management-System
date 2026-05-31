from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class CustomerBase(BaseModel):
    full_name: str = Field(min_length=2, max_length=160, examples=["Avery Stone"])
    email: EmailStr = Field(examples=["avery@example.com"])
    phone_number: str = Field(min_length=7, max_length=32, examples=["+1-555-0102"])

    @field_validator("full_name", "phone_number")
    @classmethod
    def strip_text(cls, value: str) -> str:
        return value.strip()

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.lower()


class CustomerCreate(CustomerBase):
    pass


class CustomerRead(CustomerBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

