'use client';

import { useState } from 'react';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { User } from '@/types';

interface RoleSelectorProps {
  currentRole: User['role'];
  userId: string;
  isCurrentUser: boolean;
  onRoleChange: (newRole: User['role']) => Promise<void>;
}

const ROLE_OPTIONS = [
  { value: 'participant', label: 'Deelnemer' },
  { value: 'quizmaster', label: 'Quizmaster' },
  { value: 'admin', label: 'Admin' },
] as const;

export function RoleSelector({ currentRole, userId, isCurrentUser, onRoleChange }: RoleSelectorProps) {
  const [selectedRole, setSelectedRole] = useState<User['role']>(currentRole);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const hasChanged = selectedRole !== currentRole;

  const handleSave = async () => {
    if (!hasChanged || isCurrentUser) return;

    setIsLoading(true);
    setError('');

    try {
      await onRoleChange(selectedRole);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fout bij wijzigen rol');
      setSelectedRole(currentRole); // Reset to original
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Select
        label="Rol"
        value={selectedRole}
        onChange={(e) => setSelectedRole(e.target.value as User['role'])}
        options={ROLE_OPTIONS}
        disabled={isCurrentUser || isLoading}
        hint={isCurrentUser ? 'Je kunt je eigen rol niet wijzigen' : undefined}
      />

      {error && (
        <div className="p-3 bg-warm-red/20 border border-warm-red rounded-lg">
          <p className="text-sm text-warm-red">{error}</p>
        </div>
      )}

      {hasChanged && !isCurrentUser && (
        <Button
          onClick={handleSave}
          isLoading={isLoading}
          className="w-full"
        >
          Rol opslaan
        </Button>
      )}

      {isCurrentUser && (
        <div className="p-3 bg-gold/10 border border-gold/20 rounded-lg">
          <p className="text-sm text-cream/70">
            Je kunt je eigen rol niet wijzigen. Vraag een andere admin om jouw rol te wijzigen.
          </p>
        </div>
      )}
    </div>
  );
}
