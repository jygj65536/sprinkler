import { useState } from 'react';
import { CalCell, PlantDot } from '../utils';

interface Chip { id: string; name: string; color: string; on: boolean; onToggle: () => void }
interface Upcoming { name: string; color: string; dueText: string; dueCol: string; rangeText: string; onOpen: () => void }
interface Weekday { label: string; col: string }

interface Props {
  monthLabel: string;
  weeks: CalCell[][];
  chips: Chip[];
  upcoming: Upcoming[];
  weekdays: Weekday[];
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

type Popup = {
  iso: string;
  x: number; y: number;
  above: boolean;
  past: PlantDot[];
  future: PlantDot[];
  overdue: PlantDot[];
};

function fmtPopupDate(iso: string) {
  const [, m, d] = iso.split('-');
  return `${parseInt(m)}월 ${parseInt(d)}일`;
}

export default function CalendarScreen({ monthLabel, weeks, chips, upcoming, weekdays, onPrevMonth, onNextMonth }: Props) {
  const [popup, setPopup] = useState<Popup | null>(null);

  const handleCellClick = (d: CalCell, e: React.MouseEvent<HTMLDivElement>) => {
    if (d.pastItems.length === 0 && d.futureItems.length === 0 && d.overdueItems.length === 0) {
      setPopup(null);
      return;
    }
    if (popup?.iso === d.iso) { setPopup(null); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const yBelow = rect.bottom + 6;
    const above = yBelow + 200 > window.innerHeight;
    setPopup({ iso: d.iso, x, y: above ? rect.top - 6 : yBelow, above, past: d.pastItems, future: d.futureItems, overdue: d.overdueItems });
  };

  return (
    <div className="scrl" style={{ padding: 'max(62px, calc(44px + var(--safe-top))) 18px calc(120px + var(--safe-bottom))', overflowY: 'auto' }} onClick={() => setPopup(null)}>
      {/* 팝업 */}
      {popup && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: 'fixed',
            left: Math.min(Math.max(popup.x - 90, 8), window.innerWidth - 188),
            top: popup.above ? undefined : popup.y,
            bottom: popup.above ? window.innerHeight - popup.y : undefined,
            zIndex: 80,
            width: 180,
            background: 'var(--paper)',
            border: '2px solid var(--ink)',
            borderRadius: 16,
            padding: '10px 12px',
            boxShadow: '0 6px 20px -4px rgba(40,34,22,.22)',
            animation: 'popIn .18s ease',
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--soft)', marginBottom: 8 }}>{fmtPopupDate(popup.iso)}</div>
          {popup.past.length > 0 && (
            <div style={{ marginBottom: popup.future.length > 0 || popup.overdue.length > 0 ? 8 : 0 }}>
              <div style={{ fontSize: 10.5, color: 'var(--soft)', fontWeight: 600, marginBottom: 5 }}>물 줬어요</div>
              {popup.past.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{item.name}</span>
                </div>
              ))}
            </div>
          )}
          {popup.future.length > 0 && (
            <div style={{ marginBottom: popup.overdue.length > 0 ? 8 : 0 }}>
              <div style={{ fontSize: 10.5, color: 'var(--soft)', fontWeight: 600, marginBottom: 5 }}>물 줘야해요</div>
              {popup.future.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', border: `1.6px solid ${item.color}`, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{item.name}</span>
                </div>
              ))}
            </div>
          )}
          {popup.overdue.length > 0 && (
            <div>
              <div style={{ fontSize: 10.5, color: 'var(--soft)', fontWeight: 600, marginBottom: 5 }}>물 줬어야 해요</div>
              {popup.overdue.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', border: `1.6px dashed ${item.color}`, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{item.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 월 이동 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <button onClick={e => { e.stopPropagation(); onPrevMonth(); }} style={{ width: 36, height: 36, border: '2px solid var(--ink)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, cursor: 'pointer', background: 'none', color: 'var(--ink)' }}>‹</button>
        <div style={{ fontFamily: 'KJD, sans-serif', fontSize: 34, fontWeight: 700, lineHeight: 1, whiteSpace: 'nowrap' }}>{monthLabel}</div>
        <button onClick={e => { e.stopPropagation(); onNextMonth(); }} style={{ width: 36, height: 36, border: '2px solid var(--ink)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, cursor: 'pointer', background: 'none', color: 'var(--ink)' }}>›</button>
      </div>

      {/* 달력 그리드 */}
      <div style={{ border: '2px solid var(--ink)', borderRadius: 22, padding: '12px 10px 14px', background: '#ffffffb3' }}>
        {/* 요일 헤더 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginBottom: 4 }}>
          {weekdays.map(w => (
            <div key={w.label} style={{ textAlign: 'center', fontSize: 15, fontWeight: 700, color: w.col, paddingBottom: 4, fontFamily: 'KJD, sans-serif' }}>{w.label}</div>
          ))}
        </div>
        {/* 날짜 셀 */}
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
            {week.map((d, di) => {
              const hasItems = d.pastItems.length > 0 || d.futureItems.length > 0 || d.overdueItems.length > 0;
              return (
                <div
                  key={di}
                  onClick={e => { e.stopPropagation(); handleCellClick(d, e); }}
                  style={{
                    aspectRatio: '1/1.08', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 5,
                    position: 'relative', background: d.bandBg, borderRadius: 9,
                    cursor: hasItems ? 'pointer' : 'default',
                    outline: popup?.iso === d.iso ? '2px solid var(--ink)' : 'none',
                    outlineOffset: -2,
                  }}
                >
                  {d.isToday && (
                    <div style={{ position: 'absolute', top: 2, width: 26, height: 26, border: '2px solid var(--ink)', borderRadius: '50%', background: 'var(--accent)' }} />
                  )}
                  <div style={{ fontSize: 13, fontWeight: 400, color: d.numCol, zIndex: 1, lineHeight: 1.5 }}>{d.day}</div>
                  <div style={{ display: 'flex', gap: 2.5, marginTop: 3, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 34 }}>
                    {/* 물 줬어요 — 채워진 원 */}
                    {d.pastDots.map((col, i) => (
                      <span key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: col }} />
                    ))}
                    {d.morePast && <span style={{ fontSize: 10, lineHeight: '7px', color: 'var(--soft)', letterSpacing: '-1px' }}>...</span>}
                    {/* 물 줘야해요 — 실선 빈 원 */}
                    {d.futureDots.map((col, i) => (
                      <span key={i} style={{ width: 7, height: 7, borderRadius: '50%', border: `1.6px solid ${col}`, background: 'transparent' }} />
                    ))}
                    {d.moreFuture && <span style={{ fontSize: 10, lineHeight: '7px', color: 'var(--soft)', letterSpacing: '-1px' }}>...</span>}
                    {/* 물 줬어야 해요 — 점선 빈 원 */}
                    {d.overdueDots.map((col, i) => (
                      <span key={i} style={{ width: 7, height: 7, borderRadius: '50%', border: `1.6px dashed ${col}`, background: 'transparent' }} />
                    ))}
                    {d.moreOverdue && <span style={{ fontSize: 10, lineHeight: '7px', color: 'var(--soft)', letterSpacing: '-1px' }}>...</span>}
                    {/* 단일 식물 중앙일 */}
                    {d.isCenter && (
                      <span style={{ width: 8, height: 8, borderRadius: '50%', border: `2px solid ${d.centerCol}`, background: 'transparent' }} />
                    )}
                    {d.isCenterOverdue && (
                      <span style={{ width: 8, height: 8, borderRadius: '50%', border: `2px dashed ${d.centerCol}`, background: 'transparent' }} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* 범례 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '12px 4px 0', fontSize: 11.5, color: 'var(--soft)', flexWrap: 'wrap' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--soft)', flexShrink: 0 }} />물 줬어요
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', border: '1.6px solid var(--soft)', flexShrink: 0 }} />물 줘야해요
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', border: '1.6px dashed var(--soft)', flexShrink: 0 }} />물 줬어야 해요
        </span>
      </div>

      {/* 식물 필터 칩 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 15, marginBottom: 14 }}>
        {chips.map(c => (
          <button key={c.id} onClick={e => { e.stopPropagation(); c.onToggle(); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 11px 6px', borderRadius: 14, border: `2px solid ${c.on ? c.color : 'var(--line)'}`, background: c.on ? `${c.color}1e` : 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: c.on ? 'var(--ink)' : 'var(--soft)', fontFamily: 'inherit' }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: c.on ? c.color : 'transparent', border: `1.5px solid ${c.color}`, flexShrink: 0 }} />
            {c.name}
          </button>
        ))}
      </div>

      {/* 다가오는 물주기 */}
      {upcoming.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div style={{ fontFamily: 'KJD, sans-serif', fontSize: 26, fontWeight: 700, marginBottom: 10 }}>다가오는 물주기</div>
          {upcoming.map((u, i) => (
            <div key={i} onClick={e => { e.stopPropagation(); u.onOpen(); }} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', marginBottom: 9, border: '2px solid var(--ink)', borderRadius: '17px 19px 16px 18px', cursor: 'pointer', background: '#ffffff80' }}>
              <span style={{ width: 11, height: 11, borderRadius: '50%', background: u.color, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{u.name}</div>
                <div style={{ fontSize: 12, color: 'var(--soft)' }}>{u.rangeText}</div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: u.dueCol, flexShrink: 0 }}>{u.dueText}</div>
            </div>
          ))}
        </div>
      )}

      {upcoming.length === 0 && chips.filter(c => c.on).length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--soft)', padding: '24px 0', fontSize: 13 }}>
          식물을 선택하면 물주기 일정이 보여요
        </div>
      )}
    </div>
  );
}
