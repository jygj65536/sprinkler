import { useState, useEffect } from 'react';
import { Analytics } from '@apps-in-toss/web-framework';
import { PlantType, Season, SeasonalNumbers, SeasonalLabels } from '../types';
import { plantDoodle } from '../doodles';
import { COLOR_PALETTE } from '../data';

interface SearchResult {
  id: string;
  name: string;
  sci: string;
  type: PlantType;
  intervalDays: number;
  doodle: string;
  onSelect: () => void;
}

interface CareRow { icon: string; label: string; value: string }

interface SpeciesPreview {
  id: string;
  name: string;
  sci: string;
  type: PlantType;
  desc: string;
  doodle: string;
  careRows: CareRow[];
}

export interface CustomPlantData {
  name: string;
  speciesName: string;
  sci: string;
  type: PlantType;
  color: string;
  waterIntervalDays: SeasonalNumbers;
  waterTiming: SeasonalLabels;
  light: string;
  temp: string;
}

interface Props {
  query: string;
  onQueryChange: (q: string) => void;
  results: SearchResult[];
  selectedSpecies: SpeciesPreview | null;
  customName: string;
  onCustomNameChange: (name: string) => void;
  selectedColor: string;
  onColorChange: (color: string) => void;
  onClosePreview: () => void;
  onAdd: () => void;
  onAddCustom: (data: CustomPlantData) => void;
  goBack: () => void;
  searchIcon: string;
}

const PLANT_TYPES: PlantType[] = [
  'stuckyi', 'cactus', 'palm', 'succulent',
  'fern', 'orchid', 'bulb', 'vine',
  'tropical', 'foliage', 'flowering', 'shrub',
  'tree', 'herb',
];

const TYPE_LABELS: Record<PlantType, string> = {
  stuckyi: '스투키',  cactus: '선인장',  palm: '야자',  succulent: '다육',
  fern:    '양치류',  orchid: '난초',    bulb: '구근',  vine:      '덩굴',
  tropical: '열대',  foliage: '관엽',  flowering: '화초', shrub:   '관목',
  tree:    '나무',    herb:   '허브',
};

// watercycle 코드 기반 — label과 days는 항상 묶음
const WATER_OPTIONS = [
  { label: '항상 촉촉하게',    days: 2 },
  { label: '촉촉하게 유지',    days: 5 },
  { label: '겉흙 마르면',      days: 10 },
  { label: '흙 대부분 마르면', days: 21 },
] as const;

const SEASONS: Season[] = ['spring', 'summer', 'autumn', 'winter'];
const SEASON_KO: Record<Season, string> = { spring: '봄', summer: '여름', autumn: '가을', winter: '겨울' };

const LIGHT_OPTIONS = ['반음지·음지 OK', '밝은 간접광', '직사광·양지'] as const;
const TEMP_OPTIONS  = ['10–15°C', '16–20°C', '21–25°C', '26–30°C'] as const;

const WATER_DEFAULT = 2; // index → '겉흙 마르면', 10일
const TEMP_DEFAULT  = '16–20°C';

const defaultWaterBySeason = (): Record<Season, number> =>
  ({ spring: WATER_DEFAULT, summer: WATER_DEFAULT, autumn: WATER_DEFAULT, winter: WATER_DEFAULT });

