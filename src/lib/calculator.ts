import {
  CALC_TYPES,
  ROUNDING,
  VERDICT,
  type DoseRule,
  type CalcStep,
  type CalculateParams,
  type CalcResult,
  type RoundingType,
  type VerdictType,
} from '../types';

/**
 * 年齢を月齢に変換
 */
export function ageToMonths(years: number, months: number): number {
  return years * 12 + months;
}

/**
 * 丸め処理
 */
export function applyRounding(value: number, roundingType: RoundingType): number {
  switch (roundingType) {
    case ROUNDING.ROUND_1:
      return Math.round(value * 10) / 10;
    case ROUNDING.ROUND_2:
      return Math.round(value * 100) / 100;
    case ROUNDING.FLOOR_1:
      return Math.floor(value * 10) / 10;
    case ROUNDING.CEIL_1:
      return Math.ceil(value * 10) / 10;
    case ROUNDING.NONE:
    default:
      return value;
  }
}

/**
 * CSVルールから条件に合致するルールを検索
 */
export function findMatchingRules(
  rules: DoseRule[],
  ageMonths: number,
  weight: number
): DoseRule[] {
  return rules.filter((rule) => {
    const ageMin = rule.age_min_months || 0;
    const ageMax = rule.age_max_months || Infinity;
    const wtMin = rule.wt_min_kg || 0;
    const wtMax = rule.wt_max_kg || Infinity;

    return ageMonths >= ageMin && ageMonths <= ageMax && weight >= wtMin && weight <= wtMax;
  });
}

interface BaseDoseResult {
  baseDailyMg: number;
  baseDoseMg: number;
  rawDailyMg: number;
  rawDoseMg: number;
  maxDailyMg: number | null;
  maxSingleMg: number | null;
  steps: CalcStep[];
}

/**
 * 基準用量（1日量・1回量）を算出
 */
function calculateBaseDose(
  rule: DoseRule,
  weight: number,
  frequency: number
): BaseDoseResult {
  const calcType = rule.calc_type;
  const baseValue = rule.base_value;
  const maxDailyMg = rule.max_daily_mg ?? null;
  const maxSingleMg = rule.max_single_mg ?? null;
  const rounding = rule.rounding || ROUNDING.ROUND_1;

  let baseDailyMg = 0;
  let baseDoseMg = 0;
  const steps: CalcStep[] = [];

  steps.push({
    label: '体重',
    expr: 'wt',
    value: `${weight} kg`,
  });

  switch (calcType) {
    case CALC_TYPES.MG_PER_KG_PER_DAY:
      steps.push({
        label: '基準用量',
        expr: `${baseValue} ${rule.base_unit}`,
        value: baseValue.toString(),
      });

      baseDailyMg = weight * baseValue;
      steps.push({
        label: '基準1日量（丸め前）',
        expr: `${weight} × ${baseValue}`,
        value: `${baseDailyMg.toFixed(2)} mg/day`,
      });

      if (maxDailyMg && baseDailyMg > maxDailyMg) {
        baseDailyMg = maxDailyMg;
        steps.push({
          label: '最大1日量適用',
          expr: `max_daily = ${maxDailyMg}`,
          value: `${baseDailyMg} mg/day`,
        });
      }

      baseDoseMg = baseDailyMg / frequency;
      steps.push({
        label: '基準1回量',
        expr: `${baseDailyMg.toFixed(2)} ÷ ${frequency}`,
        value: `${baseDoseMg.toFixed(2)} mg/dose`,
      });
      break;

    case CALC_TYPES.MG_PER_KG_PER_DOSE:
      steps.push({
        label: '基準用量',
        expr: `${baseValue} ${rule.base_unit}`,
        value: baseValue.toString(),
      });

      baseDoseMg = weight * baseValue;
      steps.push({
        label: '基準1回量（丸め前）',
        expr: `${weight} × ${baseValue}`,
        value: `${baseDoseMg.toFixed(2)} mg/dose`,
      });

      if (maxSingleMg && baseDoseMg > maxSingleMg * weight) {
        baseDoseMg = maxSingleMg * weight;
        steps.push({
          label: '上限用量適用',
          expr: `max_single = ${maxSingleMg} mg/kg/dose`,
          value: `${baseDoseMg.toFixed(2)} mg/dose`,
        });
      }

      baseDailyMg = baseDoseMg * frequency;
      steps.push({
        label: '基準1日量',
        expr: `${baseDoseMg.toFixed(2)} × ${frequency}`,
        value: `${baseDailyMg.toFixed(2)} mg/day`,
      });

      if (maxDailyMg && baseDailyMg > maxDailyMg) {
        baseDailyMg = maxDailyMg;
        baseDoseMg = baseDailyMg / frequency;
        steps.push({
          label: '最大1日量適用',
          expr: `max_daily = ${maxDailyMg}`,
          value: `${baseDailyMg} mg/day → 1回 ${baseDoseMg.toFixed(2)} mg`,
        });
      }
      break;

    case CALC_TYPES.FIXED_DAILY_MG:
      steps.push({
        label: '固定1日量',
        expr: `${baseValue} ${rule.base_unit}`,
        value: `${baseValue} mg/day`,
      });

      baseDailyMg = baseValue;
      baseDoseMg = baseDailyMg / frequency;
      steps.push({
        label: '1回量',
        expr: `${baseDailyMg} ÷ ${frequency}`,
        value: `${baseDoseMg.toFixed(2)} mg/dose`,
      });
      break;

    case CALC_TYPES.FIXED_DOSE_MG:
      steps.push({
        label: '固定1回量',
        expr: `${baseValue} ${rule.base_unit}`,
        value: `${baseValue} mg/dose`,
      });

      baseDoseMg = baseValue;
      baseDailyMg = baseDoseMg * frequency;
      steps.push({
        label: '1日量',
        expr: `${baseDoseMg} × ${frequency}`,
        value: `${baseDailyMg.toFixed(2)} mg/day`,
      });
      break;

    default:
      throw new Error(`未対応の計算タイプ: ${calcType}`);
  }

  const roundedDailyMg = applyRounding(baseDailyMg, rounding);
  const roundedDoseMg = applyRounding(baseDoseMg, rounding);

  if (rounding !== ROUNDING.NONE) {
    steps.push({
      label: '丸め処理',
      expr: `${rounding}`,
      value: `1回 ${roundedDoseMg} mg, 1日 ${roundedDailyMg} mg`,
    });
  }

  return {
    baseDailyMg: roundedDailyMg,
    baseDoseMg: roundedDoseMg,
    rawDailyMg: baseDailyMg,
    rawDoseMg: baseDoseMg,
    maxDailyMg,
    maxSingleMg,
    steps,
  };
}

