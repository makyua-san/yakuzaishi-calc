interface StepIndicatorProps {
  currentStep: 1 | 2 | 3;
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  const steps = [
    { number: 1, label: '薬剤選択' },
    { number: 2, label: '患者・処方入力' },
    { number: 3, label: '結果確認' },
  ];

  return (
    <div className="step-indicator">
      {steps.map((step, index) => (
        <div key={step.number}>
          <div
            className={`step ${
              currentStep === step.number
                ? 'active'
                : currentStep > step.number
                  ? 'completed'
                  : ''
            }`}
            data-step={step.number}
          >
            <span className="step-number">{step.number}</span>
            <span className="step-label">{step.label}</span>
          </div>
          {index < steps.length - 1 && <div className="step-connector"></div>}
        </div>
      ))}
    </div>
  );
}
