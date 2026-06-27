"""
API Route Controller for Linguistic String Transformations.

Maintains minimalist, thin endpoint layouts to decouple request interception 
from computational pipeline steps.
"""

from fastapi import APIRouter, HTTPException

# Absolute module path schema lookups
from backend.models.schemas import (
    AnalyzeResponse,
    EntitiesResponse,
    LemmasResponse,
    PosTagsResponse,
    StemsResponse,
    TextRequest,
    TokensResponse,
)
from backend.services.nlp_service import nlp_service as text_engine_service

# Completely renamed the internal prefix path and tags
text_router = APIRouter(prefix="/lexical", tags=["TextEngineering"])


def _intercept_operational_faults(exception_instance: Exception) -> None:
    """Encapsulates system runtime failure states into formatted client HTTP codes."""
    if isinstance(exception_instance, HTTPException):
        raise exception_instance
    if isinstance(exception_instance, RuntimeError):
        raise HTTPException(status_code=500, detail=str(exception_instance))
    raise HTTPException(status_code=500, detail=f"Internal Processing Error: {str(exception_instance)}")


@text_router.post("/parse-tokens", response_model=TokensResponse)
def execute_tokenization(input_payload: TextRequest) -> TokensResponse:
    """Deconstructs continuous text blocks into individual lexical tokens."""
    try:
        processed_tokens = text_engine_service.extract_tokens(input_payload.text)
        return TokensResponse(tokens=processed_tokens)
    except Exception as operational_error:
        _intercept_operational_faults(operational_error)


@text_router.post("/parse-lemmas", response_model=LemmasResponse)
def execute_lemmatization(input_payload: TextRequest) -> LemmasResponse:
    """Normalizes variant word shapes to canonical semantic root forms."""
    try:
        processed_lemmas = text_engine_service.extract_lemmas(input_payload.text)
        return LemmasResponse(lemmas=processed_lemmas)
    except Exception as operational_error:
        _intercept_operational_faults(operational_error)


@text_router.post("/parse-stems", response_model=StemsResponse)
def execute_stemming(input_payload: TextRequest) -> StemsResponse:
    """Trims morphological lexical endings utilizing rule-based truncation."""
    try:
        processed_stems = text_engine_service.extract_stems(input_payload.text)
        return StemsResponse(stems=processed_stems)
    except Exception as operational_error:
        _intercept_operational_faults(operational_error)


@text_router.post("/classify-pos", response_model=PosTagsResponse)
def execute_pos_tagging(input_payload: TextRequest) -> PosTagsResponse:
    """Evaluates contextual data to extract syntactic category indicators."""
    try:
        raw_tags = text_engine_service.compute_pos_tags(input_payload.text)
        formatted_pos = [
            {
                "token": item["word_item"],
                "pos": item["syntactic_category"],
                "tag": item["syntactic_category"],
                "description": item["meta_description"]
            }
            for item in raw_tags
        ]
        # Validated unpacking via keyword assignment to support Pydantic mappings safely
        return PosTagsResponse(pos_tags=formatted_pos)
    except Exception as operational_error:
        _intercept_operational_faults(operational_error)


@text_router.post("/extract-ner", response_model=EntitiesResponse)
def execute_ner_extraction(input_payload: TextRequest) -> EntitiesResponse:
    """Discovers classified proper names, operational groups, and locations."""
    try:
        raw_entities = text_engine_service.parse_named_entities(input_payload.text)
        formatted_entities = [
            {
                "text": item["matched_text"],
                "label": item["entity_type"],
                "description": item["type_details"]
            }
            for item in raw_entities
        ]
        return EntitiesResponse(entities=formatted_entities)
    except Exception as operational_error:
        _intercept_operational_faults(operational_error)


@text_router.post("/run-all", response_model=AnalyzeResponse)
def execute_full_analysis(input_payload: TextRequest) -> AnalyzeResponse:
    """Aggregates all textual pipeline transformations in a single optimized lifecycle."""
    try:
        computed_matrix = text_engine_service.execute_comprehensive_analysis(input_payload.text)
        
        # Maps keys completely down the column mapping structure
        formatted_pos = [
            {
                "token": item["word_item"],
                "pos": item["syntactic_category"],
                "tag": item["syntactic_category"],
                "description": item["meta_description"]
            }
            for item in computed_matrix["grammatical_tags"]
        ]
        
        formatted_entities = [
            {
                "text": item["matched_text"],
                "label": item["entity_type"],
                "description": item["type_details"]
            }
            for item in computed_matrix["identified_entities"]
        ]

        return AnalyzeResponse(
            tokens=computed_matrix["extracted_tokens"],
            lemmas=computed_matrix["base_lemmas"],
            stems=computed_matrix["word_stems"],
            pos_tags=formatted_pos,
            entities=formatted_entities
        )
    except Exception as operational_error:
        _intercept_operational_faults(operational_error)