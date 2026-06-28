import { CalCell } from '../utils';

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

export default function CalendarScreen({ monthLabel, weeks, chips, upcoming, weekdays, onPrevMonth, onNextMonth }: Props) {
  return (
    <div className="scrl" style={{ padding: 'max(62px, calc(44px + var(--safe-top))) 18px calc(120px + var(--safe-bottom))', overflowY: 'auto' }}>
      {/* 월 이동 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <button onClick={onPrevMonth} style={{ width: 36, height: 36, border: '2px solid var(--ink)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, cursor: 'pointer', background: 'none', color: 'var(--ink)' }}>‹</button>
        <div style={{ fontFamily: 'KJD, sans-serif', fontSize: 34, fontWeight: 700, lineHeight: 1, whiteSpace: 'nowrap' }}>{monthLabel}</div>
        <button onClick={onNextMonth} style={{ width: 36, height: 36, border: '2px solid var(--ink)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, cursor: 'pointer', background: 'none', color: 'var(--ink)' }}>›</button>
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
            {week.map((d, di) => (
              <div key={di} style={{ aspectRatio: '1/1.08', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 5, position: 'relative', background: d.bandBg, borderRadius: 9 }}>
                {d.isToday && (
                  <div style={{ position: 'absolute', top: 2, width: 26, height: 26, border: '2px solid var(--ink)', borderRadius: '50%', background: 'var(--accent)' }} />
                )}
                <div style={{ fontSize: 13, fontWeight: 400, color: d.numCol, zIndex: 1, lineHeight: 1.5 }}>{d.day}</div>
                <div style={{ display: 'flex', gap: 2.5, marginTop: 3, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 34 }}>
                  {d.pastDots.map((col, i) => (
                    <span key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: col }} />
                  ))}
                  {d.futureDots.map((col, i) => (
                    <span key={i} style={{ width: 7, height: 7, borderRadius: '50%', border: `1.6px solid ${col}`, background: 'transparent' }} />
                  ))}
                  {d.isCenter && (
                    <span style={{ width: 8, height: 8, borderRadius: '50%', border: `2px solid ${d.centerCol}`, background: 'transparent' }} />
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* 범례 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '12px 4px 0', fontSize: 11.5, color: 'var(--soft)' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--soft)' }} />물 준 날
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', border: '1.6px solid var(--soft)' }} />물 줄 날
        </span>
      </div>

      {/* 식물 필터 칩 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 15, marginBottom: 14 }}>
        {chips.map(c => (
          <button key={c.id} onClick={c.onToggle} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 11px 6px', borderRadius: 14, border: `2px solid ${c.on ? c.color : 'var(--line)'}`, background: c.on ? `${c.color}1e` : 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: c.on ? 'var(--ink)' : 'var(--soft)', fontFamily: 'inherit' }}>
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
            <div key={i} onClick={u.onOpen} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', marginBottom: 9, border: '2px solid var(--ink)', borderRadius: '17px 19px 16px 18px', cursor: 'pointer', background: '#ffffff80' }}>
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
