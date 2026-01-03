import { useState } from 'react';
import type { Drug } from '../types';

interface DrugSelectorProps {
  drugs: Drug[];
  recentDrugs: string[];
  onSelectDrug: (drugId: string) => void;
  onClearHistory: () => void;
}

export function DrugSelector({
  drugs,
  recentDrugs,
  onSelectDrug,
  onClearHistory,
}: DrugSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDrugs = searchQuery
    ? drugs.filter(
        (drug) =>
          drug.name.includes(searchQuery) ||
          drug.nameKana.includes(searchQuery) ||
          drug.genericName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : drugs;

  const recentDrugItems = recentDrugs
    .map((drugId) => drugs.find((d) => d.id === drugId))
    .filter((drug): drug is Drug => drug !== undefined);

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  return (
    <section id="step1" className="step-section active">
      <div className="card">
        <h2>
          <i className="fas fa-pills"></i> 薬剤を選択
        </h2>

        {/* 最近使った薬剤 */}
        {recentDrugItems.length > 0 && (
          <div id="recentDrugs" className="recent-drugs">
            <div className="recent-drugs-header">
              <h3>
                <i className="fas fa-history"></i> 最近使った薬剤
              </h3>
              <button type="button" className="btn btn-ghost btn-xs" onClick={onClearHistory}>
                <i className="fas fa-trash-alt"></i> 履歴クリア
              </button>
            </div>
            <div className="recent-drugs-list">
              {recentDrugItems.map((drug) => (
                <button
                  key={drug.id}
                  className="recent-drug-chip"
                  onClick={() => onSelectDrug(drug.id)}
                >
                  <i className="fas fa-clock"></i>
                  {drug.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 検索ボックス */}
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input
            type="text"
            id="drugSearch"
            placeholder="薬剤名を入力（例：アモキシシリン）"
            autoComplete="off"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button type="button" className="clear-btn" onClick={handleClearSearch}>
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>

        {/* 薬剤リスト */}
        <div id="drugList" className="drug-list">
          {filteredDrugs.length === 0 ? (
            <div className="no-results">
              <i className="fas fa-search"></i>
              <p>該当する薬剤が見つかりません</p>
            </div>
          ) : (
            filteredDrugs.map((drug) => (
              <div
                key={drug.id}
                className="drug-item"
                onClick={() => onSelectDrug(drug.id)}
              >
                <div className="drug-item-icon">
                  <i className="fas fa-pills"></i>
                </div>
                <div className="drug-item-info">
                  <div className="drug-item-name">{drug.name}</div>
                  <div className="drug-item-meta">
                    {drug.category} | {drug.formulation}
                  </div>
                </div>
                <div className="drug-item-arrow">
                  <i className="fas fa-chevron-right"></i>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
