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
                    <td><input type="text" value={editForm.name} onChange={e => handleChange(e, 'name')} /></td>
                    <td>
                      <select value={editForm.type} onChange={e => handleChange(e, 'type')}>
                        <option value="kesif">Kesif (Fabrika/Dane)</option>
                        <option value="kaba">Kaba (Ot/Saman/Silaj)</option>
                      </select>
                    </td>
                    <td><input type="number" step="0.1" value={editForm.dm} onChange={e => handleChange(e, 'dm')} /></td>
                    <td><input type="number" step="0.1" value={editForm.cp} onChange={e => handleChange(e, 'cp')} /></td>
                    <td><input type="number" step="0.1" value={editForm.me} onChange={e => handleChange(e, 'me')} /></td>
                    <td><input type="number" step="0.1" value={editForm.fb} onChange={e => handleChange(e, 'fb')} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={saveEdit}>Kaydet</button>
                        <button className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={cancelEdit}>İptal</button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{feed.name}</td>
                    <td>{feed.type === 'kaba' ? 'Kaba Yem' : 'Kesif Yem'}</td>
                    <td>{feed.dm}</td>
                    <td>{feed.cp}</td>
                    <td>{feed.me}</td>
                    <td>{feed.fb}</td>
                    <td>
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
