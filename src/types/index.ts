// 薬剤情報の型定義
export interface Drug {
  id: string;
  name: string;
  nameKana: string;
  genericName: string;
  category: string;
  formulation: string;
  defaultConcentration: number | null;
  concentrationUnit: string;
  file: string;
}

// 計算タイプの定義
export const CALC_TYPES = {
  MG_PER_KG_PER_DAY: 'MG_PER_KG_PER_DAY',
  MG_PER_KG_PER_DOSE: 'MG_PER_KG_PER_DOSE',
  FIXED_DAILY_MG: 'FIXED_DAILY_MG',
  FIXED_DOSE_MG: 'FIXED_DOSE_MG',
} as const;

export type CalcType = typeof CALC_TYPES[keyof typeof CALC_TYPES];

// 丸め規則の定義
export const ROUNDING = {
  ROUND_1: 'ROUND_1',
  ROUND_2: 'ROUND_2',
  FLOOR_1: 'FLOOR_1',
  CEIL_1: 'CEIL_1',
  NONE: 'NONE',
} as const;

export type RoundingType = typeof ROUNDING[keyof typeof ROUNDING];

// 判定結果の定義
export const VERDICT = {
  OK: 'ok',
  WARNING: 'warning',
  DANGER: 'danger',
} as const;

export type VerdictType = typeof VERDICT[keyof typeof VERDICT];

// 用量ルールの型定義
export interface DoseRule {
  rule_id: string;
  age_min_months: number;
  age_max_months: number;
  wt_min_kg: number;
  wt_max_kg: number;
  calc_type: CalcType;
  base_value: number;
  base_unit: string;
  max_daily_mg?: number;
  max_single_mg?: number;
  rounding: RoundingType;
  note?: string;
  source_title?: string;
  source_version?: string;
  source_ref?: string;
  range_min?: number;
  range_max?: number;
}

// 計算ステップの型定義
export interface CalcStep {
  label: string;
  expr: string;
  value: string;
}

// 計算パラメータの型定義
export interface CalculateParams {
  rule: DoseRule;
  weight: number;
  ageMonths: number;
  frequency: number;
  prescribedAmount: number | null;
  prescribedUnit: 'mg' | 'mL' | 'g';
  concentration: number;
  rangePercent?: number;
}

// 計算結果の型定義
export interface CalcResult {
  baseDoseMg: number;
  baseDailyMg: number;
  doseMin: number;
  doseMax: number;
  dailyMin: number;
  dailyMax: number;
  rangePolicy: 'EXPLICIT_RANGE' | 'PERCENT_AROUND_BASE';
  rangePercent: number;
  hasExplicitRange: boolean;
  prescribedDoseMg: number;
  prescribedDailyMg: number;
  verdict: VerdictType;
  message: string;
  details: string[];
  maxDailyMg: number | null;
  maxSingleMg: number | null;
  exceedsMaxDaily: boolean;
  exceedsMaxSingle: boolean;
  appliedRuleId: string;
  appliedRule: DoseRule;
  steps: CalcStep[];
  source: {
    title?: string;
    version?: string;
    ref?: string;
    note?: string;
  };
  hasPrescribedAmount?: boolean;
}

// アプリケーション状態の型定義
export interface AppState {
  currentStep: 1 | 2 | 3;
  drugs: Drug[];
  drugRules: Record<string, DoseRule[]>;
  selectedDrug: Drug | null;
  selectedRule: DoseRule | null;
  matchingRules: DoseRule[];
  lastResult: CalcResult | null;
  rangePercent: number;
  isRangeModified: boolean;
  recentDrugs: string[];
}

// 患者入力の型定義
export interface PatientInputData {
  ageYears: number;
  ageMonths: number;
  weight: number;
  doseAmount: number | null;
  doseUnit: 'mg' | 'mL' | 'g';
  frequency: number;
  concentration: number;
}
