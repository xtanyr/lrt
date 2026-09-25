import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import LoadingState from '../../components/LoadingState';
import '../../styles/pages.css';

interface IPVStatus {
  id: number;
  coffeeShopId: number;
  coffeeShop: { name: string; city: { name: string } };
  status: string;
  rule: string;
  severity: string;
  createdAt: string;
  daysOverdue: number | null;
}

interface TriggerConfig {
  code: string;
  label: string;
  thresholdRating: number | null;
  monthsCount: number | null;
}

const STATUS_FILTERS = [
  { key: 'ALL', label: 'Все' },
  { key: 'NOT_STARTED', label: 'Новые' },
  { key: 'IN_PROGRESS', label: 'В проверке' },
  { key: 'COMPLETED', label: 'Закрытые' },
] as const;

export default function CityTriggersPage() {
  const [items, setItems] = useState<IPVStatus[]>([]);
  const [configs, setConfigs] = useState<TriggerConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');
  const [actionId, setActionId] = useState<number | null>(null);
  const [closeReason, setCloseReason] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [statusesRes, configRes] = await Promise.all([
          api.get('/ipv-triggers/statuses'),
          api.get('/ipv-triggers/config').catch(() => ({ data: { data: [] } })),
        ]);
        setItems(statusesRes.data.data || statusesRes.data || []);
        setConfigs(configRes.data.data || configRes.data || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = items.filter((t) => {
    if (filter === 'ALL') return true;
    return t.status === filter;
  });

  const takeInWork = async (id: number) => {
    setActionId(id);
    try {
      await api.patch(`/ipv-triggers/status/${id}`, { status: 'IN_PROGRESS' });
      setItems((prev) => prev.map((t) => (t.id === id ? { ...t, status: 'IN_PROGRESS' } : t)));
    } finally {
      setActionId(null);
    }
  };

  const closeTrigger = async (id: number) => {
    if (!closeReason.trim()) return;
    try {
      await api.patch(`/ipv-triggers/status/${id}`, { status: 'COMPLETED', closeReason });
      setItems((prev) => prev.map((t) => (t.id === id ? { ...t, status: 'COMPLETED' } : t)));
      setCloseReason('');
    } finally {
      setActionId(null);
    }
  };

  if (loading) return <LoadingState />;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Триггеры ИПВ</h1>
          <div className="page-sub">Мониторинг и статусы</div>
        </div>
      </div>

      <div className="tabs">
        {STATUS_FILTERS.map((f) => (
          <button key={f.key} className={`tab${filter === f.key ? ' active' : ''}`} onClick={() => setFilter(f.key)}>
            {f.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 14 }}>
        <div className="card">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Кофейня</th>
                  <th>Правило</th>
                  <th>Критичность</th>
                  <th>Статус</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id}>
                    <td>
                       <div>{t.coffeeShop.name}</div>
                       <div className="helper-text">{t.coffeeShop.city?.name || '—'}</div>
                    </td>
                    <td>{t.rule}</td>
                    <td>
                      <span className={`chip ${t.severity === 'critical' ? 'chip-danger' : 'chip-warning'}`}>
                        {t.severity === 'CRITICAL' ? '🔴' : '⚠'} {t.severity}
                      </span>
                    </td>
                    <td>
                      <span className="chip">
                        {t.status === 'NOT_STARTED' ? '🆕 Новый' : t.status === 'IN_PROGRESS' ? '⏳ В работе' : '✅ Завершён'}
                      </span>
                      {t.daysOverdue && t.daysOverdue > 0 && <span className="chip chip-danger" style={{ marginLeft: 6 }}>🔔 просрочен</span>}
                    </td>
                    <td>
                      {t.status === 'NOT_STARTED' && (
                        <button className="btn btn-ghost btn-sm" onClick={() => takeInWork(t.id)} disabled={actionId === t.id}>
                          Взять в работу
                        </button>
                      )}
                      {t.status === 'IN_PROGRESS' && actionId === t.id ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <input
                            className="input"
                            placeholder="Причина закрытия"
                            value={closeReason}
                            onChange={(e) => setCloseReason(e.target.value)}
                            style={{ maxWidth: 180 }}
                          />
                          <button className="btn btn-primary btn-sm" onClick={() => closeTrigger(t.id)} disabled={!closeReason.trim()}>
                            Закрыть
                          </button>
                        </div>
                      ) : t.status === 'IN_PROGRESS' ? (
                        <button className="btn btn-ghost btn-sm" onClick={() => setActionId(t.id)}>
                          Закрыть
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={5} className="empty">Нет триггеров</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Правила триггеров</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {configs.map((c) => (
              <div key={c.code} style={{ borderBottom: '1px solid var(--line)', paddingBottom: 8 }}>
                <div style={{ fontWeight: 500, fontSize: 13 }}>{c.code}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-2)' }}>
                  {c.thresholdRating != null && `Рейтинг < ${c.thresholdRating}`}
                  {c.monthsCount != null && ` · ${c.monthsCount} мес.`}
                </div>
              </div>
            ))}
            {configs.length === 0 && <div className="empty">Нет правил</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
