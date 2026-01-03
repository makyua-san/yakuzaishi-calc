import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Disclaimer } from './components/Disclaimer';
import { StepIndicator } from './components/StepIndicator';
import { DrugSelector } from './components/DrugSelector';
import { PatientInput } from './components/PatientInput';
import { ResultDisplay } from './components/ResultDisplay';
import { Footer } from './components/Footer';
import { drugs, drugRules, STORAGE_KEY } from './data/drugs';
import { calculate, ageToMonths } from './lib/calculator';
import type { Drug, DoseRule, CalcResult, PatientInputData } from './types';
import './App.css';

function App() {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null);
  const [lastResult, setLastResult] = useState<CalcResult | null>(null);
  const [rangePercent, setRangePercent] = useState(20);
  const [isRangeModified, setIsRangeModified] = useState(false);
  const [recentDrugs, setRecentDrugs] = useState<string[]>([]);
  const [lastInputData, setLastInputData] = useState<PatientInputData | null>(null);
  const [lastSelectedRule, setLastSelectedRule] = useState<DoseRule | null>(null);

  // 最近使った薬剤を読み込み
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setRecentDrugs(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('ローカルストレージからの読み込みに失敗:', e);
    }
  }, []);

  // 最近使った薬剤を保存
  const saveRecentDrugs = useCallback((drugs: string[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(drugs));
    } catch (e) {
      console.warn('ローカルストレージへの保存に失敗:', e);
    }
  }, []);

  // 最近使った薬剤に追加
  const addToRecentDrugs = useCallback(
    (drugId: string) => {
      const updated = [drugId, ...recentDrugs.filter((id) => id !== drugId)].slice(0, 5);
      setRecentDrugs(updated);
      saveRecentDrugs(updated);
    },
    [recentDrugs, saveRecentDrugs]
  );

  // 薬剤を選択
  const handleSelectDrug = useCallback(
    (drugId: string) => {
      const drug = drugs.find((d) => d.id === drugId);
      if (drug) {
        setSelectedDrug(drug);
        addToRecentDrugs(drugId);
        setCurrentStep(2);
      }
    },
    [addToRecentDrugs]
  );

  // 履歴をクリア
  const handleClearHistory = useCallback(() => {
    if (confirm('履歴をクリアしますか？')) {
      setRecentDrugs([]);
      saveRecentDrugs([]);
    }
  }, [saveRecentDrugs]);

  // 計算を実行
  const handleCalculate = useCallback(
    (data: PatientInputData, selectedRule: DoseRule) => {
      if (!selectedDrug) return;

      setLastInputData(data);
      setLastSelectedRule(selectedRule);

      const result = calculate({
        rule: selectedRule,
        weight: data.weight,
        ageMonths: ageToMonths(data.ageYears, data.ageMonths),
        frequency: data.frequency,
        prescribedAmount: data.doseAmount,
        prescribedUnit: data.doseUnit,
        concentration: data.concentration,
        rangePercent,
      });

      setLastResult(result);
      setCurrentStep(3);
    },
    [selectedDrug, rangePercent]
  );

  // 再計算
  const handleRecalculate = useCallback(() => {
    if (lastInputData && lastSelectedRule) {
      const result = calculate({
        rule: lastSelectedRule,
        weight: lastInputData.weight,
        ageMonths: ageToMonths(lastInputData.ageYears, lastInputData.ageMonths),
        frequency: lastInputData.frequency,
        prescribedAmount: lastInputData.doseAmount,
        prescribedUnit: lastInputData.doseUnit,
        concentration: lastInputData.concentration,
        rangePercent,
      });
      setLastResult(result);
    }
  }, [lastInputData, lastSelectedRule, rangePercent]);

  // レンジ変更
  const handleRangeChange = useCallback((percent: number) => {
    setRangePercent(percent);
    setIsRangeModified(true);
  }, []);

  // レンジリセット
  const handleResetRange = useCallback(() => {
    setRangePercent(20);
    setIsRangeModified(false);
    if (lastInputData && lastSelectedRule) {
      const result = calculate({
        rule: lastSelectedRule,
        weight: lastInputData.weight,
        ageMonths: ageToMonths(lastInputData.ageYears, lastInputData.ageMonths),
        frequency: lastInputData.frequency,
        prescribedAmount: lastInputData.doseAmount,
        prescribedUnit: lastInputData.doseUnit,
        concentration: lastInputData.concentration,
        rangePercent: 20,
      });
      setLastResult(result);
    }
  }, [lastInputData, lastSelectedRule]);

  // Step 1に戻る
  const handleBackToStep1 = useCallback(() => {
    setCurrentStep(1);
  }, []);

  // Step 2に戻る
  const handleBackToStep2 = useCallback(() => {
    setCurrentStep(2);
  }, []);

  // 新規計算
  const handleNewCalculation = useCallback(() => {
    setSelectedDrug(null);
    setLastResult(null);
    setLastInputData(null);
    setLastSelectedRule(null);
    setRangePercent(20);
    setIsRangeModified(false);
    setCurrentStep(1);
  }, []);

  return (
    <div className="app-container">
      <Header />
      <Disclaimer />

      <main className="main-content">
        <StepIndicator currentStep={currentStep} />

        {currentStep === 1 && (
          <DrugSelector
            drugs={drugs}
            recentDrugs={recentDrugs}
            onSelectDrug={handleSelectDrug}
            onClearHistory={handleClearHistory}
          />
        )}

        {currentStep === 2 && selectedDrug && (
          <PatientInput
            selectedDrug={selectedDrug}
            drugRules={drugRules[selectedDrug.id] || []}
            onBack={handleBackToStep1}
            onCalculate={handleCalculate}
          />
        )}

        {currentStep === 3 && lastResult && lastInputData && (
          <ResultDisplay
            result={lastResult}
            frequency={lastInputData.frequency}
            rangePercent={rangePercent}
            isRangeModified={isRangeModified}
            onRangeChange={handleRangeChange}
            onRecalculate={handleRecalculate}
            onResetRange={handleResetRange}
            onBack={handleBackToStep2}
            onNewCalculation={handleNewCalculation}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}

export default App;
