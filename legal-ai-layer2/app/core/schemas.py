from pydantic import BaseModel
from typing import List, Optional

class ConversationMessage(BaseModel):
    role: str      # "user" | "assistant"
    content: str

class AnalyzeRequest(BaseModel):
    user_query: Optional[str] = None
    document_text: Optional[str] = None
    user_location: Optional[str] = None
    conversation_context: Optional[List[ConversationMessage]] = []

class MetricsRequest(BaseModel):
    y_true: List[str]
    y_pred: List[str]
