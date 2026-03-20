# LTM Time UI Clone - React Native Expo

Ứng dụng đồng hồ thời gian thực với 4 màn hình: Clock, Alarm, Stopwatch, Timer. Clone từ ảnh giao diện UI/UX.

## Chạy ứng dụng

### Yêu cầu
- Node.js và npm
- Expo Go (tải từ App Store hoặc Google Play)

### Bắt đầu
```bash
npm install
npm start
```

Quét QR code với Expo Go hoặc file Camera để kết nối.

---

## Cấu trúc App.js

### 1. **Imports & Constants** (Dòng 1-23)
```javascript
import React, { useEffect, useMemo, useState } from 'react';
import { ... } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Line, Polygon } from 'react-native-svg';
```
- React Native core & Expo libraries
- SVG để vẽ vòng dial (circle, lines, shapes)
- LinearGradient cho nền gradient tím

**Hằng số:**
- `TABS`: ['Clock', 'Alarm', 'Stopwatch', 'Timer']
- `CLOCK_OFFSETS`: danh sách thành phố + múi giờ

---

### 2. **Utility Functions** (Dòng 25-62)
Các hàm format dữ liệu:

| Hàm | Mục đích |
|-----|---------|
| `pad(v)` | Thêm 0 phía trước số (HH:mm) |
| `formatClockTime(date)` | Format thời gian HH:MM |
| `formatDate(date)` | Format ngày tháng đầy đủ |
| `formatStopwatch(ms)` | Format MM:SS:CS (centiseconds) |
| `formatCountdown(s)` | Format HH:MM:SS |

---

### 3. **Dial Component** (Dòng 65-195)

Thành phần chính vẽ vòng đồng hồ. Nhận props:

**Props chính:**
- `size`: kích thước (200px-215px)
- `primaryColor`: màu chữ (hồng, cam, xanh)
- `subtleColor`: màu nền nhạt
- `tickCount`: số vạch (120 mặc định)
- `pointerAngleDeg`: góc kim (0-360)
- `showOuterProgress`: hiển thị vòng ngoài
- `outerProgress`: tiến trình vòng (0-1)
- `center`: nội dung giữa (Text)

**Cấu trúc vẽ:**
1. **Vòng ngoài cạnh** (`outer`) - viền xám
2. **Vòng progress ngoài** - chạy theo `outerProgress` (nếu bật)
3. **Vòng nền cho vạch** (`ring`) - màu nhạt
4. **Progress vòng giữa** - chạy theo `progress` (nếu bật)
5. **Vạch kim phút/giây** - tính động theo `tickCount`
6. **Vòng bên trong** (`innerRim`) - xám mỏng, stroke 2.5
7. **Kim chỉ** - hình tam giác, góc = `pointerAngleDeg`

---

### 4. **TabHeader & Switch** (Dòng 197-242)

**TabHeader:**
- Hiển thị 4 tab (Clock, Alarm, Stopwatch, Timer)
- Tab đối tượng có underline đỏ

**Switch:**
- Toggle button cho Alarm on/off
- Background xanh khi `on=true`

---

### 5. **ClockScreen** (Dòng 244-280)

Hiển thị:
- Dial với kim giây (đỏ) quay theo `now.getSeconds()`
- Thời gian dạng HH:MM + ngày tháng dưới kim
- Danh sách 4 thành phố + giờ địa phương
- Nút "Set Clock" (hồng)

**Logic:**
```javascript
const clockSecondProgress = now.getSeconds() / 60;
// Kim quay trong 60 giây
pointerAngleDeg={clockSecondProgress * 360}
```

---

### 6. **AlarmScreen** (Dòng 282-315)

Danh sách alarm:
- Giờ báo thức (font lớn)
- Thứ báo (nhỏ, xám)
- Switch bật/tắt

**State:**
```javascript
const [alarms, setAlarms] = useState([
  { time: '07:00', subtitle: 'Mon to Fri only', enabled: true },
  ...
]);
```

---

### 7. **StopwatchScreen** (Dòng 317-352)

Bộ đếm thời gian:
- Dial cam với kim + vòng ngoài cùng chạy trong 60 giây
- Hiển thị MM:SS:CS (phút:giây:phần trăm giây)
- Danh sách 3 lượt lap gần nhất
- Nút Reset (viền cam) + Play/Pause (nền cam)

**Logic:**
```javascript
const stopwatchSecondProgress = (elapsedMs % 60000) / 60000;
// Reset về 0 mỗi 60 giây
pointerAngleDeg={stopwatchSecondProgress * 360}
showOuterProgress
outerProgress={stopwatchSecondProgress}
```

---

### 8. **TimerScreen** (Dòng 354-423)

Đếm ngược:
- Dial xanh với kim + vòng ngoài
- Hiển thị HH:MM:SS còn lại + "45:00:00" (tổng)
- Nút "+" để cộng 60 giây
- 3 nút điều khiển (Reset, Play/Pause, Pause)

**Logic:**
```javascript
const timerSecondProgress = ((60 - (remaining % 60)) % 60) / 60;
// Quay theo giây trôi qua trong phút (0->60 thuận chiều)
pointerAngleDeg={timerSecondProgress * 360}
showOuterProgress
outerProgress={timerOuterProgress}
```

---

### 9. **App Component** (Dòng 425-450)

Thành phần chính:
- Đọc kích thước màn hình (`useWindowDimensions`)
- Phân biệt phone vs tablet
- Render tab chủ động

**Responsive:**
- Phone: full-screen, không shadow
- Tablet (width >= 768px): khung card 420px, shadow

**State:**
```javascript
const [activeTab, setActiveTab] = useState('Clock');
const [now, setNow] = useState(new Date());
const { width } = useWindowDimensions();
```

---

### 10. **Styles** (Dòng 452 trở đi)

Bố cục theo React Native StyleSheet:

**Chính:**
| Style | Mục đích |
|-------|---------|
| `bg` | Nền gradient tím |
| `safe` | SafeArea, padding trên 28px |
| `phoneCard` | Khung card chính |
| `screenWrap` | Center các content |
| `dialWrap` | Bọc vòng dial |
| `clockDialWrap` / `stopwatchDialWrap` | Padding riêng |
| `tabHeader` / `tabItem` | Thanh tab navigation |
| `tabText` | Text tab (fontSize 12, màu đen) |

---

## Các Màu Chính

| Thành phần | Màu | Mã |
|-----------|-----|-----|
| Clock | Hồng | #e63375 |
| Stopwatch | Cam | #ef7a1a |
| Timer | Xanh | #35b9cc |
| Nút | Hồng (pink), Xanh (blue), Teal | #f93e72 / #2f7cf8 / #33b8b5 |
| BG | Gradient tím | #4f0b6c -> #220545 |

---

## Điểm Nổi Bật

✅ **Full-screen responsive** - Điều chỉnh theo kích thước màn hình  
✅ **Vòng dial động** - SVG tính toán vị trí vạch/kim real-time  
✅ **4 màn hình chức năng** - Clock, Alarm, Stopwatch, Timer  
✅ **Expo Go ready** - Chạy trực tiếp không cần build native  
✅ **UI sát ảnh mẫu** - Màu sắc, font, khoảng cách đều khớp  

---

## Tương lai

- [ ] Thay SafeAreaView bằng `react-native-safe-area-context`
- [ ] Thêm Haptic feedback (rung máy)
- [ ] Lưu Alarm + lap Stopwatch vào storage
- [ ] Âm thanh báo thức
- [ ] Theme tối/sáng
