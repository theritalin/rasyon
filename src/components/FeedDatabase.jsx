import React, { useState } from 'react';

const FeedDatabase = ({ feedsDb, onUpdateFeed, onAddFeed }) => {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);

  const startEdit = (feed) => {
    setEditingId(feed.id);
    setEditForm({ ...feed });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const saveEdit = () => {
    onUpdateFeed(editForm);
    cancelEdit();
  };

  const handleChange = (e, field) => {
    let val = e.target.value;
    if (field !== 'name' && field !== 'type') val = Number(val);
    setEditForm(prev => ({ ...prev, [field]: val }));
  };

  return (
    <div className="glass-panel">
      <div className="flex-between mb-4">
        <h2 className="panel-title" style={{ margin: 0, border: 'none', padding: 0 }}>
          <span>📚</span> Yem Kaynakları (Veritabanı)
        </h2>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          * Değerler KM (Kuru Madde) bazındadır
        </span>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Yem Adı</th>
              <th>Tür</th>
              <th>KM %</th>
              <th>Protein %</th>
              <th>ME (Mcal)</th>
              <th>Lif %</th>
              <th>İşlem</th>
            </tr>
          </thead>
          <tbody>
            {feedsDb.map(feed => (
              <tr key={feed.id}>
                {editingId === feed.id ? (
                  <>
                    <td data-label="Yem Adı"><input type="text" value={editForm.name} onChange={e => handleChange(e, 'name')} /></td>
                    <td data-label="Tür">
                      <select value={editForm.type} onChange={e => handleChange(e, 'type')}>
                        <option value="kesif">Kesif (Fabrika/Dane)</option>
                        <option value="kaba">Kaba (Ot/Saman/Silaj)</option>
                      </select>
                    </td>
                    <td data-label="KM %"><input type="number" step="0.1" value={editForm.dm} onChange={e => handleChange(e, 'dm')} /></td>
                    <td data-label="Protein %"><input type="number" step="0.1" value={editForm.cp} onChange={e => handleChange(e, 'cp')} /></td>
                    <td data-label="ME (Mcal)"><input type="number" step="0.1" value={editForm.me} onChange={e => handleChange(e, 'me')} /></td>
                    <td data-label="Lif %"><input type="number" step="0.1" value={editForm.fb} onChange={e => handleChange(e, 'fb')} /></td>
                    <td data-label="İşlem">
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={saveEdit}>Kaydet</button>
                        <button className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={cancelEdit}>İptal</button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td data-label="Yem Adı">{feed.name}</td>
                    <td data-label="Tür">{feed.type === 'kaba' ? 'Kaba Yem' : 'Kesif Yem'}</td>
                    <td data-label="KM %">{feed.dm}</td>
                    <td data-label="Protein %">{feed.cp}</td>
                    <td data-label="ME (Mcal)">{feed.me}</td>
                    <td data-label="Lif %">{feed.fb}</td>
                    <td data-label="İşlem">
                      <button className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => startEdit(feed)}>Düzenle</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FeedDatabase;
