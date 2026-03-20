import React, { useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Line, Polygon } from 'react-native-svg';

// Danh sách tab chính hiển thị trên thanh điều hướng.
const TABS = ['Clock', 'Alarm', 'Stopwatch', 'Timer'];

// Các múi giờ mẫu ở màn Clock.
const CLOCK_OFFSETS = [
  { city: 'Dakar', offset: 0 },
  { city: 'Tokyo', offset: 9 },
  { city: 'Queensland', offset: 10 },
  { city: 'Barcelona', offset: 1 },
];

// Nhóm helper để format dữ liệu thời gian.
function pad(v) {
  return String(v).padStart(2, '0');
}

function formatClockTime(date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatDate(date) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
}

function formatStopwatch(ms) {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const centiseconds = Math.floor((ms % 1000) / 10);
  return `${pad(minutes)}:${pad(seconds)}:${pad(centiseconds)}`;
}

function formatCountdown(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

// Component dial dùng chung cho Clock/Stopwatch/Timer, vẽ bằng SVG.
function Dial({
  size = 200,
  primaryColor,
  subtleColor,
  tickCount = 120,
  majorEach = 5,
  pointerColor = '#ef476f',
  pointerAngleDeg = 90,
  showProgress = false,
  progress = 1,
  progressColor,
  showOuterProgress = false,
  outerProgress = 0,
  outerProgressColor,
  center,
}) {
  // Các bán kính chính để dựng layout vòng tròn theo kích thước dial.
  const centerPos = size / 2;
  const outer = size / 2 - 6;
  const ring = size / 2 - 16;
  const innerRim = ring - 12;
  const outerProgressRadius = outer + 5;

  // Chặn tiến trình về [0..1] để tránh lỗi khi truyền giá trị vượt biên.
  const boundedProgress = Math.max(0, Math.min(1, progress));
  const boundedOuterProgress = Math.max(0, Math.min(1, outerProgress));
  const circumference = 2 * Math.PI * ring;
  const outerCircumference = 2 * Math.PI * outerProgressRadius;

  // Tạo các vạch nhỏ/đậm xung quanh dial theo tickCount.
  const ticks = useMemo(() => {
    return Array.from({ length: tickCount }, (_, i) => {
      const angle = (i / tickCount) * Math.PI * 2 - Math.PI / 2;
      const isMajor = i % majorEach === 0;
      const from = ring - (isMajor ? 8 : 4);
      const to = ring + (isMajor ? 2 : 0);

      const x1 = centerPos + from * Math.cos(angle);
      const y1 = centerPos + from * Math.sin(angle);
      const x2 = centerPos + to * Math.cos(angle);
      const y2 = centerPos + to * Math.sin(angle);

      return {
        key: `tick-${i}`,
        x1,
        y1,
        x2,
        y2,
        w: isMajor ? 1.1 : 0.7,
        o: isMajor ? 0.9 : 0.45,
      };
    });
  }, [centerPos, ring, tickCount, majorEach]);

  // Tính 3 điểm tam giác để vẽ kim chỉ theo góc pointerAngleDeg.
  const pointerPoints = useMemo(() => {
    const angle = ((pointerAngleDeg - 90) * Math.PI) / 180;
    const tipRadius = outer + 4;
    const baseRadius = outer - 6;
    const halfBase = 4;

    const tipX = centerPos + tipRadius * Math.cos(angle);
    const tipY = centerPos + tipRadius * Math.sin(angle);

    const baseCenterX = centerPos + baseRadius * Math.cos(angle);
    const baseCenterY = centerPos + baseRadius * Math.sin(angle);

    const perp = angle + Math.PI / 2;
    const b1x = baseCenterX + halfBase * Math.cos(perp);
    const b1y = baseCenterY + halfBase * Math.sin(perp);
    const b2x = baseCenterX - halfBase * Math.cos(perp);
    const b2y = baseCenterY - halfBase * Math.sin(perp);

    return `${tipX},${tipY} ${b1x},${b1y} ${b2x},${b2y}`;
  }, [centerPos, outer, pointerAngleDeg]);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Circle cx={centerPos} cy={centerPos} r={outer} stroke="#ececf2" strokeWidth={4} fill="none" />
        {/* Vòng progress ngoài cùng (dùng cho Stopwatch/Timer). */}
        {showOuterProgress && (
          <Circle
            cx={centerPos}
            cy={centerPos}
            r={outerProgressRadius}
            stroke={outerProgressColor || primaryColor}
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${outerCircumference} ${outerCircumference}`}
            strokeDashoffset={outerCircumference * (1 - boundedOuterProgress)}
            rotation="-90"
            origin={`${centerPos}, ${centerPos}`}
          />
        )}
        <Circle cx={centerPos} cy={centerPos} r={ring} stroke={subtleColor} strokeWidth={8} fill="none" opacity={0.25} />

        {/* Vòng progress ở ring giữa (nếu cần bật). */}
        {showProgress && (
          <Circle
            cx={centerPos}
            cy={centerPos}
            r={ring}
            stroke={progressColor || primaryColor}
            strokeWidth={8}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={circumference * (1 - boundedProgress)}
            rotation="-90"
            origin={`${centerPos}, ${centerPos}`}
          />
        )}

        {/* Dãy vạch kim phút/giây quanh dial. */}
        {ticks.map((t) => (
          <Line
            key={t.key}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            stroke={primaryColor}
            strokeWidth={t.w}
            opacity={t.o}
          />
        ))}

        {/* Các vòng viền trong + kim chỉ. */}
        <Circle cx={centerPos} cy={centerPos} r={innerRim} stroke={primaryColor} strokeWidth={2.5} fill="none" opacity={0.35} />
        <Circle cx={centerPos} cy={centerPos} r={ring - 2} stroke="#999999" strokeWidth={1.2} fill="none" opacity={0.6} />
        <Polygon points={pointerPoints} fill={pointerColor} />
      </Svg>

      <View style={styles.dialCenter}>{center}</View>
    </View>
  );
}

// Thanh tab điều hướng 4 màn hình.
function TabHeader({ activeTab, onChange }) {
  return (
    <View style={styles.tabHeader}>
      {TABS.map((tab) => {
        const active = tab === activeTab;
        return (
          <TouchableOpacity key={tab} style={styles.tabItem} onPress={() => onChange(tab)} activeOpacity={0.8}>
            <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab}</Text>
            <View style={[styles.tabIndicator, active && styles.tabIndicatorActive]} />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// Công tắc bật/tắt dùng ở màn Alarm.
function Switch({ on, onPress }) {
  return (
    <TouchableOpacity style={[styles.switchTrack, on && styles.switchTrackOn]} onPress={onPress} activeOpacity={0.9}>
      <View style={[styles.switchKnob, on && styles.switchKnobOn]} />
    </TouchableOpacity>
  );
}

// Màn Clock: đồng hồ hiện tại + danh sách múi giờ.
function ClockScreen({ now }) {
  // Kim clock quay theo giây hiện tại (0..59).
  const clockSecondProgress = now.getSeconds() / 60;

  return (
    <View style={styles.screenWrap}>
      <View style={[styles.dialWrap, styles.clockDialWrap]}>
        <Dial
          size={215}
          primaryColor="#e63375"
          subtleColor="#f5c3d6"
          pointerAngleDeg={clockSecondProgress * 360}
          center={
            <>
              <Text style={styles.clockMain}>{formatClockTime(now)}</Text>
              <Text style={styles.clockSub}>{formatDate(now)}</Text>
            </>
          }
        />
      </View>

      <View style={styles.listBlock}>
        {CLOCK_OFFSETS.map((row) => {
          const cityDate = new Date(now.getTime() + row.offset * 60 * 60 * 1000);
          return (
            <View style={styles.cityRow} key={row.city}>
              <Text style={styles.cityName}>{row.city}</Text>
              <Text style={styles.cityTime}>{formatClockTime(cityDate)}</Text>
            </View>
          );
        })}
      </View>

      <TouchableOpacity activeOpacity={0.9} style={styles.pinkButton}>
        <Text style={styles.buttonText}>Set Clock</Text>
      </TouchableOpacity>
    </View>
  );
}

// Màn Alarm: danh sách báo thức và trạng thái bật/tắt.
function AlarmScreen() {
  const [alarms, setAlarms] = useState([
    { time: '07:00', subtitle: 'Mon to Fri only', enabled: true },
    { time: '07:15', subtitle: 'Sun only', enabled: true },
    { time: '08:00', subtitle: 'Never mind...', enabled: false },
  ]);

  const toggleAlarm = (index) => {
    // Đảo trạng thái enabled của đúng alarm được bấm.
    setAlarms((prev) => prev.map((it, i) => (i === index ? { ...it, enabled: !it.enabled } : it)));
  };

  return (
    <View style={styles.screenWrap}>
      <View style={styles.alarmList}>
        {alarms.map((alarm, index) => (
          <View style={styles.alarmRow} key={`${alarm.time}-${index}`}>
            <View>
              <Text style={styles.alarmTime}>{alarm.time}</Text>
              <Text style={styles.alarmSub}>{alarm.subtitle}</Text>
            </View>
            <Switch on={alarm.enabled} onPress={() => toggleAlarm(index)} />
          </View>
        ))}
      </View>

      <TouchableOpacity activeOpacity={0.9} style={styles.blueButton}>
        <Text style={styles.buttonText}>Add Alarm</Text>
      </TouchableOpacity>
    </View>
  );
}

// Màn Stopwatch: bấm giờ, lap, reset, play/pause.
function StopwatchScreen() {
  const [running, setRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(15000);
  const [laps, setLaps] = useState([14500, 13030, 5000]);
  const stopwatchSecondProgress = (elapsedMs % 60000) / 60000;

  useEffect(() => {
    if (!running) {
      return undefined;
    }

    // Cập nhật mỗi 10ms để hiển thị centiseconds mượt.
    const id = setInterval(() => {
      setElapsedMs((prev) => prev + 10);
    }, 10);

    return () => clearInterval(id);
  }, [running]);

  const handleReset = () => {
    setRunning(false);
    setElapsedMs(0);
    setLaps([]);
  };

  const handleMain = () => {
    if (running) {
      // Khi đang chạy mà bấm, lưu lap mới nhất rồi dừng.
      setRunning(false);
      setLaps((prev) => [elapsedMs, ...prev].slice(0, 3));
      return;
    }
    // Khi đang dừng mà bấm, bắt đầu chạy.
    setRunning(true);
  };

  return (
    <View style={styles.screenWrap}>
      <View style={[styles.dialWrap, styles.stopwatchDialWrap]}>
        <Dial
          size={202}
          primaryColor="#ef7a1a"
          subtleColor="#f9d2b0"
          pointerAngleDeg={stopwatchSecondProgress * 360}
          showOuterProgress
          outerProgress={stopwatchSecondProgress}
          outerProgressColor="#ef7a1a"
          center={<Text style={styles.stopwatchMain}>{formatStopwatch(elapsedMs)}</Text>}
        />
      </View>

      <View style={[styles.listBlock, { marginTop: 10 }]}>
        {laps.slice(0, 3).map((lap, idx) => (
          <View style={styles.cityRow} key={`lap-${idx}`}>
            <Text style={styles.cityName}>{`Lap ${idx + 1}`}</Text>
            <Text style={styles.cityTime}>{formatStopwatch(lap).slice(0, 5)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.controlsRow2}>
        <TouchableOpacity style={[styles.roundControl, styles.orangeOutline]} onPress={handleReset} activeOpacity={0.9}>
          <View style={styles.stopIcon} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.roundControl, styles.orangeFill]} onPress={handleMain} activeOpacity={0.9}>
          {running ? <View style={styles.pauseIcon} /> : <View style={styles.playIcon} />}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Màn Timer: đếm ngược, vòng tiến trình và điều khiển.
function TimerScreen() {
  const fullSeconds = 45 * 3600;
  const [remaining, setRemaining] = useState(42 * 3600 + 15 * 60 + 32);
  const [running, setRunning] = useState(false);
  const remainingProgress = remaining / fullSeconds;
  const timerSecondProgress = ((60 - (remaining % 60)) % 60) / 60;
  const timerOuterProgress = ((60 - (remaining % 60)) % 60) / 60;

  useEffect(() => {
    if (!running) {
      return undefined;
    }

    // Mỗi giây trừ 1 đơn vị; về 0 thì tự dừng timer.
    const id = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 0) {
          setRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [running]);

  const reset = () => {
    // Trả timer về mốc ban đầu 45 giờ.
    setRunning(false);
    setRemaining(fullSeconds);
  };

  return (
    <View style={styles.screenWrap}>
      <View style={styles.dialWrap}>
        <Dial
          size={206}
          primaryColor="#35b9cc"
          subtleColor="#bdeaf1"
          showProgress={false}
          showOuterProgress
          outerProgress={timerOuterProgress}
          outerProgressColor="#35b9cc"
          pointerAngleDeg={timerSecondProgress * 360}
          pointerColor="#ef476f"
          center={
            <>
              <Text style={styles.timerMain}>{formatCountdown(remaining)}</Text>
              <Text style={styles.timerSub}>45:00:00</Text>
            </>
          }
        />
      </View>

      <TouchableOpacity style={styles.plusButton} onPress={() => setRemaining((v) => v + 60)} activeOpacity={0.9}>
        <Text style={styles.plusText}>+</Text>
      </TouchableOpacity>

      <View style={styles.controlsRow3}>
        <TouchableOpacity style={[styles.roundControl, styles.tealFill]} onPress={reset} activeOpacity={0.9}>
          <View style={styles.stopIconLight} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.roundControl, styles.tealFill]} onPress={() => setRunning((v) => !v)} activeOpacity={0.9}>
          {running ? <View style={styles.pauseIconLight} /> : <View style={styles.playIconLight} />}
        </TouchableOpacity>

        <TouchableOpacity style={[styles.roundControl, styles.tealFill]} onPress={() => setRunning(false)} activeOpacity={0.9}>
          <View style={styles.pauseIconLight} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Component gốc của app: điều hướng tab và responsive cơ bản.
export default function App() {
  const [activeTab, setActiveTab] = useState('Clock');
  const [now, setNow] = useState(new Date());
  const { width } = useWindowDimensions();
  // Phân loại device để bật style card riêng cho tablet.
  const isTablet = width >= 768;

  useEffect(() => {
    // Đồng bộ thời gian thực cho màn Clock, tick mỗi giây.
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <LinearGradient colors={['#4f0b6c', '#220545']} style={styles.bg}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safe}>
        <View style={[styles.phoneCard, isTablet ? styles.phoneCardTablet : styles.phoneCardPhone]}>
          <TabHeader activeTab={activeTab} onChange={setActiveTab} />

          {activeTab === 'Clock' && <ClockScreen now={now} />}
          {activeTab === 'Alarm' && <AlarmScreen />}
          {activeTab === 'Stopwatch' && <StopwatchScreen />}
          {activeTab === 'Timer' && <TimerScreen />}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

// Toàn bộ style của giao diện.
const styles = StyleSheet.create({
  // Nền gradient toàn màn hình.
  bg: {
    flex: 1,
  },
  // SafeArea để chừa vùng status bar/notch phía trên.
  safe: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    paddingTop: 45,
  },
  // Khung chính chứa nội dung của từng tab.
  phoneCard: {
    flex: 1,
    backgroundColor: '#fbfbfd',
    paddingTop: 10,
    paddingBottom: 20,
    paddingHorizontal: 14,
  },
  // Biến thể full-width cho điện thoại.
  phoneCardPhone: {
    width: '100%',
    maxWidth: '100%',
    alignSelf: 'stretch',
    borderRadius: 0,
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  // Biến thể card nổi cho tablet.
  phoneCardTablet: {
    width: '100%',
    maxWidth: 420,
    marginHorizontal: 56,
    alignSelf: 'center',
    borderRadius: 18,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 7,
  },
  // Thanh tab điều hướng trên cùng.
  tabHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    marginBottom: 6,
  },
  // Nút tab và trạng thái active.
  tabItem: {
    alignItems: 'center',
    width: 66,
  },
  tabText: {
    fontSize: 15,
    color: '#141414',
    fontWeight: '500',
    marginBottom: 4,
  },
  tabTextActive: {
    color: '#101010',
    fontWeight: '700',
  },
  tabIndicator: {
    width: 24,
    height: 2,
    borderRadius: 3,
    backgroundColor: 'transparent',
  },
  tabIndicatorActive: {
    backgroundColor: '#ec5f73',
  },

  // Bố cục chung cho thân màn hình mỗi tab.
  screenWrap: {
    flex: 1,
    paddingTop: 6,
    alignItems: 'center',
  },
  // Khu vực chứa dial và tinh chỉnh khoảng cách theo từng màn.
  dialWrap: {
    marginTop: 20,
    marginBottom: 12,
  },
  clockDialWrap: {
    marginTop: 24,
    marginBottom: 10,
  },
  stopwatchDialWrap: {
    marginTop: 4,
    marginBottom: 8,
  },
  // Khối nội dung nằm giữa dial (text thời gian ở center).
  dialCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Typography cho màn Clock.
  clockMain: {
    fontSize: 34,
    fontWeight: '700',
    color: '#161616',
    letterSpacing: 0.5,
  },
  clockSub: {
    marginTop: 4,
    fontSize: 9,
    color: '#868686',
    fontWeight: '500',
  },

  // Danh sách thông tin thành phố/lap theo dạng hàng.
  listBlock: {
    width: '100%',
    paddingHorizontal: 8,
    marginTop: 2,
  },
  cityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
  },
  cityName: {
    fontSize: 12,
    color: '#151515',
    fontWeight: '500',
  },
  cityTime: {
    fontSize: 12,
    color: '#2a2a2a',
  },

  // Nút hành động chính ở Clock/Alarm.
  pinkButton: {
    marginTop: 20,
    width: 92,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f93e72',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#f93e72',
    shadowOpacity: 0.5,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  blueButton: {
    marginTop: 26,
    width: 92,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2f7cf8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2f7cf8',
    shadowOpacity: 0.45,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },

  // Cụm style riêng cho màn Alarm.
  alarmList: {
    width: '100%',
    marginTop: 12,
    paddingHorizontal: 6,
  },
  alarmRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  alarmTime: {
    fontSize: 37,
    fontWeight: '700',
    color: '#101010',
    lineHeight: 38,
  },
  alarmSub: {
    marginTop: 2,
    fontSize: 9,
    color: '#8a8a8a',
    fontWeight: '500',
  },
  switchTrack: {
    width: 40,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#b8c2d2',
    paddingHorizontal: 2,
    justifyContent: 'center',
  },
  switchTrackOn: {
    backgroundColor: '#497fff',
  },
  switchKnob: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#fff',
  },
  switchKnobOn: {
    marginLeft: 'auto',
  },

  // Cụm style riêng cho Stopwatch/Timer.
  stopwatchMain: {
    fontSize: 30,
    fontWeight: '700',
    color: '#1a1a1a',
    letterSpacing: 0.5,
  },
  controlsRow2: {
    marginTop: 18,
    width: 160,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  controlsRow3: {
    marginTop: 24,
    width: 188,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roundControl: {
    width: 44,
    height: 24,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orangeOutline: {
    borderWidth: 1.5,
    borderColor: '#f08a2a',
    backgroundColor: '#fff',
  },
  orangeFill: {
    backgroundColor: '#f08a2a',
  },
  tealFill: {
    backgroundColor: '#33b8b5',
  },

  // Icon điều khiển dạng shape tự vẽ (stop/play/pause).
  stopIcon: {
    width: 11,
    height: 11,
    borderRadius: 3,
    borderWidth: 1.2,
    borderColor: '#f08a2a',
  },
  playIcon: {
    width: 0,
    height: 0,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderLeftWidth: 10,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#fff',
    marginLeft: 2,
  },
  pauseIcon: {
    width: 10,
    height: 10,
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderColor: '#fff',
  },

  // Typography + nút cộng thời gian ở màn Timer.
  timerMain: {
    fontSize: 28,
    fontWeight: '700',
    color: '#151515',
    letterSpacing: 0.3,
  },
  timerSub: {
    marginTop: 7,
    fontSize: 20,
    color: '#d7d7d7',
    fontWeight: '600',
  },
  plusButton: {
    marginTop: -6,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2bb7d4',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2bb7d4',
    shadowOpacity: 0.45,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  plusText: {
    marginTop: -2,
    color: '#fff',
    fontSize: 30,
    fontWeight: '300',
    lineHeight: 30,
  },

  // Bộ icon sáng cho controls của Timer.
  stopIconLight: {
    width: 10,
    height: 10,
    borderRadius: 2,
    borderWidth: 1.3,
    borderColor: '#e9fffe',
  },
  playIconLight: {
    width: 0,
    height: 0,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderLeftWidth: 10,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#e9fffe',
    marginLeft: 2,
  },
  pauseIconLight: {
    width: 10,
    height: 10,
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderColor: '#e9fffe',
  },
});
