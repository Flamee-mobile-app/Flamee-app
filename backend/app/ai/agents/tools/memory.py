import uuid
from datetime import datetime
from langchain_core.tools import tool
from langchain_openai import OpenAIEmbeddings
from app.database import get_supabase
from app.config import settings

# Khởi tạo embedding model
embeddings = OpenAIEmbeddings(
    model=settings.ai_embed_model, 
    api_key=settings.openai_api_key
)

@tool
def save_memory(fact: str, couple_id: str, user_id: str) -> str:
    """
    Lưu một sự thật (fact/ký ức dài hạn) quan trọng vào cơ sở dữ liệu.
    Sử dụng tool này khi người dùng cung cấp thông tin đáng nhớ về bản thân, sở thích, sự kiện.
    
    Args:
        fact: Sự thật cần lưu (vd: "User dị ứng hải sản", "Sinh nhật bạn gái là 14/2").
        couple_id: ID của cặp đôi.
        user_id: ID của người dùng.
    """
    supabase = get_supabase()
    
    # 1. Tạo vector embedding cho fact
    vector = embeddings.embed_query(fact)
    
    # 2. Lưu vào Supabase
    fact_id = f"fact_{uuid.uuid4().hex[:12]}"
    now_iso = datetime.utcnow().isoformat() + "Z"
    
    data = {
        "id": fact_id,
        "couple_id": couple_id,
        "user_id": user_id,
        "fact": fact,
        "embedding": vector,
        "created_at": now_iso
    }
    
    supabase.table("ai_facts").insert(data).execute()
    
    return f"Đã ghi nhớ thành công: '{fact}'"

@tool
def search_memory(query: str, couple_id: str, limit: int = 5) -> str:
    """
    Tìm kiếm thông tin/sự thật trong trí nhớ dài hạn (cơ sở dữ liệu) dựa trên câu hỏi.
    Sử dụng tool này khi cần gợi nhớ sở thích, thông tin cũ của người dùng hoặc partner.
    
    Args:
        query: Câu hỏi hoặc từ khóa cần tìm (vd: "người yêu thích ăn gì?").
        couple_id: ID của cặp đôi.
        limit: Số lượng kết quả trả về.
    """
    supabase = get_supabase()
    
    # 1. Tạo vector embedding cho câu hỏi
    query_vector = embeddings.embed_query(query)
    
    # 2. Gọi hàm rpc match_ai_facts trên Supabase
    res = supabase.rpc(
        "match_ai_facts",
        {
            "query_embedding": query_vector,
            "match_threshold": 0.7,
            "match_count": limit,
            "p_couple_id": couple_id
        }
    ).execute()
    
    facts = res.data
    if not facts:
        return "Không tìm thấy thông tin nào trong trí nhớ."
        
    result = "Các thông tin nhớ được:\n"
    for f in facts:
        result += f"- {f['fact']}\n"
        
    return result
