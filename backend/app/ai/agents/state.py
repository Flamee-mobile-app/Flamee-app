from typing import Annotated, TypedDict, Any
import operator
from langchain_core.messages import AnyMessage

class AgentState(TypedDict):
    """
    Trạng thái của AI Agent đi qua các Node.
    """
    # Lịch sử tin nhắn (tự động append bằng operator.add)
    messages: Annotated[list[AnyMessage], operator.add]
    
    # Metadata người dùng
    couple_id: str
    user_id: str
    partner_id: str | None
