import React, { useState, useMemo } from 'react';
import { initialFeeds } from './data/feeds';
import { calculateRequirements, calculateRationTotals, estimateGCAA } from './utils/calculations';
import InputSection from './components/InputSection';
import FeedDatabase from './components/FeedDatabase';
import RationBuilder from './components/RationBuilder';
import ResultsDashboard from './components/ResultsDashboard';

function App() {
  const [weight, setWeight] = useState(() => {
    const saved = localStorage.getItem('rasyon_weight');
    return saved ? Number(saved) : 500;
  });
  
  const [targetGcaa, setTargetGcaa] = useState(() => {
    const saved = localStorage.getItem('rasyon_targetGcaa');
    return saved ? Number(saved) : 1.5;
  });
  
  const [feedsDb, setFeedsDb] = useState(() => {
    const saved = localStorage.getItem('rasyon_feedsDb');
    return saved ? JSON.parse(saved) : initialFeeds;
  });
  
  const [rationItems, setRationItems] = useState(() => {
    const saved = localStorage.getItem('rasyon_rationItems');
    return saved ? JSON.parse(saved) : [];
  });

  // Save to localStorage when state changes
  React.useEffect(() => {
    localStorage.setItem('rasyon_weight', weight);
  }, [weight]);

  React.useEffect(() => {
    localStorage.setItem('rasyon_targetGcaa', targetGcaa);
  }, [targetGcaa]);

  React.useEffect(() => {
    localStorage.setItem('rasyon_feedsDb', JSON.stringify(feedsDb));
  }, [feedsDb]);

  React.useEffect(() => {
    localStorage.setItem('rasyon_rationItems', JSON.stringify(rationItems));
  }, [rationItems]);

  const handleClearRation = () => {
    if (window.confirm('Mevcut rasyonu tamamen silmek istediğinize emin misiniz?')) {
      setRationItems([]);
    }
  };

  const handleUpdateFeed = (updatedFeed) => {
    setFeedsDb(prev => prev.map(f => f.id === updatedFeed.id ? updatedFeed : f));
  };
  
  const handleAddFeed = (newFeed) => {
    setFeedsDb(prev => [...prev, { ...newFeed, id: Date.now() }]);
  };

  const handleAddToRation = (feedId, amount) => {
    // Check if feed already in ration
    const existing = rationItems.find(r => r.feedId === feedId);
    if (existing) {
      setRationItems(prev => prev.map(r => r.feedId === feedId ? { ...r, amount: r.amount + amount } : r));
    } else {
      setRationItems(prev => [...prev, { id: Date.now().toString(), feedId, amount }]);
    }
  };

  const handleUpdateRationAmount = (id, newAmount) => {
    setRationItems(prev => prev.map(r => r.id === id ? { ...r, amount: newAmount } : r));
  };

  const handleRemoveFromRation = (id) => {
    setRationItems(prev => prev.filter(r => r.id !== id));
  };

  // Derived state
  const requirements = useMemo(() => calculateRequirements(weight, targetGcaa), [weight, targetGcaa]);
  const rationTotals = useMemo(() => calculateRationTotals(rationItems, feedsDb), [rationItems, feedsDb]);
  const estimatedGcaa = useMemo(() => estimateGCAA(weight, rationTotals.me, rationTotals.cp), [weight, rationTotals.me, rationTotals.cp]);

  return (
    <div className="app-container">
      <header>
        <h1>Ziraat Besi Rasyon</h1>
        <p>Büyükbaş Hayvan Besleme ve Rasyon Hazırlama Programı</p>
      </header>
      
      <div className="main-grid">
        <div className="left-column">
          <InputSection 
            weight={weight} 
            setWeight={setWeight} 
            targetGcaa={targetGcaa} 
            setTargetGcaa={setTargetGcaa} 
          />
          <ResultsDashboard 
            requirements={requirements} 
            totals={rationTotals} 
            targetGcaa={targetGcaa}
            estimatedGcaa={estimatedGcaa}
          />
        </div>
        
        <div className="right-column">
          <RationBuilder 
            feedsDb={feedsDb} 
            rationItems={rationItems}
            onAdd={handleAddToRation}
            onUpdateAmount={handleUpdateRationAmount}
            onRemove={handleRemoveFromRation}
            onClear={handleClearRation}
            totals={rationTotals}
          />
          <FeedDatabase 
            feedsDb={feedsDb} 
            onUpdateFeed={handleUpdateFeed} 
            onAddFeed={handleAddFeed}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
