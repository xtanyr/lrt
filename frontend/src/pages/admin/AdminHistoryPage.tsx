import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import LoadingState from '../../components/LoadingState';
import '../../styles/pages.css';

interface HistoryEntry {
  id: number;
  changedAt: string;
  changedBy: { name: string };
  fieldChanged: string;
  oldValue: string | null;
  newValue: string | null;
}

const CATEGORIES = [
  { key: 'ALL', label: 'Все' },
  { key: 'metric', label: 'Метрики' },
  { key: 'threshold', label: 'Пороги' },
  { key: 'structure', label: 'Структура' },
  { key: 'user', label: 'Пользователи' },
  { key: 'rating', label: 'Рейтинг' },
  { key: 'trigger', label: 'Триггеры' },
] as const;

export default function AdminHistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [category, setCategory] = useState<string>('ALL');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/config-logs');
      setEntries(res.data.data || res.data || []);
    } catch {
      setError('Не удалось загрузить историю изменений.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const filtered = category === 'ALL' ? entries : entries.filter((e) => e.fieldChanged?.includes(category));

  const fieldLabel = (field: string) => {
    const parts = field.split(':');
    const actions: Record<string, string> = { create: 'создание', update: 'изменение', archive: 'архивация', restore: 'восстановление' };
    if (parts[0] === 'metric') return `Метрика #${parts[1]} · ${actions[parts[2]] || parts[2] || 'изменение'}`;
    if (parts[0] === 'structure' && parts[1] === 'coffee-shop') return `Кофейня #${parts[2]} · ${actions[parts[3]] || 'изменение'}`;
    if (parts[0] === 'structure' && parts[1] === 'city') return `Город #${parts[2]} · ${actions[parts[3]] || 'изменение'}`;
    if (parts[0] === 'user') return `Пользователь #${parts[1]}`;
    if (parts[0] === 'trigger') return `Триггер #${parts[1]}`;
    if (parts[0] === 'ipv') return `ИПВ #${parts[1]}`;
    if (parts[0] === 'import') return `Импорт отчёта #${parts[1]}`;
    if (field === 'ratingColors') return 'Цветовые пороги рейтинга';
    return field;
  };

  const valueLabel = (value: string | null) => {
    if (!value) return '—';
    try {
      const parsed = JSON.parse(value);
      if (parsed === null) return '—';
      if (typeof parsed !== 'object') return String(parsed);
      const labels: Array<[string, string]> = [
        ['name', 'Название'], ['code', 'Код'], ['role', 'Роль'], ['isActive', 'Активна'],
        ['thresholdStrong', 'Цель'], ['thresholdMedium', 'Ниже цели'],
        ['pointsStrong', 'Баллы цели'], ['pointsMedium', 'Баллы ниже цели'],
        ['greenThreshold', 'Зелёная граница'], ['redThreshold', 'Красная граница'],
      ];
      const summary = labels
        .filter(([key]) => Object.prototype.hasOwnProperty.call(parsed, key))
        .map(([key, label]) => `${label}: ${typeof parsed[key] === 'boolean' ? (parsed[key] ? 'да' : 'нет') : parsed[key]}`);
      return summary.length ? summary.join(' · ') : JSON.stringify(parsed);
    } catch {
      return value;
    }
  };

  const csvCell = (value: string) => `"${value.replaceAll('"', '""')}"`;

  const exportCsv = () => {
    const header = 'Дата;Пользователь;Поле;Было;Стало';
    const rows = filtered.map((e) => {
      const date = new Date(e.changedAt).toLocaleString('ru-RU');
      return [date, e.changedBy?.name || '—', fieldLabel(e.fieldChanged), valueLabel(e.oldValue), valueLabel(e.newValue)].map(csvCell).join(';');
    });
    const csv = [header, ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `history_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <LoadingState />;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">История изменений</h1>
          <div className="page-sub">аудит: метрики, структура, права</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-ghost btn-sm" onClick={() => void load()}>Обновить</button>
          <button className="btn btn-ghost btn-sm" disabled={filtered.length === 0} onClick={exportCsv}>Экспорт CSV</button>
        </div>
      </div>

      <div className="tabs">
        {CATEGORIES.map((c) => (
          <button key={c.key} className={`tab${category === c.key ? ' active' : ''}`} onClick={() => setCategory(c.key)}>
            {c.label}
          </button>
        ))}
      </div>

      <div className="page-sub" aria-live="polite">{error || `Записей: ${filtered.length}`}</div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Дата</th>
                <th>Пользователь</th>
                <th>Поле</th>
                <th>Было</th>
                <th>Стало</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id}>
                  <td className="muted">{new Date(e.changedAt).toLocaleString('ru-RU')}</td>
                  <td>{e.changedBy?.name || '—'}</td>
                  <td>{fieldLabel(e.fieldChanged)}</td>
                  <td className="muted audit-value" title={e.oldValue || undefined}>{valueLabel(e.oldValue)}</td>
                  <td className="audit-value" title={e.newValue || undefined}>{valueLabel(e.newValue)}</td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={5} className="empty">{error || 'Нет записей'}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
