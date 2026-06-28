import { useState } from 'react';
import { PlantType } from '../types';
import { EMPTY_POT, WATERING_CAN } from '../doodles';

export interface HomePlant {
  id: string;
  name: string;
  type: PlantType;
  shelfDoodle: string;
  status: { label: string; color: string };
  onOpen: () => void;
}

type ShelfItem = HomePlant | { id: '__add__' };
const isAdd = (item: ShelfItem): item is { id: '__add__' } => item.id === '__add__';

interface Props {
  plants: HomePlant[];
  needWater: number;
  summaryDoodle: string;
  goAdd: () => void;
  onWaterMultiple: (ids: string[]) => void;
}

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];
const SHELF_SIZE = 3;

export default function HomeScreen({ plants, needWater, summaryDoodle, goAdd, onWaterMultiple }: Props) {
  const [waterMode,   setWaterMode]   = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const now = new Date();
  const todayLabel = `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일 ${DAYS[now.getDay()]}요일`;

  const allItems: ShelfItem[] = [...plants, { id: '__add__' }];
  const shelves: ShelfItem[][] = [];
  for (let i = 0; i < allItems.length; i += SHELF_SIZE) shelves.push(allItems.slice(i, i + SHELF_SIZE));

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const startWaterMode = () => {
    setSelectedIds(new Set());
    setWaterMode(true);
  };

  const cancelWaterMode = () => {
    setWaterMode(false);
    setSelectedIds(new Set());
  };

  const confirmWater = () => {
    if (selectedIds.size === 0) return;
    onWaterMultiple([...selectedIds]);
    setWaterMode(false);
    setSelectedIds(new Set());
  };

  return (
    <div style={{ padding: 'max(62px, calc(44px + var(--safe-top))) 22px calc(104px + var(--safe-bottom))', minHeight: '100vh' }}>
      <div style={{ fontSize: 13, color: 'var(--soft)', fontWeight: 500, letterSpacing: '.5px' }}>{todayLabel}</div>
      <div style={{ fontFamily: 'Caveat, cursive', fontSize: 42, fontWeight: 700, lineHeight: 1, marginTop: 4 }}>오늘의 식구들</div>

      {/* 요약 배너 — 식물이 있을 때만 */}
      {plants.length > 0 && (
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
      )}

      {/* 선반 뷰 */}
      {shelves.map((shelf, si) => (
        <div key={si} style={{ marginBottom: 22 }}>
          {/* 화분 */}
          <div style={{ display: 'flex', alignItems: 'flex-end', padding: '0 8px' }}>
            {shelf.map(item => isAdd(item) ? (
              <div key="__add__" onClick={waterMode ? undefined : goAdd} style={{ flex: 1, display: 'flex', justifyContent: 'center', cursor: waterMode ? 'default' : 'pointer', minWidth: 0, opacity: waterMode ? 0.15 : 0.35 }}>
                <div style={{ width: 80, height: 86 }} dangerouslySetInnerHTML={{ __html: EMPTY_POT }} />
              </div>
            ) : (
              <div
                key={item.id}
                onClick={waterMode ? () => toggleSelect(item.id) : item.onOpen}
                style={{ flex: 1, display: 'flex', justifyContent: 'center', cursor: 'pointer', minWidth: 0, position: 'relative' }}
              >
                <div style={{ width: 80, height: 86, opacity: waterMode && !selectedIds.has(item.id) ? 0.55 : 1, transition: 'opacity .15s', filter: 'drop-shadow(0 2px 1.5px rgba(40,34,22,.18))' }} dangerouslySetInnerHTML={{ __html: item.shelfDoodle }} />
                {waterMode && (
                  <div style={{
                    position: 'absolute', top: 2, right: 6,
                    width: 22, height: 22, borderRadius: '50%',
                    border: `2px solid ${selectedIds.has(item.id) ? '#4A7C9B' : 'var(--line)'}`,
                    background: selectedIds.has(item.id) ? '#4A7C9B' : 'var(--paper)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all .15s',
                  }}>
                    {selectedIds.has(item.id) && (
                      <svg viewBox="0 0 10 8" width="11" height="9" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 4 l3 3 l5-6"/>
                      </svg>
                    )}
                  </div>
                )}
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
            {shelf.map(item => isAdd(item) ? (
              <div key="__add__" style={{ flex: 1, textAlign: 'center', minWidth: 0, opacity: waterMode ? 0.15 : 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--soft)', opacity: 0.6 }}>+ 들이기</div>
              </div>
            ) : (
              <div key={item.id} onClick={waterMode ? () => toggleSelect(item.id) : item.onOpen} style={{ flex: 1, textAlign: 'center', cursor: 'pointer', minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.1 }}>{item.name}</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 5 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: item.status.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: item.status.color }}>{item.status.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* 물뿌리개 FAB */}
      {plants.length > 0 && (
        <button
          onClick={waterMode ? cancelWaterMode : startWaterMode}
          style={{
            position: 'fixed',
            bottom: 'calc(96px + var(--safe-bottom))',
            right: 16,
            width: 72,
            height: 72,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            padding: 0,
            zIndex: 40,
            color: waterMode ? 'var(--soft)' : 'var(--ink)',
            fontSize: waterMode ? 26 : undefined,
            fontWeight: waterMode ? 700 : undefined,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label={waterMode ? '취소' : '물 주기'}
        >
          {waterMode
            ? '✕'
            : <div style={{ width: '100%', height: '100%' }} dangerouslySetInnerHTML={{ __html: WATERING_CAN }} />}
        </button>
      )}

      {/* 물주기 확인 바 */}
      {waterMode && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '12px 20px',
          paddingBottom: 'calc(12px + var(--safe-bottom))',
          background: 'var(--paper)',
          borderTop: '2px solid var(--ink)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          zIndex: 45,
          height: 'calc(84px + var(--safe-bottom))',
          boxSizing: 'border-box',
        }}>
          <button
            onClick={cancelWaterMode}
            style={{ flex: 1, padding: '11px 0', border: '2px solid var(--line)', borderRadius: 16, background: 'transparent', color: 'var(--soft)', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            취소
          </button>
          <button
            onClick={confirmWater}
            style={{ flex: 2, padding: '11px 0', border: '2px solid var(--ink)', borderRadius: 16, background: selectedIds.size > 0 ? '#4A7C9B' : 'var(--line)', color: 'white', fontSize: 15, fontWeight: 700, cursor: selectedIds.size > 0 ? 'pointer' : 'default', fontFamily: 'inherit', transition: 'background .15s' }}
          >
            {selectedIds.size > 0 ? `${selectedIds.size}개 식물에게 물 주기` : '화분을 선택해 주세요'}
          </button>
        </div>
      )}
    </div>
  );
}
