# Conversation Context — Bottom Navigation

## 1. Mục đích file này

File này đóng gói toàn bộ ngữ cảnh làm việc của conversation về việc gom bottom navigation vào một component dùng chung, chỉ hiển thị ở 5 route chính, và hạn chế thay đổi router. Nội dung gồm yêu cầu của user, các quyết định đã chốt, trạng thái code trước/sau, các file liên quan, kiểm thử, lỗi nền có sẵn và thay đổi cuối cùng về vị trí component.

## 2. Yêu cầu của user

Yêu cầu ban đầu:

> Đặt bottomnav ở thư mục components và chỉ hiện tại 5 route chính — ít thay đổi router

Sau đó user yêu cầu triển khai ngay:

> ngay từ conversation này hãy triển khai cho anh đi

Cuối cùng user chốt vị trí cụ thể:

> đưa bottom nav vào components/ui

Diễn giải yêu cầu cuối cùng:

- Bottom navigation phải nằm trong components/ui.
- Chỉ hiển thị ở đúng 5 route chính.
- Không chuyển hệ thống router hiện tại sang Expo Tabs.
- Thay đổi router/layout ở mức tối thiểu.
- Không ảnh hưởng các route phụ ai, dates, timeline.

## 3. Bối cảnh repository lúc bắt đầu

Đường dẫn repo:

~~~text
D:\FPT\ky7\EXE\project\Flamee-mobile-app\flamee-mobile
~~~

Router chính của app dùng Expo Router với Stack tại app/(main)/_layout.tsx. Stack ban đầu đã khai báo:

- home
- memories
- mood
- missions
- profile
- ai
- dates
- timeline

Trước khi sửa, có các thanh BottomTabBar bị lặp trực tiếp trong nhiều screen:

- features/home/screens/HomeScreen.tsx
- features/memories/screens/MemoriesScreen.tsx
- features/memories/screens/TimelineScreen.tsx
- features/mood/screens/MoodScreen.tsx
- features/missions/screens/MissionsScreen.tsx
- features/profile/screens/ProfileScreen.tsx
- features/dates/screens/DatesScreen.tsx

Các bar cục bộ này đều dùng MAIN_NAV_ITEMS nhưng render cả trên các screen phụ dates/timeline. components/ui/BottomNav.tsx lúc đầu đã tồn tại nhưng chưa được mount từ layout và chưa được dùng làm component dùng chung.

Nguồn metadata route ban đầu là lib/navigation/routes.ts:

~~~ts
export const ROUTES = {
  start: '/',
  login: '/(auth)/login',
  register: '/(auth)/register',
  home: '/(main)/home',
  timeline: '/(main)/timeline',
  memories: '/(main)/memories',
  mood: '/(main)/mood',
  missions: '/(main)/missions',
  dates: '/(main)/dates',
  ai: '/(main)/ai',
  profile: '/(main)/profile',
} as const satisfies Record<string, Href>;

export const MAIN_NAV_ITEMS: MainNavItem[] = [
  { key: 'home', label: 'Trang chủ', icon: 'home', href: ROUTES.home },
  { key: 'memories', label: 'Kỉ niệm', icon: 'heart', href: ROUTES.memories },
  { key: 'mood', label: 'Mood', icon: 'happy', href: ROUTES.mood },
  { key: 'missions', label: 'Nhiệm vụ', icon: 'checkmark-circle', href: ROUTES.missions },
  { key: 'profile', label: 'Profile', icon: 'person', href: ROUTES.profile },
];
~~~

## 4. Thiết kế đã chốt

Phương án được đề xuất và user cho phép triển khai:

1. Giữ nguyên app/(main) Stack.
2. Mount một BottomNav dùng chung một lần tại app/(main)/_layout.tsx.
3. Dùng pathname để quyết định có render nav hay không.
4. Chỉ render ở /home, /memories, /mood, /missions, /profile.
5. Không render ở /ai, /dates, /timeline.
6. Xóa các BottomTabBar lặp trong screen.
7. Dùng MAIN_NAV_ITEMS làm nguồn dữ liệu duy nhất.

Các phương án không dùng:

- Expo Tabs: thay đổi router nhiều hơn yêu cầu.
- Giữ nav riêng trong từng screen: tiếp tục gây lặp và làm nav xuất hiện sai trên route phụ.

## 5. Trình tự thực hiện trong conversation

### 5.1. Khảo sát

Assistant rà cấu trúc router và tìm tất cả BottomTabBar/BottomNav. Kết quả xác định chính xác 5 route chính từ MAIN_NAV_ITEMS:

