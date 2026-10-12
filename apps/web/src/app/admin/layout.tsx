'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Scissors, 
  Calendar, 
  Users, 
  Sparkles, 
  Clock, 
  MessageSquare, 
  Settings, 
  BarChart3,
  LogOut, 
  Menu, 
  X,
  ExternalLink
} from 'lucide-react';
import { adminGetMe, adminLogout } from '../../lib/adminApi';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [admin, setAdmin] = useState<{ id: string; login: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Игнорируем проверку сессии для страницы /admin/login
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (isLoginPage) {
      setLoading(false);
      return;
    }

    async function checkAuth() {
      const user = await adminGetMe();
      if (!user) {
        router.push('/admin/login');
      } else {
        setAdmin(user);
      }
      setLoading(false);
    }

    checkAuth();
  }, [isLoginPage, router, pathname]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0a0c0f',
        color: '#9ca3af',
      }}>
        Загрузка панели управления...
      </div>
    );
  }

  const navItems = [
    { href: '/admin', label: 'Записи и визиты', icon: Calendar },
    { href: '/admin/analytics', label: 'Аналитика и выручка', icon: BarChart3 },
    { href: '/admin/services', label: 'Каталог услуг', icon: Scissors },
    { href: '/admin/barbers', label: 'Барберы и расписание', icon: Users },
    { href: '/admin/time-off', label: 'Выходные и отпуска', icon: Clock },
    { href: '/admin/reviews', label: 'Отзывы клиентов', icon: MessageSquare },
    { href: '/admin/settings', label: 'Настройки салона', icon: Settings },
  ];

  const handleLogout = async () => {
    await adminLogout();
    router.push('/admin/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0a0c0f', color: '#f3f4f6' }}>
      {/* Сайдбар */}
      <aside style={{
        width: '260px',
        backgroundColor: '#10141c',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh',
        zIndex: 40,
      }}>
        {/* Логотип */}
        <div style={{
          padding: '24px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #dfbe7a, #c5a059)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0a0c0f',
          }}>
            <Scissors size={20} />
          </div>
          <div>
            <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: '16px', fontWeight: 700, letterSpacing: '0.5px' }}>
              CHOP & CRAFT
            </h2>
            <span style={{ fontSize: '11px', color: '#c5a059', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Admin Panel
            </span>
          </div>
        </div>

        {/* Навигация */}
        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? '#0a0c0f' : '#9ca3af',
                  backgroundColor: isActive ? '#c5a059' : 'transparent',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Подвал сайдбара */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          <Link
            href="/"
            target="_blank"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              color: '#9ca3af',
              textDecoration: 'none',
            }}
          >
            <ExternalLink size={15} /> Открыть сайт салона
          </Link>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>
              Вы вошли как: <strong style={{ color: '#f3f4f6' }}>{admin?.login}</strong>
            </span>
            <button
              onClick={handleLogout}
              style={{
                background: 'none',
                border: 'none',
                color: '#ef4444',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
              }}
            >
              <LogOut size={14} /> Выйти
            </button>
          </div>
        </div>
      </aside>

      {/* Основная рабочая область */}
      <main style={{ flex: 1, padding: '32px 40px', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
