markdown_content = """# NLP Preprocessing & Embeddings Application

A robust FastAPI-based backend application for performing advanced Natural Language Processing (NLP) tasks and vector space analysis. This project provides a modular, thin-route API for lexical parsing, string normalization, and TF-IDF document embeddings.

## Features
- **Lexical Analysis Pipeline:** Tokenization, Lemmatization, Stemming (Snowball), Part-of-Speech (POS) tagging, and Named Entity Recognition (NER).
- **Robust POS & NER:** Powered by **spaCy** (`en_core_web_sm`) to ensure high accuracy and full compatibility with modern Python environments (bypassing legacy NLTK/TextBlob pickle constraints in Python 3.14+).
- **Vector Embeddings Space:** TF-IDF based document representation, similarity computation, and 2D visualization capabilities.
- **Unified Pipeline:** A `/run-all` endpoint that aggregates all text transformations into a single, optimized data matrix.

## Project Structure

```text
nlp-assignment/
├── backend/
│   ├── app.py                 # FastAPI application and Uvicorn entry point
│   ├── models/
│   │   └── schemas.py         # Pydantic data validation schemas
│   ├── routes/
│   │   ├── nlp_routes.py      # Thin API controllers for text operations
│   │   └── embedding_routes.py# Routes for vector space & corpus data
│   └── services/
│       ├── nlp_service.py     # Core computational text logic (spaCy/NLTK)
│       └── embedding_service.py # TF-IDF and vector math logic
├── frontend/                  # Client workspace interface
└── requirements.txt
```

## Installation

# 1. Windows PowerShell
python -m venv .venv
.\\.venv\\Scripts\\activate

# 2. Install core dependencies
pip install -r requirements.txt

# 3. Download the spaCy English model (Required for POS & NER) & NLTK
python -m spacy download en_core_web_sm

python -m nltk.downloader punkt_tab

## Run Backend

Start the FastAPI server via the provided application entry point. This will boot Uvicorn locally on port 8000.
python -m backend.app