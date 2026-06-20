import { useState } from 'react';
import { PlantType, HealthStatus, DueInfo } from '../types';
import { MiniCell } from '../utils';
import { CARE_ICONS } from '../doodles';

interface CareRow { icon: string; label: string; value: string }
interface HistEntry { dateText: string; color: string; tag: string; gapText: string }
interface Weekday { label: string; col: string }

export interface DetailPlant {
  id: string;
  name: string;
  sci: string;
  type: PlantType;
  doodle: string;
  status: HealthStatus;
  due: DueInfo;
  bondDays: number;
  registeredText: string;
  careRows: CareRow[];
  history: HistEntry[];
  miniWeeks: MiniCell[][];
  canCancelWatering: boolean;
  onWater: () => void;
  onCancelWatering: () => void;
  onDelete: () => void;
}

interface Props {
  plant: DetailPlant;
  weekdays: Weekday[];
  dropDoodleLight: string;
  goBack: () => void;
}

const _ = CARE_ICONS; void _;

export default function DetailScreen({ plant: p, weekdays, dropDoodleLight, goBack }: Props) {
  const [view, setView] = useState<'list' | 'cal'>('list');

  return (
    <div className="scrl" style={{ paddingTop: 'max(54px, calc(38px + var(--safe-top)))', paddingBottom: 32, overflowY: 'auto', minHeight: '100vh' }}>
      {/* 상단 바 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px 6px' }}>
        <button onClick={goBack} style={{ width: 38, height: 38, border: '2px solid var(--ink)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, cursor: 'pointer', background: 'none', color: 'var(--ink)' }}>‹</button>
        <button onClick={p.onWater} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px 8px', border: '2px solid var(--ink)', borderRadius: 16, cursor: 'pointer', background: 'var(--ink)', color: 'var(--paper)', fontWeight: 700, fontSize: 14, fontFamily: 'inherit' }}>
          <span style={{ width: 15, height: 17, display: 'inline-block' }} dangerouslySetInnerHTML={{ __html: dropDoodleLight }} />
          물 줬어요
        </button>
      </div>

      {/* 식물 정보 */}
      <div style={{ textAlign: 'center', padding: '4px 24px 0' }}>
        <div style={{ width: 150, height: 150, margin: '0 auto', color: 'var(--ink)' }} dangerouslySetInnerHTML={{ __html: p.doodle }} />
        <div style={{ fontFamily: 'Caveat, cursive', fontSize: 40, fontWeight: 700, lineHeight: 1, marginTop: 2 }}>{p.name}</div>
        <div style={{ fontSize: 13, color: 'var(--soft)', fontStyle: 'italic', marginTop: 3 }}>{p.sci}</div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 11, padding: '5px 14px 6px', borderRadius: 14, border: `2px solid ${p.status.color}` }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: p.status.color }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: p.status.color }}>{p.status.label}</span>
        </div>
      </div>

      {/* 유대 카드 */}
      <div style={{ margin: '22px 20px 0', display: 'flex', gap: 11 }}>
        <div style={{ flex: 1, border: '2px solid var(--ink)', borderRadius: 18, padding: '13px 14px', background: 'var(--faint)' }}>
          <div style={{ fontSize: 12, color: 'var(--soft)', fontWeight: 600 }}>함께한 지</div>
          <div style={{ fontFamily: 'Caveat, cursive', fontSize: 32, fontWeight: 700, lineHeight: 1, marginTop: 3 }}>
            {p.bondDays}<span style={{ fontSize: 18 }}> 일</span>
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--soft)', marginTop: 4 }}>{p.registeredText} 들임</div>
        </div>
        <div style={{ flex: 1, border: '2px solid var(--ink)', borderRadius: 18, padding: '13px 14px' }}>
          <div style={{ fontSize: 12, color: 'var(--soft)', fontWeight: 600 }}>마지막 물주기</div>
          <div style={{ fontFamily: 'Caveat, cursive', fontSize: 32, fontWeight: 700, lineHeight: 1, marginTop: 3 }}>
            {p.status.daysSince}<span style={{ fontSize: 18 }}> 일 전</span>
          </div>
          <div style={{ fontSize: 11.5, color: p.due.color, marginTop: 4, fontWeight: 700 }}>{p.due.text}</div>
        </div>
      </div>

      {/* 케어 정보 */}
      <div style={{ margin: '18px 20px 0' }}>
        <div style={{ fontFamily: 'Caveat, cursive', fontSize: 24, fontWeight: 700, marginBottom: 8 }}>이 아이가 좋아하는 것</div>
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
          <div style={{ fontFamily: 'Caveat, cursive', fontSize: 24, fontWeight: 700 }}>물주기 일기</div>
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
                {i === 0 && p.canCancelWatering && (
                  <button
                    onClick={p.onCancelWatering}
                    style={{ flexShrink: 0, padding: '3px 9px', border: '1.5px solid #CC6B52', borderRadius: 10, background: 'transparent', color: '#CC6B52', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                  >취소</button>
                )}
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

      {/* 식물 삭제 */}
      <div style={{ margin: '28px 20px 0', paddingTop: 20, borderTop: '1.5px dashed var(--line)' }}>
        <button
          onClick={p.onDelete}
          style={{ width: '100%', padding: '13px', border: '2px solid #CC6B52', borderRadius: 18, background: 'transparent', color: '#CC6B52', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          내 식물에서 보내주기
        </button>
      </div>
    </div>
  );
}