export default function AddScreen({
  query, onQueryChange, results,
  selectedSpecies, customName, onCustomNameChange,
  selectedColor, onColorChange,
  onClosePreview, onAdd, onAddCustom, goBack, searchIcon,
}: Props) {
  const [customNameLocal,     setCustomNameLocal]     = useState('');
  const [customSpeciesName,   setCustomSpeciesName]   = useState('');
  const [customSci,           setCustomSci]           = useState('');
  const [customType,          setCustomType]          = useState<PlantType>('foliage');
  const [customColor,         setCustomColor]         = useState(COLOR_PALETTE[0]);
  const [customWaterMode,     setCustomWaterMode]     = useState<'uniform' | 'seasonal'>('uniform');
  const [customWaterBySeason, setCustomWaterBySeason] = useState<Record<Season, number>>(defaultWaterBySeason);
  const [customWaterSeason,   setCustomWaterSeason]   = useState<Season>('spring');
  const [customLight,         setCustomLight]         = useState<typeof LIGHT_OPTIONS[number]>(LIGHT_OPTIONS[1]);
  const [customTemp,          setCustomTemp]          = useState<typeof TEMP_OPTIONS[number]>(TEMP_DEFAULT);
  const [showCustomSheet,     setShowCustomSheet]     = useState(false);

  const isCustomMode = query.trim() !== '' && results.length === 0;
  const hint = query.trim() ? `${results.length}개의 친구를 찾았어요` : '예) 몬스테라, 스투키, 다육이 …';

  useEffect(() => {
    if (isCustomMode) Analytics.impression({ log_name: 'imp_add_no_result', query: query.trim() });
  }, [isCustomMode]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (showCustomSheet) Analytics.impression({ log_name: 'imp_add_custom_sheet' });
  }, [showCustomSheet]);

  const handleAddCustom = () => {
    const waterIntervalDays: SeasonalNumbers = {
      spring: WATER_OPTIONS[customWaterBySeason.spring].days,
      summer: WATER_OPTIONS[customWaterBySeason.summer].days,
      autumn: WATER_OPTIONS[customWaterBySeason.autumn].days,
      winter: WATER_OPTIONS[customWaterBySeason.winter].days,
    };
    const waterTiming: SeasonalLabels = {
      spring: WATER_OPTIONS[customWaterBySeason.spring].label,
      summer: WATER_OPTIONS[customWaterBySeason.summer].label,
      autumn: WATER_OPTIONS[customWaterBySeason.autumn].label,
      winter: WATER_OPTIONS[customWaterBySeason.winter].label,
    };
    onAddCustom({
      name: customNameLocal.trim() || '내 식물',
      speciesName: customSpeciesName.trim() || query.trim(),
      sci: customSci.trim(),
      type: customType,
      color: customColor,
      waterIntervalDays,
      waterTiming,
      light: customLight,
      temp: customTemp,
    });
    setCustomNameLocal('');
    setCustomSpeciesName('');
    setCustomSci('');
    setCustomType('foliage');
    setCustomColor(COLOR_PALETTE[0]);
    setCustomWaterMode('uniform');
    setCustomWaterBySeason(defaultWaterBySeason());
    setCustomWaterSeason('spring');
    setCustomLight(LIGHT_OPTIONS[1]);
    setCustomTemp(TEMP_DEFAULT);
    setShowCustomSheet(false);
  };

  const setSeasonWater = (idx: number) => {
    if (customWaterMode === 'uniform') {
      setCustomWaterBySeason({ spring: idx, summer: idx, autumn: idx, winter: idx });
    } else {
      setCustomWaterBySeason(prev => ({ ...prev, [customWaterSeason]: idx }));
    }
  };

  const switchWaterMode = (mode: 'uniform' | 'seasonal') => {
    if (mode === 'uniform') {
      const cur = customWaterBySeason[customWaterSeason];
      setCustomWaterBySeason({ spring: cur, summer: cur, autumn: cur, winter: cur });
    }
    setCustomWaterMode(mode);
  };

  return (
    <div style={{ paddingTop: 'max(54px, calc(38px + var(--safe-top)))', paddingBottom: 60, minHeight: '100vh', position: 'relative' }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 22px 14px' }}>
        <button onClick={goBack} style={{ width: 38, height: 38, border: '2px solid var(--ink)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, cursor: 'pointer', background: 'none', color: 'var(--ink)', flexShrink: 0 }}>‹</button>
        <div style={{ fontFamily: 'KJD, sans-serif', fontSize: 34, fontWeight: 700, lineHeight: 1 }}>식물 들이기</div>
      </div>

      <div style={{ padding: '0 22px' }}>
        {/* 검색창 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, border: '2px solid var(--ink)', borderRadius: 16, padding: '11px 15px', marginBottom: 8 }}>
          <div style={{ width: 20, height: 20, flexShrink: 0, color: 'var(--soft)' }} dangerouslySetInnerHTML={{ __html: searchIcon }} />
          <input
            value={query}
            onChange={e => onQueryChange(e.target.value)}
            onFocus={() => Analytics.click({ log_name: 'click_add_search_bar' })}
            placeholder="식물 이름을 검색해 보세요"
            style={{ border: 'none', outline: 'none', background: 'transparent', fontFamily: 'Shantell Sans, sans-serif', fontSize: 16, fontWeight: 500, color: 'var(--ink)', width: '100%' }}
          />
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--soft)', marginBottom: 14, paddingLeft: 4 }}>{hint}</div>

        {/* 검색 결과 */}
        {results.map(s => (
          <div key={s.id} onClick={s.onSelect} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '11px 13px', marginBottom: 10, border: '2px solid var(--ink)', borderRadius: '18px 16px 19px 17px', cursor: 'pointer' }}>
            <div style={{ width: 48, height: 48, flexShrink: 0, color: 'var(--ink)' }} dangerouslySetInnerHTML={{ __html: s.doodle }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{s.name}</div>
              <div style={{ fontSize: 12, color: 'var(--soft)', fontStyle: 'italic' }}>{s.sci}</div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 12, color: 'var(--soft)' }}>물주기</div>
              <div style={{ fontSize: 13.5, fontWeight: 700 }}>{s.intervalDays}일마다</div>
            </div>
          </div>
        ))}

        {/* 검색 0건 — 직접 추가 버튼 */}
        {isCustomMode && (
          <div onClick={() => { Analytics.click({ log_name: 'click_add_custom_open', query: query.trim() }); setShowCustomSheet(true); }} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 16px', border: '2px dashed var(--ink)', borderRadius: '18px 16px 19px 17px', cursor: 'pointer', opacity: 0.75 }}>
            <div style={{ width: 48, height: 48, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>🌱</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>직접 추가하기</div>
              <div style={{ fontSize: 12, color: 'var(--soft)', marginTop: 2 }}>우리 정원에 없는 식물이에요</div>
            </div>
          </div>
        )}
      </div>

      {/* 직접 추가 바텀시트 */}
      {showCustomSheet && (
        <>
          <div onClick={() => setShowCustomSheet(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(35,31,24,.32)', zIndex: 50 }} />
          <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 51, background: 'var(--paper)', borderRadius: '30px 30px 0 0', border: '2.5px solid var(--ink)', borderBottom: 'none', padding: '14px 22px calc(30px + var(--safe-bottom))', maxHeight: '90vh', overflowY: 'auto', animation: 'popIn .26s ease' }}>
            <div style={{ width: 44, height: 5, borderRadius: 3, background: 'var(--line)', margin: '0 auto 16px' }} />
            <div style={{ fontFamily: 'Caveat, cursive', fontSize: 28, fontWeight: 700, marginBottom: 18 }}>직접 추가하기</div>

            {/* 이름 */}
            <div style={{ marginBottom: 12 }}>
              <Label>이름</Label>
              <input
                value={customNameLocal}
                onChange={e => setCustomNameLocal(e.target.value)}
                placeholder="식물 이름"
                style={{ width: '100%', boxSizing: 'border-box', padding: '10px 13px', border: '2px solid var(--ink)', borderRadius: 14, fontFamily: 'Shantell Sans, sans-serif', fontSize: 15, fontWeight: 600, background: 'var(--paper)', color: 'var(--ink)', outline: 'none' }}
              />
            </div>

            {/* 종 이름 */}
            <div style={{ marginBottom: 12 }}>
              <Label>종 이름</Label>
              <input
                value={customSpeciesName}
                onChange={e => setCustomSpeciesName(e.target.value)}
                placeholder={query || '종 이름'}
                style={{ width: '100%', boxSizing: 'border-box', padding: '10px 13px', border: '2px solid var(--ink)', borderRadius: 14, fontFamily: 'Shantell Sans, sans-serif', fontSize: 15, fontWeight: 500, background: 'var(--paper)', color: 'var(--ink)', outline: 'none' }}
              />
            </div>

            {/* 학명 */}
            <div style={{ marginBottom: 18 }}>
              <Label>학명</Label>
              <input
                value={customSci}
                onChange={e => setCustomSci(e.target.value)}
                placeholder="학명"
                style={{ width: '100%', boxSizing: 'border-box', padding: '10px 13px', border: '2px solid var(--ink)', borderRadius: 14, fontFamily: 'Shantell Sans, sans-serif', fontSize: 14, fontStyle: 'italic', fontWeight: 500, background: 'var(--paper)', color: 'var(--ink)', outline: 'none' }}
              />
            </div>

            {/* 달력 색상 */}
            <div style={{ marginBottom: 22 }}>
              <Label>달력 색상</Label>
              <ColorPicker selected={customColor} onChange={setCustomColor} />
            </div>

            {/* 어떤 모습인가요? */}
            <div style={{ marginBottom: 22 }}>
              <SectionLabel>어떤 모습인가요?</SectionLabel>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 7 }}>
                {PLANT_TYPES.map(t => {
                  const sel = customType === t;
                  return (
                    <button key={t} onClick={() => setCustomType(t)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '8px 4px', border: `2px solid ${sel ? 'var(--ink)' : 'var(--line)'}`, borderRadius: 14, background: sel ? 'rgba(54,74,53,0.08)' : 'transparent', cursor: 'pointer' }}>
                      <div style={{ width: 44, height: 44, color: 'var(--ink)' }} dangerouslySetInnerHTML={{ __html: plantDoodle(t) }} />
                      <span style={{ fontSize: 10.5, fontWeight: 700, color: sel ? 'var(--ink)' : 'var(--soft)' }}>{TYPE_LABELS[t]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 어떤 환경을 좋아하나요? */}
            <div style={{ border: '2px solid var(--line)', borderRadius: 18, padding: '16px 14px', marginBottom: 22 }}>
              <SectionLabel>어떤 환경을 좋아하나요?</SectionLabel>

              {/* 물주기 */}
              <div style={{ marginBottom: 16 }}>
                <Label>물주기</Label>
                <div style={{ display: 'flex', gap: 7, marginBottom: 10 }}>
                  {(['uniform', 'seasonal'] as const).map(mode => {
                    const active = customWaterMode === mode;
                    return (
                      <button key={mode} onClick={() => switchWaterMode(mode)} style={{ flex: 1, padding: '7px 4px', border: `2px solid ${active ? 'var(--ink)' : 'var(--line)'}`, borderRadius: 10, background: active ? 'var(--ink)' : 'transparent', color: active ? 'var(--paper)' : 'var(--soft)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                        {mode === 'uniform' ? '계절 구분 없이' : '계절별로 다르게'}
                      </button>
                    );
                  })}
                </div>
                {customWaterMode === 'seasonal' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 10 }}>
                    {SEASONS.map(s => {
                      const active = customWaterSeason === s;
                      const opt = WATER_OPTIONS[customWaterBySeason[s]];
                      return (
                        <button key={s} onClick={() => setCustomWaterSeason(s)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '7px 4px', border: `2px solid ${active ? 'var(--ink)' : 'var(--line)'}`, borderRadius: 12, background: active ? 'var(--ink)' : 'transparent', cursor: 'pointer' }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: active ? 'var(--paper)' : 'var(--ink)' }}>{SEASON_KO[s]}</span>
                          <span style={{ fontSize: 9.5, color: active ? 'rgba(255,255,255,0.6)' : 'var(--soft)', lineHeight: 1.2, textAlign: 'center' }}>{opt.days}일마다</span>
                        </button>
                      );
                    })}
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {WATER_OPTIONS.map((opt, i) => {
                    const refSeason = customWaterMode === 'uniform' ? 'spring' : customWaterSeason;
                    const sel = customWaterBySeason[refSeason] === i;
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
                <Label>빛 조건</Label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {LIGHT_OPTIONS.map(opt => {
                    const sel = customLight === opt;
                    return (
                      <button key={opt} onClick={() => setCustomLight(opt)} style={{ flex: 1, padding: '9px 4px', border: `2px solid ${sel ? 'var(--ink)' : 'var(--line)'}`, borderRadius: 12, background: sel ? 'var(--ink)' : 'transparent', color: sel ? 'var(--paper)' : 'var(--soft)', fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ height: 1, background: 'var(--line)', margin: '0 -2px 16px' }} />

              {/* 온도 */}
              <div>
                <Label>온도</Label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 7 }}>
                  {TEMP_OPTIONS.map(opt => {
                    const sel = customTemp === opt;
                    return (
                      <button key={opt} onClick={() => setCustomTemp(opt)} style={{ padding: '9px 4px', border: `2px solid ${sel ? 'var(--ink)' : 'var(--line)'}`, borderRadius: 12, background: sel ? 'var(--ink)' : 'transparent', color: sel ? 'var(--paper)' : 'var(--soft)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>{/* /환경 섹션 */}

            <div onClick={handleAddCustom} style={{ textAlign: 'center', padding: 15, background: 'var(--ink)', color: 'var(--paper)', borderRadius: 18, fontSize: 17, fontWeight: 700, cursor: 'pointer' }}>
              내 식물로 들이기
            </div>
          </div>
        </>
      )}

      {/* 종 상세 바텀 시트 */}
      {selectedSpecies && (
        <>
          <div onClick={onClosePreview} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(35,31,24,.32)', zIndex: 50 }} />
          <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 51, background: 'var(--paper)', borderRadius: '30px 30px 0 0', border: '2.5px solid var(--ink)', borderBottom: 'none', padding: '14px 22px calc(30px + var(--safe-bottom))', maxHeight: '85vh', overflowY: 'auto', animation: 'popIn .26s ease' }}>
            <div style={{ width: 44, height: 5, borderRadius: 3, background: 'var(--line)', margin: '0 auto 12px' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 74, height: 74, flexShrink: 0, color: 'var(--ink)' }} dangerouslySetInnerHTML={{ __html: selectedSpecies.doodle }} />
              <div>
                <div style={{ fontFamily: 'Caveat, cursive', fontSize: 34, fontWeight: 700, lineHeight: 1 }}>{selectedSpecies.name}</div>
                <div style={{ fontSize: 13, color: 'var(--soft)', fontStyle: 'italic', marginTop: 2 }}>{selectedSpecies.sci}</div>
              </div>
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--soft)', margin: '14px 2px' }}>{selectedSpecies.desc}</div>
            <div style={{ border: '2px solid var(--ink)', borderRadius: 18, overflow: 'hidden', marginBottom: 16 }}>
              {selectedSpecies.careRows.map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '11px 15px', borderBottom: i < selectedSpecies.careRows.length - 1 ? '1.5px solid var(--line)' : 'none' }}>
                  <div style={{ width: 24, height: 24, flexShrink: 0, color: 'var(--ink)' }} dangerouslySetInnerHTML={{ __html: r.icon }} />
                  <div style={{ fontSize: 12.5, color: 'var(--soft)', width: 78, flexShrink: 0 }}>{r.label}</div>
                  <div style={{ fontSize: 14.5, fontWeight: 600, flex: 1 }}>{r.value}</div>
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12.5, color: 'var(--soft)', fontWeight: 600, marginBottom: 7 }}>이름 지어주기</div>
              <input
                value={customName}
                onChange={e => onCustomNameChange(e.target.value)}
                placeholder={selectedSpecies.name}
                style={{ width: '100%', boxSizing: 'border-box', padding: '11px 14px', border: '2px solid var(--ink)', borderRadius: 14, fontFamily: 'Shantell Sans, sans-serif', fontSize: 16, fontWeight: 600, color: 'var(--ink)', background: 'var(--paper)', outline: 'none' }}
              />
            </div>
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 12.5, color: 'var(--soft)', fontWeight: 600, marginBottom: 9 }}>달력 색상</div>
              <ColorPicker selected={selectedColor} onChange={onColorChange} />
            </div>
            <div onClick={onAdd} style={{ textAlign: 'center', padding: 15, background: 'var(--ink)', color: 'var(--paper)', borderRadius: 18, fontSize: 17, fontWeight: 700, cursor: 'pointer' }}>
              내 식물로 들이기
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ColorPicker({ selected, onChange }: { selected: string; onChange: (c: string) => void }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
      {COLOR_PALETTE.map(c => (
        <button
          key={c}
          onClick={() => onChange(c)}
          style={{
            width: 30, height: 30,
            borderRadius: '50%',
            background: c,
            border: selected === c ? `3px solid var(--ink)` : '3px solid transparent',
            outline: selected === c ? `2px solid ${c}` : 'none',
            outlineOffset: 1,
            cursor: 'pointer',
            padding: 0,
            flexShrink: 0,
            transition: 'border .12s, outline .12s',
          }}
          aria-label={c}
        />
      ))}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', marginBottom: 12 }}>{children}</div>;
}

function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 12, color: 'var(--soft)', fontWeight: 600, marginBottom: 8 }}>{children}</div>;
}

export { ColorPicker };
