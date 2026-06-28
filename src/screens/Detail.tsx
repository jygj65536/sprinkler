import { useState } from 'react';
import { PlantType, HealthStatus, DueInfo, Season, SeasonalNumbers, SeasonalLabels, PlantInitialData } from '../types';
import { MiniCell } from '../utils';
import { CARE_ICONS, plantDoodle } from '../doodles';
import { ColorPicker } from './Add';

const PLANT_TYPES: PlantType[] = [
  'stuckyi', 'cactus', 'palm', 'succulent',
  'fern', 'orchid', 'bulb', 'vine',
  'tropical', 'foliage', 'flowering', 'shrub',
  'tree', 'herb',
];
const TYPE_LABELS: Record<PlantType, string> = {
  stuckyi: '스투키', cactus: '선인장', palm: '야자',  succulent: '다육',
  fern:    '양치류', orchid: '난초',   bulb: '구근',  vine:      '덩굴',
  tropical: '열대', foliage: '관엽',  flowering: '화초', shrub:  '관목',
  tree:    '나무',  herb:   '허브',
};

interface CareRow { icon: string; label: string; value: string }
interface HistEntry { dateText: string; color: string; tag: string; gapText: string; rawDate: string; isFirst: boolean }
interface Weekday { label: string; col: string }

export interface DetailPlant {
  id: string;
  name: string;        // 닉네임 (표시용)
  speciesName: string; // 종명
  sci: string;
  type: PlantType;
  doodle: string;
  dropLight: string;
  status: HealthStatus;
  due: DueInfo;
  bondDays: number;
  registeredText: string;
  careRows: CareRow[];
  history: HistEntry[];
  miniWeeks: MiniCell[][];
  canCancelWatering: boolean;
  editable: PlantInitialData & { initialData?: PlantInitialData };
  onWater: () => void;
  onCancelWatering: () => void;
  onEditFirstWatering: (date: string) => void;
  onDelete: () => void;
  onEdit: (data: PlantInitialData) => void;
}

interface Props {
  plant: DetailPlant;
  weekdays: Weekday[];
  goBack: () => void;
}

// ── 편집 시트 상수 ──────────────────────────────────────────────
const EW = [
  { label: '항상 촉촉하게',    days: 2 },
  { label: '촉촉하게 유지',    days: 5 },
  { label: '겉흙 마르면',      days: 10 },
  { label: '흙 대부분 마르면', days: 21 },
] as const;
const E_SEASONS: Season[] = ['spring', 'summer', 'autumn', 'winter'];
const E_SEASON_KO: Record<Season, string> = { spring: '봄', summer: '여름', autumn: '가을', winter: '겨울' };
const EL = ['반음지·음지 OK', '밝은 간접광', '직사광·양지'] as const;
const ET = ['10–15°C', '16–20°C', '21–25°C', '26–30°C'] as const;

const daysToIdx = (d: number) => {
  let best = 0;
  for (let i = 1; i < EW.length; i++) {
    if (Math.abs(EW[i].days - d) < Math.abs(EW[best].days - d)) best = i;
  }
  return best;
};
const snapLight = (v: string): typeof EL[number] => {
  if ((EL as readonly string[]).includes(v)) return v as typeof EL[number];
  if (v.includes('반음지')) return '반음지·음지 OK';
  if (v.includes('직사광')) return '직사광·양지';
  return '밝은 간접광';
};
const snapTemp = (v: string): typeof ET[number] => {
  if ((ET as readonly string[]).includes(v)) return v as typeof ET[number];
  const m = v.match(/(\d+)/);
  if (!m) return '16–20°C';
  const lo = parseInt(m[1]);
  if (lo <= 15) return '10–15°C';
  if (lo <= 20) return '16–20°C';
  if (lo <= 25) return '21–25°C';
  return '26–30°C';
};
const toWaterByS = (w: SeasonalNumbers): Record<Season, number> => ({
  spring: daysToIdx(w.spring), summer: daysToIdx(w.summer),
  autumn: daysToIdx(w.autumn), winter: daysToIdx(w.winter),
});
const isUniform = (w: SeasonalNumbers) =>
  w.spring === w.summer && w.summer === w.autumn && w.autumn === w.winter;