interface RangeResult {
  doseMin: number;
  doseMax: number;
  dailyMin: number;
  dailyMax: number;
  rangePolicy: 'EXPLICIT_RANGE' | 'PERCENT_AROUND_BASE';
  rangePercent: number;
  hasExplicitRange: boolean;
  steps: CalcStep[];
}

/**
 * 推奨レンジを算出
 */
function calculateRange(
  rule: DoseRule,
  baseDoseMg: number,
  baseDailyMg: number,
  rangePercent: number = 20
): RangeResult {
  const hasExplicitRange = !!(rule.range_min && rule.range_max);
  const steps: CalcStep[] = [];
  let doseMin: number, doseMax: number, dailyMin: number, dailyMax: number;
  let rangePolicy: 'EXPLICIT_RANGE' | 'PERCENT_AROUND_BASE';

  if (hasExplicitRange) {
    rangePolicy = 'EXPLICIT_RANGE';
    const rangeMinValue = rule.range_min!;
    const rangeMaxValue = rule.range_max!;

    if (rule.calc_type === CALC_TYPES.MG_PER_KG_PER_DOSE) {
      const baseValueNum = rule.base_value;
      doseMin = baseDoseMg * (rangeMinValue / baseValueNum);
      doseMax = baseDoseMg * (rangeMaxValue / baseValueNum);
    } else {
      doseMin = rangeMinValue;
      doseMax = rangeMaxValue;
    }

    steps.push({
      label: 'レンジ方式',
      expr: 'CSV明示レンジ',
      value: `${rule.range_min} 〜 ${rule.range_max} ${rule.base_unit}`,
    });

    steps.push({
      label: '推奨1回量レンジ',
      expr: '明示値から算出',
      value: `${doseMin.toFixed(1)} 〜 ${doseMax.toFixed(1)} mg/dose`,
    });
  } else {
    rangePolicy = 'PERCENT_AROUND_BASE';
    const p = rangePercent / 100;

    doseMin = baseDoseMg * (1 - p);
    doseMax = baseDoseMg * (1 + p);

    steps.push({
      label: '許容率',
      expr: 'p',
      value: `${rangePercent}% (±)`,
    });

    steps.push({
      label: '推奨下限(1回)',
      expr: `${baseDoseMg.toFixed(1)} × (1 - ${p})`,
      value: `${doseMin.toFixed(1)} mg/dose`,
    });

    steps.push({
      label: '推奨上限(1回)',
      expr: `${baseDoseMg.toFixed(1)} × (1 + ${p})`,
      value: `${doseMax.toFixed(1)} mg/dose`,
    });
  }

  const p = rangePercent / 100;
  dailyMin = baseDailyMg * (1 - p);
  dailyMax = baseDailyMg * (1 + p);

  const rounding = rule.rounding || ROUNDING.ROUND_1;
  doseMin = applyRounding(doseMin, rounding);
  doseMax = applyRounding(doseMax, rounding);
  dailyMin = applyRounding(dailyMin, rounding);
  dailyMax = applyRounding(dailyMax, rounding);

  return {
    doseMin,
    doseMax,
    dailyMin,
    dailyMax,
    rangePolicy,
    rangePercent,
    hasExplicitRange,
    steps,
  };
}

