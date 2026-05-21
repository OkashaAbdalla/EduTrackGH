/**
 * Quick actions on the headteacher dashboard
 */

import { Link } from 'react-router-dom';
import { Card } from '../common';
import { ROUTES } from '../../utils/constants';

const actions = [
  {
    to: ROUTES.HEADTEACHER_MANAGE_STUDENTS,
    title: 'Manage Students',
    description: 'Review and approve student registrations',
    cta: 'Review pending',
    ctaClass: 'text-purple-600 dark:text-purple-400',
    gradient: 'from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700',
    shadow: 'shadow-purple-500/20',
    iconPath:
      'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
  },
  {
    to: ROUTES.HEADTEACHER_MANAGE_TEACHERS,
    title: 'Manage Teachers',
    description: 'Add teachers and manage accounts',
    cta: 'Open teachers',
    ctaClass: 'text-blue-600 dark:text-blue-400',
    gradient: 'from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700',
    shadow: 'shadow-blue-500/20',
    iconPath:
      'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  },
  {
    to: ROUTES.MANAGE_CLASSES,
    title: 'Manage Classes',
    description: 'Create classes and assign teachers',
    cta: 'Manage classes',
    ctaClass: 'text-amber-600 dark:text-amber-400',
    gradient: 'from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700',
    shadow: 'shadow-orange-500/20',
    iconPath:
      'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
  },
];

export default function HeadteacherQuickActions() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {actions.map((a) => (
        <Link key={a.to} to={a.to}>
          <Card variant="action" hover className="p-5 group cursor-pointer h-full">
            <div className="flex items-center gap-4">
              <div
                className={`w-14 h-14 shrink-0 rounded-lg bg-gradient-to-br ${a.gradient} flex items-center justify-center shadow-lg ${a.shadow} group-hover:scale-105 transition-transform duration-300`}
              >
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={a.iconPath} />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-0.5">{a.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">{a.description}</p>
                <div className={`mt-2 flex items-center ${a.ctaClass} text-sm font-medium`}>
                  <span>{a.cta}</span>
                  <svg
                    className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
