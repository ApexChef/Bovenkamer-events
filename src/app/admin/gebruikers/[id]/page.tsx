'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useParams } from 'next/navigation';
import { AuthGuard } from '@/components/AuthGuard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  RoleSelector,
  PointsManager,
  DangerZone,
  RegistrationViewer,
} from '@/components/admin';
import { User } from '@/types';
import { useAuthStore } from '@/lib/store';
import Link from 'next/link';

export default function AdminUserDetailPage() {
  return (
    <AuthGuard requireAdmin requireApproved>
      <AdminUserDetailContent />
    </AuthGuard>
  );
}

interface PointsHistoryEntry {
  id: string;
  category: 'registration' | 'prediction' | 'quiz' | 'game' | 'manual';
  points: number;
  reason?: string;
  created_at: string;
  created_by?: string;
}

function AdminUserDetailContent() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  const { currentUser } = useAuthStore();

  const [user, setUser] = useState<User | null>(null);
  const [pointsHistory, setPointsHistory] = useState<PointsHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showRegistration, setShowRegistration] = useState(false);

  const isCurrentUser = currentUser?.id === userId;

  useEffect(() => {
    if (userId) {
      fetchUserDetails();
    }
  }, [userId]);

  const fetchUserDetails = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/users/${userId}`);
      const data = await response.json();

      if (response.ok) {
        // API returns user data directly, not nested under 'user'
        setUser(data);
        setPointsHistory(data.pointsHistory || []);
      } else {
        setError(data.message || data.error || 'Kon gebruiker niet laden');
      }
    } catch (err) {
      console.error('Failed to fetch user:', err);
      setError('Netwerkfout bij ophalen gebruiker');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (newRole: User['role']) => {
    if (!user) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await response.json();

      if (response.ok) {
        setUser({ ...user, role: newRole });
        setSuccessMessage('Rol succesvol gewijzigd');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        throw new Error(data.error || 'Fout bij wijzigen rol');
      }
    } catch (err) {
      throw err;
    }
  };

  const handlePointsUpdate = async (points: number, reason: string) => {
    if (!user) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}/points`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ points, reason }),
      });

      const data = await response.json();

      if (response.ok) {
        // Refresh user details to get updated points and history
        await fetchUserDetails();
        setSuccessMessage('Punten succesvol bijgewerkt');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        throw new Error(data.error || 'Fout bij wijzigen punten');
      }
    } catch (err) {
      throw err;
    }
  };

  const handleDeactivate = async () => {
    if (!user) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}/deactivate`, {
        method: 'PATCH',
      });

      const data = await response.json();

      if (response.ok) {
        setUser({ ...user, registration_status: 'cancelled' });
        setSuccessMessage('Gebruiker succesvol gedeactiveerd');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        throw new Error(data.error || 'Fout bij deactiveren gebruiker');
      }
    } catch (err) {
      throw err;
    }
  };

  const handleReactivate = async () => {
    if (!user) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}/reactivate`, {
        method: 'PATCH',
      });

      const data = await response.json();

      if (response.ok) {
        setUser({ ...user, registration_status: 'approved' });
        setSuccessMessage('Gebruiker succesvol gereactiveerd');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        throw new Error(data.error || 'Fout bij reactiveren gebruiker');
      }
    } catch (err) {
      throw err;
    }
  };

  const handleDelete = async () => {
    if (!user) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}?confirm=DELETE`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        // Navigate back to users list after successful deletion
        router.push('/admin/gebruikers');
      } else {
        throw new Error(data.error || 'Fout bij verwijderen gebruiker');
      }
    } catch (err) {
      throw err;
    }
  };

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-deep-green flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-gold/20 border-t-gold rounded-full animate-spin mx-auto mb-4" />
          <p className="text-cream/70 text-sm uppercase tracking-wider">
            Gebruiker laden...
          </p>
        </motion.div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-deep-green p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <Link href="/admin/gebruikers" className="text-gold hover:text-gold/80 text-sm mb-4 inline-block">
            &larr; Terug naar gebruikers
          </Link>
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-warm-red mb-4">{error || 'Gebruiker niet gevonden'}</div>
              <Button onClick={() => router.push('/admin/gebruikers')}>
                Terug naar gebruikerslijst
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-deep-green p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin/gebruikers" className="text-gold hover:text-gold/80 text-sm mb-4 inline-block">
            &larr; Terug naar gebruikers
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-4xl font-serif text-gold mb-2">{user.name}</h1>
              <p className="text-cream/70 mb-3">{user.email}</p>
              <div className="flex flex-wrap gap-2">
                <span className={`px-3 py-1 text-sm rounded-full border ${getRoleBadgeColor(user.role)}`}>
                  {formatRole(user.role)}
                </span>
                <span className={`px-3 py-1 text-sm rounded-full border ${getStatusBadgeColor(user.registration_status)}`}>
                  {formatStatus(user.registration_status)}
                </span>
                {user.email_verified && (
                  <span className="px-3 py-1 text-sm rounded-full border bg-success-green/20 text-success-green border-success-green/30">
                    ✓ Email geverifieerd
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-gold font-bold text-4xl">{user.total_points}</div>
              <div className="text-cream/50 text-sm">totaal punten</div>
            </div>
          </div>
        </div>

        {/* Success Message */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-success-green/20 border border-success-green rounded-lg"
            >
              <p className="text-success-green text-sm">{successMessage}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-6">
          {/* Account Info + Role Selector */}
          <Card>
            <CardHeader>
              <CardTitle>Account informatie</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h5 className="text-sm font-semibold text-gold mb-1">Gebruikers ID</h5>
                  <p className="text-cream/70 text-sm font-mono">{user.id}</p>
                </div>
                <div>
                  <h5 className="text-sm font-semibold text-gold mb-1">Account aangemaakt</h5>
                  <p className="text-cream/70 text-sm">
                    {new Date(user.created_at).toLocaleDateString('nl-NL', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                {user.last_login_at && (
                  <div>
                    <h5 className="text-sm font-semibold text-gold mb-1">Laatst ingelogd</h5>
                    <p className="text-cream/70 text-sm">
                      {new Date(user.last_login_at).toLocaleDateString('nl-NL', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                )}
                {user.approved_at && (
                  <div>
                    <h5 className="text-sm font-semibold text-gold mb-1">Goedgekeurd op</h5>
                    <p className="text-cream/70 text-sm">
                      {new Date(user.approved_at).toLocaleDateString('nl-NL', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gold/10">
                <RoleSelector
                  currentRole={user.role}
                  userId={user.id}
                  isCurrentUser={isCurrentUser}
                  onRoleChange={handleRoleChange}
                />
              </div>
            </CardContent>
          </Card>

          {/* Points Manager */}
          <Card>
            <CardHeader>
              <CardTitle>Puntenbeheer</CardTitle>
            </CardHeader>
            <CardContent>
              <PointsManager
                user={user}
                pointsHistory={pointsHistory}
                onPointsUpdate={handlePointsUpdate}
              />
            </CardContent>
          </Card>

          {/* Registration Data (Expandable) */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Registratiegegevens</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowRegistration(!showRegistration)}
                >
                  {showRegistration ? '▲ Verberg' : '▼ Toon'}
                </Button>
              </div>
            </CardHeader>
            <AnimatePresence>
              {showRegistration && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <CardContent>
                    <RegistrationViewer userId={user.id} />
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>

          {/* Danger Zone */}
          <DangerZone
            user={user}
            isCurrentUser={isCurrentUser}
            onDeactivate={handleDeactivate}
            onReactivate={handleReactivate}
            onDelete={handleDelete}
          />
        </div>
      </div>
    </div>
  );
}
