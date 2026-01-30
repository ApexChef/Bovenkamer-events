'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AuthGuard } from '@/components/AuthGuard';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { motion } from 'framer-motion';

interface FormSummary {
  id: string;
  key: string;
  name: string;
  description?: string;
  active_version_id?: string;
  section_count: number;
  field_count: number;
  response_count: number;
  created_at: string;
  updated_at: string;
}

export default function AdminFormulierenPage() {
  return (
    <AuthGuard requireAdmin requireApproved>
      <DashboardLayout>
        <FormulierenContent />
      </DashboardLayout>
    </AuthGuard>
  );
}

function FormulierenContent() {
  const [forms, setForms] = useState<FormSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchForms() {
      try {
        const res = await fetch('/api/admin/forms');
        if (!res.ok) throw new Error('Kan formulieren niet laden');
        const data = await res.json();
        setForms(data.forms || []);
      } catch (err) {
        console.error('Error fetching forms:', err);
        setError('Kon formulieren niet laden');
      } finally {
        setIsLoading(false);
      }
    }
    fetchForms();
  }, []);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-gold mb-2">
            Formulieren
          </h1>
          <p className="text-cream/60">Formulieren en vragen beheren</p>
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
      ) : error ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-warm-red">{error}</p>
          </CardContent>
        </Card>
      ) : forms.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-cream/60">Geen formulieren gevonden.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {forms.map((form, index) => (
            <motion.div
              key={form.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={`/admin/formulieren/${form.key}`}>
                <Card className="hover:border-gold/50 transition-colors cursor-pointer">
                  <CardContent className="py-5">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h2 className="text-gold font-semibold text-lg">{form.name}</h2>
                          <span className="text-cream/30 text-sm font-mono">{form.key}</span>
                        </div>
                        {form.description && (
                          <p className="text-cream/50 text-sm mb-2">{form.description}</p>
                        )}
                        <div className="flex gap-6 text-sm">
                          <span className="text-cream/60">
                            <span className="text-cream font-medium">{form.section_count}</span> secties
                          </span>
                          <span className="text-cream/60">
                            <span className="text-cream font-medium">{form.field_count}</span> velden
                          </span>
                          <span className="text-cream/60">
                            <span className="text-cream font-medium">{form.response_count}</span> inzendingen
                          </span>
                        </div>
                      </div>
                      <div className="text-cream/30 text-2xl ml-4">&rarr;</div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
