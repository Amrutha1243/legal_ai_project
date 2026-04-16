from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.embeddings import GoogleGenerativeAIEmbeddings
from langchain.vectorstores import FAISS
from langchain.chat_models import ChatGoogleGenerativeAI
from langchain.chains import RetrievalQA




# ✅ Strict RAG chain (anti-hallucination)
def get_rag_chain(vectorstore):

    retriever = vectorstore.as_retriever(search_kwargs={"k": 3})

    llm = ChatGoogleGenerativeAI(
        model="gemini-pro",
        temperature=0.2
    )

    prompt_template = """
You are an AI-powered Legal Assistant.

Your task is to answer user questions strictly based on the provided legal document context.

GUIDELINES:
1. Use ONLY the information present in the given context.
2. Do NOT use any external knowledge or assumptions.
3. If the answer is not clearly found in the context, respond with:
   "The requested information is not available in the provided document."
4. Do NOT guess or fabricate information.
5. Provide clear, structured, and concise answers.
6. When applicable, present the answer in bullet points for readability.
7. Focus on legal clarity and user understanding.

CONTEXT:
{context}

USER QUESTION:
{question}

FINAL ANSWER:
"""

    qa_chain = RetrievalQA.from_chain_type(
        llm=llm,
        retriever=retriever,
        chain_type="stuff",
        return_source_documents=True,
        chain_type_kwargs={"prompt": prompt_template}
    )

    return qa_chain

# ✅ Strict RAG chain for persistent Knowledge Base
def get_persistent_rag_chain():
    from app.services.vectorstore_manager import get_persistent_vectorstore
    vs = get_persistent_vectorstore()
    if not vs:
        return None
    return get_rag_chain(vs)