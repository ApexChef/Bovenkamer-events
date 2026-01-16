'use client';

import { useRegistrationStore } from '@/lib/store';
import { Select, TextArea, Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui';
import { SKILL_OPTIONS, MUSIC_DECADES, MUSIC_GENRES } from '@/types';
import { motion } from 'framer-motion';

export function Step2Skills() {
  const { formData, setFormData, nextStep, prevStep } = useRegistrationStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    nextStep();
  };

  const isValid =
    formData.primarySkill !== '' &&
    formData.musicDecade !== '' &&
    formData.musicGenre !== '';

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Capaciteiten & Voorkeuren</CardTitle>
          <CardDescription>
            De commissie wijst taken toe op basis van uw (vermeende) talenten
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gold mb-3 uppercase tracking-wider">
                Waar bent u goed in?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SKILL_OPTIONS.map((skill) => (
                  <motion.button
                    key={skill.value}
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setFormData({ primarySkill: skill.value })}
                    className={`p-4 rounded-lg border text-left transition-all duration-200 ${
                      formData.primarySkill === skill.value
                        ? 'bg-gold/20 border-gold text-gold'
                        : 'bg-dark-wood/30 border-gold/20 text-cream hover:border-gold/50'
                    }`}
                  >
                    <span className="font-semibold block">{skill.label}</span>
                    <span className="text-sm opacity-70">{skill.description}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            <TextArea
              label="Aanvullende talenten"
              placeholder="Overige vaardigheden die de commissie moet weten (optioneel)"
              value={formData.additionalSkills}
              onChange={(e) =>
                setFormData({ additionalSkills: e.target.value })
              }
              hint="Wees niet te bescheiden, maar ook niet te overmoedig"
            />

            <div className="pt-4 border-t border-gold/10">
              <p className="text-sm text-gold mb-4 uppercase tracking-wider font-semibold">
                Muziekvoorkeur
              </p>
              <p className="text-cream/60 text-sm mb-4">
                Essentieel voor de juiste sfeer (en om u later mee te plagen)
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Select
                  label="Decennium"
                  options={MUSIC_DECADES}
                  placeholder="Kies een decennium"
                  value={formData.musicDecade}
                  onChange={(e) => setFormData({ musicDecade: e.target.value })}
                  required
                />

                <Select
                  label="Genre"
                  options={MUSIC_GENRES}
                  placeholder="Kies een genre"
                  value={formData.musicGenre}
                  onChange={(e) => setFormData({ musicGenre: e.target.value })}
                  required
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button type="button" variant="ghost" onClick={prevStep}>
              Vorige stap
            </Button>
            <Button type="submit" disabled={!isValid}>
              Volgende stap
            </Button>
          </CardFooter>
        </form>
      </Card>
    </motion.div>
  );
}
