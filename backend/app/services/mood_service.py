import uuid
from datetime import datetime
from supabase import Client
from typing import List, Optional
import json

from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

from app.models.mood import Mood, MoodAlert
from app.repositories.mood_repo import MoodRepository, MoodAlertRepository
from app.config import settings

# Phân loại cảm xúc
POSITIVE_MOODS = {"happy", "excited", "loved", "relaxed", "proud", "joyful"}
NEGATIVE_MOODS = {"sad", "angry", "anxious", "tired", "lonely", "stressed", "frustrated"}

class MoodService:
    def __init__(self, db: Client):
        self.db = db
        self.mood_repo = MoodRepository(db)
        self.alert_repo = MoodAlertRepository(db)
        
    def create_mood(self, couple_id: str, user_id: str, mood: str, intensity: int, note: Optional[str], is_private: bool) -> Mood:
        mood_id = f"mood_{uuid.uuid4().hex[:12]}"
        now_iso = datetime.utcnow().isoformat() + "Z"
        
        mood_data = {
            "id": mood_id,
            "couple_id": couple_id,
            "user_id": user_id,
            "mood": mood,
            "intensity": intensity,
            "note": note,
            "is_private": is_private,
            "created_at": now_iso
        }
        
        new_mood = self.mood_repo.create_mood(mood_data)
        
        # Chạy kiểm tra Rule-based streak
        # (Trong thực tế nên dùng BackgroundTasks của FastAPI để không block request, 
        # nhưng ở MVP ta gọi trực tiếp cho đơn giản)
        self._check_and_trigger_ai_alert(user_id, couple_id)
        
        return new_mood
        
    def get_my_moods(self, user_id: str, limit: int = 20) -> List[Mood]:
        return self.mood_repo.get_recent_moods(user_id, limit)
        
    def get_partner_latest_mood_and_alert(self, partner_id: str):
        latest_mood = self.mood_repo.get_latest_mood(partner_id)
        active_alert = self.alert_repo.get_active_alert_for_partner(partner_id)
        return latest_mood, active_alert
        
    def mark_alert_read(self, alert_id: str):
        self.alert_repo.mark_as_read(alert_id)
        
    def _check_and_trigger_ai_alert(self, user_id: str, couple_id: str):
        recent_moods = self.mood_repo.get_recent_moods(user_id, limit=3)
        if len(recent_moods) < 3:
            return
            
        # Kiểm tra xem 3 cảm xúc gần nhất có cùng 1 cực (Positive/Negative) không
        mood_names = [m.mood.lower() for m in recent_moods]
        
        is_all_positive = all(m in POSITIVE_MOODS for m in mood_names)
        is_all_negative = all(m in NEGATIVE_MOODS for m in mood_names)
        
        if not (is_all_positive or is_all_negative):
            return
            
        alert_type = "positive" if is_all_positive else "negative"
        
        # Đã đạt điều kiện chuỗi (Streak) => Gọi AI sinh ra thông báo
        self._generate_ai_alert(recent_moods, alert_type, user_id, couple_id)
        
    def _generate_ai_alert(self, moods: List[Mood], alert_type: str, user_id: str, couple_id: str):
        # Tránh trigger liên tục: Kiểm tra xem đã có alert nào gần đây cho user này chưa
        # (Ở MVP bỏ qua bước kiểm tra trùng lặp để dễ test)
        
        llm = ChatOpenAI(
            model=settings.ai_chat_model,
            api_key=settings.openai_api_key,
            temperature=0.7
        )
        
        system_prompt = """Bạn là trợ lý tâm lý tình yêu.
Nhiệm vụ của bạn là đọc lịch sử 3 cảm xúc gần nhất của người dùng, phân tích nguyên nhân và đưa ra lời khuyên cho NGƯỜI YÊU của họ.
Hãy trả về ĐÚNG định dạng JSON với 3 trường:
- "title": Tiêu đề ngắn gọn báo động/chúc mừng (VD: "Báo động đỏ: Người yêu đang rất buồn", "Tin vui: Người yêu đang cực kỳ hạnh phúc")
- "message": Giải thích lý do dựa vào các note của người dùng (nói với người yêu của họ).
- "advice": Hành động cụ thể người yêu nên làm ngay lập tức.
Chỉ trả về JSON, không kèm markdown code block.
"""
        
        history_text = "Lịch sử 3 cảm xúc gần nhất:\n"
        for idx, m in enumerate(moods):
            history_text += f"Lần {idx+1}: Cảm xúc {m.mood} (Mức độ {m.intensity}/10). Ghi chú: {m.note or 'Không có'}\n"
            
        human_msg = f"Loại cảnh báo: {alert_type.upper()}\n\n{history_text}"
        
        try:
            res = llm.invoke([
                SystemMessage(content=system_prompt),
                HumanMessage(content=human_msg)
            ])
            
            # Phân tích cú pháp JSON
            content = res.content.strip()
            if content.startswith("```json"):
                content = content[7:-3].strip()
            elif content.startswith("```"):
                content = content[3:-3].strip()
                
            data = json.loads(content)
            
            # Lưu vào DB
            alert_id = f"alert_{uuid.uuid4().hex[:12]}"
            now_iso = datetime.utcnow().isoformat() + "Z"
            
            alert_data = {
                "id": alert_id,
                "couple_id": couple_id,
                "user_id": user_id, # Người đang bị ảnh hưởng
                "alert_type": alert_type,
                "title": data.get("title", "Có biến!"),
                "message": data.get("message", "Người yêu bạn đang có những cảm xúc mạnh mẽ."),
                "advice": data.get("advice", "Hãy nhắn tin hỏi thăm ngay nhé!"),
                "is_read": False,
                "created_at": now_iso
            }
            
            self.alert_repo.create_alert(alert_data)
            
        except Exception as e:
            print(f"Lỗi khi AI sinh cảnh báo: {str(e)}")