interface EvaluationResult {
  verdict: VerdictType;
  message: string;
  details: string[];
  prescribedDoseMg: number;
  prescribedDailyMg: number;
  doseInRange: boolean;
  exceedsMaxDaily: boolean;
  exceedsMaxSingle: boolean;
  steps: CalcStep[];
}

/**
 * 処方量との比較・判定
 */
function evaluate(
  prescribedDoseMg: number,
  frequency: number,
  baseDose: BaseDoseResult,
  range: RangeResult
): EvaluationResult {
  const prescribedDailyMg = prescribedDoseMg * frequency;
  const steps: CalcStep[] = [];
  let verdict: VerdictType = VERDICT.OK;
  let message = '';
  const details: string[] = [];

  steps.push({
    label: '処方1回量',
    expr: 'input',
    value: `${prescribedDoseMg} mg`,
  });

  steps.push({
    label: '処方1日量',
    expr: `${prescribedDoseMg} × ${frequency}`,
    value: `${prescribedDailyMg} mg/day`,
  });

  const doseInRange = prescribedDoseMg >= range.doseMin && prescribedDoseMg <= range.doseMax;
  const doseBelowRange = prescribedDoseMg < range.doseMin;
  const doseAboveRange = prescribedDoseMg > range.doseMax;

  const exceedsMaxDaily = !!(baseDose.maxDailyMg && prescribedDailyMg > baseDose.maxDailyMg);
  const exceedsMaxSingle = !!(baseDose.maxSingleMg && prescribedDoseMg > baseDose.maxSingleMg);

  if (exceedsMaxDaily || exceedsMaxSingle) {
    verdict = VERDICT.DANGER;
    if (exceedsMaxDaily) {
      details.push(`1日最大量(${baseDose.maxDailyMg}mg)を超過`);
    }
    if (exceedsMaxSingle) {
      details.push(`1回最大量(${baseDose.maxSingleMg}mg)を超過`);
    }
    message = '最大量を超過しています';
  } else if (doseInRange) {
    verdict = VERDICT.OK;
    message = '推奨レンジ内です';
    details.push('処方量は推奨範囲内');
  } else if (doseBelowRange) {
    const deviation = ((range.doseMin - prescribedDoseMg) / range.doseMin) * 100;
    if (deviation > 30) {
      verdict = VERDICT.DANGER;
      message = '推奨量を大幅に下回っています';
      details.push(`推奨下限の${(100 - deviation).toFixed(0)}%`);
    } else {
      verdict = VERDICT.WARNING;
      message = '推奨量をやや下回っています';
      details.push(`推奨下限より${deviation.toFixed(0)}%少ない`);
    }
  } else if (doseAboveRange) {
    const deviation = ((prescribedDoseMg - range.doseMax) / range.doseMax) * 100;
    if (deviation > 30) {
      verdict = VERDICT.DANGER;
      message = '推奨量を大幅に上回っています';
      details.push(`推奨上限の${(100 + deviation).toFixed(0)}%`);
    } else {
      verdict = VERDICT.WARNING;
      message = '推奨量をやや上回っています';
      details.push(`推奨上限より${deviation.toFixed(0)}%多い`);
    }
  }

  steps.push({
    label: '判定',
    expr: `${prescribedDoseMg} vs [${range.doseMin}, ${range.doseMax}]`,
    value:
      verdict === VERDICT.OK
        ? 'レンジ内'
        : verdict === VERDICT.WARNING
          ? 'レンジ外（軽微）'
          : 'レンジ外（要確認）',
  });

  return {
    verdict,
    message,
    details,
    prescribedDoseMg,
    prescribedDailyMg,
    doseInRange,
    exceedsMaxDaily,
    exceedsMaxSingle,
    steps,
  };
}

