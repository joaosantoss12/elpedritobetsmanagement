// src/App.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import './App.css';

type Seller = 'pedrito' | 'goja' | 'tipster';

interface BetData {
  id: number;
  game: string;
  bet: string;
  odd: string;
  analysis: string;
  active: boolean;
  price: number | string;
  image_url: string | null;
  markets: string;
  seller: Seller;
}

const TABS: { key: Seller; label: string; color: string }[] = [
  { key: 'pedrito', label: 'El Pedrito', color: '#EAB308' },
  { key: 'goja', label: 'Goja', color: '#38BDF8' },
  { key: 'tipster', label: 'Tipster do Pedrito', color: '#A78BFA' },
];

function SellerForm({ seller, color }: { seller: Seller; color: string }) {
  const [formData, setFormData] = useState<Partial<BetData>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seller]);

  const fetchData = async () => {
    setLoading(true);
    setMessage(null);
    const { data, error } = await supabase
      .from('picks')
      .select('*')
      .eq('seller', seller)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Erro ao carregar dados:', error);
      setMessage({ text: 'Falha ao carregar os dados da base de dados.', type: 'error' });
    } else if (data) {
      setFormData(data);
    }
    setLoading(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      let finalImageUrl = formData.image_url;

      if (imageFile) {
        const cleanFileName = imageFile.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
        const fileName = `bet_${seller}_${Date.now()}_${cleanFileName}`;

        const { error: uploadError } = await supabase.storage
          .from('bets')
          .upload(fileName, imageFile, { cacheControl: '3600', upsert: false });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage.from('bets').getPublicUrl(fileName);
        if (!publicUrlData.publicUrl) throw new Error('Falha ao gerar URL público.');
        finalImageUrl = publicUrlData.publicUrl;
      }

      const { error: updateError } = await supabase
        .from('picks')
        .update({
          game: formData.game,
          bet: formData.bet,
          odd: formData.odd,
          analysis: formData.analysis,
          markets: formData.markets,
          active: formData.active,
          price: formData.price === '' || formData.price === undefined ? 0 : Number(formData.price),
          image_url: finalImageUrl,
        })
        .eq('id', formData.id);

      if (updateError) throw updateError;

      setMessage({ text: 'Alterações guardadas com sucesso!', type: 'success' });
      setFormData((prev) => ({ ...prev, image_url: finalImageUrl }));
      setImageFile(null);
      setTimeout(() => setMessage(null), 4000);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Ocorreu um erro ao tentar guardar os dados.';
      console.error('Falha na atualização:', error);
      setMessage({ text: msg, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const cssVars = { '--tab-color': color } as React.CSSProperties;

  if (loading) {
    return (
      <div className="card" style={cssVars}>
        <div className="loading">
          <span className="spinner" />
          A carregar dados...
        </div>
      </div>
    );
  }

  const active = formData.active ?? false;

  return (
    <>
      {message && (
        <div className={`toast ${message.type}`}>
          <span className="toast-badge">{message.type === 'success' ? '✓' : '✕'}</span>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card" style={cssVars}>
        <div className="card-strip" />

        <div className="form">
          <div className="field">
            <label className="field-label">Nome do Jogo / Evento</label>
            <input
              className="input"
              type="text"
              name="game"
              value={formData.game || ''}
              onChange={handleInputChange}
              placeholder="Ex: Benfica vs Porto"
              required
            />
          </div>

          <div className="field">
            <label className="field-label">Descrição da Aposta</label>
            <textarea
              className="textarea"
              name="bet"
              value={formData.bet || ''}
              onChange={handleInputChange}
              placeholder="Descreve as seleções da aposta..."
              required
            />
          </div>

          <div className="row">
            <div className="field">
              <label className="field-label">Odd</label>
              <input
                className="input"
                type="text"
                name="odd"
                value={formData.odd || ''}
                onChange={handleInputChange}
                placeholder="Ex: 2.50"
                required
              />
            </div>
            <div className="field">
              <label className="field-label">Preço</label>
              <div className="input-affix">
                <input
                  className="input"
                  type="number"
                  name="price"
                  value={formData.price ?? ''}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                  required
                />
                <span className="affix">€</span>
              </div>
            </div>
          </div>

          <div className="field">
            <label className="field-label">
              Mercados <span className="field-hint">— alternativas sugeridas</span>
            </label>
            <textarea
              className="textarea"
              name="markets"
              value={formData.markets || ''}
              onChange={handleInputChange}
              placeholder="Ex: Resultado Final, Mais de 2.5 Golos, Ambas Marcam..."
            />
          </div>

          <div className="field">
            <label className="field-label">
              Análise Detalhada <span className="field-hint">— opcional</span>
            </label>
            <textarea
              className="textarea lg"
              name="analysis"
              value={formData.analysis || ''}
              onChange={handleInputChange}
              placeholder="Escreve a justificação para esta aposta..."
            />
          </div>

          <label className={`toggle-card ${active ? 'on' : ''}`}>
            <input type="checkbox" name="active" checked={active} onChange={handleInputChange} />
            <span className="switch" />
            <span className="toggle-text">
              <span className="toggle-title">
                {active ? 'Aposta ativa e visível' : 'Aposta desativada'}
              </span>
              <span className="toggle-desc">
                Quando o jogo começar ou acabar o período de venda, desativa aqui.
              </span>
            </span>
          </label>

          <div className="field">
            <label className="field-label">Imagem do Bilhete</label>
            <div className="dropzone">
              {formData.image_url ? (
                <img
                  key={formData.image_url}
                  src={formData.image_url}
                  alt="Previsualização da aposta"
                  className="dropzone-preview"
                />
              ) : (
                <div className="dropzone-empty">
                  <span className="icon">🖼️</span>
                  Nenhuma imagem carregada
                </div>
              )}
              <div className="dropzone-divider">
                <label className="file-btn">
                  {formData.image_url ? 'Alterar imagem' : 'Carregar imagem'}
                  <input type="file" accept="image/*" onChange={handleFileChange} />
                </label>
                {imageFile && <p className="file-name">{imageFile.name}</p>}
              </div>
            </div>
          </div>
        </div>
      </form>

      <div className="save-bar">
        <button type="submit" className="btn-save" disabled={saving} onClick={handleSubmit}>
          {saving ? (
            <>
              <span className="spinner sm" />
              A guardar...
            </>
          ) : (
            'Guardar Dados da Aposta'
          )}
        </button>
      </div>
    </>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState<Seller>('pedrito');
  const current = TABS.find((t) => t.key === activeTab)!;

  return (
    <div className="admin">
      <div className="admin-shell">
        <header className="admin-header">
          <p className="admin-eyebrow">Painel de Edição</p>
          <h1 className="admin-title">Apostas Premium</h1>
          <p className="admin-subtitle">Escolhe o tipster e atualiza a aposta em venda.</p>

          <div className="tab-bar">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                className={`tab ${activeTab === tab.key ? 'active' : ''}`}
                style={{ '--tab-color': tab.color } as React.CSSProperties}
                onClick={() => setActiveTab(tab.key)}
              >
                <span className="tab-dot" />
                {tab.label}
              </button>
            ))}
          </div>
        </header>

        <SellerForm key={activeTab} seller={activeTab} color={current.color} />
      </div>
    </div>
  );
}

export default App;
