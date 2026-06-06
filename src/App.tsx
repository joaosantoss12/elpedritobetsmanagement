// src/App.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

type Seller = 'pedrito' | 'rodrigo' | 'magnata';

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

const TABS: { key: Seller; label: string }[] = [
  { key: 'pedrito', label: 'El Pedrito' },
  { key: 'rodrigo', label: 'Rodrigo' },
  { key: 'magnata', label: 'Magnata' },
];

const TAB_COLOR: Record<Seller, string> = {
  pedrito: '#3b82f6',
  rodrigo: '#8b5cf6',
  magnata: '#f59e0b',
};

const styles = {
  body: {
    backgroundColor: '#f4f7f6',
    margin: 0,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    color: '#333',
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    padding: '40px 20px',
  },
  container: {
    backgroundColor: '#ffffff',
    maxWidth: '700px',
    width: '100%',
    padding: '40px',
    borderRadius: '16px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
    alignSelf: 'flex-start',
  },
  header: {
    borderBottom: '2px solid #eaeaea',
    paddingBottom: '20px',
    marginBottom: '24px',
    textAlign: 'center' as const,
  },
  title: {
    margin: '0 0 20px 0',
    fontSize: '24px',
    fontWeight: 700,
    color: '#1a1a1a',
  },
  tabBar: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  label: {
    fontWeight: 600,
    fontSize: '14px',
    color: '#555',
  },
  input: {
    padding: '12px 15px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '16px',
    transition: 'border-color 0.2s',
  },
  textarea: {
    padding: '12px 15px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '16px',
    minHeight: '100px',
    resize: 'vertical' as const,
    fontFamily: 'inherit',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
  },
  checkboxContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#f9f9f9',
    padding: '15px',
    borderRadius: '8px',
    border: '1px solid #eee',
    marginTop: '10px',
    cursor: 'pointer',
  },
  imageSection: {
    border: '2px dashed #ddd',
    padding: '25px',
    borderRadius: '12px',
    backgroundColor: '#fafafa',
    marginTop: '10px',
    textAlign: 'center' as const,
  },
  currentImage: {
    maxWidth: '100%',
    maxHeight: '180px',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    marginBottom: '15px',
    border: '1px solid #eee',
  },
  fileInput: {
    fontSize: '14px',
    color: '#555',
  },
  message: {
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '15px',
    fontWeight: 500,
  },
  toast: {
    position: 'fixed' as const,
    bottom: '24px',
    right: '24px',
    padding: '14px 20px',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: 500,
    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
    zIndex: 9999,
    minWidth: '260px',
    maxWidth: '360px',
    animation: 'fadeInUp 0.2s ease',
  },
  successMessage: {
    backgroundColor: '#ecfdf5',
    color: '#065f46',
    border: '1px solid #a7f3d0',
  },
  errorMessage: {
    backgroundColor: '#fff1f2',
    color: '#9f1239',
    border: '1px solid #fecdd3',
  },
  loading: {
    fontSize: '18px',
    color: '#666',
    textAlign: 'center' as const,
    marginTop: '50px',
  },
};

