'use client';

import React, { useEffect, useState } from 'react';
import { Star, CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import { adminGetReviews, adminUpdateReview } from '@/lib/adminApi';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReviews = async () => {
    setLoading(true);
    const data = await adminGetReviews();
    setReviews(data);
    setLoading(false);
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const handleTogglePublic = async (id: string, current: boolean) => {
    await adminUpdateReview(id, !current);
    loadReviews();
  };

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 700, fontFamily: 'Cinzel, serif', color: '#f3f4f6' }}>
          Отзывы клиентов
        </h1>
        <p style={{ color: '#9ca3af', fontSize: '14px', marginTop: '4px' }}>
          Модерация оценок и отзывов для показа на главном сайте
        </p>
      </div>

      <div style={{
        backgroundColor: '#12161f',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        overflow: 'hidden',
      }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>
            Загрузка отзывов...
          </div>
        ) : reviews.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#6b7280' }}>
            Пока нет отзывов
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#0e121a', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#9ca3af' }}>
                <th style={{ padding: '16px 20px' }}>Дата</th>
                <th style={{ padding: '16px 20px' }}>Клиент</th>
                <th style={{ padding: '16px 20px' }}>Барбер</th>
                <th style={{ padding: '16px 20px' }}>Оценка</th>
                <th style={{ padding: '16px 20px' }}>Комментарий</th>
                <th style={{ padding: '16px 20px', textAlign: 'right' }}>Публикация</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((r) => {
                const dateStr = new Date(r.createdAt).toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });

                return (
                  <tr key={r.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '16px 20px', color: '#9ca3af' }}>
                      {dateStr}
                    </td>

                    <td style={{ padding: '16px 20px', fontWeight: 600, color: '#f3f4f6' }}>
                      {r.client?.name}
                    </td>

                    <td style={{ padding: '16px 20px', color: '#c5a059' }}>
                      {r.barber?.name}
                    </td>

                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#dfbe7a' }}>
                        {Array.from({ length: r.rating }).map((_, i) => (
                          <Star key={i} size={14} fill="#dfbe7a" />
                        ))}
                      </div>
                    </td>

                    <td style={{ padding: '16px 20px', color: '#f3f4f6', maxWidth: '340px' }}>
                      {r.comment || 'Без комментария'}
                    </td>

                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <button
                        onClick={() => handleTogglePublic(r.id, r.isPublic)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: 600,
                          border: 'none',
                          cursor: 'pointer',
                          backgroundColor: r.isPublic ? 'rgba(16, 185, 129, 0.15)' : 'rgba(107, 114, 128, 0.2)',
                          color: r.isPublic ? '#10b981' : '#9ca3af',
                        }}
                      >
                        {r.isPublic ? 'Опубликован ✅' : 'Скрыт'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
