from langgraph.graph import StateGraph, END, START
from langgraph.prebuilt import ToolNode
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

from app.ai.agents.state import AgentState
from app.ai.agents.tools.memory import save_memory, search_memory
from app.ai.agents.tools.date_planner import search_google_places
from app.ai.agents.tools.mood import record_mood_alert
from app.config import settings

# 1. Khởi tạo LLM và Tools
llm = ChatOpenAI(
    model=settings.ai_chat_model, 
    api_key=settings.openai_api_key,
    temperature=0.7
)

tools = [save_memory, search_memory, search_google_places, record_mood_alert]
llm_with_tools = llm.bind_tools(tools)
tool_node = ToolNode(tools)

# 2. Xây dựng các Node của Graph

def call_model(state: AgentState):
    """
    Node xử lý chính: LLM sẽ đọc lịch sử chat, system prompt và quyết định
    trả lời trực tiếp hoặc gọi tool.
    """
    messages = state["messages"]
    
    # Tạo System Prompt với context của người dùng
    system_prompt = f"""Bạn là một Trợ lý Tình yêu (Love Assistant) thông minh và tinh tế của ứng dụng Flamee.
Bạn đang nói chuyện với người dùng có user_id: {state['user_id']} thuộc couple_id: {state['couple_id']}.

NHIỆM VỤ CỦA BẠN:
1. Trò chuyện tự nhiên, lãng mạn, thấu hiểu cảm xúc.
2. SỬ DỤNG TOOL MỘT CÁCH CHỦ ĐỘNG:
   - Nếu người dùng kể thông tin gì mới về bản thân hoặc người yêu (sở thích, thói quen, sự kiện quan trọng...), hãy GỌI NGAY tool `save_memory` để lưu lại, và TRUYỀN ĐÚNG `couple_id`={state['couple_id']}, `user_id`={state['user_id']}.
   - Nếu bạn cần nhớ lại thông tin cũ, hãy gọi tool `search_memory` với `couple_id`={state['couple_id']}.
   - Nếu người dùng muốn gợi ý địa điểm hẹn hò, đi chơi, ăn uống, hãy gọi tool `search_google_places`.
   - Nếu phát hiện người dùng đang tiêu cực, buồn chán trầm trọng, hãy gọi tool `record_mood_alert` với `couple_id`={state['couple_id']} và `user_id`={state['user_id']}.

LUÔN ưu tiên sự tự nhiên. Khi trả lại kết quả tìm kiếm địa điểm, hãy diễn đạt lại bằng lời văn của bạn chứ không in ra danh sách cứng nhắc.
"""
    
    # Chèn System message vào đầu (nếu chưa có)
    # Trong thực tế, có thể tạo 1 list mới
    full_messages = [SystemMessage(content=system_prompt)] + messages
    
    response = llm_with_tools.invoke(full_messages)
    
    return {"messages": [response]}

def should_continue(state: AgentState) -> str:
    """
    Router node: Quyết định xem có đi tiếp vào Tool Node hay kết thúc.
    """
    last_message = state["messages"][-1]
    # Nếu LLM quyết định gọi tool, langchain sẽ set tool_calls
    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        return "tools"
    return END

# 3. Compile Graph
workflow = StateGraph(AgentState)

# Định nghĩa các Node
workflow.add_node("agent", call_model)
workflow.add_node("tools", tool_node)

# Thiết lập Luồng (Edges)
workflow.add_edge(START, "agent")
workflow.add_conditional_edges(
    "agent",
    should_continue,
    {
        "tools": "tools",
        END: END
    }
)
# Sau khi tool chạy xong, quay lại agent để tổng hợp kết quả
workflow.add_edge("tools", "agent")

# Build Graph
love_assistant_graph = workflow.compile()