- home
- memories
- mood
- missions
- profile

Ba route phụ phải ẩn nav:

- ai
- dates
- timeline

### 5.2. TDD cho điều kiện hiển thị

Test mới được tạo tại:

~~~text
lib/navigation/routes.test.ts
~~~

Test kiểm tra 9 pathname:

- true: /home, /memories, /mood, /missions, /profile
- false: /ai, /dates, /timeline, /login

Vòng RED đã được thực hiện trước khi thêm predicate. Test fail với:

~~~text
TypeError: (0 , _routes.isMainNavigationPath) is not a function
~~~

Sau đó thêm predicate vào lib/navigation/routes.ts:

~~~ts
export function isMainNavigationPath(pathname: string) {
  return MAIN_NAV_ITEMS.some((item) => String(item.href).replace('/(main)', '') === pathname);
}
~~~

Test chuyển GREEN, toàn bộ 9 case pass.

### 5.3. Tích hợp component dùng chung

BottomNav được làm self-contained:

- đọc pathname bằng usePathname()
- điều hướng bằng useRouter()
- render MAIN_NAV_ITEMS
- active state so sánh pathname đã bỏ group prefix /(main)
- gọi router.replace(item.href) khi chọn tab

Component được đặt cuối cùng tại:

~~~text
components/ui/BottomNav.tsx
~~~

components/ui/index.ts cũng export BottomNav.

### 5.4. Tích hợp layout

app/(main)/_layout.tsx vẫn giữ nguyên các Stack.Screen. Chỉ bổ sung:

- usePathname()
- import BottomNav từ @/components/ui/BottomNav
- import isMainNavigationPath
- wrapper View flex: 1
- render có điều kiện:

~~~tsx
{isMainNavigationPath(pathname) && <BottomNav />}
~~~

Không có chuyển đổi sang Tabs và không thay đổi danh sách Stack route.

### 5.5. Dọn nav bị lặp

Đã xóa BottomTabBar, tabStyles và call tương ứng khỏi:

- HomeScreen
- MemoriesScreen
- TimelineScreen
- MoodScreen
- MissionsScreen
- ProfileScreen
- DatesScreen

Router trong những screen cần cho chức năng khác, ví dụ router.back() hoặc các shortcut của HomeScreen, được giữ lại. Chỉ bỏ import/handler nào chỉ phục vụ bottom bar cục bộ.

## 6. Trạng thái code cuối cùng

### 6.1. components/ui/BottomNav.tsx

Component cuối cùng có các đặc điểm:

~~~tsx
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { flameeTheme } from '@/constants/flameeTheme';
import { MAIN_NAV_ITEMS } from '@/lib/navigation/routes';

import { AppText } from './AppText';
import type { IconName } from './IconButton';
~~~

Component dùng:

~~~tsx
const pathname = usePathname();
const router = useRouter();

const selected = String(item.href).replace('/(main)', '') === pathname;
router.replace(item.href);
~~~

Nav được đặt absolute ở đáy màn hình, có padding ngang và padding bottom theo theme. Các item có accessibilityLabel, accessibilityRole="tab" và accessibilityState.selected.

### 6.2. app/(main)/_layout.tsx

Layout giữ nguyên Stack:

~~~tsx
<Stack screenOptions={{ headerShown: false }}>
  <Stack.Screen name="home" options={{ animation: 'none' }} />
  <Stack.Screen name="memories" options={{ animation: 'none' }} />
  <Stack.Screen name="mood" options={{ animation: 'none' }} />
  <Stack.Screen name="missions" options={{ animation: 'none' }} />
  <Stack.Screen name="profile" options={{ animation: 'none' }} />
  <Stack.Screen name="ai" options={{ animation: 'slide_from_right' }} />
  <Stack.Screen name="dates" options={{ animation: 'slide_from_right' }} />
  <Stack.Screen name="timeline" options={{ animation: 'slide_from_right' }} />
</Stack>
~~~

Nav chỉ được mount với predicate 5 route:

~~~tsx
{isMainNavigationPath(pathname) && <BottomNav />}
~~~

### 6.3. lib/navigation/routes.ts

MAIN_NAV_ITEMS vẫn là nguồn metadata duy nhất. Chỉ thêm isMainNavigationPath; không đổi các ROUTES hiện hữu.

### 6.4. Test

File:

~~~text
lib/navigation/routes.test.ts
~~~

Nội dung kiểm tra:

