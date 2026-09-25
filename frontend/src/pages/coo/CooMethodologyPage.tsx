import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import LoadingState from '../../components/LoadingState';
import '../../styles/pages.css';

interface Metric {
  id: number;
  name: string;
  code: string;
  unit: string;
  direction: string;
  targetValue: number | null;
  midValue: number | null;
  ptTarget: number;
  ptMid: number;
}

export default function CooMethodologyPage() {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/metrics');
        setMetrics(res.data.data || res.data || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <LoadingState />;

  const groups = [
    { title: 'Команда и гости', keys: ['ENPS', 'REVIEWS', 'GUEST_EXPERIENCE', 'STANDARDS', 'GIFTS'] },
    { title: 'Labor Cost', keys: ['LABOR_COST', 'PERSONNEL_COSTS'] },
    { title: 'Себестоимость', keys: ['FREE_ACCESS', 'DESSERT_WRITEOFF', 'PRODUCT_WRITEOFF'] },
    { title: 'Расходы', keys: ['ADMIN_COSTS', 'RENT', 'EQUIPMENT'] },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Методика расчёта</h1>
          <div className="page-sub">движок баллов и порогов</div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Формула</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--ink)' }}>Шаг 1.</strong> Для каждой метрики определяется зона на основе порогов:
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <span className="chip chip-success">Целевой — ≥ порога</span>
            <span className="chip chip-warning">Ниже цели — ≥ нижнего порога</span>
            <span className="chip chip-danger">Критично — &lt; нижнего порога</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--ink)' }}>Шаг 2.</strong> Суммируются баллы по всем метрикам. Зоны «Целевой» и «Ниже цели» дают фиксированные баллы, «Критично» — 0.
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--ink)' }}>Шаг 3.</strong> Итоговый балл масштабируется до 0–100. Пороги и баллы редактируются в панели администратора.
          </div>
        </div>
      </div>

      {groups.map((g) => {
        const groupMetrics = metrics.filter((m) => g.keys.includes(m.code));
        if (groupMetrics.length === 0) return null;
        return (
          <div className="card" key={g.title}>
            <div className="card-title">{g.title}</div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Метрика</th>
                    <th>Ед.</th>
                    <th>Направление</th>
                    <th>Целевой</th>
                    <th>Ниже цели</th>
                    <th>Баллы (зелёная)</th>
                    <th>Баллы (жёлтая)</th>
                  </tr>
                </thead>
                <tbody>
                  {groupMetrics.map((m) => (
                    <tr key={m.id}>
                      <td>{m.name}</td>
                      <td className="muted">{m.unit}</td>
                      <td className="muted">{m.direction === 'HIGHER_IS_BETTER' ? '↑ больше — лучше' : '↓ меньше — лучше'}</td>
                      <td className="muted">{m.targetValue ?? '—'}</td>
                      <td className="muted">{m.midValue ?? '—'}</td>
                      <td className="muted">{m.ptTarget}</td>
                      <td className="muted">{m.ptMid}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
