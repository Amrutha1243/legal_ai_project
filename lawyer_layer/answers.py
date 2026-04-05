# answers.py
import google.generativeai as genai

def generate_legal_answer(api_key, context, question):
    genai.configure(api_key=api_key)
    m=genai.GenerativeModel("gemini-2.5-flash")
    p=f"""You are a legal expert.
Use formal legal terminology.

Context:
{context}

Question:
{question}
"""
    return m.generate_content(p).text
