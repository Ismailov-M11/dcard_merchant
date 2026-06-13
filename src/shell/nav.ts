import {
  LayoutDashboard,
  Building2,
  Tag,
  ShoppingBag,
  BarChart2,
  Users,
  User,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Обзор',      path: '/',          icon: LayoutDashboard },
  { label: 'Профиль',    path: '/profile',    icon: User },
  { label: 'Филиалы',    path: '/branches',   icon: Building2 },
  { label: 'Акции',      path: '/sales',      icon: Tag },
  { label: 'Заказы',     path: '/orders',     icon: ShoppingBag },
  { label: 'Аналитика',  path: '/analytics',  icon: BarChart2 },
  { label: 'Сотрудники', path: '/staff',      icon: Users },
];
