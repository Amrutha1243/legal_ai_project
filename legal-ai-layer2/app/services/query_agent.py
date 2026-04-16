import json
from app.services.llm_provider import gemini_chat

def handle_query_only(user_query: str):
    system_prompt = """
    You are an expert legal assistant categorizing a user's legal issue.
    Analyze the user's issue and return ONLY a valid JSON object with exactly these three keys:
    1. "legal_domain": String. Identify the correct Indian legal domain (ex: "Employment Law", "Family Law", "Criminal Law", "Civil Law", "Property Law", etc.). If unsure, use "General Law".
    2. "issue_summary": String. A 1-2 sentence professional summary of the user's situation.
    3. "user_actions": Array of Strings. A list of 2-3 immediate, legally sound actions the user should take.

    Example Output:
    {
      "legal_domain": "Employment Law",
      "issue_summary": "The user states they were terminated without proper notice or severance pay.",
      "user_actions": [
        "Collect your employment contract and termination letter.",
        "Do not sign any severance agreements immediately without review."
      ]
    }
    """

    try:
        response_text = gemini_chat(system_prompt, user_query)
        
        # Clean up any markdown code blocks the LLM might have added around the JSON
        clean_json = response_text.replace("```json", "").replace("```", "").strip()
        data = json.loads(clean_json)

        return {
            "legal_domain": data.get("legal_domain", "General Law"),
            "issue_summary": data.get("issue_summary", "You are facing a legal matter that requires professional advice."),
            "user_actions": data.get("user_actions", ["Gather all relevant documents.", "Consider speaking to a lawyer."])
        }
    except Exception as e:
        print("❌ AI Classification Error in query_agent:", e)
        # Safe fallback for the demo if Gemini breaks or returns bad JSON
        return {
            "legal_domain": "General Law",
            "issue_summary": "You are facing a legal query that requires further investigation.",
            "user_actions": [
                "Collect all relevant documents and communications.",
                "Consult a legal professional."
            ]
        }
