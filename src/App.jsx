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

  const [animalType, setAnimalType] = useState(() => {
    return localStorage.getItem('rasyon_animalType') || 'besi';
  });

  const [milkYield, setMilkYield] = useState(() => {
    const saved = localStorage.getItem('rasyon_milkYield');
    return saved ? Number(saved) : 20;
  });

  const [milkFat, setMilkFat] = useState(() => {
    const saved = localStorage.getItem('rasyon_milkFat');
    return saved ? Number(saved) : 3.5;
  });

  const [pregnancyPeriod, setPregnancyPeriod] = useState(() => {
    return localStorage.getItem('rasyon_pregnancyPeriod') || 'ilk_6_ay';
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
      const mergedFeeds = savedFeeds.map(sf => {
        const initial = initialFeeds.find(f => f.id === sf.id);
        if (initial) {
          return { ...initial, ...sf, ufl: sf.ufl ?? initial.ufl, ufb: sf.ufb ?? initial.ufb, pdie: sf.pdie ?? initial.pdie, pdin: sf.pdin ?? initial.pdin, kd: sf.kd ?? initial.kd, ndfd: sf.ndfd ?? initial.ndfd };
        }
        return { ufl: 0.8, ufb: 0.8, pdie: 80, pdin: 80, kd: 10, ndfd: 40, ...sf };
      });
      
      // Add any new feeds from initialFeeds that aren't in savedFeeds
      initialFeeds.forEach(initial => {
        if (!mergedFeeds.find(f => f.id === initial.id)) {
          mergedFeeds.push(initial);
        }
      });
      
      return mergedFeeds;
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
    localStorage.setItem('rasyon_animalType', animalType);
  }, [animalType]);

  React.useEffect(() => {
    localStorage.setItem('rasyon_milkYield', milkYield);
  }, [milkYield]);

  React.useEffect(() => {
    localStorage.setItem('rasyon_milkFat', milkFat);
  }, [milkFat]);

  React.useEffect(() => {
    localStorage.setItem('rasyon_pregnancyPeriod', pregnancyPeriod);
  }, [pregnancyPeriod]);

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

  const handleUpdateFeedPrice = (feedId, price) => {
    setFeedsDb(prev => prev.map(f => f.id === feedId ? { ...f, price } : f));
  };

  // Get theory-specific functions
  const theoryFns = useMemo(() => getTheoryFunctions(selectedTheory), [selectedTheory]);

  // Derived state
  const requirements = useMemo(
    () => theoryFns.calculateRequirements({
      weight: Number(weight) || 0, 
      targetGcaa: Number(targetGcaa) || 0,
      animalType,
      milkYield: Number(milkYield) || 0,
      milkFat: Number(milkFat) || 3.5,
      pregnancyPeriod
    }),
    [weight, targetGcaa, animalType, milkYield, milkFat, pregnancyPeriod, theoryFns]
  );
  
  const rationTotals = useMemo(
    () => theoryFns.calculateRationTotals(rationItems, feedsDb),
    [rationItems, feedsDb, theoryFns]
  );
  
  const estimatedProduction = useMemo(
    () => theoryFns.estimateProduction({
      weight: Number(weight) || 0, 
      energy: rationTotals.energy, 
      protein: rationTotals.protein,
      animalType,
      milkFat: Number(milkFat) || 3.5,
      pregnancyPeriod
    }),
    [weight, rationTotals.energy, rationTotals.protein, animalType, milkFat, pregnancyPeriod, theoryFns]
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
            animalType={animalType}
            setAnimalType={setAnimalType}
            milkYield={milkYield}
            setMilkYield={setMilkYield}
            milkFat={milkFat}
            setMilkFat={setMilkFat}
            pregnancyPeriod={pregnancyPeriod}
            setPregnancyPeriod={setPregnancyPeriod}
            selectedTheory={selectedTheory}
            setSelectedTheory={setSelectedTheory}
          />
          <ResultsDashboard 
            requirements={requirements} 
            totals={rationTotals} 
            targetGcaa={targetGcaa}
            estimatedProduction={estimatedProduction}
            animalType={animalType}
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
            onUpdateFeedPrice={handleUpdateFeedPrice}
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
           <div className="footer">
        <p><b>Sitemizde verilen bilgiler tamamen tahmini hesaplamalar olup yatırım tavsiyesi değildir.</b></p>
        <p><b>Soru ve öneri için: ziraatbesi@gmail.com</b></p>

      </div>
    </div>
  );
}

export default App;
