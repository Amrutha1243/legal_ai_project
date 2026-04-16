from pypdf import PdfReader
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import os

# Internal storage encapsulated within the module
module_pdf_chunks = []
module_pdf_vectorizer = None
module_pdf_vectors = None

def process_pdf(filepath):
    """
    Extracts text from PDF and builds the internal vector database.
    (Operates alongside existing app object without modifying its core).
    """
    global module_pdf_chunks, module_pdf_vectorizer, module_pdf_vectors
    try:
        reader = PdfReader(filepath)
        chunks = []
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                lines = page_text.split('\n')
                chunks.extend([line.strip() for line in lines if len(line.strip()) > 10])
                
        if not chunks:
            return False, "Could not extract text from PDF."
            
        module_pdf_chunks = chunks
        module_pdf_vectorizer = TfidfVectorizer(stop_words='english', ngram_range=(1, 2))
        module_pdf_vectors = module_pdf_vectorizer.fit_transform(module_pdf_chunks)
        
        return True, "PDF Processed and securely stored in memory."
    except Exception as e:
        print(f"PDF Engine Error: {e}")
        return False, str(e)

def ask_pdf(search_query_english):
    """
    Searches the stored PDF text using the internal text vectors.
    """
    global module_pdf_chunks, module_pdf_vectorizer, module_pdf_vectors
    if not module_pdf_chunks or module_pdf_vectorizer is None:
        return ""

    try:
        query_vec = module_pdf_vectorizer.transform([search_query_english])
        similarities = cosine_similarity(query_vec, module_pdf_vectors).flatten()
        best_idx = np.argmax(similarities)
        best_score = similarities[best_idx]
        
        if best_score > 0.05: 
            result_text = module_pdf_chunks[best_idx]
            # Grab context 
            if len(result_text.split()) < 15 and best_idx < len(module_pdf_chunks)-1:
                result_text += " " + module_pdf_chunks[best_idx+1]
            return result_text
            
        return ""
    except Exception as e:
        print(f"PDF QA Retreival Error: {e}")
        return ""