/**
 * mL から mg への変換
 */
export function mlToMg(volumeMl: number, concentrationMgPerMl: number): number {
  return volumeMl * concentrationMgPerMl;
}

/**
 * g から mg への変換
 */
export function gToMg(grams: number): number {
  return grams * 1000;
}

/**
 * 完全な計算を実行
 */
export function calculate(params: CalculateParams): CalcResult {
  const {
    rule,
    weight,
    frequency,
    prescribedAmount,
    prescribedUnit,
    concentration,
    rangePercent = 20,
  } = params;

  let prescribedDoseMg: number | null = null;
  const conversionSteps: CalcStep[] = [];
  const hasPrescribedAmount = prescribedAmount !== null && prescribedAmount > 0;

  if (hasPrescribedAmount) {
    switch (prescribedUnit) {
      case 'mg':
        prescribedDoseMg = prescribedAmount;
        break;
      case 'mL':
        prescribedDoseMg = mlToMg(prescribedAmount, concentration);
        conversionSteps.push({
          label: 'mL→mg変換',
          expr: `${prescribedAmount} mL × ${concentration} mg/mL`,
          value: `${prescribedDoseMg} mg`,
        });
        break;
      case 'g':
        prescribedDoseMg = gToMg(prescribedAmount);
        conversionSteps.push({
          label: 'g→mg変換',
          expr: `${prescribedAmount} g × 1000`,
          value: `${prescribedDoseMg} mg`,
        });
        break;
      default:
        prescribedDoseMg = prescribedAmount;
    }
  }

  const baseDose = calculateBaseDose(rule, weight, frequency);
  const range = calculateRange(rule, baseDose.baseDoseMg, baseDose.baseDailyMg, rangePercent);

  let evaluation: EvaluationResult;
  if (hasPrescribedAmount && prescribedDoseMg !== null) {
    evaluation = evaluate(prescribedDoseMg, frequency, baseDose, range);
  } else {
    evaluation = {
      verdict: VERDICT.OK,
      message: '推奨用量を表示しています',
      details: [],
      prescribedDoseMg: 0,
      prescribedDailyMg: 0,
      doseInRange: false,
      exceedsMaxDaily: false,
      exceedsMaxSingle: false,
      steps: [],
    };
  }

  const allSteps = [...conversionSteps, ...baseDose.steps, ...range.steps, ...evaluation.steps];

  return {
    baseDoseMg: baseDose.baseDoseMg,
    baseDailyMg: baseDose.baseDailyMg,
    doseMin: range.doseMin,
    doseMax: range.doseMax,
    dailyMin: range.dailyMin,
    dailyMax: range.dailyMax,
    rangePolicy: range.rangePolicy,
    rangePercent: range.rangePercent,
    hasExplicitRange: range.hasExplicitRange,
    prescribedDoseMg: evaluation.prescribedDoseMg,
    prescribedDailyMg: evaluation.prescribedDailyMg,
    verdict: evaluation.verdict,
    message: evaluation.message,
    details: evaluation.details,
    maxDailyMg: baseDose.maxDailyMg,
    maxSingleMg: baseDose.maxSingleMg,
    exceedsMaxDaily: evaluation.exceedsMaxDaily,
    exceedsMaxSingle: evaluation.exceedsMaxSingle,
    appliedRuleId: rule.rule_id,
    appliedRule: rule,
    steps: allSteps,
    source: {
      title: rule.source_title,
      version: rule.source_version,
      ref: rule.source_ref,
      note: rule.note,
    },
    hasPrescribedAmount,
  };
}

export { CALC_TYPES, ROUNDING, VERDICT };
