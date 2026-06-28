// @vitest-environment happy-dom
/**
 * 스모크 테스트: 각 화면이 에러 없이 렌더링되는지 검증한다.
 * JSX 구조 오류, import 실패, 런타임 크래시를 조기에 잡는다.
 */
import { describe, it } from 'vitest';
import { render } from '@testing-library/react';
import HomeScreen from '../screens/Home';
import AddScreen from '../screens/Add';
import CalendarScreen from '../screens/Calendar';
import DetailScreen from '../screens/Detail';

const noop = () => {};

describe('스모크 — 화면 렌더링', () => {
  it('HomeScreen: 식물 0개', () => {
    render(
      <HomeScreen
        plants={[]}
        needWater={0}
        summaryDoodle=""
        goAdd={noop}
        onWaterMultiple={noop}
      />
    );
  });

  it('HomeScreen: 식물 있음', () => {
    render(
      <HomeScreen
        plants={[{
          id: 'p1', name: '몬스테라', type: 'tropical',
          shelfDoodle: '', status: { label: '촉촉해요', color: '#4A7C59' },
          onOpen: noop,
        }]}
        needWater={0}
        summaryDoodle=""
        goAdd={noop}
        onWaterMultiple={noop}
      />
    );
  });

  it('AddScreen: 초기 상태 (검색 전)', () => {
    render(
      <AddScreen
        query="" onQueryChange={noop} results={[]}
        selectedSpecies={null} customName="" onCustomNameChange={noop}
        selectedColor="#4A7C59" onColorChange={noop}
        onClosePreview={noop} onAdd={noop} onAddCustom={noop}
        goBack={noop} searchIcon=""
      />
    );
  });

  it('AddScreen: 검색 결과 0건 (직접 추가 버튼 노출)', () => {
    render(
      <AddScreen
        query="알로에" onQueryChange={noop} results={[]}
        selectedSpecies={null} customName="" onCustomNameChange={noop}
        onClosePreview={noop} onAdd={noop} onAddCustom={noop}
        goBack={noop} searchIcon=""
      />
    );
  });

  it('AddScreen: 검색 결과 있음', () => {
    render(
      <AddScreen
        query="몬스" onQueryChange={noop}
        results={[{
          id: 'sp_mon', name: '몬스테라', sci: 'Monstera deliciosa',
          type: 'tropical', intervalDays: 7, doodle: '', onSelect: noop,
        }]}
        selectedSpecies={null} customName="" onCustomNameChange={noop}
        onClosePreview={noop} onAdd={noop} onAddCustom={noop}
        goBack={noop} searchIcon=""
      />
    );
  });

  it('CalendarScreen: 빈 달력', () => {
    render(
      <CalendarScreen
        monthLabel="2026년 6월"
        weeks={[]}
        chips={[]}
        upcoming={[]}
        weekdays={['일', '월', '화', '수', '목', '금', '토'].map(d => ({ label: d }))}
        onPrevMonth={noop}
        onNextMonth={noop}
      />
    );
  });

  it('DetailScreen: 기본 식물', () => {
    render(
      <DetailScreen
        plant={{
          id: 'p1', name: '몬스테라', speciesName: '몬스테라', sci: 'Monstera deliciosa',
          type: 'tropical', doodle: '',
          status: { key: 'healthy', label: '촉촉해요', color: '#4A7C59', daysSince: 3, lastWatered: '2026-06-18' },
          due: { dueDate: '2026-06-25', daysUntil: 4, text: '4일 뒤', color: '#4A7C59' },
          bondDays: 100, registeredText: '2026-03-12 등록',
          careRows: [], history: [], miniWeeks: [],
          canCancelWatering: false,
          editable: {
            name: '몬스테라', speciesName: '몬스테라', sci: 'Monstera deliciosa', type: 'tropical' as const, color: '#4A7C59',
            waterIntervalDays: { spring: 7, summer: 7, autumn: 7, winter: 7 },
            waterTiming: { spring: '겉흙 마르면', summer: '겉흙 마르면', autumn: '겉흙 마르면', winter: '겉흙 마르면' },
            light: '밝은 간접광', temp: '18–27°C',
            initialData: undefined,
          },
          onCancelWatering: noop, onEditFirstWatering: noop, onDelete: noop, onEdit: noop,
        }}
        weekdays={['일', '월', '화', '수', '목', '금', '토'].map(d => ({ label: d }))}
        goBack={noop}
      />
    );
  });
});
