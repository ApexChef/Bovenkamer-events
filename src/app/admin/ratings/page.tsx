'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AuthGuard } from '@/components/AuthGuard';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { motion } from 'framer-motion';

interface FormResponseRow {
  form_key: string;
  user_name: string;
  user_email: string;
  status: string;
  submitted_at: string;
  section_key: string;
  section_label: string;
  section_sort: number;
  field_key: string;
  field_label: string;
  field_type: string;
  is_required: boolean;
  field_sort: number;
  text: string | null;
  number: number | null;
  boolean: boolean | null;
  display_value: string;
}

interface UserResponse {
  name: string;
  email: string;
  status: string;
  submitted_at: string;
  fields: FormResponseRow[];
}

interface ApiResponse {
  form_key: string;
  total_responses: number;
  responses: UserResponse[];
  raw: FormResponseRow[];
}

export default function AdminRatingsPage() {
  return (
    <AuthGuard requireAdmin requireApproved>
      <AdminRatingsContent />
    </AuthGuard>
  );
}

function AdminRatingsContent() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/admin/forms/ratings/responses');
        if (res.ok) {
          setData(await res.json());
        }
      } catch (error) {
        console.error('Error fetching ratings:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  // Compute stats from raw data
  const starFields = data?.raw.filter((r) => r.field_type === 'star_rating') || [];
  const uniqueStarKeys = Array.from(new Set(starFields.map((r) => r.field_key)));
  const averages = uniqueStarKeys.map((key) => {
    const rows = starFields.filter((r) => r.field_key === key);
    const avg = rows.reduce((sum, r) => sum + (r.number || 0), 0) / (rows.length || 1);
    return { key, label: rows[0]?.field_label || key, avg, count: rows.length };
  });
  const overallAvg = starFields.length > 0
    ? starFields.reduce((sum, r) => sum + (r.number || 0), 0) / starFields.length
    : 0;

  const worthyRows = data?.raw.filter((r) => r.field_key === 'is_worthy') || [];
  const worthyYes = worthyRows.filter((r) => r.boolean === true).length;
  const worthyNo = worthyRows.filter((r) => r.boolean === false).length;
  const worthyPct = worthyRows.length > 0 ? Math.round((worthyYes / worthyRows.length) * 100) : 0;

  return (
    <main className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-gold mb-2">
              Beoordelingen
            </h1>
            <p className="text-cream/60">Boy Boom Winterproef resultaten</p>
          </div>
          <Link href="/admin">
            <Button variant="ghost">&larr; Terug</Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto mb-4" />
            <p className="text-cream/60">Laden...</p>
          </div>
        ) : !data || data.total_responses === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-6xl mb-4">⭐</div>
              <p className="text-cream/60">Nog geen beoordelingen ingediend.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card>
                  <CardContent className="py-4 text-center">
                    <p className="text-3xl font-bold text-gold">{data.total_responses}</p>
                    <p className="text-cream/60 text-sm">Beoordelingen</p>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card>
                  <CardContent className="py-4 text-center">
                    <p className="text-3xl font-bold text-gold">{overallAvg.toFixed(1)}</p>
                    <p className="text-cream/60 text-sm">Gemiddeld</p>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card>
                  <CardContent className="py-4 text-center">
                    <p className="text-3xl font-bold text-success-green">{worthyPct}%</p>
                    <p className="text-cream/60 text-sm">Waardig</p>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <Card>
                  <CardContent className="py-4 text-center">
                    <p className="text-3xl font-bold text-cream">
                      {worthyYes} <span className="text-cream/40 text-lg">/ {worthyNo}</span>
                    </p>
                    <p className="text-cream/60 text-sm">Ja / Nee</p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Average per criterion */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Gemiddelde per Criterium</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {averages.map((a) => (
                      <div key={a.key} className="flex items-center gap-4">
                        <span className="text-cream w-48 text-sm">{a.label}</span>
                        <div className="flex-1 bg-dark-wood/50 rounded-full h-4 overflow-hidden">
                          <div
                            className="bg-gold h-full rounded-full transition-all"
                            style={{ width: `${(a.avg / 5) * 100}%` }}
                          />
                        </div>
                        <span className="text-gold font-bold w-12 text-right">{a.avg.toFixed(1)}</span>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <span key={s} className={s <= Math.round(a.avg) ? 'text-gold' : 'text-gold/20'}>
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Per-user detail table */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
              <Card>
                <CardHeader>
                  <CardTitle>Alle Beoordelingen</CardTitle>
                  <CardDescription>{data.total_responses} inzendingen</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gold/20">
                          <th className="text-left py-3 px-2 text-gold font-semibold">Naam</th>
                          {averages.map((a) => (
                            <th key={a.key} className="text-center py-3 px-2 text-gold/70 font-normal text-xs">
                              {a.label}
                            </th>
                          ))}
                          <th className="text-center py-3 px-2 text-gold/70 font-normal text-xs">Waardig?</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.responses.map((user, index) => {
                          const fieldMap = new Map(user.fields.map((f) => [f.field_key, f]));
                          const worthy = fieldMap.get('is_worthy');
                          return (
                            <motion.tr
                              key={user.email}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: index * 0.03 }}
                              className="border-b border-gold/10 hover:bg-dark-wood/30"
                            >
                              <td className="py-3 px-2 text-cream font-medium">{user.name}</td>
                              {averages.map((a) => {
                                const field = fieldMap.get(a.key);
                                const val = field?.number;
                                return (
                                  <td key={a.key} className="text-center py-3 px-2">
                                    {val != null ? (
                                      <span className="text-cream/70">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                          <span key={s} className={s <= val ? 'text-gold' : 'text-gold/20'}>★</span>
                                        ))}
                                      </span>
                                    ) : (
                                      <span className="text-cream/30">-</span>
                                    )}
                                  </td>
                                );
                              })}
                              <td className="text-center py-3 px-2">
                                {worthy?.boolean === true && <span className="text-success-green font-semibold">Ja</span>}
                                {worthy?.boolean === false && <span className="text-warm-red font-semibold">Nee</span>}
                                {worthy?.boolean == null && <span className="text-cream/30">-</span>}
                              </td>
                            </motion.tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Open feedback */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
              <Card className="mt-8">
                <CardHeader>
                  <CardTitle>Open Feedback</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {data.responses.map((user) => {
                      const textFields = user.fields.filter(
                        (f) => f.field_type === 'text_long' && f.text
                      );
                      if (textFields.length === 0) return null;
                      return (
                        <div key={user.email} className="border-b border-gold/10 pb-4 last:border-0">
                          <p className="text-gold font-semibold mb-2">{user.name}</p>
                          {textFields.map((f) => (
                            <div key={f.field_key} className="mb-2">
                              <p className="text-cream/50 text-xs">{f.field_label}</p>
                              <p className="text-cream/80 text-sm">{f.text}</p>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </div>
    </main>
  );
}
