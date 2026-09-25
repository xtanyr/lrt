import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../components/ToastProvider';
import LoadingState from '../../components/LoadingState';
import '../../styles/pages.css';

interface RatingColorConfig {
  id: number;
  greenThreshold: number;
  redThreshold: number;
}

interface TriggerConfig {
  code: string;
  thresholdRating: number | null;
  monthsCount: number | null;
}

export default function AdminConfigPage() {
  const toast = useToast();
  const [tab, setTab] = useState<'rating' | 'triggers' | 'integrations' | 'auth'>('rating');
  const [ratingConfig, setRatingConfig] = useState<RatingColorConfig | null>(null);
  const [triggerConfigs, setTriggerConfigs] = useState<TriggerConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [ratingRes, triggerRes] = await Promise.all([
          api.get('/admin/rating-color-config').catch(() => ({ data: null })),
          api.get('/admin/trigger-configs').catch(() => ({ data: { data: [] } })),
        ]);
        if (ratingRes.data) setRatingConfig(ratingRes.data.data || ratingRes.data);
        setTriggerConfigs(triggerRes.data.data || triggerRes.data || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const saveRating = async () => {
    if (!ratingConfig) return;
    try {
      await api.patch('/admin/rating-color-config', ratingConfig);
      toast.show('Сохранено', 'success');
    } catch {
      // silent
    }
  };

  if (loading) return <LoadingState />;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Конфигурация</h1>
          <div className="page-sub">доступы, интеграции, аутентификация</div>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab${tab === 'rating' ? ' active' : ''}`} onClick={() => setTab('rating')}>Рейтинг</button>
        <button className={`tab${tab === 'triggers' ? ' active' : ''}`} onClick={() => setTab('triggers')}>Триггеры</button>
        <button className={`tab${tab === 'integrations' ? ' active' : ''}`} onClick={() => setTab('integrations')}>Интеграции</button>
        <button className={`tab${tab === 'auth' ? ' active' : ''}`} onClick={() => setTab('auth')}>Аутентификация</button>
      </div>

      {tab === 'rating' && ratingConfig && (
        <div className="card">
          <div className="card-title">Цветовые пороги рейтинга</div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <label className="field">
              <span className="field-label">Зелёная зона ≥</span>
              <input className="input" type="number" value={ratingConfig.greenThreshold} onChange={(e) => setRatingConfig({ ...ratingConfig, greenThreshold: parseInt(e.target.value) || 0 })} style={{ maxWidth: 120 }} />
            </label>
            <label className="field">
              <span className="field-label">Красная зона ≤</span>
              <input className="input" type="number" value={ratingConfig.redThreshold} onChange={(e) => setRatingConfig({ ...ratingConfig, redThreshold: parseInt(e.target.value) || 0 })} style={{ maxWidth: 120 }} />
            </label>
            <button className="btn btn-primary btn-sm" onClick={saveRating}>Сохранить</button>
          </div>
        </div>
      )}

      {tab === 'triggers' && (
        <div className="card">
          <div className="card-title">Правила триггеров ИПВ</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {triggerConfigs.map((c) => (
              <div key={c.code} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
                <div>
                  <div style={{ fontWeight: 500 }}>{c.code}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-2)' }}>
                    {c.thresholdRating != null && `Рейтинг < ${c.thresholdRating}`}
                    {c.monthsCount != null && ` · ${c.monthsCount} мес.`}
                  </div>
                </div>
              </div>
            ))}
            {triggerConfigs.length === 0 && <div className="empty">Нет правил</div>}
          </div>
        </div>
      )}

      {tab === 'integrations' && (
        <div className="card">
          <div className="card-title">Источники данных</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 500 }}>RocketData</div>
                <div style={{ fontSize: 12, color: 'var(--ink-2)' }}>Скорость разбора отзыва · v2</div>
              </div>
              <span className="chip chip-ghost">не подключено</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 500 }}>Финансовый дашборд</div>
                <div style={{ fontSize: 12, color: 'var(--ink-2)' }}>Выручка, ФОТ, списания, аренда, расходы · v2</div>
              </div>
              <span className="chip chip-ghost">не подключено</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 500 }}>1С</div>
                <div style={{ fontSize: 12, color: 'var(--ink-2)' }}>Не используется в текущей версии</div>
              </div>
              <span className="chip chip-ghost">не подключено</span>
            </div>
          </div>
        </div>
      )}

      {tab === 'auth' && (
        <div className="card">
          <div className="card-title">Аутентификация</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 500 }}>Email + пароль</div>
                <div style={{ fontSize: 12, color: 'var(--ink-2)' }}>вход по корпоративной почте</div>
              </div>
              <span className="chip chip-success">включено</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 500 }}>Google OAuth</div>
                <div style={{ fontSize: 12, color: 'var(--ink-2)' }}>активен наравне с email+паролем</div>
              </div>
              <span className="chip chip-success">включено</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 500 }}>Длительность сессии</div>
                <div style={{ fontSize: 12, color: 'var(--ink-2)' }}>скользящее окно, обновляется при каждом входе</div>
              </div>
              <span className="chip chip-ghost">60 дней</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 500 }}>Ссылка сброса пароля</div>
                <div style={{ fontSize: 12, color: 'var(--ink-2)' }}>действует 24 часа</div>
              </div>
              <span className="chip chip-ghost">24 ч</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
