'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Scissors, Check, X, Clock } from 'lucide-react';
import { adminGetServices, adminCreateService, adminUpdateService, adminDeleteService } from '@/lib/adminApi';

export default function AdminServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<any | null>(null);

  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formDuration, setFormDuration] = useState(45);
  const [formPrice, setFormPrice] = useState(200000);
  const [formCategory, setFormCategory] = useState('стрижки');
  const [formSortOrder, setFormSortOrder] = useState(0);

  const loadServices = async () => {
    setLoading(true);
    const data = await adminGetServices();
    setServices(data);
    setLoading(false);
  };

  useEffect(() => {
    loadServices();
  }, []);

  const openCreateModal = () => {
    setEditingService(null);
    setFormName('');
    setFormDesc('');
    setFormDuration(45);
    setFormPrice(200000);
    setFormCategory('стрижки');
    setFormSortOrder(services.length + 1);
    setIsModalOpen(true);
  };

  const openEditModal = (s: any) => {
    setEditingService(s);
    setFormName(s.name);
    setFormDesc(s.description);
    setFormDuration(s.durationMin);
    setFormPrice(s.price);
    setFormCategory(s.category);
    setFormSortOrder(s.sortOrder);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formName,
      description: formDesc,
      durationMin: Number(formDuration),
      price: Number(formPrice),
      category: formCategory,
      sortOrder: Number(formSortOrder),
    };

    if (editingService) {
      await adminUpdateService(editingService.id, payload);
    } else {
      await adminCreateService(payload);
    }

    setIsModalOpen(false);
    loadServices();
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Удалить услугу «${name}»?`)) {
      await adminDeleteService(id);
      loadServices();
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 700, fontFamily: 'Cinzel, serif', color: '#f3f4f6' }}>
            Каталог услуг
          </h1>
          <p style={{ color: '#9ca3af', fontSize: '14px', marginTop: '4px' }}>
            Управление прайс-листом, длительностью процедур и категориями
          </p>
        </div>

        <button
          onClick={openCreateModal}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            background: 'linear-gradient(135deg, #dfbe7a, #c5a059)',
            color: '#0a0c0f',
            fontWeight: 600,
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          <Plus size={18} /> Добавить услугу
        </button>
      </div>

      <div style={{
        backgroundColor: '#12161f',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        overflow: 'hidden',
      }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>
            Загрузка услуг...
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#0e121a', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#9ca3af' }}>
                <th style={{ padding: '16px 20px' }}>Название</th>
                <th style={{ padding: '16px 20px' }}>Категория</th>
                <th style={{ padding: '16px 20px' }}>Длительность</th>
                <th style={{ padding: '16px 20px' }}>Стоимость</th>
                <th style={{ padding: '16px 20px', textAlign: 'right' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr key={s.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ fontWeight: 600, color: '#f3f4f6', fontSize: '14px' }}>{s.name}</div>
                    <div style={{ color: '#9ca3af', fontSize: '12px', marginTop: '2px', maxWidth: '400px' }}>{s.description}</div>
                  </td>

                  <td style={{ padding: '16px 20px' }}>
                    <span style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.06)',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      color: '#c5a059',
                    }}>
                      {s.category}
                    </span>
                  </td>

                  <td style={{ padding: '16px 20px', color: '#f3f4f6' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={13} color="#6b7280" /> {s.durationMin} мин
                    </div>
                  </td>

                  <td style={{ padding: '16px 20px', fontWeight: 700, color: '#dfbe7a', fontSize: '15px' }}>
                    {s.price.toLocaleString('ru-RU')} ₽
                  </td>

                  <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button
                        onClick={() => openEditModal(s)}
                        style={{
                          background: 'rgba(255, 255, 255, 0.06)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '6px',
                          color: '#f3f4f6',
                          padding: '6px 10px',
                          cursor: 'pointer',
                        }}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(s.id, s.name)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.2)',
                          borderRadius: '6px',
                          color: '#fca5a5',
                          padding: '6px 10px',
                          cursor: 'pointer',
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal создания / редактирования услуги */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px',
        }}>
          <div style={{
            backgroundColor: '#12161f',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '520px',
            padding: '28px',
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>
              {editingService ? 'Редактирование услуги' : 'Новая услуга'}
            </h3>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '6px' }}>
                  Название процедуры
                </label>
                <input
                  type="text"
                  required
                  placeholder="Мужская стрижка"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#0a0c0f',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#f3f4f6',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '6px' }}>
                  Описание
                </label>
                <textarea
                  rows={3}
                  placeholder="Что входит в процедуру..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#0a0c0f',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#f3f4f6',
                    fontSize: '13px',
                    outline: 'none',
                    resize: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '6px' }}>
                    Длительность (минут)
                  </label>
                  <input
                    type="number"
                    required
                    min={10}
                    step={5}
                    value={formDuration}
                    onChange={(e) => setFormDuration(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: '#0a0c0f',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#f3f4f6',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '6px' }}>
                    Стоимость (₽)
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={100}
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: '#0a0c0f',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#f3f4f6',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '6px' }}>
                    Категория
                  </label>
                  <input
                    type="text"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: '#0a0c0f',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#f3f4f6',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '6px' }}>
                    Порядок сортировки
                  </label>
                  <input
                    type="number"
                    value={formSortOrder}
                    onChange={(e) => setFormSortOrder(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: '#0a0c0f',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#f3f4f6',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#9ca3af',
                    cursor: 'pointer',
                  }}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    background: 'linear-gradient(135deg, #dfbe7a, #c5a059)',
                    color: '#0a0c0f',
                    fontWeight: 600,
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                >
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
