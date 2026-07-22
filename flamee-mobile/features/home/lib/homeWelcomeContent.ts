export type HomeWelcomeContent = {
  greeting: string;
  quote: string;
};

const QUOTES = [
  'Tình yêu được nuôi dưỡng từ những kỷ niệm.',
  'Một lời quan tâm nhỏ cũng có thể làm ngày hôm nay ấm hơn.',
  'Cùng nhau lưu lại những điều đáng nhớ nhé.',
  'Yêu nhau là chọn lắng nghe nhau mỗi ngày.',
] as const;

function greetingForHour(hour: number) {
  if (hour >= 5 && hour < 11) return 'Chào buổi sáng';
  if (hour >= 11 && hour < 14) return 'Chào buổi trưa';
  if (hour >= 14 && hour < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
}

export function getHomeWelcomeContent(date: Date): HomeWelcomeContent {
  return {
    greeting: greetingForHour(date.getHours()),
    quote: QUOTES[date.getDate() % QUOTES.length],
  };
}
