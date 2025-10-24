"""Routes for doubt ingestion and retrieval."""

from __future__ import annotations

from functools import lru_cache
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from app.core.mcp.input_parser import ExtractionResult, InputParser, InputParserError
from app.core.pil.classifier import ClassificationError, SubjectClassifier
from app.core.rag.embeddings import EmbeddingError, EmbeddingService, get_embedding_service
from app.core.rag.retriever import RetrievalError, VectorRetriever
from app.models.doubt import DoubtCreate, DoubtUploadResponse, InputType
from app.repositories.doubt_repository import DoubtRepository
from app.utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/doubts", tags=["doubts"])


def get_input_parser() -> InputParser:
    """Return a new InputParser instance for each request."""

    return InputParser()


@lru_cache(maxsize=1)
def get_subject_classifier() -> SubjectClassifier:
    """Return a cached subject classifier instance."""

    # SubjectClassifier internally manages fallback stubs via settings.
    return SubjectClassifier()


@lru_cache(maxsize=1)
def get_vector_retriever() -> VectorRetriever:
    """Return a cached vector retriever instance."""

    return VectorRetriever()


@lru_cache(maxsize=1)
def get_doubt_repository() -> DoubtRepository:
    """Return a repository instance for persistence."""

    return DoubtRepository()


@router.post("/upload_doubt", response_model=DoubtUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_doubt(
    user_id: str = Form(..., description="Supabase user identifier"),
    input_type: InputType = Form(..., description="Type of incoming payload"),
    text: str = Form("", description="Optional text description of the doubt"),
    user_additional_text: Optional[str] = Form(None, description="Extra context from student"),
    exam_type: str = Form("JEE", description="Exam stream"),
    image: Optional[UploadFile] = File(None, description="Optional image containing the doubt"),
    parser: InputParser = Depends(get_input_parser),
    classifier: SubjectClassifier = Depends(get_subject_classifier),
    embeddings: EmbeddingService = Depends(get_embedding_service),
    retriever: VectorRetriever = Depends(get_vector_retriever),
    repository: DoubtRepository = Depends(get_doubt_repository),
) -> DoubtUploadResponse:
    """Ingest a doubt, run MCP + PIL + RAG primitives, and persist the record."""

    parser_context = {"user_id": user_id, "input_type": input_type}

    try:
        extraction = await _run_parser(parser, input_type, text, image, parser_context)
    except InputParserError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    classification_confidence = extraction.confidence
    subject = extraction.subject
    topic = extraction.topic
    subtopic = extraction.subtopic

    if extraction.extracted_text:
        try:
            classification = await classifier.classify(extraction.extracted_text)
            subject = subject or classification["subject"]
            topic = topic or classification.get("topic")
            classification_confidence = max(classification_confidence, classification.get("confidence", 0.0))
        except ClassificationError as exc:  # pragma: no cover - defensive logging
            logger.warning("Subject classification failed", extra={"error": str(exc)})

    # Ensure fallback defaults so persistence always has core taxonomy
    subject = subject or "General"
    classification_confidence = float(classification_confidence)

    # Embed and retrieve similar contexts (best-effort)
    if extraction.extracted_text:
        try:
            embedding_vector = await embeddings.embed_query(extraction.extracted_text)
            filters: Optional[Dict[str, Any]] = {"subject": subject} if subject else None
            contexts = await retriever.retrieve(embedding_vector, filters=filters)
            logger.info("Retrieved candidate contexts", extra={"count": len(contexts)})
        except (EmbeddingError, RetrievalError) as exc:  # pragma: no cover - best-effort logging
            logger.warning("Context retrieval failed", extra={"error": str(exc)})
    else:
        logger.warning("Skipping context retrieval due to empty extracted text")

    create_payload = DoubtCreate(
        user_id=user_id,
        doubt_text=extraction.extracted_text,
        doubt_image_url=None,  # TODO: integrate Supabase storage and set actual URL
        user_additional_text=user_additional_text,
        input_type=extraction.input_type,
        subject=subject,
        topic=topic,
        subtopic=subtopic,
        exam_type=exam_type,
        entities=extraction.entities,
        extracted_text=extraction.extracted_text,
    )

    try:
        record = await repository.create(create_payload)
    except Exception as exc:  # pragma: no cover - surface persistence issues
        logger.exception("Failed to persist doubt", extra={"user_id": user_id, "error": str(exc)})
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to persist doubt") from exc

    return DoubtUploadResponse(
        doubt_id=record.id,
        extracted_text=extraction.extracted_text,
        subject=subject,
        topic=topic,
        confidence=classification_confidence,
        input_type=extraction.input_type,
        entities=extraction.entities,
    )


async def _run_parser(
    parser: InputParser,
    input_type: InputType,
    text: str,
    image: Optional[UploadFile],
    context: Dict[str, Any],
) -> ExtractionResult:
    """Route to the appropriate parser based on the declared input type."""

    if input_type == "text":
        if not text.strip():
            raise InputParserError("Text payload required for text input type")
        return await parser.parse_text(text, context=context)

    if input_type == "image":
        if image is None:
            raise InputParserError("Image file required for image input type")
        image_bytes = await image.read()
        if not image_bytes:
            raise InputParserError("Uploaded image is empty")
        mime_type = image.content_type or "image/png"
        return await parser.parse_image(image_bytes, mime_type=mime_type, context=context)

    if input_type == "multimodal":
        if image is None or not text.strip():
            raise InputParserError("Both image and text required for multimodal input type")
        image_bytes = await image.read()
        if not image_bytes:
            raise InputParserError("Uploaded image is empty")
        mime_type = image.content_type or "image/png"
        return await parser.parse_multimodal(image_bytes, text, mime_type=mime_type, context=context)

    raise InputParserError("Unsupported input type supplied")
