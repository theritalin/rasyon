import { useEffect, useMemo, useState } from 'react';
import { initialFeeds } from './data/feeds';
import { toNum } from './utils/calculations';
import { getTheoryFunctions, THEORY_META } from './utils/theories';
import InputSection from './components/InputSection';
import FeedDatabase from './components/FeedDatabase';
import RationBuilder from './components/RationBuilder';
import ResultsDashboard from './components/ResultsDashboard';
import SummaryBar from './components/SummaryBar';

// localStorage erişimi gizli sekmede veya bozuk veride hata fırlatabilir; uygulama yine de açılmalı.
const loadText = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key);
    return saved === null ? fallback : saved;
  } catch {
    return fallback;
  }
};

const loadJson = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key);
    return saved === null ? fallback : JSON.parse(saved);
  } catch {
    return fallback;
  }
};

const usePersisted = (key, value, serialize = String) => {
  useEffect(() => {
    try {
      localStorage.setItem(key, serialize(value));
    } catch {
      // Depolama kapalı veya dolu: kaydetmeden devam et.
    }
  }, [key, value, serialize]);
};

const DEFAULT_FEED_IDS = new Set(initialFeeds.map(f => f.id));
const isCustomFeed = (id) => !DEFAULT_FEED_IDS.has(id);

// Kayıtlı yemleri, sonradan eklenen alanlar ve yeni varsayılan yemlerle birleştirir.
const loadFeeds = () => {
  const saved = loadJson('rasyon_feedsDb', null);
  if (!Array.isArray(saved)) return initialFeeds;
  const merged = saved
    .filter(sf => sf && sf.id !== undefined)
    .map(sf => {
      const initial = initialFeeds.find(f => f.id === sf.id);
      return initial
        ? { ...initial, ...sf }
        : { ufl: 0.8, ufb: 0.8, pdie: 80, pdin: 80, kd: 10, ndfd: 40, cb: 0, ...sf };
    });
  initialFeeds.forEach(initial => {
    if (!merged.some(f => f.id === initial.id)) merged.push(initial);
  });
  return merged;
};

const loadRation = () => {
  const saved = loadJson('rasyon_rationItems', []);
  return Array.isArray(saved) ? saved.filter(r => r && r.id && r.feedId !== undefined) : [];
};

function App() {
  const [weight, setWeight] = useState(() => loadText('rasyon_weight', '500'));
  const [targetGcaa, setTargetGcaa] = useState(() => loadText('rasyon_targetGcaa', '1.5'));
  const [animalType, setAnimalType] = useState(() => loadText('rasyon_animalType', 'besi'));
  const [milkYield, setMilkYield] = useState(() => loadText('rasyon_milkYield', '20'));
  const [milkFat, setMilkFat] = useState(() => loadText('rasyon_milkFat', '3.5'));
  const [pregnancyPeriod, setPregnancyPeriod] = useState(() => loadText('rasyon_pregnancyPeriod', 'ilk_6_ay'));
  const [selectedTheory, setSelectedTheory] = useState(() => {
    const saved = loadText('rasyon_theory', 'nrc');
    return THEORY_META[saved] ? saved : 'nrc';
  });
  const [feedsDb, setFeedsDb] = useState(loadFeeds);
  const [rationItems, setRationItems] = useState(loadRation);

  usePersisted('rasyon_weight', weight);
  usePersisted('rasyon_targetGcaa', targetGcaa);
  usePersisted('rasyon_animalType', animalType);
  usePersisted('rasyon_milkYield', milkYield);
  usePersisted('rasyon_milkFat', milkFat);
  usePersisted('rasyon_pregnancyPeriod', pregnancyPeriod);
  usePersisted('rasyon_theory', selectedTheory);
  usePersisted('rasyon_feedsDb', feedsDb, JSON.stringify);
  usePersisted('rasyon_rationItems', rationItems, JSON.stringify);

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

  const handleDeleteFeed = (feedId) => {
    setFeedsDb(prev => prev.filter(f => f.id !== feedId));
    setRationItems(prev => prev.filter(r => r.feedId !== feedId));
  };

  const handleResetFeeds = () => {
    if (window.confirm('Varsayılan yemlerin besin değerleri ilk haline dönecek. Eklediğiniz yemler ve fiyatlar korunur. Devam edilsin mi?')) {
      setFeedsDb(prev => prev.map(f => {
        const initial = initialFeeds.find(i => i.id === f.id);
        return initial ? { ...initial, price: f.price } : f;
      }));
    }
  };

  const handleAddToRation = (feedId, amount) => {
    setRationItems(prev => {
      if (prev.some(r => r.feedId === feedId)) {
        // Miktar düzenlenirken metin olarak tutulur; toplarken sayıya çevrilmezse "5" + 2 = "52" olur.
        return prev.map(r => r.feedId === feedId
          ? { ...r, amount: Math.round((toNum(r.amount) + amount) * 100) / 100 }
          : r);
      }
      return [...prev, { id: `${Date.now()}-${feedId}`, feedId, amount }];
    });
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
      weight: toNum(weight),
      targetGcaa: toNum(targetGcaa),
      animalType,
      milkYield: toNum(milkYield),
      milkFat: toNum(milkFat) || 3.5,
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
      weight: toNum(weight),
      energy: rationTotals.energy, 
      protein: rationTotals.protein,
      animalType,
      milkFat: toNum(milkFat) || 3.5,
      pregnancyPeriod
    }),
    [weight, rationTotals.energy, rationTotals.protein, animalType, milkFat, pregnancyPeriod, theoryFns]
  );

  const totalCost = useMemo(
    () => rationItems.reduce((sum, item) => {
      const feed = feedsDb.find(f => f.id === item.feedId);
      return sum + toNum(item.amount) * toNum(feed?.price);
    }, 0),
    [rationItems, feedsDb]
  );

  return (
    <div className="app">
      <header className="app-header">
        <h1>Ziraat Besi Rasyon</h1>
        <p>Büyükbaş hayvan besleme ve rasyon hazırlama programı</p>
      </header>

      <main className="layout">
        <div className="col col-side">
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

        <div className="col col-main">
          <RationBuilder
            feedsDb={feedsDb}
            rationItems={rationItems}
            onAdd={handleAddToRation}
            onUpdateAmount={handleUpdateRationAmount}
            onUpdateFeedPrice={handleUpdateFeedPrice}
            onRemove={handleRemoveFromRation}
            onClear={handleClearRation}
            totals={rationTotals}
            totalCost={totalCost}
            theoryMeta={theoryFns.meta}
            selectedTheory={selectedTheory}
          />
          <FeedDatabase
            feedsDb={feedsDb}
            isCustomFeed={isCustomFeed}
            onUpdateFeed={handleUpdateFeed}
            onAddFeed={handleAddFeed}
            onDeleteFeed={handleDeleteFeed}
            onResetFeeds={handleResetFeeds}
          />
        </div>
      </main>

      <footer className="app-footer">
        <p>Sitemizde verilen bilgiler tamamen tahmini hesaplamalar olup yatırım tavsiyesi değildir.</p>
        <p>Soru ve öneri için: <a href="mailto:ziraatbesi@gmail.com">ziraatbesi@gmail.com</a></p>
      </footer>

      <SummaryBar
        requirements={requirements}
        totals={rationTotals}
        totalCost={totalCost}
        theoryMeta={theoryFns.meta}
      />
    </div>
  );
}

export default App;
