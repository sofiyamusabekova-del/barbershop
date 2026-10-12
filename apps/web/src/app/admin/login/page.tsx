'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User, AlertCircle, Scissors, ArrowRight } from 'lucide-react';
import { adminLogin } from '../../../lib/adminApi';

export default function AdminLoginPage() {
  const router = useRouter();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!login || !password) {
      setError('Заполните логин и пароль');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { ok, data } = await adminLogin(login, password);
      if (ok) {
        router.push('/admin');
      } else {
        setError(data?.error?.message || 'Неверные учетные данные');
      }
    } catch (err: any) {
      setError('Ошибка подключения к серверу авторизации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0a0c0f',
      backgroundImage: 'radial-gradient(ellipse 80% 80% at 50% -20%, rgba(197, 160, 89, 0.15), rgba(255, 255, 255, 0))',
      padding: '20px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        backgroundColor: '#12161f',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '36px 32px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #dfbe7a, #c5a059)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0a0c0f',
            marginBottom: '16px',
          }}>
            <Scissors size={26} />
          </div>
          <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: '24px', fontWeight: 700, color: '#f3f4f6', letterSpacing: '1px' }}>
            CHOP & CRAFT
          </h1>
          <p style={{ color: '#9ca3af', fontSize: '13px', marginTop: '4px' }}>
            Панель управления барбершопом
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            borderLeft: '4px solid #ef4444',
            padding: '12px 14px',
            borderRadius: '6px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#fca5a5',
            fontSize: '13px',
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', color: '#9ca3af', fontSize: '12px', marginBottom: '6px' }}>
              Логин администратора
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#0a0c0f',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '0 12px',
            }}>
              <User size={18} color="#6b7280" />
              <input
                type="text"
                placeholder="admin"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#f3f4f6',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', color: '#9ca3af', fontSize: '12px', marginBottom: '6px' }}>
              Пароль
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#0a0c0f',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '0 12px',
            }}>
              <Lock size={18} color="#6b7280" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#f3f4f6',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '10px',
              padding: '14px',
              background: 'linear-gradient(135deg, #dfbe7a, #c5a059)',
              color: '#0a0c0f',
              fontWeight: 600,
              fontSize: '15px',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'opacity 0.2s ease',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Вход в систему...' : 'Войти в панель'} <ArrowRight size={18} />
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>
            По умолчанию: <strong>admin</strong> / <strong>admin123</strong>
          </span>
        </div>
      </div>
    </div>
  );
}
