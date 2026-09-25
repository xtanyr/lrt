import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import LoadingState from '../../components/LoadingState';
import { useToast } from '../../components/ToastProvider';
import '../../styles/pages.css';
import './AdminStructurePage.css';

interface City {
  id: number;
  name: string;
  isActive: boolean;
  coffeeShops: Array<{ id: number; name: string; isActive: boolean }>;
}

export default function AdminStructurePage() {
  const toast = useToast();
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [showAddCity, setShowAddCity] = useState(false);
  const [showAddShop, setShowAddShop] = useState<{ cityId: number } | null>(null);
  const [newCityName, setNewCityName] = useState('');
  const [newShopName, setNewShopName] = useState('');
  const [editingShop, setEditingShop] = useState<{ cityId: number; shopId: number; name: string } | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [citiesRes] = await Promise.all([
          api.get('/cities?includeInactiveShops=true'),
        ]);
        setCities(citiesRes.data.data || citiesRes.data || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const toggleCity = (id: number) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const addCity = async () => {
    if (!newCityName.trim()) return;
    try {
      const res = await api.post('/cities', { name: newCityName });
      setCities((prev) => [...prev, res.data.data || res.data]);
      setNewCityName('');
      setShowAddCity(false);
    } catch {
      toast.show('Не удалось добавить город', 'error');
    }
  };

  const addShop = async (cityId: number) => {
    if (!newShopName.trim()) return;
    try {
      const res = await api.post('/coffee-shops', { name: newShopName, cityId });
      setCities((prev) =>
        prev.map((c) => (c.id === cityId ? { ...c, coffeeShops: [...c.coffeeShops, res.data.data || res.data] } : c)),
      );
      setNewShopName('');
      setShowAddShop(null);
    } catch {
      toast.show('Не удалось добавить кофейню', 'error');
    }
  };

  const deactivateShop = async (cityId: number, shopId: number) => {
    try {
      await api.patch(`/coffee-shops/${shopId}`, { isActive: false });
      setCities((prev) =>
        prev.map((c) =>
          c.id === cityId
            ? {
                ...c,
                coffeeShops: c.coffeeShops.map((s) => (s.id === shopId ? { ...s, isActive: false } : s)),
              }
            : c,
        ),
      );
      toast.show('Кофейня деактивирована', 'success');
    } catch {
      toast.show('Не удалось деактивировать кофейню', 'error');
    }
  };

  const activateShop = async (cityId: number, shopId: number) => {
    try {
      await api.patch(`/coffee-shops/${shopId}`, { isActive: true });
      setCities((prev) =>
        prev.map((c) =>
          c.id === cityId
            ? {
                ...c,
                coffeeShops: c.coffeeShops.map((s) => (s.id === shopId ? { ...s, isActive: true } : s)),
              }
            : c,
        ),
      );
      toast.show('Кофейня активирована', 'success');
    } catch {
      toast.show('Не удалось активировать кофейню', 'error');
    }
  };

  const saveShop = async () => {
    if (!editingShop?.name.trim()) return;
    try { await api.patch(`/coffee-shops/${editingShop.shopId}`, { name: editingShop.name.trim() }); setCities(prev => prev.map(city => city.id !== editingShop.cityId ? city : {...city, coffeeShops: city.coffeeShops.map(shop => shop.id === editingShop.shopId ? {...shop, name: editingShop.name.trim()} : shop)})); setEditingShop(null); toast.show('Название кофейни сохранено', 'success'); } catch { toast.show('Не удалось сохранить название', 'error'); }
  };

  if (loading) return <LoadingState />;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Структура сети</h1>
          <div className="page-sub">сеть → города → кофейни</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary btn-sm" onClick={() => setShowAddCity(true)}>Город</button>
        </div>
      </div>

      {showAddCity && (
        <div className="card">
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              className="input"
              placeholder="Название города"
              value={newCityName}
              onChange={(e) => setNewCityName(e.target.value)}
              style={{ maxWidth: 240 }}
            />
            <button className="btn btn-primary btn-sm" onClick={addCity}>Добавить</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowAddCity(false)}>Отмена</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {cities.map((city) => (
          <div key={city.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => toggleCity(city.id)}>
              <div style={{ fontWeight: 600 }}>
                <span style={{ marginRight: 8 }}>{expanded[city.id] ? '▼' : '▶'}</span>
                {city.name}
                <span className="chip chip-ghost" style={{ marginLeft: 8 }}>{(city.coffeeShops || []).length} кофеен</span>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); setShowAddShop({ cityId: city.id }); }}>
                + Кофейня
              </button>
            </div>

            {expanded[city.id] && (
              <div style={{ marginTop: 10 }}>
                {showAddShop?.cityId === city.id && (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
                    <input
                      className="input"
                      placeholder="Название кофейни"
                      value={newShopName}
                      onChange={(e) => setNewShopName(e.target.value)}
                      style={{ maxWidth: 240 }}
                    />
                    <button className="btn btn-primary btn-sm" onClick={() => addShop(city.id)}>Добавить</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setShowAddShop(null)}>Отмена</button>
                  </div>
                )}
                <table className="table">
                  <thead>
                    <tr>
                      <th>Кофейня</th>
                      <th>Статус</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {city.coffeeShops.map((shop) => (
                      <tr key={shop.id}>
                        <td>{editingShop?.shopId===shop.id?<div className="structure-edit"><input className="input" aria-label="Название кофейни" value={editingShop.name} onChange={e=>setEditingShop({...editingShop,name:e.target.value})}/><button className="btn btn-primary btn-sm" onClick={saveShop}>Сохранить</button><button className="btn btn-subtle btn-sm" onClick={()=>setEditingShop(null)}>Отмена</button></div>:shop.name}</td>
                        <td>
                          <span className={`chip ${shop.isActive ? 'chip-success' : 'chip-ghost'}`}>
                            {shop.isActive ? 'активна' : 'деактивирована'}
                          </span>
                        </td>
                        <td>
                          {editingShop?.shopId!==shop.id&&<button className="btn btn-ghost btn-sm" onClick={() => setEditingShop({cityId:city.id,shopId:shop.id,name:shop.name})}>Редактировать</button>}
                          {shop.isActive && (
                            <button className="btn btn-ghost btn-sm" onClick={() => deactivateShop(city.id, shop.id)}>
                              Деактивировать
                            </button>
                          )}
                          {!shop.isActive && (
                            <button className="btn btn-primary btn-sm" onClick={() => activateShop(city.id, shop.id)}>
                              Активировать
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {city.coffeeShops.length === 0 && <tr><td colSpan={3} className="empty">Нет кофеен</td></tr>}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
        {cities.length === 0 && <div className="empty">Нет городов</div>}
      </div>
    </div>
  );
}
