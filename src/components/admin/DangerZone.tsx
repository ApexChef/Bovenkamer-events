'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { User } from '@/types';

interface DangerZoneProps {
  user: User;
  isCurrentUser: boolean;
  onDeactivate: () => Promise<void>;
  onReactivate: () => Promise<void>;
  onDelete: () => Promise<void>;
}

export function DangerZone({ user, isCurrentUser, onDeactivate, onReactivate, onDelete }: DangerZoneProps) {
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [error, setError] = useState('');

  const isInactive = user.registration_status === 'cancelled' || user.registration_status === 'rejected';

  const handleDeactivate = async () => {
    if (isCurrentUser) return;

    if (!confirm(`Weet je zeker dat je ${user.name} wilt deactiveren?\n\nDe gebruiker kan niet meer inloggen totdat de account opnieuw wordt geactiveerd.`)) {
      return;
    }

    setIsDeactivating(true);
    setError('');

    try {
      await onDeactivate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fout bij deactiveren gebruiker');
    } finally {
      setIsDeactivating(false);
    }
  };

  const handleReactivate = async () => {
    if (isCurrentUser) return;

    if (!confirm(`Weet je zeker dat je ${user.name} opnieuw wilt activeren?\n\nDe gebruiker kan daarna weer inloggen.`)) {
      return;
    }

    setIsReactivating(true);
    setError('');

    try {
      await onReactivate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fout bij reactiveren gebruiker');
    } finally {
      setIsReactivating(false);
    }
  };

  const handleDelete = async () => {
    if (isCurrentUser) return;

    if (deleteConfirmText !== 'DELETE') {
      setError('Type "DELETE" om te bevestigen');
      return;
    }

    setIsDeleting(true);
    setError('');

    try {
      await onDelete();
      // Navigation happens in parent component after successful delete
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fout bij verwijderen gebruiker');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isCurrentUser) {
    return (
      <div className="p-6 bg-warm-red/10 border-2 border-warm-red/30 rounded-lg">
        <h4 className="text-warm-red font-semibold mb-2">Danger Zone</h4>
        <p className="text-cream/70 text-sm">
          Je kunt je eigen account niet deactiveren of verwijderen. Vraag een andere admin om dit te doen.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-warm-red/10 border-2 border-warm-red/30 rounded-lg space-y-4">
      <div>
        <h4 className="text-warm-red font-semibold mb-2">Danger Zone</h4>
        <p className="text-cream/70 text-sm mb-4">
          Gevaarlijke acties die niet ongedaan gemaakt kunnen worden. Wees voorzichtig.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-warm-red/20 border border-warm-red rounded-lg">
          <p className="text-sm text-warm-red">{error}</p>
        </div>
      )}

      {/* Deactivate/Reactivate */}
      <div className="space-y-2">
        {!isInactive ? (
          <>
            <h5 className="text-cream font-semibold text-sm">Account deactiveren</h5>
            <p className="text-cream/60 text-xs mb-2">
              De gebruiker kan niet meer inloggen totdat de account opnieuw wordt geactiveerd.
              Alle data blijft behouden.
            </p>
            <Button
              variant="secondary"
              className="w-full border-warm-red text-warm-red hover:bg-warm-red/20"
              onClick={handleDeactivate}
              isLoading={isDeactivating}
              disabled={isCurrentUser}
            >
              Account deactiveren
            </Button>
          </>
        ) : (
          <>
            <h5 className="text-cream font-semibold text-sm">Account reactiveren</h5>
            <p className="text-cream/60 text-xs mb-2">
              De gebruiker kan weer inloggen en de app gebruiken.
            </p>
            <Button
              variant="secondary"
              className="w-full border-success-green text-success-green hover:bg-success-green/20"
              onClick={handleReactivate}
              isLoading={isReactivating}
              disabled={isCurrentUser}
            >
              Account reactiveren
            </Button>
          </>
        )}
      </div>

      {/* Hard Delete */}
      <div className="pt-4 border-t border-warm-red/20 space-y-2">
        <h5 className="text-warm-red font-semibold text-sm">Permanent verwijderen</h5>
        <p className="text-cream/60 text-xs mb-2">
          Verwijder deze gebruiker permanent inclusief alle data. Dit kan NIET ongedaan gemaakt worden!
        </p>

        {!showDeleteConfirm ? (
          <Button
            variant="secondary"
            className="w-full border-warm-red text-warm-red hover:bg-warm-red/30"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isCurrentUser}
          >
            Gebruiker verwijderen
          </Button>
        ) : (
          <div className="space-y-3 p-4 bg-warm-red/20 rounded-lg border border-warm-red">
            <p className="text-warm-red text-sm font-semibold">
              ⚠️ Laatste waarschuwing!
            </p>
            <p className="text-cream/70 text-xs">
              Dit verwijdert permanent:
            </p>
            <ul className="text-cream/70 text-xs list-disc list-inside space-y-1 ml-2">
              <li>Gebruikersaccount en inloggegevens</li>
              <li>Registratiegegevens</li>
              <li>Quiz resultaten en scores</li>
              <li>Voorspellingen en beoordelingen</li>
              <li>Puntengeschiedenis</li>
            </ul>

            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder='Type "DELETE" om te bevestigen'
              disabled={isDeleting}
            />

            <div className="flex gap-2">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmText('');
                  setError('');
                }}
                disabled={isDeleting}
              >
                Annuleren
              </Button>
              <Button
                variant="secondary"
                className="flex-1 border-warm-red bg-warm-red text-cream hover:bg-warm-red/90"
                onClick={handleDelete}
                isLoading={isDeleting}
                disabled={deleteConfirmText !== 'DELETE'}
              >
                Permanent verwijderen
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
