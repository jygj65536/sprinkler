import { useState, useEffect, useRef } from 'react';
import { Analytics } from '@apps-in-toss/web-framework';
import { UserPlant, Screen, PlantInitialData } from './types';
import { SPECIES_DB, DEMO_PLANTS, COLOR_PALETTE } from './data';
import type { CustomPlantData } from './screens/Add';
import { todayISO, getStatus, getDueInfo, addDays, diffDays, buildCalendarWeeks, buildMiniCalendar, fmtDate, parseDate, getCurrentSeason } from './utils';
import { loadPlants, savePlants } from './storage';
import { plantDoodle, shelfDoodle, DROP_LIGHT, SEARCH, HOME_NAV, CAL_NAV, CARE_ICONS, SUMMARY_NEED, SUMMARY_OK, CAN_STICKER, DROP_MINI, ARCHIVE_NAV, ARCHIVE_DOODLE } from './doodles';
import HomeScreen from './screens/Home';
import CalendarScreen from './screens/Calendar';
import DetailScreen from './screens/Detail';
import ArchiveScreen from './screens/Archive';
import AddScreen from './screens/Add';
import './App.css';

const TODAY = todayISO();
const MONTH_NAMES = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
const WEEKDAYS = ['일','월','화','수','목','금','토'].map((l, i) => ({ label: l, col: i === 0 ? '#CC6B52' : 'var(--soft)' }));

