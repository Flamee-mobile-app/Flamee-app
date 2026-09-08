import uuid
from datetime import datetime
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
import json

from app.config import settings
from app.database import get_supabase
from app.ai.agents.tools.memory import embeddings

def extract_and_save_fact_background(text: str, couple_id: str, source: str):
    """
    Chạy ngầm: Đọc text (từ mood note hoặc memory), trích xuất thông tin/fact quan trọng, và lưu vào Vector DB.
    """
    if not text or len(text.strip()) < 5:
        return
        
    llm = ChatOpenAI(
        model=settings.ai_chat_model,
        api_key=settings.openai_api_key,
        temperature=0.3
    )
    
    system_prompt = """Bạn là trợ lý AI ngầm tinh tế. Nhiệm vụ của bạn là đọc một đoạn text của người dùng và trích xuất ra một SỰ THẬT (FACT) DÀI HẠN về họ.
QUY TẮC QUAN TRỌNG:
1. CHỈ LƯU các sự thật có giá trị lâu dài (vd: sở thích, thói quen, dị ứng, thông tin cá nhân, mối quan hệ, tính cách cốt lõi).
2. TUYỆT ĐỐI BỎ QUA các cảm xúc, sự kiện hay trạng thái nhất thời (vd: "hôm nay đau đầu quá", "mình đang mệt", "vừa cãi nhau xong"). Những cái này là nhất thời (transient), không phải fact dài hạn.
3. Nếu text chứa fact dài hạn, trả về:
{"has_fact": true, "fact": "Sự thật trích xuất được (ngắn gọn, ngôi thứ 3)"}
4. Nếu text CHỈ là cảm xúc nhất thời hoặc không có thông tin dài hạn, TRẢ VỀ NGAY:
{"has_fact": false}

Chỉ trả về JSON, không giải thích gì thêm."""

    human_msg = f"Nguồn: {source}\nText: {text}"
    
    try:
        res = llm.invoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=human_msg)
        ])
        
        content = res.content.strip()
        if content.startswith("```json"):
            content = content[7:-3].strip()
        elif content.startswith("```"):
            content = content[3:-3].strip()
            
        data = json.loads(content)
        
        if data.get("has_fact") and data.get("fact"):
            fact = data["fact"]
            
            # Lưu vào Supabase ai_facts
            supabase = get_supabase()
            vector = embeddings.embed_query(fact)
            
            fact_id = f"fact_{uuid.uuid4().hex[:12]}"
            now_iso = datetime.utcnow().isoformat() + "Z"
            
            insert_data = {
                "id": fact_id,
                "couple_id": couple_id,
                "fact": fact,
                "embedding": vector,
                "created_at": now_iso
            }
            
            supabase.table("ai_facts").insert(insert_data).execute()
            print(f"[Ambient AI] Extracted and saved fact: {fact}")
            
    except Exception as e:
        print(f"[Ambient AI] Error extracting fact: {e}")