function SellerForm({ seller }: { seller: Seller }) {
  const color = TAB_COLOR[seller];
  const [formData, setFormData] = useState<Partial<BetData>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = color;
    e.target.style.boxShadow = `0 0 0 3px ${color}22`;
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = '#ddd';
    e.target.style.boxShadow = 'none';
  };

  useEffect(() => {
    fetchData();
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

  const submitStyle = {
    position: 'fixed' as const,
    bottom: 0,
    left: 0,
    right: 0,
    padding: '16px 20px',
    backgroundColor: saving ? '#d1d5db' : color,
    color: 'white',
    border: 'none',
    fontSize: '16px',
    fontWeight: 600,
    cursor: saving ? 'not-allowed' : 'pointer',
    transition: 'background-color 0.2s',
    zIndex: 1000,
    boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
  };

  if (loading) return <div style={styles.loading}>A carregar dados...</div>;

  return (
    <>
      {message && (
        <div style={{ ...styles.toast, ...(message.type === 'success' ? styles.successMessage : styles.errorMessage) }}>
          {message.type === 'success' ? '✓ ' : '✕ '}
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ ...styles.form, paddingBottom: '80px' }}>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Nome do Jogo / Evento</label>
          <input
            type="text"
            name="game"
            value={formData.game || ''}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            style={styles.input}
            placeholder="Ex: Benfica vs Porto"
            required
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Descrição da Aposta</label>
          <textarea
            name="bet"
            value={formData.bet || ''}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            style={styles.textarea}
            placeholder="Descreva as seleções da aposta..."
            required
          />
        </div>

        <div style={styles.row}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Odd (ex: 1.54)</label>
            <input
              type="text"
              name="odd"
              value={formData.odd || ''}
              onChange={handleInputChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              style={styles.input}
              placeholder="Ex: 2.50"
              required
            />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Preço (ex: 5.99)</label>
            <input
              type="number"
              name="price"
              value={formData.price ?? ''}
              onChange={handleInputChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              style={styles.input}
              placeholder="0.00"
              step="0.01"
              required
            />
          </div>
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Mercados</label>
          <textarea
            name="markets"
            value={formData.markets || ''}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            style={{ ...styles.textarea, minHeight: '80px' }}
            placeholder="Ex: Resultado Final, Mais de 2.5 Golos, Ambas Marcam..."
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Análise Detalhada (Opcional)</label>
          <textarea
            name="analysis"
            value={formData.analysis || ''}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            style={{ ...styles.textarea, minHeight: '140px' }}
            placeholder="Escreva a justificação para esta aposta..."
          />
        </div>

        <label style={styles.checkboxContainer}>
          <input
            type="checkbox"
            name="active"
            checked={formData.active || false}
            onChange={handleInputChange}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
          <span style={{ ...styles.label, color: '#1a1a1a', textAlign: 'left' }}>Esta aposta está ativa e visível?<br></br>[quando começar o jogo ou acabar o período de venda, desativar]</span>
        </label>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Imagem do Bilhete</label>
          <div style={styles.imageSection}>
            {formData.image_url ? (
              <div>
                <img
                  key={formData.image_url}
                  src={formData.image_url}
                  alt="Previsualização da aposta"
                  style={styles.currentImage}
                />
                <p style={{ fontSize: '12px', color: '#888', margin: '0 0 15px 0' }}>Imagem atual carregada.</p>
              </div>
            ) : (
              <div style={{ padding: '20px 0', color: '#999' }}>Nenhuma imagem carregada.</div>
            )}
            <div style={{ borderTop: '1px solid #eee', paddingTop: '15px' }}>
              <label style={{ ...styles.label, display: 'block', marginBottom: '10px', color }}>Alterar Imagem</label>
              <input type="file" accept="image/*" onChange={handleFileChange} style={styles.fileInput} />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          style={submitStyle}
          onMouseOver={(e) => !saving && (e.currentTarget.style.backgroundColor = color + 'cc')}
          onMouseOut={(e) => !saving && (e.currentTarget.style.backgroundColor = color)}
        >
          {saving ? 'A guardar alterações...' : 'Guardar Dados da Aposta'}
        </button>
      </form>
    </>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState<Seller>('pedrito');

  return (
    <div style={styles.body}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>Painel de Edição -- Apostas</h2>
          <div style={styles.tabBar}>
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              const color = TAB_COLOR[tab.key];
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '8px',
                    border: isActive ? `2px solid ${color}` : '2px solid #eaeaea',
                    backgroundColor: isActive ? color : '#f9f9f9',
                    color: isActive ? '#fff' : '#555',
                    fontWeight: 600,
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <SellerForm key={activeTab} seller={activeTab} />
      </div>
    </div>
  );
}

export default App;
