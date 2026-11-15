import { getStatus } from '../utils/status';

const Metric = ({ label, provided, required, unit, mode = 'min', decimals = 2 }) => {
  const status = getStatus(provided, required, mode);
  return (
    <div className={`metric ${status.level}`}>
      <div className="metric-top">
        <span className="metric-label">{label}</span>
        <span className="badge">{status.label}</span>
      </div>
      <div className="metric-value">
        {provided.toFixed(decimals)}
        <span className="metric-target"> / {required.toFixed(decimals)} {unit}</span>
      </div>
      <div
        className="progress"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(Math.min(100, status.percent))}
      >
        <div className="progress-fill" style={{ width: `${Math.min(100, status.percent)}%` }} />
      </div>
      <div className="metric-percent">%{status.percent.toFixed(0)}</div>
    </div>
  );
};

const NOTES = {
  besi: 'Besi hayvanlarında kesif yem oranı %80’lere çıkabilir; asidoz riskine karşı mutlaka karbonat (soda) eklenmelidir. Günlük canlı ağırlık artışı rasyonun enerjisiyle doğrudan ilişkilidir.',
  bos_duve: 'Boş düvelerde hızlı yağlanmayı önlemek için aşırı enerjiden kaçınılmalı, iskelet ve kas gelişimini destekleyen dengeli bir büyüme hedeflenmelidir.',
  sagmal: 'Sağmal ineklerde işkembe sağlığı ve süt yağının düşmemesi için kaba yem oranı KM bazında en az %40 olmalıdır. Yüksek süt verimi için enerji kadar protein kalitesi de önemlidir.',
  gebe: 'Gebeliğin son 3 ayında (kuru dönem) süt hummasını önlemek için kalsiyum alımı kısıtlanmalı, doğum felci ve ketozise karşı enerji dengesine dikkat edilmelidir.',
};

