import { useState, useRef } from 'react';
import { PlantType } from '../types';
import { EMPTY_POT } from '../doodles';
import { getCurrentSeason } from '../utils';
import type { WeatherPermission, WeatherInfo } from '../hooks/useWeather';

export interface HomePlant {
  id: string;
  name: string;
  type: PlantType;
  shelfDoodle: string;
  status: { label: string; color: string };
  archived: boolean;
  onOpen: () => void;
}

type ShelfItem = HomePlant | { id: '__add__' };
const isAdd = (item: ShelfItem): item is { id: '__add__' } => item.id === '__add__';

interface Props {
  plants: HomePlant[];
  needWater: number;
  summaryDoodle: string;
  canSticker: string;
  dropMini: string;
  goAdd: () => void;
  onWaterOne: (id: string) => void;
  weather: WeatherInfo | null;
  weatherPermission: WeatherPermission;
  onRequestWeather: () => void;
}

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];
const SHELF_SIZE = 3;

const SEASON_KO: Record<ReturnType<typeof getCurrentSeason>, string> = {
  spring: '봄', summer: '여름', autumn: '가을', winter: '겨울',
};

const DROP_POSITIONS = [
  { left: 0,   delay: '0s'   },
  { left: 18,  delay: '.18s' },
  { left: -18, delay: '.36s' },
];

