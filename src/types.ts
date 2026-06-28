export type PlantType =
  | 'fern' | 'orchid' | 'palm' | 'succulent' | 'bulb' | 'vine'
  | 'tropical' | 'foliage' | 'flowering' | 'shrub' | 'tree' | 'herb'
  | 'stuckyi' | 'cactus';

export type HealthKey = 'healthy' | 'thirsty' | 'urgent';
export type Screen = 'home' | 'calendar' | 'detail' | 'add';
export type DetailView = 'list' | 'cal';
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export interface SeasonalNumbers {
  spring: number;
  summer: number;
  autumn: number;
  winter: number;
}

export interface SeasonalLabels {
  spring: string;
  summer: string;
  autumn: string;
  winter: string;
}

export interface PlantSpecies {
  id: string;
  name: string;
  sci: string;
  type: PlantType;
  waterIntervalDays: SeasonalNumbers;
  waterTiming: SeasonalLabels;
  light: string;
  temp: string;
  desc: string;
}

export interface PlantInitialData {
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

export interface UserPlant {
  id: string;
  speciesId: string;
  speciesName: string; // DB에서 가져온 종명 (API cntntsSj)
  name: string;        // 사용자가 붙인 이름
  sci: string;
  type: PlantType;
  color: string;
  waterIntervalDays: SeasonalNumbers;
  waterTiming: SeasonalLabels;
  light: string;
  temp: string;
  registeredAt: string;
  wateringLogs: string[];
  archived?: boolean;
  initialData?: PlantInitialData;
}

export interface HealthStatus {
  key: HealthKey;
  label: string;
  color: string;
  daysSince: number;
  lastWatered: string;
}

export interface DueInfo {
  dueDate: string;
  daysUntil: number;
  text: string;
  color: string;
}
