import { useState } from 'react';
import type { CalcResult } from '../types';
import { VERDICT } from '../types';

interface ResultDisplayProps {
  result: CalcResult;
  frequency: number;
  rangePercent: number;
  isRangeModified: boolean;
  onRangeChange: (percent: number) => void;
  onRecalculate: () => void;
  onResetRange: () => void;
  onBack: () => void;
  onNewCalculation: () => void;
}

export function ResultDisplay({
  result,
  frequency,
  rangePercent,
  isRangeModified,
  onRangeChange,
  onRecalculate,
  onResetRange,
  onBack,
  onNewCalculation,
}: ResultDisplayProps) {
  const [localRangePercent, setLocalRangePercent] = useState(rangePercent);

  const handleRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (value >= 5 && value <= 50) {
      setLocalRangePercent(value);
      onRangeChange(value);
    }
  };

  const getStatusConfig = () => {
    if (!result.hasPrescribedAmount) {
      return {
        class: 'info',
        icon: 'fa-info-circle',
        title: '推奨用量を表示中',
        message: '処方量を入力すると比較判定ができます',
      };
    }

    switch (result.verdict) {
      case VERDICT.OK:
        return {
          class: 'ok',
          icon: 'fa-circle-check',
          title: '適正',
          message: result.message,
        };
      case VERDICT.WARNING:
        return {
          class: 'warning',
          icon: 'fa-triangle-exclamation',
          title: '注意',
          message: result.message,
        };
      case VERDICT.DANGER:
        return {
          class: 'danger',
          icon: 'fa-circle-xmark',
          title: '要確認',
          message: result.message,
        };
      default:
        return {
          class: 'info',
          icon: 'fa-info-circle',
          title: '',
          message: '',
        };
    }
  };

  const getHighlightClass = () => {
    switch (result.verdict) {
      case VERDICT.OK:
        return 'highlight-ok';
      case VERDICT.WARNING:
        return 'highlight-warning';
      case VERDICT.DANGER:
        return 'highlight-danger';
      default:
        return '';
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <section id="step3" className="step-section active">
      <div className="card">
        <h2>
          <i className="fas fa-clipboard-check"></i> 判定結果
        </h2>

        {/* 判定ステータス */}
        <div id="resultStatus" className={`result-status ${statusConfig.class}`}>
          <div className="result-status-icon">
            <i className={`fas ${statusConfig.icon}`}></i>
          </div>
          <div className="result-status-content">
            <div className="result-status-title">{statusConfig.title}</div>
            <div className="result-status-message">{statusConfig.message}</div>
            {result.hasPrescribedAmount && result.details.length > 0 && (
              <div className="result-status-details">
                {result.details.map((d, i) => (
                  <span key={i}>・{d}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 許容レンジ調整 */}
        <div id="rangeAdjustment" className="range-adjustment">
          <div className="range-header">
            <label htmlFor="rangePercent">
              <i className="fas fa-sliders-h"></i> 許容レンジ調整
            </label>
            {isRangeModified && (
              <span id="rangeIndicator" className="range-indicator">
                <i className="fas fa-exclamation-circle"></i> ユーザー調整中
              </span>
            )}
          </div>
          <div className="range-controls">
            <span>±</span>
            <input
              type="number"
              id="rangePercent"
              min="5"
              max="50"
              step="5"
              value={localRangePercent}
              onChange={handleRangeChange}
            />
            <span>%</span>
            <button type="button" id="recalculateBtn" className="btn btn-sm" onClick={onRecalculate}>
              再計算
            </button>
            <button
              type="button"
              id="resetRangeBtn"
              className="btn btn-sm btn-ghost"
              onClick={onResetRange}
            >
              リセット
            </button>
          </div>
          {result.hasExplicitRange && (
            <small id="rangeNote" className="range-note">
              ※ CSVに明示レンジが定義されているため、±%は参考値です
            </small>
          )}
        </div>

        {/* 比較表 */}
        <div id="comparisonTable" className="comparison-table">
          {result.hasPrescribedAmount && (
            <>
              <div className="comparison-row">
                <div className="comparison-label">処方1回量</div>
                <div className={`comparison-value ${getHighlightClass()}`}>
                  {result.prescribedDoseMg.toFixed(1)} mg
                </div>
              </div>
              <div className="comparison-row">
                <div className="comparison-label">処方1日量</div>
                <div className="comparison-value">
                  {result.prescribedDailyMg.toFixed(1)} mg/日 ({frequency}回)
                </div>
              </div>
            </>
          )}
          <div className="comparison-row">
            <div className="comparison-label">推奨1回量</div>
            <div className="comparison-value highlight-primary">
              {result.baseDoseMg.toFixed(1)} mg
            </div>
          </div>
          <div className="comparison-row">
            <div className="comparison-label">推奨レンジ(1回)</div>
            <div className="comparison-value">
              {result.doseMin.toFixed(1)} 〜 {result.doseMax.toFixed(1)} mg
            </div>
          </div>
          <div className="comparison-row">
            <div className="comparison-label">推奨1日量</div>
            <div className="comparison-value">{result.baseDailyMg.toFixed(1)} mg/日</div>
          </div>
          {result.maxDailyMg && (
            <div className="comparison-row">
              <div className="comparison-label">最大1日量</div>
              <div
                className={`comparison-value ${
                  result.hasPrescribedAmount && result.exceedsMaxDaily ? 'highlight-danger' : ''
                }`}
              >
                {result.maxDailyMg} mg/日
                {result.hasPrescribedAmount && result.exceedsMaxDaily && ' ⚠️ 超過'}
              </div>
            </div>
          )}
        </div>

        {/* 計算過程（折りたたみ） */}
        <details className="calculation-details">
          <summary>
            <i className="fas fa-calculator"></i> 計算過程を表示
          </summary>
          <div id="calculationSteps" className="calculation-steps">
            {result.steps.map((step, index) => (
              <div key={index} className="calc-step">
                <div className="calc-step-number">{index + 1}</div>
                <div className="calc-step-content">
                  <div className="calc-step-label">{step.label}</div>
                  <div className="calc-step-expr">{step.expr}</div>
                  <div className="calc-step-value">= {step.value}</div>
                </div>
              </div>
            ))}
          </div>
        </details>

        {/* 根拠情報 */}
        <div id="sourceInfo" className="source-info">
          <h3>
            <i className="fas fa-book"></i> 根拠情報
          </h3>
          <div className="source-info-item">
            <strong>適用ルール:</strong> {result.appliedRuleId}
          </div>
          <div className="source-info-item">
            <strong>出典:</strong> {result.source.title || '－'}
          </div>
          <div className="source-info-item">
            <strong>版:</strong> {result.source.version || '－'}
          </div>
          <div className="source-info-item">
            <strong>参照:</strong> {result.source.ref || '－'}
          </div>
          {result.source.note && (
            <div className="source-note">
              <i className="fas fa-info-circle"></i> {result.source.note}
            </div>
          )}
        </div>

        <div className="form-actions">
          <button type="button" id="backToStep2" className="btn btn-secondary" onClick={onBack}>
            <i className="fas fa-arrow-left"></i> 戻る
          </button>
          <button
            type="button"
            id="newCalculation"
            className="btn btn-primary"
            onClick={onNewCalculation}
          >
            <i className="fas fa-redo"></i> 新規計算
          </button>
        </div>
      </div>
    </section>
  );
}
