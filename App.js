import React, { useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Line, Polygon } from 'react-native-svg';

const TABS = ['Clock', 'Alarm', 'Stopwatch', 'Timer'];

const CLOCK_OFFSETS = [
  { city: 'Dakar', offset: 0 },
  { city: 'Tokyo', offset: 9 },
  { city: 'Queensland', offset: 10 },
  { city: 'Barcelona', offset: 1 },
];

const COLORS = {
  clock: '#e63375',
  stopwatch: '#ef7a1a',
  timer: '#35b9cc',
  alarm: '#2f7cf8',
};

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Chuẩn hóa số về 2 ký tự để format thời gian luôn đồng nhất (vd: 7 -> 07).
function pad(v) {
  return String(v).padStart(2, '0');
}

function formatClockTime(date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatDate(date) {
  return `${DAYS[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]}`;
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

const Dial = React.memo(function Dial({
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
  const centerPos = size / 2;
  const outer = size / 2 - 6;
  const ring = size / 2 - 16;
  const innerRim = ring - 12;

  // Giữ vòng tiến trình ngoài trùng đúng bán kính với vòng xám ngoài để không lệch nét.
  const outerProgressRadius = outer;
  const outerStrokeWidth = 4;

  const boundedProgress = Math.max(0, Math.min(1, progress));
  const boundedOuterProgress = Math.max(0, Math.min(1, outerProgress));

  const circumference = 2 * Math.PI * ring;
  const outerCircumference = 2 * Math.PI * outerProgressRadius;

  // Tính sẵn tọa độ các vạch chia (tick) theo cực -> Descartes.
  // Dùng useMemo để tránh tính lại liên tục mỗi lần re-render.
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

  // Tạo tam giác kim chỉ từ một góc (độ):
  // 1) Lấy điểm mũi kim theo hướng góc.
  // 2) Lấy tâm đáy kim lùi vào trong một chút.
  // 3) Dùng vector vuông góc để tách 2 điểm đáy trái/phải.
  const pointerPoints = useMemo(() => {
    const angle = ((pointerAngleDeg - 90) * Math.PI) / 180;
    const tipRadius = outer + 4;
    const baseRadius = outer - 6;

    const tipX = centerPos + tipRadius * Math.cos(angle);
    const tipY = centerPos + tipRadius * Math.sin(angle);

    const baseCenterX = centerPos + baseRadius * Math.cos(angle);
    const baseCenterY = centerPos + baseRadius * Math.sin(angle);

    const perp = angle + Math.PI / 2;
    const halfBase = 4;
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

        {showOuterProgress && (
          <Circle
            cx={centerPos}
            cy={centerPos}
            r={outerProgressRadius}
            stroke={outerProgressColor || primaryColor}
            strokeWidth={outerStrokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${outerCircumference} ${outerCircumference}`}
            strokeDashoffset={outerCircumference * (1 - boundedOuterProgress)}
            rotation="-90"
            origin={`${centerPos}, ${centerPos}`}
          />
        )}

        <Circle cx={centerPos} cy={centerPos} r={ring} stroke={subtleColor} strokeWidth={8} fill="none" opacity={0.25} />

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

        <Circle cx={centerPos} cy={centerPos} r={innerRim} stroke={primaryColor} strokeWidth={2.5} fill="none" opacity={0.35} />
        <Circle cx={centerPos} cy={centerPos} r={ring - 2} stroke="#999999" strokeWidth={1.2} fill="none" opacity={0.6} />
        <Polygon points={pointerPoints} fill={pointerColor} />
      </Svg>

      <View style={styles.dialCenter}>{center}</View>
    </View>
  );
});

const TabHeader = React.memo(function TabHeader({ activeTab, onChange }) {
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
});

const Switch = React.memo(function Switch({ on, onPress }) {
  return (
    <TouchableOpacity style={[styles.switchTrack, on && styles.switchTrackOn]} onPress={onPress} activeOpacity={0.9}>
      <View style={[styles.switchKnob, on && styles.switchKnobOn]} />
    </TouchableOpacity>
  );
});

const ClockScreen = React.memo(function ClockScreen({ now }) {
  const clockSecondProgress = now.getSeconds() / 60;

  return (
    <View style={styles.screenWrap}>
      <View style={[styles.dialWrap, styles.clockDialWrap]}>
        <Dial
          size={206}
          primaryColor={COLORS.clock}
          subtleColor="#f5c3d6"
          pointerAngleDeg={clockSecondProgress * 360}
          showOuterProgress
          outerProgress={clockSecondProgress}
          outerProgressColor={COLORS.clock}
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
});

function AlarmScreen() {
  const [alarms, setAlarms] = useState([
    { time: '07:00', subtitle: 'Mon to Fri only', enabled: true },
    { time: '07:15', subtitle: 'Sun only', enabled: true },
    { time: '08:00', subtitle: 'Never mind...', enabled: false },
  ]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newHour, setNewHour] = useState(0);
  const [newMinute, setNewMinute] = useState(0);
  const [newSubtitle, setNewSubtitle] = useState('');

  // Bật/tắt từng alarm theo index, giữ immutable để React nhận đúng thay đổi state.
  const toggleAlarm = (index) => {
    setAlarms((prev) => prev.map((it, i) => (i === index ? { ...it, enabled: !it.enabled } : it)));
  };

  // Kiểm tra dữ liệu giờ/phút hợp lệ trước khi thêm alarm mới.
  // Sau khi thêm thì reset form để lần nhập tiếp theo luôn về trạng thái sạch.
  const addAlarm = () => {
    if (newHour >= 0 && newHour < 24 && newMinute >= 0 && newMinute < 60) {
      const newAlarm = {
        time: `${pad(newHour)}:${pad(newMinute)}`,
        subtitle: newSubtitle || 'New alarm',
        enabled: true,
      };
      setAlarms((prev) => [...prev, newAlarm]);
      setShowAddModal(false);
      setNewHour(0);
      setNewMinute(0);
      setNewSubtitle('');
    }
  };

  const incrementAlarmHour = () => setNewHour((prev) => (prev + 1) % 24);
  const decrementAlarmHour = () => setNewHour((prev) => (prev === 0 ? 23 : prev - 1));
  const incrementAlarmMinute = () => setNewMinute((prev) => (prev + 1) % 60);
  const decrementAlarmMinute = () => setNewMinute((prev) => (prev === 0 ? 59 : prev - 1));

  return (
    <View style={styles.screenWrapContainer}>
      <View style={styles.screenWrap}>
        <ScrollView style={styles.alarmList} showsVerticalScrollIndicator>
          {alarms.map((alarm, index) => (
            <View style={styles.alarmRow} key={`${alarm.time}-${index}`}>
              <View>
                <Text style={styles.alarmTime}>{alarm.time}</Text>
                <Text style={styles.alarmSub}>{alarm.subtitle}</Text>
              </View>
              <Switch on={alarm.enabled} onPress={() => toggleAlarm(index)} />
            </View>
          ))}
        </ScrollView>

        <TouchableOpacity activeOpacity={0.9} style={styles.blueButton} onPress={() => setShowAddModal(true)}>
          <Text style={styles.buttonText}>Add Alarm</Text>
        </TouchableOpacity>
      </View>

      {showAddModal && (
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowAddModal(false)} activeOpacity={1}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set New Alarm</Text>

            <View style={styles.timerInputRow}>
              <View style={styles.timeUnitControl}>
                <TouchableOpacity onPress={incrementAlarmHour} activeOpacity={0.7}>
                  <Text style={styles.timeBtnText}>+</Text>
                </TouchableOpacity>
                <Text style={styles.timeUnitValue}>{pad(newHour)}</Text>
                <TouchableOpacity onPress={decrementAlarmHour} activeOpacity={0.7}>
                  <Text style={styles.timeBtnText}>-</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.timeUnitLabel}>:</Text>

              <View style={styles.timeUnitControl}>
                <TouchableOpacity onPress={incrementAlarmMinute} activeOpacity={0.7}>
                  <Text style={styles.timeBtnText}>+</Text>
                </TouchableOpacity>
                <Text style={styles.timeUnitValue}>{pad(newMinute)}</Text>
                <TouchableOpacity onPress={decrementAlarmMinute} activeOpacity={0.7}>
                  <Text style={styles.timeBtnText}>-</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalButtonRow}>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnCancel]} onPress={() => setShowAddModal(false)} activeOpacity={0.8}>
                <Text style={styles.modalBtnTextCancel}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnAdd]} onPress={addAlarm} activeOpacity={0.8}>
                <Text style={styles.modalBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

function StopwatchScreen() {
  const [running, setRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(15000);
  const [laps, setLaps] = useState([14500, 13030, 5000]);
  const stopwatchSecondProgress = (elapsedMs % 60000) / 60000;

  // Khi running=true, đồng hồ chạy mỗi 10ms để hiển thị centisecond (1/100 giây).
  // Cleanup interval trong return để tránh tạo nhiều interval chồng nhau.
  useEffect(() => {
    if (!running) {
      return undefined;
    }
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
      setRunning(false);
      // Khi bấm lúc đang chạy: coi như chốt một lap và chỉ giữ 3 lap mới nhất.
      setLaps((prev) => [elapsedMs, ...prev].slice(0, 3));
      return;
    }
    setRunning(true);
  };

  return (
    <View style={styles.screenWrap}>
      <View style={[styles.dialWrap, styles.stopwatchDialWrap]}>
        <Dial
          size={206}
          primaryColor={COLORS.stopwatch}
          subtleColor="#f9d2b0"
          pointerAngleDeg={stopwatchSecondProgress * 360}
          showOuterProgress
          outerProgress={stopwatchSecondProgress}
          outerProgressColor={COLORS.stopwatch}
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

function TimerScreen() {
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(1);
  const [seconds, setSeconds] = useState(30);
  const [running, setRunning] = useState(false);
  const [remaining, setRemaining] = useState(1 * 60 + 30);
  const [showTimeInput, setShowTimeInput] = useState(false);

  // totalSeconds là mốc gốc, remaining là thời gian còn lại.
  // Tỷ lệ remaining/totalSeconds dùng để tô vòng tiến trình tròn.
  const totalSeconds = hours * 3600 + minutes * 60 + seconds;
  const timerProgress = totalSeconds > 0 ? remaining / totalSeconds : 0;

  // Vòng lặp đếm ngược chính: mỗi giây giảm 1 đơn vị.
  // Nếu còn <=1 thì dừng hẳn và chốt về 0 để tránh âm.
  useEffect(() => {
    if (!running) {
      return undefined;
    }
    const id = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          setRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (running) {
      setShowTimeInput(false);
    }
  }, [running]);

  const setTime = (newHours, newMinutes, newSeconds) => {
    // Hàm trung tâm để đồng bộ cả phần input (h/m/s) lẫn remaining.
    // Mỗi lần đổi thời lượng mới thì dừng timer để tránh trạng thái mâu thuẫn.
    setHours(newHours);
    setMinutes(newMinutes);
    setSeconds(newSeconds);
    setRemaining(newHours * 3600 + newMinutes * 60 + newSeconds);
    setRunning(false);
  };

  const incrementHour = () => setTime((hours + 1) % 24, minutes, seconds);
  const decrementHour = () => setTime(hours === 0 ? 23 : hours - 1, minutes, seconds);

  const incrementMinute = () => {
    // Khi phút từ 59 -> 00 thì tự động cộng giờ.
    const newMinutes = (minutes + 1) % 60;
    const newHours = minutes === 59 ? (hours + 1) % 24 : hours;
    setTime(newHours, newMinutes, seconds);
  };

  const decrementMinute = () => {
    // Khi phút đang 00 mà giảm tiếp thì mượn 1 giờ và đưa phút về 59.
    if (minutes === 0) {
      setTime(hours === 0 ? 23 : hours - 1, 59, seconds);
    } else {
      setTime(hours, minutes - 1, seconds);
    }
  };

  const incrementSecond = () => {
    // Quy tắc nhớ khi giây tràn: 59s -> 00s thì tăng phút, có thể kéo theo tăng giờ.
    const newSeconds = (seconds + 1) % 60;
    const newMinutes = seconds === 59 ? (minutes + 1) % 60 : minutes;
    const newHours = seconds === 59 && minutes === 59 ? (hours + 1) % 24 : hours;
    setTime(newHours, newMinutes, newSeconds);
  };

  const decrementSecond = () => {
    // Quy tắc mượn khi giây giảm dưới 00.
    if (seconds === 0) {
      if (minutes === 0) {
        setTime(hours === 0 ? 23 : hours - 1, 59, 59);
      } else {
        setTime(hours, minutes - 1, 59);
      }
    } else {
      setTime(hours, minutes, seconds - 1);
    }
  };

  const reset = () => {
    setRunning(false);
    setRemaining(hours * 3600 + minutes * 60 + seconds);
  };

  const closeTimeInput = () => setShowTimeInput(false);

  return (
    <View style={styles.screenWrapContainer}>
      <View style={styles.screenWrap}>
        <View style={styles.dialWrap}>
          <Dial
            size={206}
            primaryColor={COLORS.timer}
            subtleColor="#bdeaf1"
            showProgress={false}
            showOuterProgress
            outerProgress={timerProgress}
            outerProgressColor={COLORS.timer}
            pointerAngleDeg={timerProgress * 360}
            pointerColor="#ef476f"
            center={
              <>
                <Text style={styles.timerMain}>{formatCountdown(remaining)}</Text>
                <Text style={styles.timerSub}>{formatCountdown(totalSeconds)}</Text>
              </>
            }
          />
        </View>

        <TouchableOpacity
          style={[styles.roundControl, styles.tealFill, styles.plusButtonTimer, running && styles.disabledButton]}
          onPress={() => !running && setShowTimeInput(true)}
          activeOpacity={running ? 0.5 : 0.9}
          disabled={running}
        >
          <Text style={styles.plusTextSmall}>+</Text>
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

      {showTimeInput && (
        <TouchableOpacity style={styles.modalOverlay} onPress={closeTimeInput} activeOpacity={1}>
          <View style={styles.modalContent}>
            <View style={styles.timerInputRow}>
              <View style={styles.timeUnitControl}>
                <TouchableOpacity onPress={incrementHour} activeOpacity={0.7}>
                  <Text style={styles.timeBtnText}>+</Text>
                </TouchableOpacity>
                <Text style={styles.timeUnitValue}>{pad(hours)}</Text>
                <TouchableOpacity onPress={decrementHour} activeOpacity={0.7}>
                  <Text style={styles.timeBtnText}>-</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.timeUnitLabel}>:</Text>

              <View style={styles.timeUnitControl}>
                <TouchableOpacity onPress={incrementMinute} activeOpacity={0.7}>
                  <Text style={styles.timeBtnText}>+</Text>
                </TouchableOpacity>
                <Text style={styles.timeUnitValue}>{pad(minutes)}</Text>
                <TouchableOpacity onPress={decrementMinute} activeOpacity={0.7}>
                  <Text style={styles.timeBtnText}>-</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.timeUnitLabel}>:</Text>

              <View style={styles.timeUnitControl}>
                <TouchableOpacity onPress={incrementSecond} activeOpacity={0.7}>
                  <Text style={styles.timeBtnText}>+</Text>
                </TouchableOpacity>
                <Text style={styles.timeUnitValue}>{pad(seconds)}</Text>
                <TouchableOpacity onPress={decrementSecond} activeOpacity={0.7}>
                  <Text style={styles.timeBtnText}>-</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.modalCloseBtn} onPress={closeTimeInput} activeOpacity={0.8}>
              <Text style={styles.modalCloseBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('Clock');
  const [now, setNow] = useState(new Date());
  const { width } = useWindowDimensions();
  const isTablet = useMemo(() => width >= 768, [width]);

  // Cập nhật thời gian hiện tại mỗi giây để tab Clock và dữ liệu phụ luôn realtime.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <LinearGradient colors={['#000000', '#000000']} style={styles.bg}>
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

const styles = StyleSheet.create({
  bg: {
    flex: 1,
  },
  safe: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    paddingTop: 45,
  },
  phoneCard: {
    flex: 1,
    backgroundColor: '#fbfbfd',
    paddingTop: 10,
    paddingBottom: 20,
    paddingHorizontal: 14,
    overflow: 'visible',
  },
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
  tabHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    marginBottom: 6,
  },
  tabItem: {
    alignItems: 'center',
    width: 66,
  },
  tabText: {
    fontSize: 12,
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
  screenWrapContainer: {
    flex: 1,
    position: 'relative',
    overflow: 'visible',
  },
  screenWrap: {
    flex: 1,
    paddingTop: 6,
    alignItems: 'center',
    overflow: 'visible',
  },
  dialWrap: {
    marginTop: 20,
    marginBottom: 12,
  },
  clockDialWrap: {},
  stopwatchDialWrap: {},
  dialCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  alarmList: {
    flex: 1,
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
  timerInputRow: {
    marginTop: 18,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeUnitControl: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  timeUnitValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginVertical: 6,
  },
  timeUnitLabel: {
    fontSize: 20,
    fontWeight: '600',
    color: '#999',
    marginHorizontal: 4,
  },
  timeBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#35b9cc',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  plusButtonTimer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginTop: 12,
    marginBottom: 12,
  },
  plusTextSmall: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
  },
  modalContent: {
    backgroundColor: '#fbfbfd',
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  modalCloseBtn: {
    marginTop: 20,
    paddingHorizontal: 32,
    paddingVertical: 10,
    backgroundColor: '#35b9cc',
    borderRadius: 20,
    alignItems: 'center',
  },
  modalCloseBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  modalButtonRow: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
  },
  modalBtnCancel: {
    backgroundColor: '#ddd',
  },
  modalBtnAdd: {
    backgroundColor: '#2f7cf8',
  },
  modalBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  modalBtnTextCancel: {
    color: '#333',
    fontSize: 13,
    fontWeight: '600',
  },
});