~~~ts
describe('isMainNavigationPath', () => {
  test.each(['/home', '/memories', '/mood', '/missions', '/profile'])(
    'shows the bottom navigation on %s',
    (pathname) => {
      expect(isMainNavigationPath(pathname)).toBe(true);
    },
  );

  test.each(['/ai', '/dates', '/timeline', '/login'])(
    'hides the bottom navigation on %s',
    (pathname) => {
      expect(isMainNavigationPath(pathname)).toBe(false);
    },
  );
});
~~~

## 7. Kiểm thử và bằng chứng

### 7.1. Focused route test

Command:

~~~text
npx jest lib/navigation/routes.test.ts --runInBand --config '{"preset":"jest-expo"}'
~~~

Kết quả cuối:

~~~text
PASS lib/navigation/routes.test.ts
Test Suites: 1 passed, 1 total
Tests:       9 passed, 9 total
~~~

### 7.2. TypeScript

Command:

~~~text
npx tsc --noEmit
~~~

Kết quả cuối: exit code 0, không có TypeScript error.

### 7.3. Lint

Command:

~~~text
npm run lint
~~~

Kết quả: exit code 0.

### 7.4. Full Jest

Command:

~~~text
npm test
~~~

Kết quả không chạy được do lỗi nền có sẵn:

~~~text
Validation Error:
Module <rootDir>/test/setup.ts in the setupFilesAfterEnv option was not found.
~~~

File test/setup.ts đã bị xóa trước đó trong working tree, không phải do thay đổi bottom navigation. Các test cũ trong __tests__ cũng đang ở trạng thái deleted trước khi thực hiện task.

## 8. Working tree có sẵn trước task

Các thay đổi sau đã tồn tại trong workspace và được giữ nguyên, không tự ý khôi phục:

~~~text
D __tests__/auth-form-test.ts
D __tests__/mission-store-test.ts
D __tests__/routes-test.ts
D __tests__/theme-test.ts
M app/_layout.tsx
M components/ui/GradientButton.tsx
M features/auth/screens/LoginScreen.tsx
M features/auth/screens/RegisterScreen.tsx
M features/auth/screens/StartScreen.tsx
M package-lock.json
M package.json
D redesign_summary.md
D test/setup.ts
~~~

Các file liên quan trực tiếp bottom navigation sau task:

~~~text
M app/(main)/_layout.tsx
M components/ui/BottomNav.tsx
M components/ui/index.ts
M features/dates/screens/DatesScreen.tsx
M features/home/screens/HomeScreen.tsx
M features/memories/screens/MemoriesScreen.tsx
M features/memories/screens/TimelineScreen.tsx
M features/missions/screens/MissionsScreen.tsx
M features/mood/screens/MoodScreen.tsx
M features/profile/screens/ProfileScreen.tsx
M lib/navigation/routes.ts
?? lib/navigation/routes.test.ts
~~~

Lưu ý: tên file components/ui/BottomNav.tsx xuất hiện là modified/deleted tùy cách Git ghi nhận move; trạng thái mong muốn cuối cùng là file tồn tại tại components/ui/BottomNav.tsx, không còn file tại components/BottomNav.tsx.

## 9. Các ràng buộc cần giữ nếu làm tiếp

- Không dùng git reset --hard hoặc git checkout --.
- Không khôi phục các test/setup bị xóa nếu user chưa yêu cầu.
- Dùng apply_patch khi chỉnh file.
- Không sửa các thay đổi unrelated trong working tree.
- Giữ app/(main) là Stack.
- Không thêm route mới chỉ để phục vụ bottom nav.
- Không render nav cho ai, dates, timeline.
- Nếu đổi label/icon hoặc style, cần coi đó là thay đổi UI riêng; task hiện tại chỉ yêu cầu vị trí và visibility.
- Khi kiểm thử toàn bộ, cần xử lý riêng lỗi thiếu test/setup.ts thay vì gán lỗi đó cho BottomNav.

## 10. Điểm bàn giao

Tại thời điểm đóng gói conversation:

- User đã yêu cầu vị trí cuối là components/ui.
- BottomNav đã được đặt ở components/ui/BottomNav.tsx.
- Layout đã mount một lần và lọc đúng 5 route.
- Các route phụ không còn bar cục bộ.
- Route predicate có 9 test case và pass.
- TypeScript và lint pass.
- Full Jest bị block bởi test/setup.ts bị xóa sẵn.

File này là handoff context; đọc nó trước khi tiếp tục chỉnh router, bottom navigation hoặc các test liên quan.