const ResultsDashboard = ({ requirements, totals, targetGcaa, estimatedProduction, animalType, theoryMeta, selectedTheory }) => {
  const hasRation = totals.dm > 0;
  const hasAnimal = requirements.energy > 0;
  const isLactating = animalType === 'sagmal' || animalType === 'gebe_sagmal';
  const isPregnant = animalType === 'gebe_sagmal' || animalType === 'kuru_gebe';
  const showTarget = animalType === 'besi' || animalType === 'bos_duve';

  const dmStatus = getStatus(totals.dm, requirements.targetDM, 'range');
  const balanced = hasRation && hasAnimal
    && totals.energy >= requirements.energy
    && totals.protein >= requirements.protein
    && totals.fiberPct >= requirements.minFiberPct
    && totals.nfcPct <= requirements.maxNfcPct
    && dmStatus.percent <= 110;

  return (
    <section className="panel panel-results" id="analiz" aria-labelledby="analiz-baslik">
      <div className="panel-head">
        <h2 className="panel-title" id="analiz-baslik">Rasyon Analizi</h2>
        <span className="chip">{theoryMeta.name}</span>
      </div>

      <div className="estimate">
        <div className="estimate-label">
          {isLactating ? 'Rasyonun desteklediği süt verimi' : 'Tahmini günlük canlı ağırlık artışı'}
        </div>
        {hasRation && hasAnimal ? (
          <div className="estimate-value">
            {isLactating ? estimatedProduction.milk.toFixed(1) : estimatedProduction.gcaa.toFixed(2)}
            <span className="estimate-unit">{isLactating ? 'L/gün' : 'kg/gün'}</span>
          </div>
        ) : (
          <div className="estimate-empty">
            {hasAnimal ? 'Tahmin için rasyona yem ekleyin.' : 'Tahmin için canlı ağırlık girin.'}
          </div>
        )}
        {showTarget && hasRation && hasAnimal && (
          <div className="estimate-sub">Hedef: {targetGcaa || 0} kg/gün</div>
        )}
      </div>

      <div className="metric-grid">
        <Metric label={theoryMeta.energyLabel} provided={totals.energy} required={requirements.energy} unit={theoryMeta.energyUnit} />
        <Metric
          label={theoryMeta.proteinLabel}
          provided={totals.protein}
          required={requirements.protein}
          unit={theoryMeta.proteinUnit}
          decimals={selectedTheory === 'nrc' ? 2 : 0}
        />
        <Metric label="Kuru Madde (KM)" provided={totals.dm} required={requirements.targetDM} unit="kg" mode="range" />
        <Metric label="Ham Selüloz (en az)" provided={totals.fiberPct} required={requirements.minFiberPct} unit="% KM" decimals={1} />
        <Metric label="Nişasta + Şeker (en fazla)" provided={totals.nfcPct} required={requirements.maxNfcPct} unit="% KM" mode="max" decimals={1} />
      </div>

      <dl className="fact-list">
        <div>
          <dt>Kesif yem oranı (KM)</dt>
          <dd>%{totals.kesifRatio.toFixed(1)}</dd>
        </div>
        <div>
          <dt>Soda (sodyum bikarbonat)</dt>
          <dd className={totals.recommendedSoda > 0 ? 'text-warning' : ''}>
            {totals.recommendedSoda > 0 ? `${totals.recommendedSoda.toFixed(0)} g/gün önerilir` : 'Gerekmiyor'}
          </dd>
        </div>
        <div>
          <dt>Enerji yoğunluğu</dt>
          <dd>{hasRation ? `${totals.energyDensity.toFixed(2)} ${theoryMeta.energyUnit} / kg KM` : '—'}</dd>
        </div>
        <div>
          <dt>Ham protein (KM'de)</dt>
          <dd>{hasRation ? `%${totals.cpPct.toFixed(1)}` : '—'}</dd>
        </div>
        {selectedTheory === 'inra' && totals.pdie !== undefined && (
          <div>
            <dt>PDIE / PDIN</dt>
            <dd>
              {totals.pdie.toFixed(0)} g / {totals.pdin.toFixed(0)} g
              {hasRation && <> · sınırlayıcı: {totals.pdie <= totals.pdin ? 'PDIE (enerji)' : 'PDIN (azot)'}</>}
            </dd>
          </div>
        )}
        {selectedTheory === 'cncps' && totals.syncScore !== undefined && (
          <>
            <div>
              <dt>Senkronizasyon skoru</dt>
              <dd className={hasRation && totals.syncScore < 40 ? 'text-danger' : hasRation && totals.syncScore < 70 ? 'text-warning' : ''}>
                {hasRation ? `%${totals.syncScore.toFixed(0)}` : '—'}
              </dd>
            </div>
            <div>
              <dt>Ort. sindirim hızı (kd)</dt>
              <dd>%{(totals.avgKd || 0).toFixed(1)} / saat</dd>
            </div>
            <div>
              <dt>Ort. NDF sindirilebilirliği</dt>
              <dd>%{(totals.avgNdfd || 0).toFixed(1)}</dd>
            </div>
          </>
        )}
      </dl>

      {hasRation && hasAnimal && (
        <div className="alerts">
          {totals.energy < requirements.energy * 0.9 && (
            <div className="alert alert-warning">
              <strong>Enerji yetersiz.</strong> {theoryMeta.energyLabel} hedef gereksinimin altında kalıyor.
            </div>
          )}
          {totals.protein < requirements.protein * 0.9 && (
            <div className="alert alert-warning">
              <strong>Protein yetersiz.</strong> {theoryMeta.proteinLabel} hedefin altında. Soya veya pamuk tohumu küspesi eklemeyi düşünebilirsiniz.
            </div>
          )}
          {totals.fiberPct < requirements.minFiberPct && (
            <div className="alert alert-danger">
              <strong>Kaba yem yetersiz.</strong> Ham selüloz KM'nin %{totals.fiberPct.toFixed(1)}'i; en az %{requirements.minFiberPct} olmalı. İşkembe sağlığı için saman, yonca veya silaj oranını artırın.
            </div>
          )}
          {totals.nfcPct > requirements.maxNfcPct && (
            <div className={`alert ${totals.nfcPct > requirements.maxNfcPct * 1.2 ? 'alert-danger' : 'alert-warning'}`}>
              <strong>Asidoz riski.</strong> Nişasta + şeker KM'nin %{totals.nfcPct.toFixed(1)}'i; bu hayvan için üst sınır %{requirements.maxNfcPct}. Tahıl oranını azaltın veya kaba yemi artırın.
            </div>
          )}
          {dmStatus.percent > 110 && (
            <div className="alert alert-warning">
              <strong>Kuru madde fazla.</strong> Rasyon, hayvanın tahmini tüketim kapasitesinin (%{dmStatus.percent.toFixed(0)}) üzerinde; hayvan bu miktarı yiyemeyebilir.
            </div>
          )}
          {selectedTheory === 'cncps' && totals.syncScore < 40 && (
            <div className="alert alert-warning">
              <strong>Düşük senkronizasyon.</strong> Yemlerin sindirim hızları (kd) çok farklı; enerji ve protein işkembede eşzamanlı çözülemeyebilir.
            </div>
          )}
          {balanced && (
            <div className="alert alert-success">
              <strong>Rasyon dengeli ({theoryMeta.name}).</strong> Yaşama, verim ve gebelik gereksinimleri karşılanıyor.
            </div>
          )}
        </div>
      )}

      <p className="note">
        {isLactating ? NOTES.sagmal : NOTES[animalType] || ''}
        {isPregnant && <> {NOTES.gebe}</>}
      </p>
    </section>
  );
};

export default ResultsDashboard;
