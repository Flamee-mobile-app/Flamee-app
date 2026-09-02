import googlemaps
from langchain_core.tools import tool
from app.config import settings

@tool
def search_google_places(query: str, location: str = "Hồ Chí Minh, Việt Nam") -> str:
    """
    Tìm kiếm các địa điểm thực tế trên Google Maps (nhà hàng, quán cafe, rạp chiếu phim, công viên...).
    Sử dụng tool này khi người dùng nhờ gợi ý địa điểm đi chơi, hẹn hò, hoặc ăn uống.
    
    Args:
        query: Loại địa điểm cần tìm (vd: "quán cafe lãng mạn", "nhà hàng đồ âu giá rẻ").
        location: Khu vực tìm kiếm (vd: "Quận 1, TP HCM", "Hà Nội").
    """
    if not settings.google_maps_api_key:
        return (
            "Lỗi: Chưa cấu hình Google Maps API Key. "
            "Hãy nói với người dùng vui lòng thêm FLAMEE_GOOGLE_MAPS_API_KEY vào biến môi trường để sử dụng tính năng này."
        )
        
    try:
        gmaps = googlemaps.Client(key=settings.google_maps_api_key)
        
        # Gọi Google Maps Text Search API
        places_result = gmaps.places(
            query=f"{query} ở {location}",
            language="vi"
        )
        
        results = places_result.get("results", [])
        if not results:
            return f"Không tìm thấy địa điểm nào phù hợp với từ khóa '{query}' ở '{location}'."
            
        # Lấy top 5 kết quả tốt nhất
        top_places = results[:5]
        
        response_text = f"Kết quả tìm kiếm Google Maps cho '{query}' tại '{location}':\n\n"
        
        for p in top_places:
            name = p.get("name", "Không rõ tên")
            address = p.get("formatted_address", "Không rõ địa chỉ")
            rating = p.get("rating", "Chưa có đánh giá")
            user_ratings_total = p.get("user_ratings_total", 0)
            
            # Tính toán mức giá
            price_level = p.get("price_level")
            price_str = "Chưa rõ giá"
            if price_level is not None:
                price_str = "$" * int(price_level) # $, $$, $$$, $$$$
                
            open_now = "Không rõ"
            opening_hours = p.get("opening_hours")
            if opening_hours:
                open_now = "Đang mở cửa" if opening_hours.get("open_now") else "Đang đóng cửa"
                
            response_text += f"- Tên: {name}\n"
            response_text += f"  Địa chỉ: {address}\n"
            response_text += f"  Đánh giá: {rating} sao ({user_ratings_total} lượt đánh giá)\n"
            response_text += f"  Mức giá: {price_str}\n"
            response_text += f"  Trạng thái: {open_now}\n\n"
            
        response_text += "Lưu ý: Hãy sử dụng thông tin trên để tư vấn một cách tự nhiên và lãng mạn cho người dùng."
        return response_text
        
    except Exception as e:
        return f"Đã xảy ra lỗi khi gọi Google Maps API: {str(e)}"
