import { PlantType } from '../types';

export interface HomePlant {
  id: string;
  name: string;
  type: PlantType;
  shelfDoodle: string;
  status: { label: string; color: string };
  onOpen: () => void;
}

interface Props {
  plants: HomePlant[];
  needWater: number;
  summaryDoodle: string;
  dropDoodle: string;
  goAdd: () => void;
}

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];
const SHELF_SIZE = 3;

export default function HomeScreen({ plants, needWater, summaryDoodle, dropDoodle, goAdd }: Props) {
  const now = new Date();
  const todayLabel = `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일 ${DAYS[now.getDay()]}요일`;
  const shelves: HomePlant[][] = [];
  for (let i = 0; i < plants.length; i += SHELF_SIZE) shelves.push(plants.slice(i, i + SHELF_SIZE));

  return (
    <div style={{ padding: 'max(62px, calc(44px + var(--safe-top))) 22px 32px' }}>
      <div style={{ fontSize: 13, color: 'var(--soft)', fontWeight: 500, letterSpacing: '.5px' }}>{todayLabel}</div>
      <div style={{ fontFamily: 'Caveat, cursive', fontSize: 42, fontWeight: 700, lineHeight: 1, marginTop: 4 }}>오늘의 식구들</div>

      {/* 요약 배너 */}
      <div style={{ margin: '18px 0 22px', border: '2px solid var(--ink)', borderRadius: '20px 22px 19px 23px', padding: '15px 18px', display: 'flex', alignItems: 'center', gap: 14, background: '#364A35' }}>
        <div style={{ width: 42, height: 42, flexShrink: 0 }} dangerouslySetInnerHTML={{ __html: summaryDoodle }} />
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.25, color: '#F8FFF5' }}>
            {needWater > 0 ? `${needWater}개의 식물이 물을 기다려요` : '모두 촉촉해요'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--soft)', marginTop: 2 }}>
            {needWater > 0 ? '오늘 챙겨주면 더 건강해질 거예요' : '오늘은 푹 쉬어도 좋아요'}
          </div>
        </div>
      </div>

      {/* 선반 뷰 */}
      {shelves.map((shelf, si) => (
        <div key={si} style={{ marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', padding: '0 8px' }}>
            {shelf.map(p => (
              <div key={p.id} onClick={p.onOpen} style={{ flex: 1, display: 'flex', justifyContent: 'center', cursor: 'pointer', minWidth: 0 }}>
                <div style={{ width: 80, height: 86 }} dangerouslySetInnerHTML={{ __html: p.shelfDoodle }} />
              </div>
            ))}
          </div>
          {/* 선반 */}
          <div style={{ height: 13, border: '2.5px solid var(--ink)', borderRadius: 5, background: 'var(--faint)', marginTop: -5, position: 'relative', boxShadow: '0 5px 0 -3px rgba(54,74,53,.14)' }}>
            <span style={{ position: 'absolute', left: 18, top: 11, height: 9, borderLeft: '2.5px solid var(--ink)' }} />
            <span style={{ position: 'absolute', right: 18, top: 11, height: 9, borderLeft: '2.5px solid var(--ink)' }} />
          </div>
          {/* 이름 & 상태 */}
          <div style={{ display: 'flex', padding: '0 8px', marginTop: 14 }}>
            {shelf.map(p => (
              <div key={p.id} onClick={p.onOpen} style={{ flex: 1, textAlign: 'center', cursor: 'pointer', minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.1 }}>{p.name}</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 5 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: p.status.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: p.status.color }}>{p.status.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* 빈 상태 */}
      {plants.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--soft)', padding: '48px 0 24px', fontSize: 15 }}>
          <div style={{ width: 60, height: 60, margin: '0 auto 16px', color: 'var(--line)' }} dangerouslySetInnerHTML={{ __html: dropDoodle }} />
          아직 식물이 없어요<br />
          <span style={{ fontSize: 13 }}>아래 버튼으로 첫 식구를 들여보세요 🌱</span>
        </div>
      )}

      {/* 식물 추가 버튼 */}
      <div onClick={goAdd} style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, padding: 15, border: '2.5px dashed var(--soft)', borderRadius: 20, cursor: 'pointer', color: 'var(--soft)', fontSize: 16, fontWeight: 700 }}>
        <span style={{ fontSize: 22, lineHeight: 1 }}>＋</span> 새로운 식물 들이기
      </div>
    </div>
  );
}
