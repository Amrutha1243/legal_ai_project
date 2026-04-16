from .duckduckgo_client import fetch_search_results
from .fuzzy_ranker import rank_results


# 🔥 STEP 1: MAP CASE → LAWYER TYPE
def map_case_to_lawyer(case_type: str):
    case_type = case_type.lower()

    if any(k in case_type for k in ["divorce", "family", "marriage"]):
        return "family lawyer"

    if any(k in case_type for k in ["job", "employment", "salary"]):
        return "employment lawyer"

    if any(k in case_type for k in ["property", "land"]):
        return "property lawyer"

    if any(k in case_type for k in ["criminal", "police", "crime"]):
        return "criminal lawyer"

    if any(k in case_type for k in ["ip", "intellectual", "patent", "copyright"]):
        return "intellectual property lawyer"

    return "lawyer"


# 🔥 STEP 2: MAIN FUNCTION
def recommend_lawyers(case_type: str, location: str):
    """
    Smart lawyer recommendation based on case type.
    """

    if not case_type or not location:
        return []

    # 🔥 Convert to correct lawyer type
    lawyer_type = map_case_to_lawyer(case_type)

    # 🔥 Better search query
    query = f"best {lawyer_type} in {location}"

    print("🔍 SEARCH QUERY:", query)

    search_results = fetch_search_results(query)

    if not search_results:
        return []

    # 🔥 STEP 3: FILTER BAD RESULTS
    filtered_results = []

    for r in search_results:
        title = r.get("title", "").lower()
        url = r.get("href", "")

        # ❌ Remove directory/spam sites
        if any(bad in url for bad in ["justdial", "bark", "gmrao"]):
            continue

        # ✅ Keep only relevant titles
        if lawyer_type.split()[0] in title:
            filtered_results.append(r)

    # fallback if too strict
    if not filtered_results:
        filtered_results = search_results

    # 🔥 STEP 4: RANK
    ranked = rank_results(lawyer_type, filtered_results)

    # 🔥 STEP 5: LIMIT RESULTS
    return ranked[:3]