export default function HomeScreen({ plants, needWater, summaryDoodle, canSticker, dropMini, goAdd, onWaterOne, weather, weatherPermission, onRequestWeather }: Props) {
  const [waterMode, setWaterMode]   = useState(false);
  const [sprinkleId, setSprinkleId] = useState<string | null>(null);
  const sprinkleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const now = new Date();
  const todayLabel = `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일 ${DAYS[now.getDay()]}요일`;

  const allItems: ShelfItem[] = [...plants, { id: '__add__' }];
  const shelves: ShelfItem[][] = [];
  for (let i = 0; i < allItems.length; i += SHELF_SIZE) shelves.push(allItems.slice(i, i + SHELF_SIZE));

  const toggleWaterMode = () => {
    setWaterMode(prev => !prev);
    setSprinkleId(null);
    if (sprinkleTimer.current) clearTimeout(sprinkleTimer.current);
  };

  const sprinkleWater = (id: string) => {
    if (sprinkleId) return;
    setSprinkleId(id);
    if (sprinkleTimer.current) clearTimeout(sprinkleTimer.current);
    sprinkleTimer.current = setTimeout(() => {
      onWaterOne(id);
      setSprinkleId(null);
    }, 1050);
  };

  return (
    <div style={{ padding: 'max(62px, calc(44px + var(--safe-top))) 22px calc(104px + var(--safe-bottom))', minHeight: '100vh' }}>

      {/* 날짜 + 계절 + 날씨 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ fontFamily: 'KJD, sans-serif', fontSize: 16, color: 'var(--soft)', fontWeight: 500, letterSpacing: '.5px' }}>
          {todayLabel}, {SEASON_KO[getCurrentSeason()]}
          {weatherPermission === 'granted' && weather && `, ${weather.label} ${weather.tempC}°C`}
        </div>
        {weatherPermission === 'denied' && (
          <button
            onClick={onRequestWeather}
            style={{ fontSize: 12, color: 'var(--soft)', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'KJD, sans-serif', flexShrink: 0, textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: 3, letterSpacing: '.5px' }}
          >
            📍 위치 켜기
          </button>
        )}
      </div>

      {/* 타이틀 */}
      <div style={{ fontFamily: 'KJD, sans-serif', fontSize: 42, fontWeight: 700, lineHeight: 1, marginTop: 4 }}>오늘의 식구들</div>

      {/* 요약 배너 */}
      {plants.length > 0 && (
        <div onClick={needWater > 0 ? toggleWaterMode : undefined} style={{ margin: '18px 0 22px', border: '2px solid var(--ink)', borderRadius: '20px 22px 19px 23px', padding: '15px 18px', display: 'flex', alignItems: 'center', gap: 14, background: '#364A35', cursor: needWater > 0 ? 'pointer' : 'default' }}>
          <div style={{ width: 42, height: 42, flexShrink: 0 }} dangerouslySetInnerHTML={{ __html: summaryDoodle }} />
          <div>
            <div style={{ fontFamily: 'KJD, sans-serif', fontSize: 20, fontWeight: 700, lineHeight: 1.25, color: '#F8FFF5' }}>
              {needWater > 0 ? `${needWater}개의 식물이 물을 기다려요` : '모두 촉촉해요'}
            </div>
            <div style={{ fontFamily: 'KJD, sans-serif', fontSize: 13, color: 'var(--soft)', marginTop: 2 }}>
              {needWater > 0 ? '오늘 챙겨주면 더 건강해질 거예요' : '오늘은 푹 쉬어도 좋아요'}
            </div>
          </div>
        </div>
      )}

      {/* 식물이 없을 때 안내 */}
      {plants.length === 0 && (
        <div onClick={goAdd} style={{ marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, padding: 15, border: '2.5px dashed var(--soft)', borderRadius: 20, cursor: 'pointer', color: 'var(--soft)', fontSize: 16, fontWeight: 700 }}>
          <span style={{ fontSize: 22, lineHeight: 1 }}>＋</span> 새로운 식물 들이기
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
                onClick={waterMode ? (item.archived ? undefined : () => sprinkleWater(item.id)) : item.onOpen}
                style={{ flex: 1, display: 'flex', justifyContent: 'center', cursor: waterMode && item.archived ? 'default' : 'pointer', minWidth: 0, position: 'relative', opacity: item.archived ? 0.38 : 1, transition: 'opacity .15s' }}
              >
                <div
                  style={{
                    width: 80, height: 86,
                    opacity: waterMode && !item.archived && sprinkleId && sprinkleId !== item.id ? 0.55 : 1,
                    transition: 'opacity .15s',
                    filter: 'drop-shadow(2px 4px 3px rgba(40,34,22,.22))',
                  }}
                  dangerouslySetInnerHTML={{ __html: item.shelfDoodle }}
                />
                {/* 물방울 애니메이션 */}
                {waterMode && sprinkleId === item.id && (
                  <div style={{ position: 'absolute', top: -6, left: 0, right: 0, height: 60, pointerEvents: 'none' }}>
                    {DROP_POSITIONS.map((d, i) => (
                      <span
                        key={i}
                        style={{
                          position: 'absolute', top: 0,
                          left: `calc(50% - 18px + ${d.left}px)`,
                          width: 13, height: 13,
                          animation: `sprinkleDrop .85s ease-in ${d.delay} infinite`,
                        }}
                        dangerouslySetInnerHTML={{ __html: dropMini }}
                      />
                    ))}
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
              <div key="__add__" style={{ flex: 1, minWidth: 0, opacity: waterMode ? 0.15 : 1 }}>
                <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: 'var(--soft)', opacity: 0.6 }}>+ 들이기</div>
              </div>
            ) : (
              <div key={item.id} onClick={waterMode && item.archived ? undefined : (waterMode ? () => sprinkleWater(item.id) : item.onOpen)} style={{ flex: 1, textAlign: 'center', cursor: waterMode && item.archived ? 'default' : 'pointer', minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.1 }}>{item.name}</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 5 }}>
                  {item.archived ? (
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--soft)' }}>보관 중</span>
                  ) : (
                    <>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: item.status.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: item.status.color }}>{item.status.label}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* 물뿌리개 FAB */}
      {plants.length > 0 && (
        <div
          onClick={toggleWaterMode}
          style={{
            position: 'fixed',
            right: 20,
            bottom: `calc(100px + var(--safe-bottom))`,
            zIndex: 40,
            width: 100, height: 100,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            animation: waterMode ? 'canBob 1s ease-in-out infinite' : 'none',
            filter: 'drop-shadow(2px 3px 4px rgba(40,34,22,.28))',
          }}
        >
          <div style={{ width: 100, height: 100 }} dangerouslySetInnerHTML={{ __html: canSticker }} />
        </div>
      )}

      {/* 물주기 모드 힌트 */}
      {waterMode && (
        <div style={{
          position: 'fixed',
          bottom: `calc(104px + var(--safe-bottom))`,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 55,
          background: '#4A7C9B', color: '#fff',
          padding: '10px 16px 10px 14px',
          borderRadius: 16,
          fontSize: 14, fontWeight: 700,
          whiteSpace: 'nowrap',
          display: 'flex', alignItems: 'center', gap: 10,
          boxShadow: '0 6px 16px -6px rgba(40,34,22,.5)',
          animation: 'toastIn .3s ease',
        }}>
          식물을 선택해서 물을 주세요
          <span
            onClick={toggleWaterMode}
            style={{ cursor: 'pointer', border: '1.5px solid rgba(255,255,255,.6)', borderRadius: 10, padding: '2px 11px', fontSize: 12.5 }}
          >완료</span>
        </div>
      )}
    </div>
  );
}
