import { PlantType } from '../types';

export interface ArchivePlant {
  id: string;
  name: string;
  type: PlantType;
  shelfDoodle: string;
  archiveTag: string;
  onOpen: () => void;
}

interface Props {
  plants: ArchivePlant[];
  archiveDoodle: string;
  archiveSummary: string;
}

const SHELF_SIZE = 3;

export default function ArchiveScreen({ plants, archiveDoodle, archiveSummary }: Props) {
  const shelves: ArchivePlant[][] = [];
  for (let i = 0; i < plants.length; i += SHELF_SIZE) {
    shelves.push(plants.slice(i, i + SHELF_SIZE));
  }

  return (
    <div style={{ padding: 'max(62px, calc(44px + var(--safe-top))) 22px calc(120px + var(--safe-bottom))', minHeight: '100vh' }}>
      {/* 헤더 */}
      <div style={{ fontFamily: 'KJD, sans-serif', fontSize: 16, color: 'var(--soft)', fontWeight: 500, letterSpacing: '.5px' }}>물주기를 잠시 쉬는 중</div>
      <div style={{ fontFamily: 'KJD, sans-serif', fontSize: 40, fontWeight: 700, lineHeight: 1, marginTop: 4 }}>보관함</div>

      {/* 요약 배너 */}
      <div style={{ margin: '18px 0 24px', border: '1px dashed var(--ink)', borderRadius: '20px 22px 19px 23px', padding: '15px 18px', display: 'flex', alignItems: 'center', gap: 14, background: 'var(--faint)' }}>
        <div style={{ width: 40, height: 40, flexShrink: 0, color: 'var(--soft)' }} dangerouslySetInnerHTML={{ __html: archiveDoodle }} />
        <div>
          <div style={{ fontFamily: 'KJD, sans-serif', fontSize: 19, fontWeight: 700, lineHeight: 1.25 }}>{archiveSummary}</div>
          <div style={{ fontFamily: 'KJD, sans-serif', fontSize: 13.5, color: 'var(--soft)', marginTop: 2 }}>물주기 알림은 잠시 꺼져 있어요</div>
        </div>
      </div>

      {/* 비어있을 때 */}
      {plants.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--soft)', padding: '54px 24px', fontSize: 14.5, lineHeight: 1.7 }}>
          아직 보관한 식물이 없어요.<br />
          식물 상세 화면 아래 <b style={{ color: 'var(--ink)' }}>보관하기</b>로<br />
          물주기를 쉬게 할 수 있어요.
        </div>
      )}

      {/* 선반 뷰 */}
      {shelves.map((shelf, si) => (
        <div key={si} style={{ marginBottom: 22 }}>
          {/* 화분 */}
          <div style={{ display: 'flex', alignItems: 'flex-end', padding: '0 8px' }}>
            {shelf.map(item => (
              <div
                key={item.id}
                onClick={item.onOpen}
                style={{ flex: 1, display: 'flex', justifyContent: 'center', cursor: 'pointer', minWidth: 0, opacity: 0.8 }}
              >
                <div
                  style={{ width: 80, height: 86, filter: 'drop-shadow(0 2px 1.5px rgba(40,34,22,.12)) grayscale(.2)' }}
                  dangerouslySetInnerHTML={{ __html: item.shelfDoodle }}
                />
              </div>
            ))}
            {Array.from({ length: SHELF_SIZE - shelf.length }).map((_, i) => (
              <div key={`ep-${i}`} style={{ flex: 1, minWidth: 0 }} />
            ))}
          </div>
          {/* 선반 */}
          <div style={{ height: 13, border: '2.5px solid var(--ink)', borderRadius: 5, background: 'var(--faint)', marginTop: -5, position: 'relative', boxShadow: '0 5px 0 -3px rgba(54,74,53,.14)' }}>
            <span style={{ position: 'absolute', left: 18, top: 11, height: 9, borderLeft: '2.5px solid var(--ink)' }} />
            <span style={{ position: 'absolute', right: 18, top: 11, height: 9, borderLeft: '2.5px solid var(--ink)' }} />
          </div>
          {/* 이름 & 태그 */}
          <div style={{ display: 'flex', padding: '0 8px', marginTop: 14 }}>
            {shelf.map(item => (
              <div key={item.id} onClick={item.onOpen} style={{ flex: 1, textAlign: 'center', cursor: 'pointer', minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.1, color: 'var(--soft)' }}>{item.name}</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', marginTop: 6, padding: '2px 10px 3px', borderRadius: 11, border: '1.5px solid var(--line)', background: 'var(--faint)' }}>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--soft)' }}>{item.archiveTag}</span>
                </div>
              </div>
            ))}
            {Array.from({ length: SHELF_SIZE - shelf.length }).map((_, i) => (
              <div key={`el-${i}`} style={{ flex: 1, minWidth: 0 }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
