'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRegistrationStore } from '@/lib/store';
import { Button, Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui';
import { AIAssignment } from '@/types';
import { motion } from 'framer-motion';

const WARNING_COLORS = {
  GROEN: 'bg-success-green text-cream',
  GEEL: 'bg-yellow-500 text-dark-wood',
  ORANJE: 'bg-orange-500 text-dark-wood',
  ROOD: 'bg-warm-red text-cream',
};

export function Step4Assignment() {
  const router = useRouter();
  const { formData, aiAssignment, setAIAssignment, setComplete } = useRegistrationStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssignment = async () => {
      // Skip if we already have an assignment
      if (aiAssignment) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/assignment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            skill: formData.primarySkill,
            additionalSkills: formData.additionalSkills,
            musicDecade: formData.musicDecade,
            musicGenre: formData.musicGenre,
            birthYear: formData.birthYear,
            quizAnswers: formData.quizAnswers,
          }),
        });

        if (!response.ok) {
          throw new Error('Kon toewijzing niet genereren');
        }

        const data: AIAssignment = await response.json();
        setAIAssignment(data);
      } catch (err) {
        console.error('Assignment error:', err);
        // Use fallback assignment
        const fallback: AIAssignment = {
          officialTitle: 'Algemeen Medewerker',
          task: 'U wordt ingezet waar nodig',
          reasoning: `De commissie heeft uw aanmelding ontvangen, ${formData.name}. Uw claim "${formData.primarySkill}" goed te zijn is genoteerd en wordt met gepaste scepsis behandeld.`,
          warningLevel: 'GEEL',
          specialPrivilege: 'Mag als eerste het bierblikje openen',
        };
        setAIAssignment(fallback);
        setError('AI tijdelijk niet beschikbaar - standaard toewijzing gebruikt');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssignment();
  }, [formData, aiAssignment, setAIAssignment]);

  const [isSaving, setIsSaving] = useState(false);

  const handleComplete = async () => {
    setIsSaving(true);
    try {
      // Save to database
      const response = await fetch('/api/registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formData,
          aiAssignment: aiAssignment!,
        }),
      });

      if (!response.ok) {
        console.error('Failed to save registration to database');
        // Continue anyway - localStorage backup is available
      }
    } catch (err) {
      console.error('Error saving registration:', err);
      // Continue anyway - localStorage backup is available
    } finally {
      setIsSaving(false);
      setComplete(true);
      router.push('/dashboard');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-16">
          <div className="flex flex-col items-center justify-center text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-16 h-16 border-4 border-gold/30 border-t-gold rounded-full mb-6"
            />
            <h3 className="font-display text-xl text-gold mb-2">
              De Commissie Beraadslaagt...
            </h3>
            <p className="text-cream/60">
              Uw profiel wordt geanalyseerd en een passende taak wordt toegewezen.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const assignment = aiAssignment!;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card>
        <CardHeader className="text-center border-b-0 pb-0">
          <div className="mb-4">
            <span className="stamp text-xs animate-glow">TOEGEWEZEN</span>
          </div>
          <CardTitle className="text-3xl mb-2">Uw Officiële Functie</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3 text-sm text-yellow-200">
              {error}
            </div>
          )}

          {/* Official Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center py-6 bg-dark-wood/50 rounded-lg border border-gold/30"
          >
            <p className="text-cream/50 text-sm uppercase tracking-wider mb-2">
              Hierbij benoemd tot
            </p>
            <h2 className="font-display text-3xl md:text-4xl text-gold">
              {assignment.officialTitle}
            </h2>
          </motion.div>

          {/* Task */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gold/10 border border-gold/30 rounded-lg p-6"
          >
            <p className="text-gold text-sm uppercase tracking-wider mb-2 font-semibold">
              Uw Taak
            </p>
            <p className="text-cream text-lg">{assignment.task}</p>
          </motion.div>

          {/* Reasoning */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <p className="text-gold text-sm uppercase tracking-wider mb-2 font-semibold">
              Motivatie van de Commissie
            </p>
            <p className="text-cream/80 italic leading-relaxed">
              &ldquo;{assignment.reasoning}&rdquo;
            </p>
          </motion.div>

          {/* Warning Level & Privilege */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div className="bg-dark-wood/30 rounded-lg p-4 border border-gold/20">
              <p className="text-cream/50 text-xs uppercase tracking-wider mb-2">
                Risico-niveau
              </p>
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
                  WARNING_COLORS[assignment.warningLevel]
                }`}
              >
                {assignment.warningLevel}
              </span>
            </div>

            <div className="bg-dark-wood/30 rounded-lg p-4 border border-gold/20">
              <p className="text-cream/50 text-xs uppercase tracking-wider mb-2">
                Speciaal Privilege
              </p>
              <p className="text-gold font-medium">{assignment.specialPrivilege}</p>
            </div>
          </motion.div>

          {/* Signature */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-center pt-6 border-t border-gold/20"
          >
            <p className="text-cream/40 text-xs uppercase tracking-widest mb-2">
              Namens de Bovenkamer Winterproef Commissie
            </p>
            <p className="font-display text-gold italic">
              De Voorzitter
            </p>
          </motion.div>
        </CardContent>

        <CardFooter className="flex justify-center pt-6">
          <Button size="lg" onClick={handleComplete} isLoading={isSaving}>
            {isSaving ? 'Opslaan...' : 'Naar Mijn Dashboard'}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
