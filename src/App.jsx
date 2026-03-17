import React, { useState, useMemo } from 'react';
import { initialFeeds } from './data/feeds';
import { convertToDM } from './utils/calculations';
import { getTheoryFunctions, THEORY_META } from './utils/theories';
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

  const [selectedTheory, setSelectedTheory] = useState(() => {
    const saved = localStorage.getItem('rasyon_theory');
    return saved || 'nrc';
  });
  
  const [feedsDb, setFeedsDb] = useState(() => {
    const saved = localStorage.getItem('rasyon_feedsDb');
    if (saved) {
      // Merge saved feeds with new fields from initialFeeds
      const savedFeeds = JSON.parse(saved);
      return savedFeeds.map(sf => {
        const initial = initialFeeds.find(f => f.id === sf.id);
        if (initial) {
          return { ...initial, ...sf, ufl: sf.ufl ?? initial.ufl, ufb: sf.ufb ?? initial.ufb, pdie: sf.pdie ?? initial.pdie, pdin: sf.pdin ?? initial.pdin, kd: sf.kd ?? initial.kd, ndfd: sf.ndfd ?? initial.ndfd };
        }
        return { ufl: 0.8, ufb: 0.8, pdie: 80, pdin: 80, kd: 10, ndfd: 40, ...sf };
      });
    }
    return initialFeeds;
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
    localStorage.setItem('rasyon_theory', selectedTheory);
  }, [selectedTheory]);

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

  // Get theory-specific functions
  const theoryFns = useMemo(() => getTheoryFunctions(selectedTheory), [selectedTheory]);

  // Derived state
  const requirements = useMemo(
    () => theoryFns.calculateRequirements(weight, targetGcaa),
    [weight, targetGcaa, theoryFns]
  );
  const rationTotals = useMemo(
    () => theoryFns.calculateRationTotals(rationItems, feedsDb),
    [rationItems, feedsDb, theoryFns]
  );
  const estimatedGcaa = useMemo(
    () => theoryFns.estimateGCAA(weight, rationTotals.energy, rationTotals.protein),
    [weight, rationTotals.energy, rationTotals.protein, theoryFns]
  );

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
            selectedTheory={selectedTheory}
            setSelectedTheory={setSelectedTheory}
          />
          <ResultsDashboard 
            requirements={requirements} 
            totals={rationTotals} 
            targetGcaa={targetGcaa}
            estimatedGcaa={estimatedGcaa}
            theoryMeta={theoryFns.meta}
            selectedTheory={selectedTheory}
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
            theoryMeta={theoryFns.meta}
            selectedTheory={selectedTheory}
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
