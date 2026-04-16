from ddgs import DDGS

import logging

logger = logging.getLogger(__name__)

def fetch_search_results(query: str, max_results: int = 10):
    """
    Fetch search results from DuckDuckGo.
    Returns list of raw results.
    """

    try:
        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=max_results))
        return results

    except Exception as e:
        logger.error(f"DuckDuckGo search failed: {e}")
        return []
