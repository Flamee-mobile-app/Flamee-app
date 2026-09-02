from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client
from pydantic import BaseModel
import uuid
from datetime import datetime

from app.api.deps import get_current_user, get_db
from app.api.response import ok
from app.ai.agents.graph import love_assistant_graph
from langchain_core.messages import HumanMessage, AIMessage

router = APIRouter(prefix="/chat", tags=["chat"])

class ChatRequest(BaseModel):
    content: str

@router.post("")
def chat_with_assistant(
    payload: ChatRequest,
    current: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    couple_id = current.get("couple_id")
    user_id = current["id"]
    
    if not couple_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bạn cần ghép đôi trước khi sử dụng tính năng Chat AI."
        )
        
    # 1. Lưu tin nhắn của User vào DB
    msg_user_id = f"msg_{uuid.uuid4().hex[:12]}"
    now_iso = datetime.utcnow().isoformat() + "Z"
    
    db.table("chat_messages").insert({
        "id": msg_user_id,
        "couple_id": couple_id,
        "sender_id": user_id,
        "sender_role": "user",
        "content": payload.content,
        "created_at": now_iso
    }).execute()
    
    # 2. Lấy 10 tin nhắn gần nhất để làm ngữ cảnh
    res = db.table("chat_messages")\
        .select("*")\
        .eq("couple_id", couple_id)\
        .order("created_at", desc=True)\
        .limit(10)\
        .execute()
        
    history = res.data[::-1] # Đảo ngược lại theo chiều thời gian (từ cũ đến mới)
    
    # Convert sang LangChain messages
    langchain_msgs = []
    for m in history:
        if m["sender_role"] == "user":
            langchain_msgs.append(HumanMessage(content=m["content"]))
        else:
            langchain_msgs.append(AIMessage(content=m["content"]))
            
    # 3. Gọi LangGraph Agent
    state_input = {
        "messages": langchain_msgs,
        "couple_id": couple_id,
        "user_id": user_id,
        "partner_id": None
    }
    
    # Chạy đồ thị
    final_state = love_assistant_graph.invoke(state_input)
    
    # Lấy tin nhắn cuối cùng (phản hồi của AI)
    ai_response = final_state["messages"][-1].content
    
    # 4. Lưu tin nhắn của AI vào DB
    msg_ai_id = f"msg_{uuid.uuid4().hex[:12]}"
    now_iso2 = datetime.utcnow().isoformat() + "Z"
    db.table("chat_messages").insert({
        "id": msg_ai_id,
        "couple_id": couple_id,
        "sender_id": None,
        "sender_role": "ai",
        "content": ai_response,
        "created_at": now_iso2
    }).execute()
    
    return ok({"response": ai_response})
