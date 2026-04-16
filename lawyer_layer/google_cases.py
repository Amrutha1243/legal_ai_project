# google_cases.py
from duckduckgo_search import DDGS
from rapidfuzz import fuzz
import logging

def search_google_cases(q, num=3):
    try:
        cases = []
        with DDGS() as ddgs:
            # Broaden the search query to ensure short conversational questions don't return blank results
            core_topic = "employment agreement contract breach"
            query_str = q if len(q) > 10 else f"{core_topic} {q}"
            
            query = f"{query_str} Indian court cases Kanoon"
            results = list(ddgs.text(query, max_results=10))
            
        if not results:
            return ["No case laws found via search engine."]

        scored_results = []
        for res in results:
            title = res.get('title', '')
            url = res.get('href', '')
            snippet = res.get('body', '')
            
            # Score context relevance strictly using RapidFuzz
            score = fuzz.token_set_ratio(q.lower(), (title + " " + snippet).lower())
            scored_results.append({
                'score': score,
                'title': title,
                'url': url
            })

        # Rank and extract top matches
        scored_results.sort(key=lambda x: x['score'], reverse=True)

        for best in scored_results[:num]:
            cases.append(f"{best['title']}\nURL: {best['url']}")

        return cases
    except Exception as e:
        logging.error(f"Case search failed: {e}")
        return ["Case law search entirely unavailable."]
