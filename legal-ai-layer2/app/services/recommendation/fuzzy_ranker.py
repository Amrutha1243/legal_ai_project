from rapidfuzz import fuzz

def rank_results(case_type: str, search_results: list, threshold: int = 60):

    ranked = []

    for result in search_results:
        title = result.get("title", "")
        url = result.get("href", "")

        if not title or not url:
            continue

        # 🔥 For now skip fuzzy filtering
        ranked.append({
            "title": title,
            "url": url,
            "relevanceScore": 100
        })

    return ranked[:5]

