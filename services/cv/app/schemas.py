from pydantic import BaseModel, Field, HttpUrl


class ScanRequest(BaseModel):
    observation_id: str
    image_url: HttpUrl
    width: int | None = Field(default=None, gt=0)
    height: int | None = Field(default=None, gt=0)


class Detection(BaseModel):
    monster_name: str | None = None
    monster_level: int | None = Field(default=None, ge=0)
    map_x: int | None = None
    map_y: int | None = None
    confidence: float = Field(ge=0, le=1)
    bbox: dict[str, float] | None = None
    raw_text: str | None = None


class ScanResponse(BaseModel):
    observation_id: str
    detections: list[Detection]
    processor_version: str
    warnings: list[str] = []
