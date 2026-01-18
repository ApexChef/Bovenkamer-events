'use client';

import { useRegistrationStore } from '@/lib/store';
import { Select, TextArea, Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui';
import { SKILL_CATEGORIES, SkillCategoryKey, SkillSelections, MUSIC_DECADES, MUSIC_GENRES } from '@/types';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

const DEFAULT_SKILLS: SkillSelections = {
  food_prep: '',
  bbq_grill: '',
  drinks: '',
  entertainment: '',
  atmosphere: '',
  social: '',
  cleanup: '',
  documentation: '',
};

export function Step2Skills() {
  const { formData, setFormData, nextStep, prevStep } = useRegistrationStore();

  // Ensure skills object exists with fallback to defaults
  const skills = formData.skills || DEFAULT_SKILLS;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    nextStep();
  };

  const handleSkillChange = (category: SkillCategoryKey, value: string) => {
    setFormData({
      skills: { ...skills, [category]: value },
    });
  };

  // All 8 skill categories must be selected, plus music
  const filledSkillsCount = Object.values(skills).filter(skill => skill !== '').length;
  const allSkillsFilled = filledSkillsCount === 8;
  const isValid =
    allSkillsFilled &&
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
                Waar bent u goed in? (per categorie)
              </label>
              <p className="text-sm text-cream/60 mb-4">
                Selecteer per categorie wat je het beste kunt. "Niks" is ook valide!
              </p>
              <div className="space-y-4">
                {(Object.entries(SKILL_CATEGORIES) as [SkillCategoryKey, typeof SKILL_CATEGORIES[SkillCategoryKey]][]).map(([categoryKey, category]) => (
                  <div
                    key={categoryKey}
                    className={`p-4 rounded-lg border transition-all ${
                      skills[categoryKey]
                        ? 'border-gold/40 bg-gold/5'
                        : 'border-cream/20 bg-dark-wood/30'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl">{category.icon}</span>
                      <span className="text-sm font-semibold text-cream">{category.label}</span>
                      {skills[categoryKey] && (
                        <Check className="w-4 h-4 text-success-green ml-auto" />
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {category.options.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleSkillChange(categoryKey, option.value)}
                          className={`px-3 py-3 min-h-[52px] text-sm rounded-lg border transition-all text-center flex items-center justify-center ${
                            skills[categoryKey] === option.value
                              ? 'border-gold bg-gold/20 text-gold font-medium'
                              : 'border-cream/20 text-cream/70 hover:border-cream/40 hover:text-cream'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-cream/50 text-center mt-3">
                {filledSkillsCount} van 8 categorieën ingevuld
              </p>
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
