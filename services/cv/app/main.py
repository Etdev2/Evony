from fastapi import FastAPI

from .schemas import ScanRequest, ScanResponse

app = FastAPI(title="Evony Scout CV", version="0.1.0")


@app.get("/health")
def health() -> dict[str, str]:
    return {"service": "evony-scout-cv", "status": "ok"}


@app.post("/v1/scan", response_model=ScanResponse)
def scan(request: ScanRequest) -> ScanResponse:
    # Contract-first placeholder. The recognition pipeline will replace this
    # implementation once versioned screenshot fixtures are available.
    return ScanResponse(
        observation_id=request.observation_id,
        detections=[],
        processor_version="contract-0.1.0",
        warnings=["recognition_pipeline_not_configured"],
    )
