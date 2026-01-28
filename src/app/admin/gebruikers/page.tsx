'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/AuthGuard';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { User } from '@/types';
import Link from 'next/link';

export default function AdminUsersPage() {
  return (
    <AuthGuard requireAdmin requireApproved>
      <AdminUsersContent />
    </AuthGuard>
  );
}

function AdminUsersContent() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const ITEMS_PER_PAGE = 20;

  // Helper functions for badges
  const getRoleBadgeColor = (role: User['role']) => {
    switch (role) {
      case 'admin':
        return 'bg-gold/20 text-gold';
      case 'quizmaster':
        return 'bg-blue-500/20 text-blue-400';
      case 'participant':
      default:
        return 'bg-cream/10 text-cream/70';
    }
  };

  const formatRole = (role: User['role']) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'quizmaster': return 'Quizmaster';
      case 'participant': return 'Deelnemer';
      default: return role;
    }
  };

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // Reset to first page on new search
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: ITEMS_PER_PAGE.toString(),
      });

      if (debouncedSearch) {
        params.append('search', debouncedSearch);
      }

      const response = await fetch(`/api/admin/users?${params}`);
      const data = await response.json();

      if (response.ok) {
        setUsers(data.users || []);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.totalCount || 0);
      } else {
        setError(data.error || 'Kon gebruikers niet laden');
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('Netwerkfout bij ophalen gebruikers');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, debouncedSearch]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRefresh = () => {
    fetchUsers();
  };

  const handleUserClick = (userId: string) => {
    router.push(`/admin/gebruikers/${userId}`);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPaginationRange = () => {
    const range = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        range.push(i);
      }
    } else {
      // Always show first page
      range.push(1);

      if (currentPage > 3) {
        range.push('...');
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        range.push(i);
      }

      if (currentPage < totalPages - 2) {
        range.push('...');
      }

      // Always show last page
      range.push(totalPages);
    }

    return range;
  };

  return (
    <div className="min-h-screen bg-deep-green p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin" className="text-gold hover:text-gold/80 text-sm mb-4 inline-block">
            &larr; Terug naar admin dashboard
          </Link>
          <h1 className="text-4xl font-serif text-gold mb-2">Gebruikersbeheer</h1>
          <p className="text-cream/70">
            Bekijk en beheer alle gebruikers, rollen en punten
          </p>
        </div>

        {/* Search and Controls */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Zoek op naam of email..."
                  disabled={isLoading}
                />
              </div>
              <Button
                variant="secondary"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                ↻ Vernieuwen
              </Button>
            </div>

            <div className="mt-4 flex items-center gap-4 text-sm">
              <div className="text-cream/70">
                <span className="text-gold font-semibold">{totalCount}</span> gebruiker{totalCount !== 1 ? 's' : ''}
              </div>
              {debouncedSearch && (
                <div className="text-cream/50">
                  Zoekresultaten voor &ldquo;{debouncedSearch}&rdquo;
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-gold/20 border-t-gold rounded-full animate-spin mx-auto mb-4" />
            <p className="text-cream/70 text-sm">Gebruikers laden...</p>
          </div>
        ) : error ? (
          <Card>
            <CardContent className="p-8">
              <div className="text-center">
                <div className="text-warm-red mb-4">{error}</div>
                <Button onClick={handleRefresh}>Opnieuw proberen</Button>
              </div>
            </CardContent>
          </Card>
        ) : users.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-cream/50">
              {debouncedSearch
                ? <>Geen gebruikers gevonden voor &ldquo;{debouncedSearch}&rdquo;</>
                : 'Nog geen gebruikers'}
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Users Table */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-6 overflow-x-auto"
            >
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gold/20">
                    <th className="text-left py-3 px-4 text-gold font-semibold text-sm">Naam</th>
                    <th className="text-left py-3 px-4 text-gold font-semibold text-sm hidden md:table-cell">Email</th>
                    <th className="text-left py-3 px-4 text-gold font-semibold text-sm">Rol</th>
                    <th className="text-right py-3 px-4 text-gold font-semibold text-sm">Punten</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                      onClick={() => handleUserClick(user.id)}
                      className="border-b border-gold/10 hover:bg-gold/5 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="text-cream font-medium">{user.name}</div>
                        <div className="text-cream/50 text-xs md:hidden">{user.email}</div>
                      </td>
                      <td className="py-3 px-4 text-cream/70 text-sm hidden md:table-cell">
                        {user.email}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                          {formatRole(user.role)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-gold font-bold">{user.total_points || 0}</span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </motion.div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1 || isLoading}
                    >
                      ← Vorige
                    </Button>

                    <div className="flex items-center gap-2">
                      {getPaginationRange().map((page, index) => (
                        typeof page === 'number' ? (
                          <button
                            key={index}
                            onClick={() => handlePageChange(page)}
                            disabled={isLoading}
                            className={`
                              px-3 py-1 rounded text-sm transition-colors
                              ${page === currentPage
                                ? 'bg-gold text-dark-wood font-bold'
                                : 'bg-dark-wood/30 text-cream/70 hover:bg-dark-wood/50 hover:text-cream'
                              }
                              ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                            `}
                          >
                            {page}
                          </button>
                        ) : (
                          <span key={index} className="text-cream/30 px-2">
                            {page}
                          </span>
                        )
                      ))}
                    </div>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages || isLoading}
                    >
                      Volgende →
                    </Button>
                  </div>

                  <div className="text-center text-cream/50 text-xs mt-3">
                    Pagina {currentPage} van {totalPages}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
