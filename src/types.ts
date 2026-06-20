export type PlantType = 'monstera' | 'snake' | 'palm' | 'succulent' | 'olive';
export type HealthKey = 'healthy' | 'thirsty' | 'urgent';
export type Screen = 'home' | 'calendar' | 'detail' | 'add';
export type DetailView = 'list' | 'cal';

export interface PlantSpecies {
  id: string;
  name: string;
  sci: string;
  type: PlantType;
  color: string;
  intervalDays: number;
  light: string;
  waterTiming: string;
  temp: string;
  amount: string;
  desc: string;
}

export interface UserPlant {
  id: string;
  name: string;
  sci: string;
  type: PlantType;
  color: string;
  intervalDays: number;
  registeredAt: string;
  light: string;
  waterTiming: string;
  temp: string;
  amount: string;
  wateringLogs: string[];
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
