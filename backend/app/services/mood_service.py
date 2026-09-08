import uuid
from datetime import datetime, timezone
from supabase import Client
from typing import List, Optional
import json

from fastapi import BackgroundTasks
from app.ai.background_tasks import extract_and_save_fact_background

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
        
    def create_mood(self, couple_id: str, user_id: str, mood: str, intensity: int, note: Optional[str], is_private: bool, background_tasks: BackgroundTasks = None) -> Mood:
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
        
        # 🆕 Tầng 1: Event Hook - Trích xuất facts từ mood note
        if note and background_tasks:
            background_tasks.add_task(
                extract_and_save_fact_background,
                text=note,
                couple_id=couple_id,
                source="mood check-in"
            )
            
        # Kiểm tra Rule-based streak
        self._check_and_trigger_ai_alert(user_id, couple_id, background_tasks)
        
        return new_mood
        
    def get_my_moods(self, user_id: str, limit: int = 20) -> List[Mood]:
        return self.mood_repo.get_recent_moods(user_id, limit)
        
    def get_partner_latest_mood_and_alert(self, partner_id: str):
        latest_mood = self.mood_repo.get_latest_mood(partner_id)
        active_alert = self.alert_repo.get_active_alert_for_partner(partner_id)
        return latest_mood, active_alert
        
    def get_or_generate_daily_digest(self, user_id: str, partner_id: str, couple_id: str, background_tasks: BackgroundTasks = None) -> Optional[MoodAlert]:
        from datetime import timedelta
        today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        
        # Check if already generated today
        digest = self.alert_repo.get_daily_digest_for_date(user_id, today_str)
        if digest:
            # If it's a pending placeholder, just return None so UI doesn't show "Đang tổng hợp..."
            if digest.title == "Đang tổng hợp...":
                return None
            return digest
            
        # If not, generate one
        yesterday_str = (datetime.now(timezone.utc) - timedelta(days=1)).strftime("%Y-%m-%d")
        partner_moods = self.mood_repo.get_moods_by_date(partner_id, yesterday_str)
        
        if not partner_moods:
            return None # No moods yesterday, no digest
            
        # Create placeholder
        alert_id = f"alert_{uuid.uuid4().hex[:12]}"
        now_iso = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        alert_data = {
            "id": alert_id,
            "couple_id": couple_id,
            "user_id": user_id,
            "alert_type": "daily_digest",
            "title": "Đang tổng hợp...",
            "message": "AI đang tổng hợp cảm xúc của ngày hôm qua...",
            "advice": "...",
            "is_read": False,
            "created_at": now_iso
        }
        self.alert_repo.create_alert(alert_data)
        
        if background_tasks:
            background_tasks.add_task(self._generate_daily_digest, alert_id, partner_moods)
        else:
            self._generate_daily_digest(alert_id, partner_moods)
            
        return None # Return None initially so frontend doesn't show placeholder

    def _generate_daily_digest(self, alert_id: str, partner_moods: List[Mood]):
        try:
            llm = ChatOpenAI(
                model=settings.ai_chat_model,
                api_key=settings.openai_api_key,
                temperature=0.7
            )
            
            system_prompt = """Bạn là trợ lý AI thông minh của một cặp đôi.
Nhiệm vụ của bạn là tóm tắt cảm xúc của người yêu trong ngày hôm qua để báo cáo (Daily Digest) cho người dùng vào buổi sáng.
Hãy đọc các note cảm xúc của ngày hôm qua, tổng hợp lại một cách tinh tế và đưa ra gợi ý nhỏ cho ngày hôm nay.
Trả về định dạng JSON:
- "title": Tiêu đề báo cáo (VD: "Tóm tắt ngày hôm qua của người yêu")
- "message": Tóm tắt ngắn gọn các cảm xúc và sự kiện đã xảy ra hôm qua.
- "advice": Một gợi ý hành động cụ thể cho ngày hôm nay (VD: "Hôm qua cô ấy đã rất mệt, hôm nay hãy mua trà sữa cho cô ấy nhé").
Chỉ trả về JSON, không giải thích gì thêm."""

            history_text = "Cảm xúc hôm qua:\n"
            for m in partner_moods:
                history_text += f"- Cảm xúc: {m.mood} (Cường độ: {m.intensity}/10). Ghi chú: {m.note or 'Không có'}\n"
                
            res = llm.invoke([
                SystemMessage(content=system_prompt),
                HumanMessage(content=history_text)
            ])
            
            content = res.content.strip()
            if content.startswith("```json"):
                content = content[7:-3].strip()
            elif content.startswith("```"):
                content = content[3:-3].strip()
                
            data = json.loads(content)
            
            update_data = {
                "title": data.get("title", "Báo cáo cảm xúc"),
                "message": data.get("message", "Đây là báo cáo cảm xúc của ngày hôm qua."),
                "advice": data.get("advice", "Hãy luôn quan tâm đến nhau nhé.")
            }
            
            self.alert_repo.update_alert(alert_id, update_data)
            
        except Exception as e:
            print(f"Lỗi khi AI sinh daily digest: {str(e)}")
        
    def mark_alert_read(self, alert_id: str):
        self.alert_repo.mark_as_read(alert_id)
        
    def delete_mood(self, mood_id: str, user_id: str) -> bool:
        return self.mood_repo.delete_mood(mood_id, user_id)
        
    def _check_and_trigger_ai_alert(self, user_id: str, couple_id: str, background_tasks: BackgroundTasks = None):
        recent_moods = self.mood_repo.get_recent_moods(user_id, limit=2)
        if not recent_moods:
            return
            
        latest_mood = recent_moods[0]
        
        # Kiểm tra Cooldown 4 tiếng
        latest_alert = self.alert_repo.get_latest_alert_for_user(user_id)
        if latest_alert:
            created_at_dt = datetime.fromisoformat(latest_alert.created_at.replace("Z", "+00:00"))
            now_dt = datetime.now(timezone.utc)
            if (now_dt - created_at_dt).total_seconds() < 4 * 3600:
                print(f"[Ambient AI] Skipped alert for user {user_id} due to 4-hour cooldown.")
                return
        
        # Rule 1: Intensity quá cao (>= 8)
        if latest_mood.intensity >= 8:
            alert_type = "positive" if latest_mood.mood.lower() in POSITIVE_MOODS else "negative"
            self._create_pending_and_enqueue(recent_moods, alert_type, user_id, couple_id, background_tasks)
            return
            
        # Rule 2: 2 mood gần nhất cùng cực tiêu cực hoặc tích cực
        if len(recent_moods) == 2:
            mood_names = [m.mood.lower() for m in recent_moods]
            is_all_positive = all(m in POSITIVE_MOODS for m in mood_names)
            is_all_negative = all(m in NEGATIVE_MOODS for m in mood_names)
            
            if is_all_positive or is_all_negative:
                alert_type = "positive" if is_all_positive else "negative"
                self._create_pending_and_enqueue(recent_moods, alert_type, user_id, couple_id, background_tasks)

    def _create_pending_and_enqueue(self, moods, alert_type, user_id, couple_id, background_tasks: BackgroundTasks):
        alert_id = f"alert_{uuid.uuid4().hex[:12]}"
        now_iso = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        alert_data = {
            "id": alert_id,
            "couple_id": couple_id,
            "user_id": user_id,
            "alert_type": alert_type,
            "title": "Đang phân tích...",
            "message": "AI đang phân tích cảm xúc của người yêu bạn...",
            "advice": "...",
            "is_read": False,
            "created_at": now_iso
        }
        self.alert_repo.create_alert(alert_data)
        
        if background_tasks:
            background_tasks.add_task(self._generate_ai_alert, alert_id, moods, alert_type, user_id, couple_id)
        else:
            self._generate_ai_alert(alert_id, moods, alert_type, user_id, couple_id)
        
    def _generate_ai_alert(self, alert_id: str, moods: List[Mood], alert_type: str, user_id: str, couple_id: str):
        # Tránh trigger liên tục: Kiểm tra xem đã có alert nào gần đây cho user này chưa
        # (Ở MVP bỏ qua bước kiểm tra trùng lặp để dễ test)
        
        llm = ChatOpenAI(
            model=settings.ai_chat_model,
            api_key=settings.openai_api_key,
            temperature=0.7
        )
        
        system_prompt = """Bạn là một người bạn tâm tình và trợ lý AI tinh tế.
Nhiệm vụ của bạn là đọc lịch sử 3 cảm xúc gần nhất của người dùng, phân tích nguyên nhân và đưa ra lời khuyên cho NGƯỜI YÊU của họ một cách nhẹ nhàng, thấu cảm.
TUYỆT ĐỐI TRÁNH dùng các từ ngữ giật gân, làm quá vấn đề (như "Báo động đỏ", "Khẩn cấp"). Hãy dùng giọng điệu quan tâm, ấm áp.
Hãy trả về ĐÚNG định dạng JSON với 3 trường:
- "title": Tiêu đề tinh tế (VD: "Có vẻ người yêu bạn đang cần bạn ở bên", "Hôm nay người yêu có nhiều tâm sự")
- "message": Giải thích lý do dựa vào các note một cách thấu cảm (nói với người yêu của họ).
- "advice": Một gợi ý nhẹ nhàng để người yêu có thể làm giúp họ thấy tốt hơn.
Chỉ trả về JSON, không giải thích gì thêm.
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
            
            # Cập nhật DB
            update_data = {
                "title": data.get("title", "Có biến!"),
                "message": data.get("message", "Người yêu bạn đang có những cảm xúc mạnh mẽ."),
                "advice": data.get("advice", "Hãy nhắn tin hỏi thăm ngay nhé!")
            }
            
            self.alert_repo.update_alert(alert_id, update_data)
            
        except Exception as e:
            print(f"Lỗi khi AI sinh cảnh báo: {str(e)}")
