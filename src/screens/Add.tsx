import { PlantType } from '../types';

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

interface Props {
  query: string;
  onQueryChange: (q: string) => void;
  results: SearchResult[];
  selectedSpecies: SpeciesPreview | null;
  customName: string;
  onCustomNameChange: (name: string) => void;
  onClosePreview: () => void;
  onAdd: () => void;
  goBack: () => void;
  searchIcon: string;
}

export default function AddScreen({ query, onQueryChange, results, selectedSpecies, customName, onCustomNameChange, onClosePreview, onAdd, goBack, searchIcon }: Props) {
  const hint = query.trim()
    ? `${results.length}개의 친구를 찾았어요`
    : '예) 몬스테라, 스투키, 다육이 …';

  return (
    <div style={{ paddingTop: 'max(54px, calc(38px + var(--safe-top)))', paddingBottom: 60, minHeight: '100vh', position: 'relative' }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 22px 14px' }}>
        <button onClick={goBack} style={{ width: 38, height: 38, border: '2px solid var(--ink)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, cursor: 'pointer', background: 'none', color: 'var(--ink)', flexShrink: 0 }}>‹</button>
        <div style={{ fontFamily: 'Caveat, cursive', fontSize: 34, fontWeight: 700, lineHeight: 1 }}>식물 들이기</div>
      </div>

      <div style={{ padding: '0 22px' }}>
        {/* 검색창 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, border: '2px solid var(--ink)', borderRadius: 16, padding: '11px 15px', marginBottom: 8 }}>
          <div style={{ width: 20, height: 20, flexShrink: 0, color: 'var(--soft)' }} dangerouslySetInnerHTML={{ __html: searchIcon }} />
          <input
            value={query}
            onChange={e => onQueryChange(e.target.value)}
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

        {query.trim() && results.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--soft)', padding: '30px 0', fontSize: 14 }}>
            아직 우리 정원에 없는 친구예요 🌱<br />다른 이름으로 찾아볼까요?
          </div>
        )}
      </div>

      {/* 종 상세 바텀 시트 */}
      {selectedSpecies && (
        <>
          {/* dim 오버레이 — 별도 요소로 분리해 fixed 포지셔닝 버그 방지 */}
          <div
            onClick={onClosePreview}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(35,31,24,.32)', zIndex: 50 }}
          />
          {/* 시트 본체 */}
          <div
            style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 51, background: 'var(--paper)', borderRadius: '30px 30px 0 0', border: '2.5px solid var(--ink)', borderBottom: 'none', padding: '14px 22px calc(30px + var(--safe-bottom))', maxHeight: '85vh', overflowY: 'auto', animation: 'popIn .26s ease' }}
          >
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
            {/* 이름 지어주기 */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12.5, color: 'var(--soft)', fontWeight: 600, marginBottom: 7 }}>이름 지어주기</div>
              <input
                value={customName}
                onChange={e => onCustomNameChange(e.target.value)}
                placeholder={selectedSpecies.name}
                style={{ width: '100%', boxSizing: 'border-box', padding: '11px 14px', border: '2px solid var(--ink)', borderRadius: 14, fontFamily: 'Shantell Sans, sans-serif', fontSize: 16, fontWeight: 600, color: 'var(--ink)', background: 'var(--paper)', outline: 'none' }}
              />
            </div>
            <div
              onClick={onAdd}
              style={{ textAlign: 'center', padding: 15, background: 'var(--ink)', color: 'var(--paper)', borderRadius: 18, fontSize: 17, fontWeight: 700, cursor: 'pointer' }}
            >
              내 식물로 들이기
            </div>
          </div>
        </>
      )}
    </div>
  );
}
