"""
Text Engine Service Module.

Provides isolated computational methods for lexical parsing, string normalization,
and structural feature extraction. 
"""

import re
from textblob import TextBlob
from nltk.stem import SnowballStemmer
from nltk.tokenize import word_tokenize
import spacy

# Global components initialized with distinct naming schemes
word_reducer = SnowballStemmer("english")
_nlp_model_cache = None

def _fetch_language_model():
    """Lazy initializer for structural dependencies like NER mapping."""
    global _nlp_model_cache
    if _nlp_model_cache is None:
        try:
            _nlp_model_cache = spacy.load("en_core_web_sm")
        except OSError:
            raise RuntimeError("Required pipeline component missing. Please install en_core_web_sm.")
    return _nlp_model_cache


class TextEngineService:
    """Container class that exposes core NLP utilities as operational methods."""

    def extract_tokens(self, raw_string: str) -> list[str]:
        """Slices a continuous text block into discrete atomic tokens."""
        normalized = " ".join(raw_string.split())
        return [str(token) for token in word_tokenize(normalized) if token.strip()]

    def extract_lemmas(self, raw_string: str) -> list[str]:
        """Reduces words to their semantic dictionary base forms using TextBlob morph-rules."""
        normalized = " ".join(raw_string.split())
        blob = TextBlob(normalized)
        return [str(word.lemma) for word in blob.words]

    def extract_stems(self, raw_string: str) -> list[str]:
        """Trims suffixes using algorithmic rules via the Snowball paradigm."""
        normalized = " ".join(raw_string.split())
        token_list = word_tokenize(normalized)
        
        transformed_stems = []
        for current_item in token_list:
            if not current_item.strip():
                continue
            # Only stem standard characters, leave syntax markers raw
            if current_item.isalnum():
                transformed_stems.append(word_reducer.stem(current_item.lower()))
            else:
                transformed_stems.append(current_item)
                
        return transformed_stems

    def compute_pos_tags(self, raw_string: str) -> list[dict[str, str]]:
        """Identifies lexical classifications for every component word."""
        normalized = " ".join(raw_string.split())
        blob = TextBlob(normalized)
        
        dataset_records = []
        for element, structural_tag in blob.tags:
            dataset_records.append({
                "word_item": str(element),
                "syntactic_category": str(structural_tag),
                "meta_description": f"Grammar code: {structural_tag}"
            })
        return dataset_records

    def parse_named_entities(self, raw_string: str) -> list[dict[str, str]]:
        """Discovers explicitly named locations, entities, and corporate titles."""
        normalized = " ".join(raw_string.split())
        pipeline = _fetch_language_model()(normalized)
        
        found_entities = []
        for entity_item in pipeline.ents:
            found_entities.append({
                "matched_text": entity_item.text,
                "entity_type": entity_item.label_,
                "type_details": spacy.explain(entity_item.label_) or "Unknown Category"
            })
        return found_entities

    def execute_comprehensive_analysis(self, raw_string: str) -> dict:
        """Executes all structural text features in a singular pipeline pass."""
        normalized = " ".join(raw_string.split())
        
        # Intercept and map internal instance methods smoothly
        token_collection = self.extract_tokens(normalized)
        lemma_collection = self.extract_lemmas(normalized)
        stem_collection = self.extract_stems(normalized)
        pos_collection = self.compute_pos_tags(normalized)
        entity_collection = self.parse_named_entities(normalized)
        
        return {
            "extracted_tokens": token_collection,
            "base_lemmas": lemma_collection,
            "word_stems": stem_collection,
            "grammatical_tags": pos_collection,
            "identified_entities": entity_collection
        }


# CRUCIAL: Instantiate the exact object variable your router is looking to import!
nlp_service = TextEngineService()