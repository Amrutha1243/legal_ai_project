import google.generativeai as genai
import os
from dotenv import load_dotenv

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel("gemini-2.5-flash")

import time

def gemini_chat(system_prompt: str, user_message: str) -> str:
    prompt = f"""
    {system_prompt}

    User: {user_message}

    Give a clear, complete, structured legal explanation.
    Do not cut off mid-sentence.
    """
    
    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = model.generate_content(
                prompt,
                generation_config={
                    "temperature": 0.5,
                    "max_output_tokens": 1500,
                }
            )
            return response.text.strip()
        except Exception as e:
            error_str = str(e)
            print(f"⚠️ GEMINI ERROR (Attempt {attempt + 1}/{max_retries}):", error_str)
            if "503" in error_str or "quota" in error_str.lower() or "overloaded" in error_str.lower():
                time.sleep(2)  # Wait before retry
                continue
            else:
                break # Some other hard error

    # Safe fallback if all retries fail
    print("❌ GEMINI FAILED MULTIPLE TIMES. USING FALLBACK.")
    return "Based on general legal principles, your issue requires careful review of associated contracts or statutes. Please consult a legal professional for exact details, as live AI analysis is currently experiencing high server load."