'use client';

import { motion } from 'framer-motion';
import { User } from '@/types';

interface UserCardProps {
  user: User;
  onClick?: () => void;
  isSelected?: boolean;
}

export function UserCard({ user, onClick, isSelected = false }: UserCardProps) {
  const getRoleBadgeColor = (role: User['role']) => {
    switch (role) {
      case 'admin':
        return 'bg-gold/20 text-gold border-gold/30';
      case 'quizmaster':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'participant':
        return 'bg-cream/10 text-cream/70 border-cream/20';
      default:
        return 'bg-cream/10 text-cream/70 border-cream/20';
    }
  };

  const getStatusBadgeColor = (status: User['registration_status']) => {
    switch (status) {
      case 'approved':
        return 'bg-success-green/20 text-success-green border-success-green/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'rejected':
        return 'bg-warm-red/20 text-warm-red border-warm-red/30';
      case 'cancelled':
        return 'bg-cream/10 text-cream/50 border-cream/20';
      default:
        return 'bg-cream/10 text-cream/50 border-cream/20';
    }
  };

  const formatLastLogin = (lastLogin?: string) => {
    if (!lastLogin) return 'Nooit ingelogd';

    const date = new Date(lastLogin);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Net ingelogd';
    if (diffMins < 60) return `${diffMins} min geleden`;
    if (diffHours < 24) return `${diffHours} uur geleden`;
    if (diffDays < 7) return `${diffDays} dag${diffDays > 1 ? 'en' : ''} geleden`;

    return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatRole = (role: User['role']) => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'quizmaster':
        return 'Quizmaster';
      case 'participant':
        return 'Deelnemer';
      default:
        return role;
    }
  };

  const formatStatus = (status: User['registration_status']) => {
    switch (status) {
      case 'approved':
        return 'Actief';
      case 'pending':
        return 'In afwachting';
      case 'rejected':
        return 'Afgewezen';
      case 'cancelled':
        return 'Geannuleerd';
      default:
        return status;
    }
  };

  return (
    <motion.div
      className={`
        p-4 rounded-lg border cursor-pointer transition-all
        ${isSelected
          ? 'bg-dark-wood/60 border-gold ring-2 ring-gold/50'
          : 'bg-dark-wood/30 border-gold/20 hover:bg-dark-wood/40 hover:border-gold/40'
        }
      `}
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-cream font-semibold truncate">{user.name}</h3>
          <p className="text-cream/60 text-sm truncate">{user.email}</p>

          <div className="flex flex-wrap gap-2 mt-2">
            <span className={`px-2 py-1 text-xs rounded-full border ${getRoleBadgeColor(user.role)}`}>
              {formatRole(user.role)}
            </span>
            <span className={`px-2 py-1 text-xs rounded-full border ${getStatusBadgeColor(user.registration_status)}`}>
              {formatStatus(user.registration_status)}
            </span>
          </div>
        </div>

        <div className="text-right flex-shrink-0">
          <div className="text-gold font-bold text-lg">{user.total_points}</div>
          <div className="text-cream/50 text-xs">punten</div>
        </div>
      </div>

      {user.last_login_at && (
        <div className="mt-3 pt-3 border-t border-gold/10">
          <p className="text-cream/50 text-xs">
            Laatst actief: {formatLastLogin(user.last_login_at)}
          </p>
        </div>
      )}
    </motion.div>
  );
}
