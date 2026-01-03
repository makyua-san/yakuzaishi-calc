import { useState, useEffect, useCallback } from 'react';
import type { Drug, DoseRule, PatientInputData } from '../types';
import { ageToMonths, findMatchingRules } from '../lib/calculator';

interface PatientInputProps {
  selectedDrug: Drug;
  drugRules: DoseRule[];
  onBack: () => void;
  onCalculate: (data: PatientInputData, selectedRule: DoseRule) => void;
}

export function PatientInput({
  selectedDrug,
  drugRules,
  onBack,
  onCalculate,
}: PatientInputProps) {
  const [ageYears, setAgeYears] = useState(0);
  const [ageMonths, setAgeMonths] = useState(0);
  const [weight, setWeight] = useState(10);
  const [doseAmount, setDoseAmount] = useState<string>('');
  const [doseUnit, setDoseUnit] = useState<'mg' | 'mL' | 'g'>('mg');
  const [frequency, setFrequency] = useState(3);
  const [concentration, setConcentration] = useState(selectedDrug.defaultConcentration || 100);
  const [matchingRules, setMatchingRules] = useState<DoseRule[]>([]);
  const [selectedRuleIndex, setSelectedRuleIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // スライダーの進捗を計算
  const getSliderProgress = (value: number, min: number, max: number) => {
    return ((value - min) / (max - min)) * 100;
  };

  // マッチングルールを更新
  const updateMatchingRules = useCallback(() => {
    const totalMonths = ageToMonths(ageYears, ageMonths);
    const rules = findMatchingRules(drugRules, totalMonths, weight);
    setMatchingRules(rules);
    if (rules.length > 0 && selectedRuleIndex >= rules.length) {
      setSelectedRuleIndex(0);
    }
  }, [ageYears, ageMonths, weight, drugRules, selectedRuleIndex]);

  useEffect(() => {
    updateMatchingRules();
  }, [updateMatchingRules]);

  // 濃度フィールドの表示制御
  const showConcentration = doseUnit === 'mL' || doseUnit === 'g';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // バリデーション
    if (ageYears === 0 && ageMonths === 0) {
      setError('年齢を入力してください（1か月以上）');
      return;
    }

    if (weight <= 0) {
      setError('体重を入力してください');
      return;
    }

    if (weight > 100) {
      setError('体重が範囲外です（100kg以下）');
      return;
    }

    if (matchingRules.length === 0) {
      setError('入力された年齢・体重に対応するルールが見つかりません。条件を確認してください。');
      return;
    }

    const data: PatientInputData = {
      ageYears,
      ageMonths,
      weight,
      doseAmount: doseAmount ? parseFloat(doseAmount) : null,
      doseUnit,
      frequency,
      concentration,
    };

    onCalculate(data, matchingRules[selectedRuleIndex]);
  };

  return (
    <section id="step2" className="step-section active">
      <div className="card">
        <h2>
          <i className="fas fa-user-injured"></i> 患者情報・処方入力
        </h2>

        {/* 選択された薬剤表示 */}
        <div id="selectedDrugInfo" className="selected-drug-info">
          <div className="drug-icon">
            <i className="fas fa-pills"></i>
          </div>
          <div>
            <div className="drug-name">{selectedDrug.name}</div>
            <div className="drug-form">
              {selectedDrug.category} | {selectedDrug.formulation}
            </div>
          </div>
        </div>

        {error && (
          <div className="error-message">
            <i className="fas fa-exclamation-circle"></i> {error}
          </div>
        )}

        <form id="inputForm" className="input-form" onSubmit={handleSubmit}>
          {/* 患者情報 */}
          <fieldset className="form-group">
            <legend>
              <i className="fas fa-child"></i> 患者情報
            </legend>

            {/* 年齢スライダー */}
            <div className="form-row">
              <div className="form-field">
                <label>年齢</label>
                <div className="slider-group">
                  <div className="slider-control">
                    <div className="slider-label-row">
                      <span className="slider-min">0歳</span>
                      <span className="slider-current" id="ageYearsDisplay">
                        {ageYears} 歳
                      </span>
                      <span className="slider-max">15歳</span>
                    </div>
                    <input
                      type="range"
                      id="ageYears"
                      className="slider"
                      min="0"
                      max="15"
                      step="1"
                      value={ageYears}
                      onChange={(e) => setAgeYears(parseInt(e.target.value))}
                      style={
                        {
                          '--slider-progress': `${getSliderProgress(ageYears, 0, 15)}%`,
                        } as React.CSSProperties
                      }
                    />
                  </div>
                  <div className="slider-control">
                    <div className="slider-label-row">
                      <span className="slider-min">0</span>
                      <span className="slider-current" id="ageMonthsDisplay">
                        {ageMonths} か月
                      </span>
                      <span className="slider-max">11</span>
                    </div>
                    <input
                      type="range"
                      id="ageMonths"
                      className="slider"
                      min="0"
                      max="11"
                      step="1"
                      value={ageMonths}
                      onChange={(e) => setAgeMonths(parseInt(e.target.value))}
                      style={
                        {
                          '--slider-progress': `${getSliderProgress(ageMonths, 0, 11)}%`,
                        } as React.CSSProperties
                      }
                    />
                  </div>
                </div>
                <div className="age-total" id="ageTotalDisplay">
                  合計: {ageYears * 12 + ageMonths} か月
                </div>
              </div>
            </div>

            {/* 体重スライダー */}
            <div className="form-row">
              <div className="form-field">
                <label>体重</label>
                <div className="slider-control">
                  <div className="slider-label-row">
                    <span className="slider-min">2kg</span>
                    <span className="slider-current slider-current-large" id="weightDisplay">
                      {weight.toFixed(1)} kg
                    </span>
                    <span className="slider-max">60kg</span>
                  </div>
                  <input
                    type="range"
                    id="weight"
                    className="slider slider-large"
                    min="2"
                    max="60"
                    step="0.5"
                    value={weight}
                    onChange={(e) => setWeight(parseFloat(e.target.value))}
                    style={
                      {
                        '--slider-progress': `${getSliderProgress(weight, 2, 60)}%`,
                      } as React.CSSProperties
                    }
                  />
                </div>
                <small className="help-text">スライダーで調整（0.5kg単位）</small>
              </div>
            </div>
          </fieldset>

          {/* 処方情報（オプション） */}
          <fieldset className="form-group form-group-optional">
            <legend>
              <i className="fas fa-prescription"></i> 処方情報
              <span className="optional-badge">オプション</span>
            </legend>
            <p className="optional-note">処方量を入力すると、推奨量との比較判定ができます</p>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="doseAmount">1回量</label>
                <div className="input-group">
                  <input
                    type="number"
                    id="doseAmount"
                    min="0"
                    step="0.1"
                    placeholder="未入力でも可"
                    value={doseAmount}
                    onChange={(e) => setDoseAmount(e.target.value)}
                  />
                  <select
                    id="doseUnit"
                    value={doseUnit}
                    onChange={(e) => setDoseUnit(e.target.value as 'mg' | 'mL' | 'g')}
                  >
                    <option value="mg">mg</option>
                    <option value="mL">mL</option>
                    <option value="g">g</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="frequency">1日回数</label>
                <div className="input-group">
                  <select
                    id="frequency"
                    value={frequency}
                    onChange={(e) => setFrequency(parseInt(e.target.value))}
                  >
                    <option value="1">1回</option>
                    <option value="2">2回</option>
                    <option value="3">3回</option>
                    <option value="4">4回</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 濃度入力（mL/g選択時に表示） */}
            {showConcentration && (
              <div id="concentrationField" className="form-row">
                <div className="form-field">
                  <label htmlFor="concentration">濃度</label>
                  <div className="input-group">
                    <input
                      type="number"
                      id="concentration"
                      min="0"
                      step="0.1"
                      value={concentration}
                      onChange={(e) => setConcentration(parseFloat(e.target.value))}
                    />
                    <span className="unit" id="concentrationUnit">
                      {selectedDrug.concentrationUnit}
                    </span>
                  </div>
                  <small className="help-text">薬剤のデフォルト濃度が入力されています</small>
                </div>
              </div>
            )}
          </fieldset>

          {/* ルール選択（複数ある場合） */}
          {matchingRules.length > 1 && (
            <fieldset id="ruleSelection" className="form-group">
              <legend>
                <i className="fas fa-list-check"></i> 用量ルール選択
              </legend>
              <div id="ruleOptions" className="rule-options">
                {matchingRules.map((rule, index) => (
                  <label
                    key={rule.rule_id}
                    className={`rule-option ${selectedRuleIndex === index ? 'selected' : ''}`}
                    onClick={() => setSelectedRuleIndex(index)}
                  >
                    <input
                      type="radio"
                      name="rule"
                      value={index}
                      checked={selectedRuleIndex === index}
                      onChange={() => setSelectedRuleIndex(index)}
                    />
                    <div className="rule-option-content">
                      <div className="rule-option-title">
                        {rule.base_value} {rule.base_unit}
                      </div>
                      <div className="rule-option-desc">{rule.note || ''}</div>
                    </div>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          <div className="form-actions">
            <button type="button" id="backToStep1" className="btn btn-secondary" onClick={onBack}>
              <i className="fas fa-arrow-left"></i> 戻る
            </button>
            <button type="submit" id="calculateBtn" className="btn btn-primary btn-calculate">
              <i className="fas fa-calculator"></i> 推奨量を確認
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