export default function App() {
  const [plants, setPlants] = useState<UserPlant[]>(DEMO_PLANTS);
  const [screen, setScreen] = useState<Screen>('home');
  const [lastMain, setLastMain] = useState<'home' | 'calendar' | 'archive'>('home');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calVisible, setCalVisible] = useState<string[]>(DEMO_PLANTS.map(p => p.id));
  const [addQuery, setAddQuery] = useState('');
  const [addSelId, setAddSelId] = useState<string | null>(null);
  const [addCustomName, setAddCustomName] = useState('');
  const [addColor, setAddColor] = useState(COLOR_PALETTE[0]);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [loaded, setLoaded] = useState(false);

  // 저장된 식물 불러오기
  useEffect(() => {
    loadPlants().then(saved => {
      if (saved && saved.length > 0) {
        setPlants(saved);
        setCalVisible(saved.map(p => p.id));
      }
      setLoaded(true);
    });
  }, []);

  // 식물 변경 시 저장
  useEffect(() => {
    if (!loaded) return;
    savePlants(plants).catch(() => {
      showToast('저장 실패 ⚠️ 데이터가 보관되지 않을 수 있어요');
    });
  }, [plants, loaded]); // eslint-disable-line react-hooks/exhaustive-deps

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1900);
  };

  const activePlants = plants.filter(p => !p.archived);
  const archivedPlants = plants.filter(p => p.archived);
  const needWater = activePlants.filter(p => getStatus(p, TODAY).key !== 'healthy').length;

  const go = (s: Screen) => {
    if (s === 'home' || s === 'calendar' || s === 'archive') setLastMain(s);
    if (s === 'home') {
      const statuses = activePlants.map(p => getStatus(p, TODAY).key);
      Analytics.screen({ log_name: 'screen_home', home_state: activePlants.length === 0 ? 'empty' : needWater > 0 ? 'need' : 'ok', plant_count: activePlants.length, need_water_count: needWater, healthy_count: statuses.filter(k => k === 'healthy').length, thirsty_count: statuses.filter(k => k === 'thirsty').length, urgent_count: statuses.filter(k => k === 'urgent').length });
    } else if (s === 'calendar') {
      Analytics.screen({ log_name: 'screen_calendar', plant_count: activePlants.length });
    } else if (s === 'archive') {
      Analytics.screen({ log_name: 'screen_archive', archive_state: archivedPlants.length === 0 ? 'empty' : 'has_plants', plant_count: archivedPlants.length });
    } else if (s === 'add') {
      Analytics.screen({ log_name: 'screen_add', plant_count: activePlants.length, entry_from: lastMain });
    }
    setScreen(s);
  };

  const waterMultiple = (ids: string[]) => {
    const targets = plants.filter(p => ids.includes(p.id) && p.wateringLogs[p.wateringLogs.length - 1] !== TODAY);
    if (targets.length === 0) { showToast('오늘 이미 기록됐어요'); return; }
    setPlants(prev => prev.map(p => targets.some(t => t.id === p.id) ? { ...p, wateringLogs: [...p.wateringLogs, TODAY] } : p));
    showToast(targets.length === 1 ? `${targets[0].name} 물 주기 완료!` : `${targets.length}개 식물에게 물 줬어요`);
  };

  const cancelWatering = (id: string) => {
    setPlants(prev => prev.map(p => {
      if (p.id !== id) return p;
      if (p.wateringLogs[p.wateringLogs.length - 1] !== TODAY) return p;
      if (p.wateringLogs.length <= 1) return p;
      return { ...p, wateringLogs: p.wateringLogs.slice(0, -1) };
    }));
    showToast('물주기 취소했어요');
  };

  const editFirstWatering = (id: string, date: string) => {
    setPlants(prev => prev.map(p => {
      if (p.id !== id) return p;
      const logs = [...p.wateringLogs];
      logs[0] = date;
      logs.sort();
      return { ...p, wateringLogs: logs };
    }));
    showToast('첫 물주기 날짜를 수정했어요');
  };

  const editPlant = (id: string, data: PlantInitialData) => {
    setPlants(prev => prev.map(p => p.id !== id ? p : {
      ...p,
      name: data.name,
      speciesName: data.speciesName,
      sci: data.sci,
      type: data.type,
      color: data.color,
      waterIntervalDays: data.waterIntervalDays,
      waterTiming: data.waterTiming,
      light: data.light,
      temp: data.temp,
    }));
    showToast('저장했어요');
  };

  const deletePlant = (id: string) => {
    setPlants(prev => prev.filter(p => p.id !== id));
    setCalVisible(prev => prev.filter(pid => pid !== id));
    go('home');
    showToast('식물을 보내줬어요');
  };

  const archivePlant = (id: string) => {
    const p = plants.find(x => x.id === id);
    if (!p) return;
    setPlants(prev => prev.map(x => x.id === id ? { ...x, archived: true, archivedAt: TODAY } : x));
    go('archive');
    showToast(`${p.name}을(를) 보관함으로 옮겼어요`);
  };

  const unarchivePlant = (id: string) => {
    const p = plants.find(x => x.id === id);
    if (!p) return;
    setPlants(prev => prev.map(x => x.id === id ? { ...x, archived: false, archivedAt: undefined } : x));
    go('home');
    showToast(`${p.name}이(가) 다시 식구로 돌아왔어요`);
  };

  const addCustomPlant = (data: CustomPlantData) => {
    const waterMode = data.waterIntervalDays.spring === data.waterIntervalDays.summer && data.waterIntervalDays.summer === data.waterIntervalDays.autumn && data.waterIntervalDays.autumn === data.waterIntervalDays.winter ? 'uniform' : 'seasonal';
    const np: UserPlant = {
      id: 'u_' + Date.now(),
      speciesId: '',
      speciesName: data.speciesName || data.name,
      name: data.name,
      sci: data.sci,
      type: data.type,
      color: data.color,
      waterIntervalDays: data.waterIntervalDays,
      waterTiming: data.waterTiming,
      light: data.light,
      temp: data.temp,
      registeredAt: TODAY,
      wateringLogs: [TODAY],
      initialData: { name: data.name, speciesName: data.speciesName || data.name, sci: data.sci, type: data.type, color: data.color, waterIntervalDays: data.waterIntervalDays, waterTiming: data.waterTiming, light: data.light, temp: data.temp },
    };
    Analytics.click({ log_name: 'click_add_custom_confirm', plant_id: np.id, plant_type: np.type, water_mode: waterMode, color: np.color });
    setPlants(prev => [...prev, np]);
    setCalVisible(prev => [...prev, np.id]);
    setAddQuery('');
    go('home');
    showToast('새로운 가족이 되었어요!');
  };

  const addPlant = () => {
    const sp = SPECIES_DB.find(s => s.id === addSelId);
    if (!sp) return;
    const finalName = addCustomName.trim() || sp.name;
    const np: UserPlant = {
      id: 'u_' + Date.now(),
      speciesId: sp.id,
      speciesName: sp.name,
      name: finalName,
      sci: sp.sci, type: sp.type, color: addColor,
      waterIntervalDays: sp.waterIntervalDays,
      waterTiming: sp.waterTiming,
      registeredAt: TODAY,
      light: sp.light, temp: sp.temp,
      wateringLogs: [TODAY],
      initialData: { name: finalName, speciesName: sp.name, sci: sp.sci, type: sp.type, color: addColor, waterIntervalDays: sp.waterIntervalDays, waterTiming: sp.waterTiming, light: sp.light, temp: sp.temp },
    };
    Analytics.click({ log_name: 'click_add_species_confirm', plant_id: np.id, species_id: np.speciesId, has_custom_name: addCustomName.trim() !== '', color: addColor });
    setPlants(prev => [...prev, np]);
    setCalVisible(prev => [...prev, np.id]);
    setAddQuery('');
    setAddSelId(null);
    setAddCustomName('');
    setAddColor(COLOR_PALETTE[0]);
    go('home');
    showToast('새로운 가족이 되었어요!');
  };

  const shiftMonth = (n: number) => {
    let y = calYear, m = calMonth + n;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    Analytics.click({ log_name: n < 0 ? 'click_calendar_month_prev' : 'click_calendar_month_next', year: y, month: m + 1 });
    setCalYear(y); setCalMonth(m);
  };

  // ---- Home 데이터 (보관 식물 제외) ----
  const homePlants = activePlants.map((p, idx) => {
    const st = getStatus(p, TODAY);
    return {
      id: p.id, name: p.name, type: p.type, speciesId: p.speciesId,
      shelfDoodle: shelfDoodle(p.type, st.color),
      status: { key: st.key, label: st.label, color: st.color },
      onOpen: () => {
        Analytics.click({ log_name: 'click_home_plant_card', plant_id: p.id, species_id: p.speciesId, plant_type: p.type, plant_status: st.key, shelf_position: idx });
        Analytics.screen({ log_name: 'screen_detail', plant_id: p.id, species_id: p.speciesId, plant_type: p.type, plant_count: activePlants.length, entry_from: lastMain });
        setSelectedId(p.id); go('detail');
      },
    };
  });

  // ---- Archive 데이터 ----
  const archivePlants = archivedPlants.map((p, idx) => {
    const d = p.archivedAt ? new Date(p.archivedAt) : new Date();
    const archiveTag = `${d.getMonth() + 1}월 ${d.getDate()}일 보관`;
    const archivedDays = p.archivedAt ? diffDays(p.archivedAt, TODAY) : 0;
    return {
      id: p.id, name: p.name, type: p.type,
      shelfDoodle: shelfDoodle(p.type, p.color),
      archiveTag,
      onOpen: () => {
        Analytics.click({ log_name: 'click_archive_plant_card', plant_id: p.id, plant_type: p.type, archived_days: archivedDays, shelf_position: idx });
        Analytics.screen({ log_name: 'screen_detail', plant_id: p.id, species_id: p.speciesId, plant_type: p.type, plant_count: activePlants.length, entry_from: lastMain });
        setSelectedId(p.id); go('detail');
      },
    };
  });
  const archiveSummary = archivedPlants.length > 0
    ? `${archivedPlants.length}개의 식물이 쉬는 중`
    : '보관 중인 식물이 없어요';

  // ---- Calendar 데이터 ----
  const selPlants = activePlants.filter(p => calVisible.includes(p.id));
  const calWeeks = buildCalendarWeeks(calYear, calMonth, selPlants, TODAY);
  const chips = activePlants.map(p => ({
    id: p.id, name: p.name, color: p.color,
    on: calVisible.includes(p.id),
    onToggle: () => {
      const wasOn = calVisible.includes(p.id);
      Analytics.click({ log_name: 'click_calendar_plant_chip', plant_id: p.id, state: wasOn ? 'off' : 'on', active_chip_count: wasOn ? calVisible.length - 1 : calVisible.length + 1 });
      setCalVisible(prev => prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id]);
    },
  }));
  const upcoming = selPlants
    .map(p => ({ p, due: getDueInfo(p, TODAY) }))
    .sort((a, b) => parseDate(a.due.dueDate).getTime() - parseDate(b.due.dueDate).getTime())
    .map(({ p, due }) => {
      const dueDays = diffDays(TODAY, due.dueDate);
      return {
        name: p.name, color: p.color,
        dueText: due.text, dueCol: due.color,
        rangeText: `추천 구간 ${fmtDate(addDays(due.dueDate, -2))} ~ ${fmtDate(addDays(due.dueDate, 2))}`,
        onOpen: () => {
          Analytics.click({ log_name: 'click_calendar_upcoming_item', plant_id: p.id, due_days: dueDays });
          Analytics.screen({ log_name: 'screen_detail', plant_id: p.id, species_id: p.speciesId, plant_type: p.type, plant_count: activePlants.length, entry_from: lastMain });
          setSelectedId(p.id); go('detail');
        },
      };
    });

  // ---- Detail 데이터 ----
  const dp = plants.find(p => p.id === selectedId);
  const detailPlant = dp ? (() => {
    const st = getStatus(dp, TODAY);
    const du = getDueInfo(dp, TODAY);
    const history = [...dp.wateringLogs].reverse().map((h, i) => {
      const origIdx = dp.wateringLogs.length - 1 - i;
      const prev = dp.wateringLogs[origIdx - 1];
      const isFirst = origIdx === 0;
      let color = '#5E8C57', tag = '첫 물주기', gapText = '기록의 시작';
      if (prev) {
        const gap = diffDays(prev, h);
        if (gap <= dp.waterIntervalDays[getCurrentSeason()] * 1.15)     { color = '#5E8C57'; tag = '제때'; }
        else if (gap <= dp.waterIntervalDays[getCurrentSeason()] * 1.5) { color = '#C99A3C'; tag = '조금 늦음'; }
        else                                    { color = '#CC6B52'; tag = '많이 늦음'; }
        gapText = `${gap}일 만에 줬어요`;
      }
      const dow = '일월화수목금토'[parseDate(h).getDay()];
      return { dateText: `${fmtDate(h)} (${dow})`, color, tag, gapText, rawDate: h, isFirst };
    });
    const regDate = parseDate(dp.registeredAt);
    return {
      id: dp.id, name: dp.name, speciesName: dp.speciesName, sci: dp.sci, type: dp.type,
      doodle: plantDoodle(dp.type),
      dropLight: DROP_LIGHT,
      status: st, due: du,
      bondDays: diffDays(dp.registeredAt, TODAY),
      registeredText: `${regDate.getFullYear()}.${String(regDate.getMonth() + 1).padStart(2, '0')}`,
      careRows: [
        { icon: CARE_ICONS.light,  label: '빛',      value: dp.light },
        { icon: CARE_ICONS.water,  label: '물 줄 때', value: dp.waterTiming[getCurrentSeason()] },
        { icon: CARE_ICONS.temp,   label: '온도',     value: dp.temp },
        { icon: CARE_ICONS.cycle,  label: '물주기',   value: `${dp.waterIntervalDays[getCurrentSeason()]}일마다` },
      ],
      history,
      miniWeeks: buildMiniCalendar(dp, calYear, calMonth),
      canCancelWatering: dp.wateringLogs[dp.wateringLogs.length - 1] === TODAY,
      editable: {
        name: dp.name, speciesName: dp.speciesName, sci: dp.sci, type: dp.type, color: dp.color,
        waterIntervalDays: dp.waterIntervalDays, waterTiming: dp.waterTiming,
        light: dp.light, temp: dp.temp,
        initialData: dp.initialData ?? {
          name: dp.name, speciesName: dp.speciesName, sci: dp.sci, type: dp.type, color: dp.color,
          waterIntervalDays: dp.waterIntervalDays, waterTiming: dp.waterTiming,
          light: dp.light, temp: dp.temp,
        },
      },
      onWater: () => {
        Analytics.click({ log_name: 'click_detail_water', plant_id: dp.id, species_id: dp.speciesId, plant_type: dp.type, plant_status: st.key });
        waterMultiple([dp.id]);
      },
      onCancelWatering: () => {
        Analytics.click({ log_name: 'click_detail_cancel_water', plant_id: dp.id });
        cancelWatering(dp.id);
      },
      onEditFirstWatering: (date: string) => editFirstWatering(dp.id, date),
      onDelete: () => {
        Analytics.click({ log_name: 'click_detail_delete', plant_id: dp.id, species_id: dp.speciesId, plant_type: dp.type, bond_days: diffDays(dp.registeredAt, TODAY), plant_status: st.key });
        deletePlant(dp.id);
      },
      onEdit: (data: PlantInitialData) => editPlant(dp.id, data),
    };
  })() : null;

  // ---- Add 데이터 ----
  const q = addQuery.trim();
  const selectSpecies = (id: string) => {
    Analytics.impression({ log_name: 'imp_add_species_sheet', species_id: id });
    setAddSelId(id);
    const sp = SPECIES_DB.find(s => s.id === id);
    if (sp) setAddCustomName(sp.name);
  };
  const addResults = SPECIES_DB
    .filter(s => !q || s.name.includes(q) || s.sci.toLowerCase().includes(q.toLowerCase()))
    .map((s, idx) => ({ ...s, intervalDays: s.waterIntervalDays[getCurrentSeason()], doodle: plantDoodle(s.type), onSelect: () => {
      Analytics.click({ log_name: 'click_add_search_result', species_id: s.id, query: q, rank: idx });
      selectSpecies(s.id);
    } }));
  const addSel = SPECIES_DB.find(s => s.id === addSelId);
  const addSelData = addSel ? {
    ...addSel,
    doodle: plantDoodle(addSel.type),
    careRows: [
      { icon: CARE_ICONS.light,  label: '빛',      value: addSel.light },
      { icon: CARE_ICONS.water,  label: '물 줄 때', value: addSel.waterTiming[getCurrentSeason()] },
      { icon: CARE_ICONS.temp,   label: '온도',     value: addSel.temp },
      { icon: CARE_ICONS.cycle,  label: '물주기',   value: `${addSel.waterIntervalDays[getCurrentSeason()]}일마다` },
    ],
  } : null;

  const isMain = screen === 'home' || screen === 'calendar' || screen === 'archive';
  const navPb = `calc(84px + var(--safe-bottom))`;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)', paddingBottom: isMain ? navPb : 0 }}>
      {screen === 'home' && (
        <HomeScreen
          plants={homePlants}
          needWater={needWater}
          summaryDoodle={needWater > 0 ? SUMMARY_NEED : SUMMARY_OK}
          canSticker={CAN_STICKER}
          dropMini={DROP_MINI}
          goAdd={() => go('add')}
          onWaterOne={id => waterMultiple([id])}
        />
      )}

      {screen === 'calendar' && (
        <CalendarScreen
          monthLabel={`${calYear}년 ${MONTH_NAMES[calMonth]}`}
          weeks={calWeeks}
          chips={chips}
          upcoming={upcoming}
          weekdays={WEEKDAYS}
          onPrevMonth={() => shiftMonth(-1)}
          onNextMonth={() => shiftMonth(1)}
        />
      )}

      {screen === 'detail' && detailPlant && (
        <DetailScreen
          plant={detailPlant}
          weekdays={WEEKDAYS}
          goBack={() => go(lastMain)}
        />
      )}

      {screen === 'archive' && (
        <ArchiveScreen
          plants={archivePlants}
          archiveDoodle={ARCHIVE_DOODLE}
          archiveSummary={archiveSummary}
        />
      )}

      {screen === 'add' && (
        <AddScreen
          query={addQuery}
          onQueryChange={setAddQuery}
          results={addResults}
          selectedSpecies={addSelData}
          customName={addCustomName}
          onCustomNameChange={setAddCustomName}
          selectedColor={addColor}
          onColorChange={setAddColor}
          onClosePreview={() => setAddSelId(null)}
          onAdd={addPlant}
          onAddCustom={addCustomPlant}
          goBack={() => go(lastMain)}
          searchIcon={SEARCH}
        />
      )}

      {/* 하단 네비게이션 */}
      {isMain && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: `calc(84px + var(--safe-bottom))`, background: 'var(--paper)', borderTop: '2px solid var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'space-around', paddingBottom: 'calc(14px + var(--safe-bottom))', paddingLeft: 28, paddingRight: 28, zIndex: 30 }}>
          <button onClick={() => go('home')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', color: screen === 'home' ? 'var(--ink)' : 'var(--soft)', padding: 0, fontFamily: 'inherit' }}>
            <div style={{ width: 26, height: 26 }} dangerouslySetInnerHTML={{ __html: HOME_NAV }} />
            <span style={{ fontSize: 11, fontWeight: 700 }}>홈</span>
          </button>
          <button onClick={() => go('calendar')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', color: screen === 'calendar' ? 'var(--ink)' : 'var(--soft)', padding: 0, fontFamily: 'inherit' }}>
            <div style={{ width: 26, height: 26 }} dangerouslySetInnerHTML={{ __html: CAL_NAV }} />
            <span style={{ fontSize: 11, fontWeight: 700 }}>달력</span>
          </button>
          <button onClick={() => go('archive')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', color: screen === 'archive' ? 'var(--ink)' : 'var(--soft)', padding: 0, fontFamily: 'inherit' }}>
            <div style={{ width: 26, height: 26 }} dangerouslySetInnerHTML={{ __html: ARCHIVE_NAV }} />
            <span style={{ fontSize: 11, fontWeight: 700 }}>보관함</span>
          </button>
        </div>
      )}

      {/* 토스트 */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 104, left: '50%', transform: 'translateX(-50%)', zIndex: 60, background: 'var(--ink)', color: 'var(--paper)', padding: '11px 20px', borderRadius: 16, fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap', animation: 'toastIn .3s ease' }}>
          {toast}
        </div>
      )}
    </div>
  );
}