const _ = CARE_ICONS; void _;

export default function DetailScreen({ plant: p, weekdays, goBack }: Props) {
  const [view, setView] = useState<'list' | 'cal'>('list');

  const [pickerOpen,  setPickerOpen]  = useState(false);
  const [pickerDate,  setPickerDate]  = useState('');
  const [pickerYear,  setPickerYear]  = useState(0);
  const [pickerMonth, setPickerMonth] = useState(0);

  const openDatePicker = (rawDate: string) => {
    const d = new Date(rawDate + 'T00:00:00');
    setPickerDate(rawDate);
    setPickerYear(d.getFullYear());
    setPickerMonth(d.getMonth());
    setPickerOpen(true);
  };
  const navPickerMonth = (delta: number) => {
    const d = new Date(pickerYear, pickerMonth + delta);
    setPickerYear(d.getFullYear());
    setPickerMonth(d.getMonth());
  };

  const [editOpen,         setEditOpen]         = useState(false);
  const [editName,         setEditName]         = useState('');
  const [editSpeciesName,  setEditSpeciesName]  = useState('');
  const [editSci,          setEditSci]          = useState('');
  const [editType,         setEditType]         = useState<PlantType>('foliage');
  const [editColor,        setEditColor]        = useState('');
  const [editWaterMode, setEditWaterMode] = useState<'uniform' | 'seasonal'>('uniform');
  const [editWaterByS,  setEditWaterByS]  = useState<Record<Season, number>>({ spring: 2, summer: 2, autumn: 2, winter: 2 });
  const [editWaterSeas, setEditWaterSeas] = useState<Season>('spring');
  const [editLight,     setEditLight]     = useState<typeof EL[number]>('밝은 간접광');
  const [editTemp,      setEditTemp]      = useState<typeof ET[number]>('16–20°C');

  const initEditState = (src: PlantInitialData) => {
    setEditName(src.name);
    setEditSpeciesName(src.speciesName);
    setEditSci(src.sci);
    setEditType(src.type);
    setEditColor(src.color);
    setEditWaterByS(toWaterByS(src.waterIntervalDays));
    setEditWaterMode(isUniform(src.waterIntervalDays) ? 'uniform' : 'seasonal');
    setEditWaterSeas('spring');
    setEditLight(snapLight(src.light));
    setEditTemp(snapTemp(src.temp));
  };

  const openEdit = () => { initEditState(p.editable); setEditOpen(true); };

  const setSeasonWater = (idx: number) => {
    if (editWaterMode === 'uniform') {
      setEditWaterByS({ spring: idx, summer: idx, autumn: idx, winter: idx });
    } else {
      setEditWaterByS(prev => ({ ...prev, [editWaterSeas]: idx }));
    }
  };

  const switchWaterMode = (mode: 'uniform' | 'seasonal') => {
    if (mode === 'uniform') {
      const cur = editWaterByS[editWaterSeas];
      setEditWaterByS({ spring: cur, summer: cur, autumn: cur, winter: cur });
    }
    setEditWaterMode(mode);
  };

  const resetToInitial = () => { if (p.editable.initialData) initEditState(p.editable.initialData); };

  const saveEdit = () => {
    const waterIntervalDays: SeasonalNumbers = {
      spring: EW[editWaterByS.spring].days, summer: EW[editWaterByS.summer].days,
      autumn: EW[editWaterByS.autumn].days, winter: EW[editWaterByS.winter].days,
    };
    const waterTiming: SeasonalLabels = {
      spring: EW[editWaterByS.spring].label, summer: EW[editWaterByS.summer].label,
      autumn: EW[editWaterByS.autumn].label, winter: EW[editWaterByS.winter].label,
    };
    p.onEdit({ name: editName.trim() || p.editable.name, speciesName: editSpeciesName, sci: editSci, type: editType, color: editColor, waterIntervalDays, waterTiming, light: editLight, temp: editTemp });
    setEditOpen(false);
  };

  const refSeas = editWaterMode === 'uniform' ? 'spring' : editWaterSeas;

  return (
    <div className="scrl" style={{ paddingTop: 'max(54px, calc(38px + var(--safe-top)))', paddingBottom: 32, overflowY: 'auto', minHeight: '100vh' }}>
      {/* 상단 바 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px 6px' }}>
        <button onClick={goBack} style={{ width: 38, height: 38, border: '2px solid var(--ink)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, cursor: 'pointer', background: 'none', color: 'var(--ink)' }}>‹</button>
        <button onClick={p.onWater} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px 8px', border: '2px solid var(--ink)', borderRadius: 16, background: 'var(--ink)', color: 'var(--paper)', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          <span style={{ width: 15, height: 17, display: 'inline-block' }} dangerouslySetInnerHTML={{ __html: p.dropLight }} />
          물 줬어요
        </button>
      </div>

      {/* 식물 정보 */}
      <div style={{ textAlign: 'center', padding: '4px 24px 0' }}>
        <div style={{ width: 150, height: 150, margin: '0 auto', color: 'var(--ink)', filter: 'drop-shadow(0 2px 1.5px rgba(40,34,22,.18))' }} dangerouslySetInnerHTML={{ __html: p.doodle }} />
        <div style={{ fontFamily: 'KJD, sans-serif', fontSize: 40, fontWeight: 700, lineHeight: 1, marginTop: 2 }}>{p.name}</div>
        {(p.speciesName || p.sci) && (
          <div style={{ fontSize: 13, color: 'var(--soft)', marginTop: 3 }}>
            {p.speciesName && <span>{p.speciesName}{p.sci ? ' · ' : ''}</span>}
            {p.sci && <em>{p.sci}</em>}
          </div>
        )}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 11, padding: '5px 14px 6px', borderRadius: 14, border: `2px solid ${p.status.color}` }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: p.status.color }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: p.status.color }}>{p.status.label}</span>
        </div>
      </div>

      {/* 유대 카드 */}
      <div style={{ margin: '22px 20px 0', display: 'flex', gap: 11 }}>
        <div style={{ flex: 1, border: '2px solid var(--ink)', borderRadius: 18, padding: '13px 14px', background: 'var(--faint)' }}>
          <div style={{ fontSize: 12, color: 'var(--soft)', fontWeight: 600 }}>함께한 지</div>
          <div style={{ fontFamily: 'KJD, sans-serif', fontSize: 32, fontWeight: 700, lineHeight: 1, marginTop: 3 }}>
            {p.bondDays}<span style={{ fontSize: 18 }}> 일</span>
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--soft)', marginTop: 4 }}>{p.registeredText} 들임</div>
        </div>
        <div style={{ flex: 1, border: '2px solid var(--ink)', borderRadius: 18, padding: '13px 14px' }}>
          <div style={{ fontSize: 12, color: 'var(--soft)', fontWeight: 600 }}>마지막 물주기</div>
          <div style={{ fontFamily: 'KJD, sans-serif', fontSize: 32, fontWeight: 700, lineHeight: 1, marginTop: 3 }}>
            {p.status.daysSince}<span style={{ fontSize: 18 }}> 일 전</span>
          </div>
          <div style={{ fontSize: 11.5, color: p.due.color, marginTop: 4, fontWeight: 700 }}>다음 물주기: {p.due.text}</div>
        </div>
      </div>

      {/* 케어 정보 */}
      <div style={{ margin: '18px 20px 0' }}>
        <div style={{ fontFamily: 'KJD, sans-serif', fontSize: 24, fontWeight: 700, marginBottom: 8 }}>좋아하는 것</div>
        <div style={{ border: '2px solid var(--ink)', borderRadius: 18, overflow: 'hidden' }}>
          {p.careRows.map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '12px 15px', borderBottom: i < p.careRows.length - 1 ? '1.5px solid var(--line)' : 'none' }}>
              <div style={{ width: 26, height: 26, flexShrink: 0, color: 'var(--ink)' }} dangerouslySetInnerHTML={{ __html: r.icon }} />
              <div style={{ fontSize: 12.5, color: 'var(--soft)', width: 78, flexShrink: 0 }}>{r.label}</div>
              <div style={{ fontSize: 14.5, fontWeight: 600, flex: 1 }}>{r.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 물주기 일기 */}
      <div style={{ margin: '20px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ fontFamily: 'KJD, sans-serif', fontSize: 24, fontWeight: 700 }}>물주기 일기</div>
          <div style={{ display: 'flex', border: '2px solid var(--ink)', borderRadius: 12, overflow: 'hidden', fontSize: 12.5, fontWeight: 700 }}>
            <button onClick={() => setView('list')} style={{ padding: '5px 12px', cursor: 'pointer', background: view === 'list' ? 'var(--ink)' : 'transparent', color: view === 'list' ? 'var(--paper)' : 'var(--ink)', border: 'none', fontFamily: 'inherit', fontSize: 'inherit', fontWeight: 'inherit' }}>목록</button>
            <button onClick={() => setView('cal')} style={{ padding: '5px 12px', cursor: 'pointer', background: view === 'cal' ? 'var(--ink)' : 'transparent', color: view === 'cal' ? 'var(--paper)' : 'var(--ink)', border: 'none', borderLeft: '2px solid var(--ink)', fontFamily: 'inherit', fontSize: 'inherit', fontWeight: 'inherit' }}>달력</button>
          </div>
        </div>

        {view === 'list' && (
          <div>
            {p.history.map((h, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '10px 4px', borderBottom: '1.5px dashed var(--line)' }}>
                <span style={{ width: 13, height: 13, borderRadius: '50%', background: h.color, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 600 }}>{h.dateText}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--soft)' }}>{h.gapText}</div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: h.color }}>{h.tag}</div>
                {h.isFirst ? (
                  <button
                    onClick={() => openDatePicker(h.rawDate)}
                    style={{ flexShrink: 0, padding: '3px 9px', border: '1.5px solid var(--soft)', borderRadius: 10, background: 'transparent', color: 'var(--soft)', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                  >수정</button>
                ) : i === 0 && p.canCancelWatering ? (
                  <button
                    onClick={p.onCancelWatering}
                    style={{ flexShrink: 0, padding: '3px 9px', border: '1.5px solid #CC6B52', borderRadius: 10, background: 'transparent', color: '#CC6B52', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                  >취소</button>
                ) : null}
              </div>
            ))}
          </div>
        )}

        {view === 'cal' && (
          <div style={{ border: '2px solid var(--ink)', borderRadius: 16, padding: '10px 8px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginBottom: 2 }}>
              {weekdays.map(w => (
                <div key={w.label} style={{ textAlign: 'center', fontSize: 10.5, fontWeight: 700, color: w.col }}>{w.label}</div>
              ))}
            </div>
            {p.miniWeeks.map((week, wi) => (
              <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
                {week.map((d, di) => (
                  <div key={di} style={{ aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    {d.dot && (
                      <span style={{ position: 'absolute', width: 22, height: 22, borderRadius: '50%', background: d.dotCol }} />
                    )}
                    <span style={{ fontSize: 11, fontWeight: 600, color: d.numCol, zIndex: 1 }}>{d.day}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 식물 삭제 / 편집 */}
      <div style={{ margin: '28px 20px 0', paddingTop: 20, borderTop: '1.5px dashed var(--line)', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          onClick={openEdit}
          style={{ width: '100%', padding: '13px', border: '2px solid var(--line)', borderRadius: 18, background: 'transparent', color: 'var(--soft)', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          정보 수정
        </button>
        <button
          onClick={p.onDelete}
          style={{ width: '100%', padding: '13px', border: '2px solid #CC6B52', borderRadius: 18, background: 'transparent', color: '#CC6B52', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          내 식물에서 보내주기
        </button>
      </div>

      {/* ── 첫 물주기 날짜 수정 바텀시트 ── */}
      {pickerOpen && (
        <>
          <div onClick={() => setPickerOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(35,31,24,.32)', zIndex: 50 }} />
          <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 51, background: 'var(--paper)', borderRadius: '30px 30px 0 0', border: '2.5px solid var(--ink)', borderBottom: 'none', padding: '14px 22px calc(30px + var(--safe-bottom))', animation: 'popIn .26s ease' }}>
            <div style={{ width: 44, height: 5, borderRadius: 3, background: 'var(--line)', margin: '0 auto 14px' }} />
            <div style={{ fontFamily: 'Caveat, cursive', fontSize: 26, fontWeight: 700, marginBottom: 16 }}>첫 물주기 날짜</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <button onClick={() => navPickerMonth(-1)} style={{ width: 36, height: 36, border: '2px solid var(--ink)', borderRadius: '50%', background: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{pickerYear}년 {pickerMonth + 1}월</div>
              <button onClick={() => navPickerMonth(1)} style={{ width: 36, height: 36, border: '2px solid var(--ink)', borderRadius: '50%', background: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginBottom: 4 }}>
              {['일','월','화','수','목','금','토'].map(d => (
                <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--soft)', padding: '2px 0' }}>{d}</div>
              ))}
            </div>
            {buildPickerCal(pickerYear, pickerMonth).map((week, wi) => (
              <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
                {week.map((date, di) => {
                  if (!date) return <div key={di} />;
                  const today = new Date().toLocaleDateString('sv-SE');
                  const isSel = date === pickerDate;
                  const disabled = date > today;
                  return (
                    <button
                      key={di}
                      onClick={() => !disabled && setPickerDate(date)}
                      style={{ padding: '8px 0', textAlign: 'center', fontSize: 13, fontWeight: isSel ? 700 : 400, background: isSel ? 'var(--ink)' : 'transparent', color: isSel ? 'var(--paper)' : disabled ? 'var(--line)' : 'var(--ink)', border: 'none', borderRadius: 8, cursor: disabled ? 'default' : 'pointer', fontFamily: 'inherit' }}
                    >
                      {parseInt(date.split('-')[2])}
                    </button>
                  );
                })}
              </div>
            ))}
            <div
              onClick={() => { if (pickerDate) { p.onEditFirstWatering(pickerDate); setPickerOpen(false); } }}
              style={{ textAlign: 'center', padding: 14, background: 'var(--ink)', color: 'var(--paper)', borderRadius: 16, marginTop: 16, fontSize: 16, fontWeight: 700, cursor: 'pointer' }}
            >
              수정하기
            </div>
          </div>
        </>
      )}

      {/* ── 편집 바텀시트 ── */}
      {editOpen && (
        <>
          <div onClick={() => setEditOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(35,31,24,.32)', zIndex: 50 }} />
          <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 51, background: 'var(--paper)', borderRadius: '30px 30px 0 0', border: '2.5px solid var(--ink)', borderBottom: 'none', padding: '14px 22px calc(30px + var(--safe-bottom))', maxHeight: '90vh', overflowY: 'auto', animation: 'popIn .26s ease' }}>
            <div style={{ width: 44, height: 5, borderRadius: 3, background: 'var(--line)', margin: '0 auto 16px' }} />
            <div style={{ fontFamily: 'Caveat, cursive', fontSize: 28, fontWeight: 700, marginBottom: 18 }}>정보 수정</div>

            {/* 이름 */}
            <div style={{ marginBottom: 12 }}>
              <ELabel>이름</ELabel>
              <input
                value={editName}
                onChange={e => setEditName(e.target.value)}
                placeholder={p.name}
                style={{ width: '100%', boxSizing: 'border-box', padding: '10px 13px', border: '2px solid var(--ink)', borderRadius: 14, fontFamily: 'Shantell Sans, sans-serif', fontSize: 15, fontWeight: 600, background: 'var(--paper)', color: 'var(--ink)', outline: 'none' }}
              />
            </div>

            {/* 종 이름 */}
            <div style={{ marginBottom: 12 }}>
              <ELabel>종 이름</ELabel>
              <input
                value={editSpeciesName}
                onChange={e => setEditSpeciesName(e.target.value)}
                placeholder={p.speciesName || '종 이름'}
                style={{ width: '100%', boxSizing: 'border-box', padding: '10px 13px', border: '2px solid var(--ink)', borderRadius: 14, fontFamily: 'Shantell Sans, sans-serif', fontSize: 15, fontWeight: 500, background: 'var(--paper)', color: 'var(--ink)', outline: 'none' }}
              />
            </div>

            {/* 학명 */}
            <div style={{ marginBottom: 18 }}>
              <ELabel>학명</ELabel>
              <input
                value={editSci}
                onChange={e => setEditSci(e.target.value)}
                placeholder={p.sci || '학명 (선택)'}
                style={{ width: '100%', boxSizing: 'border-box', padding: '10px 13px', border: '2px solid var(--ink)', borderRadius: 14, fontFamily: 'Shantell Sans, sans-serif', fontSize: 14, fontStyle: 'italic', fontWeight: 500, background: 'var(--paper)', color: 'var(--ink)', outline: 'none' }}
              />
            </div>

            {/* 달력 색상 */}
            <div style={{ marginBottom: 18 }}>
              <ELabel>달력 색상</ELabel>
              <ColorPicker selected={editColor} onChange={setEditColor} />
            </div>

            {/* 어떤 모습인가요? */}
            <div style={{ marginBottom: 22 }}>
              <ESectionLabel>어떤 모습인가요?</ESectionLabel>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 7 }}>
                {PLANT_TYPES.map(t => {
                  const sel = editType === t;
                  return (
                    <button key={t} onClick={() => setEditType(t)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '8px 4px', border: `2px solid ${sel ? 'var(--ink)' : 'var(--line)'}`, borderRadius: 14, background: sel ? 'rgba(54,74,53,0.08)' : 'transparent', cursor: 'pointer' }}>
                      <div style={{ width: 44, height: 44, color: 'var(--ink)' }} dangerouslySetInnerHTML={{ __html: plantDoodle(t) }} />
                      <span style={{ fontSize: 10.5, fontWeight: 700, color: sel ? 'var(--ink)' : 'var(--soft)' }}>{TYPE_LABELS[t]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 어떤 환경을 좋아하나요? */}
            <div style={{ border: '2px solid var(--line)', borderRadius: 18, padding: '16px 14px', marginBottom: 22 }}>
              <ESectionLabel>어떤 환경을 좋아하나요?</ESectionLabel>

              {/* 물주기 */}
              <div style={{ marginBottom: 16 }}>
                <ELabel>물주기</ELabel>
                <div style={{ display: 'flex', gap: 7, marginBottom: 10 }}>
                  {(['uniform', 'seasonal'] as const).map(mode => {
                    const active = editWaterMode === mode;
                    return (
                      <button key={mode} onClick={() => switchWaterMode(mode)} style={{ flex: 1, padding: '7px 4px', border: `2px solid ${active ? 'var(--ink)' : 'var(--line)'}`, borderRadius: 10, background: active ? 'var(--ink)' : 'transparent', color: active ? 'var(--paper)' : 'var(--soft)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                        {mode === 'uniform' ? '계절 구분 없이' : '계절별로 다르게'}
                      </button>
                    );
                  })}
                </div>
                {editWaterMode === 'seasonal' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 10 }}>
                    {E_SEASONS.map(s => {
                      const active = editWaterSeas === s;
                      const opt = EW[editWaterByS[s]];
                      return (
                        <button key={s} onClick={() => setEditWaterSeas(s)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '7px 4px', border: `2px solid ${active ? 'var(--ink)' : 'var(--line)'}`, borderRadius: 12, background: active ? 'var(--ink)' : 'transparent', cursor: 'pointer' }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: active ? 'var(--paper)' : 'var(--ink)' }}>{E_SEASON_KO[s]}</span>
                          <span style={{ fontSize: 9.5, color: active ? 'rgba(255,255,255,0.6)' : 'var(--soft)', lineHeight: 1.2, textAlign: 'center' }}>{opt.days}일마다</span>
                        </button>
                      );
                    })}
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {EW.map((opt, i) => {
                    const sel = editWaterByS[refSeas] === i;
                    return (
                      <button key={i} onClick={() => setSeasonWater(i)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 3, padding: '10px 13px', border: `2px solid ${sel ? 'var(--ink)' : 'var(--line)'}`, borderRadius: 14, background: sel ? 'var(--ink)' : 'transparent', cursor: 'pointer', textAlign: 'left' }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: sel ? 'var(--paper)' : 'var(--ink)' }}>{opt.label}</span>
                        <span style={{ fontSize: 11, color: sel ? 'rgba(255,255,255,0.6)' : 'var(--soft)' }}>{opt.days}일마다</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ height: 1, background: 'var(--line)', margin: '0 -2px 16px' }} />

              {/* 빛 조건 */}
              <div style={{ marginBottom: 16 }}>
                <ELabel>빛 조건</ELabel>
                <div style={{ display: 'flex', gap: 8 }}>
                  {EL.map(opt => {
                    const sel = editLight === opt;
                    return (
                      <button key={opt} onClick={() => setEditLight(opt)} style={{ flex: 1, padding: '9px 4px', border: `2px solid ${sel ? 'var(--ink)' : 'var(--line)'}`, borderRadius: 12, background: sel ? 'var(--ink)' : 'transparent', color: sel ? 'var(--paper)' : 'var(--soft)', fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ height: 1, background: 'var(--line)', margin: '0 -2px 16px' }} />

              {/* 온도 */}
              <div>
                <ELabel>온도</ELabel>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 7 }}>
                  {ET.map(opt => {
                    const sel = editTemp === opt;
                    return (
                      <button key={opt} onClick={() => setEditTemp(opt)} style={{ padding: '9px 4px', border: `2px solid ${sel ? 'var(--ink)' : 'var(--line)'}`, borderRadius: 12, background: sel ? 'var(--ink)' : 'transparent', color: sel ? 'var(--paper)' : 'var(--soft)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>{/* /환경 섹션 */}

            {/* 초기화 */}
            {p.editable.initialData && (
              <button
                onClick={resetToInitial}
                style={{ width: '100%', padding: '11px', border: '1.5px dashed var(--soft)', borderRadius: 14, background: 'transparent', color: 'var(--soft)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 10 }}
              >
                처음 들일 때 값으로 초기화
              </button>
            )}

            <div onClick={saveEdit} style={{ textAlign: 'center', padding: 15, background: 'var(--ink)', color: 'var(--paper)', borderRadius: 18, fontSize: 17, fontWeight: 700, cursor: 'pointer' }}>
              저장하기
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function buildPickerCal(year: number, month: number): (string | null)[][] {
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = Array(firstDow).fill(null);
  const mm = String(month + 1).padStart(2, '0');
  for (let d = 1; d <= daysInMonth; d++) cells.push(`${year}-${mm}-${String(d).padStart(2, '0')}`);
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

function ESectionLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', marginBottom: 12 }}>{children}</div>;
}
function ELabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 12, color: 'var(--soft)', fontWeight: 600, marginBottom: 8 }}>{children}</div>;
}
