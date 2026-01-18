'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  User,
  ChevronDown,
  ChevronUp,
  Check,
  Star,
  ArrowLeft,
  Calendar,
  Users,
  Utensils,
  Briefcase,
  Music,
  HelpCircle
} from 'lucide-react';
import { useRegistrationStore, useAuthStore, SECTION_POINTS, TOTAL_PROFILE_POINTS } from '@/lib/store';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Select } from '@/components/ui';
import { SKILL_CATEGORIES, SkillSelections, SkillCategoryKey, MUSIC_DECADES, MUSIC_GENRES, BIRTH_YEARS } from '@/types';

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

type SectionId = 'personal' | 'skills' | 'music' | 'quiz';

interface Section {
  id: SectionId;
  title: string;
  description: string;
  points: number;
  icon: React.ElementType;
}

const sections: Section[] = [
  {
    id: 'personal',
    title: 'Persoonlijke Gegevens',
    description: 'Geboortejaar, partner en dieetwensen',
    points: SECTION_POINTS.personal,
    icon: Calendar
  },
  {
    id: 'skills',
    title: 'Vaardigheden',
    description: 'Wat breng jij mee naar het feest?',
    points: SECTION_POINTS.skills,
    icon: Briefcase
  },
  {
    id: 'music',
    title: 'Muziekvoorkeuren',
    description: 'Welk decennium en genre?',
    points: SECTION_POINTS.music,
    icon: Music
  },
  {
    id: 'quiz',
    title: 'Persoonlijke Quiz',
    description: 'Vertel ons meer over jezelf',
    points: SECTION_POINTS.quiz,
    icon: HelpCircle
  },
];

export default function ProfilePage() {
  const router = useRouter();
  const { currentUser, isAuthenticated } = useAuthStore();
  const {
    formData,
    setFormData,
    completedSections,
    markSectionComplete,
    getProfileCompletion,
    attendance,
    _hasHydrated
  } = useRegistrationStore();

  const [expandedSection, setExpandedSection] = useState<SectionId | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form state for each section
  // Pre-fill partner info from attendance if available
  const [birthYear, setBirthYear] = useState<number | null>(formData.birthYear);
  const [hasPartner, setHasPartner] = useState(
    formData.hasPartner || attendance.bringingPlusOne === true
  );
  const [partnerName, setPartnerName] = useState(
    formData.partnerName || attendance.plusOneName || ''
  );
  const [dietaryRequirements, setDietaryRequirements] = useState(formData.dietaryRequirements);

  const [skills, setSkills] = useState<SkillSelections>(formData.skills || DEFAULT_SKILLS);
  const [additionalSkills, setAdditionalSkills] = useState(formData.additionalSkills);

  const [musicDecade, setMusicDecade] = useState(formData.musicDecade);
  const [musicGenre, setMusicGenre] = useState(formData.musicGenre);

  const [quizAnswers, setQuizAnswers] = useState(formData.quizAnswers);

  // Redirect if not authenticated
  useEffect(() => {
    if (_hasHydrated && !isAuthenticated) {
      router.push('/login');
    }
  }, [_hasHydrated, isAuthenticated, router]);

  // Sync local state with store after hydration
  useEffect(() => {
    if (_hasHydrated) {
      setBirthYear(formData.birthYear);
      setHasPartner(formData.hasPartner || attendance.bringingPlusOne === true);
      setPartnerName(formData.partnerName || attendance.plusOneName || '');
      setDietaryRequirements(formData.dietaryRequirements);
      setSkills(formData.skills || DEFAULT_SKILLS);
      setAdditionalSkills(formData.additionalSkills);
      setMusicDecade(formData.musicDecade);
      setMusicGenre(formData.musicGenre);
      setQuizAnswers(formData.quizAnswers);
    }
  }, [_hasHydrated, formData, attendance]);

  if (!_hasHydrated) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const { percentage, points } = getProfileCompletion();

  const toggleSection = (sectionId: SectionId) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  const savePersonalSection = async () => {
    setIsLoading(true);
    try {
      setFormData({
        birthYear,
        hasPartner,
        partnerName,
        dietaryRequirements,
      });
      markSectionComplete('personal');
      setExpandedSection(null);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSkillsSection = async () => {
    setIsLoading(true);
    try {
      setFormData({
        skills,
        additionalSkills,
      });
      markSectionComplete('skills');
      setExpandedSection(null);
    } finally {
      setIsLoading(false);
    }
  };

  const saveMusicSection = async () => {
    setIsLoading(true);
    try {
      setFormData({
        musicDecade,
        musicGenre,
      });
      markSectionComplete('music');
      setExpandedSection(null);
    } finally {
      setIsLoading(false);
    }
  };

  const saveQuizSection = async () => {
    setIsLoading(true);
    try {
      setFormData({
        quizAnswers,
      });
      markSectionComplete('quiz');
      setExpandedSection(null);
    } finally {
      setIsLoading(false);
    }
  };

  const isPersonalValid = birthYear !== null;
  // All 8 skill categories must be selected
  const isSkillsValid = Object.values(skills).every(skill => skill !== '');
  const filledSkillsCount = Object.values(skills).filter(skill => skill !== '').length;
  const isMusicValid = musicDecade !== '' && musicGenre !== '';
  const isQuizValid = Object.keys(quizAnswers).length >= 5; // At least 5 answers

  const renderSectionContent = (sectionId: SectionId) => {
    switch (sectionId) {
      case 'personal':
        // Check if partner info comes from attendance (pre-filled)
        const hasPartnerFromAttendance = attendance.bringingPlusOne === true;

        return (
          <div className="space-y-4">
            <Select
              label="Geboortejaar"
              value={birthYear?.toString() || ''}
              onChange={(e) => setBirthYear(e.target.value ? parseInt(e.target.value) : null)}
              options={BIRTH_YEARS.map(year => ({ value: year.toString(), label: year.toString() }))}
              placeholder="Selecteer je geboortejaar"
            />

            {/* Show pre-filled partner info or ask */}
            {hasPartnerFromAttendance ? (
              <div className="space-y-3 p-4 bg-gold/10 border border-gold/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gold" />
                    <span className="text-sm text-cream">Je komt met +1</span>
                  </div>
                  <span className="text-xs text-cream/50">(via aanmelding)</span>
                </div>
                {partnerName && (
                  <p className="text-gold font-medium">{partnerName}</p>
                )}
                <Input
                  label="Naam partner/+1 aanpassen"
                  value={partnerName}
                  onChange={(e) => {
                    setPartnerName(e.target.value);
                    setHasPartner(true);
                  }}
                  placeholder="Naam van je partner/+1"
                />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-cream">
                    Kom je met partner?
                  </label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setHasPartner(false)}
                      className={`flex-1 px-4 py-3 rounded-lg border transition-all ${
                        !hasPartner
                          ? 'border-gold bg-gold/20 text-gold'
                          : 'border-cream/20 text-cream/60 hover:border-cream/40'
                      }`}
                    >
                      Nee, alleen
                    </button>
                    <button
                      type="button"
                      onClick={() => setHasPartner(true)}
                      className={`flex-1 px-4 py-3 rounded-lg border transition-all ${
                        hasPartner
                          ? 'border-gold bg-gold/20 text-gold'
                          : 'border-cream/20 text-cream/60 hover:border-cream/40'
                      }`}
                    >
                      Ja, met partner
                    </button>
                  </div>
                </div>

                {hasPartner && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <Input
                      label="Naam partner"
                      value={partnerName}
                      onChange={(e) => setPartnerName(e.target.value)}
                      placeholder="Naam van je partner"
                    />
                  </motion.div>
                )}
              </>
            )}

            <Input
              label="Dieetwensen (optioneel)"
              value={dietaryRequirements}
              onChange={(e) => setDietaryRequirements(e.target.value)}
              placeholder="Vegetarisch, allergieën, etc."
            />

            <Button
              onClick={savePersonalSection}
              disabled={!isPersonalValid || isLoading}
              isLoading={isLoading}
              className="w-full"
            >
              Opslaan (+{SECTION_POINTS.personal} punten)
            </Button>
          </div>
        );

      case 'skills':
        return (
          <div className="space-y-4">
            <p className="text-sm text-cream/70">
              Selecteer per categorie wat je het beste kunt. "Niks" is ook een valide keuze!
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(Object.entries(SKILL_CATEGORIES) as [SkillCategoryKey, typeof SKILL_CATEGORIES[SkillCategoryKey]][]).map(([categoryKey, category]) => (
                <div
                  key={categoryKey}
                  className={`p-3 rounded-lg border transition-all ${
                    skills[categoryKey]
                      ? 'border-gold/40 bg-gold/10'
                      : 'border-cream/20 bg-dark-wood/30'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{category.icon}</span>
                    <span className="text-sm font-medium text-cream">{category.label}</span>
                    {skills[categoryKey] && (
                      <Check className="w-4 h-4 text-success-green ml-auto" />
                    )}
                  </div>
                  <select
                    value={skills[categoryKey]}
                    onChange={(e) => setSkills({ ...skills, [categoryKey]: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-dark-wood border border-cream/20 rounded-lg text-cream focus:border-gold focus:outline-none"
                  >
                    <option value="">Selecteer...</option>
                    {category.options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <p className="text-xs text-cream/50 text-center">
              {filledSkillsCount} van 8 categorieën ingevuld
            </p>

            <Input
              label="Extra vaardigheden (optioneel)"
              value={additionalSkills}
              onChange={(e) => setAdditionalSkills(e.target.value)}
              placeholder="Andere talenten die je wilt delen"
            />

            <Button
              onClick={saveSkillsSection}
              disabled={!isSkillsValid || isLoading}
              isLoading={isLoading}
              className="w-full"
            >
              Opslaan (+{SECTION_POINTS.skills} punten)
            </Button>
          </div>
        );

      case 'music':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-cream">
                Favoriete muziek decennium
              </label>
              <div className="grid grid-cols-2 gap-2">
                {MUSIC_DECADES.map((decade) => (
                  <button
                    key={decade.value}
                    type="button"
                    onClick={() => setMusicDecade(decade.value)}
                    className={`px-3 py-3 rounded-lg border transition-all ${
                      musicDecade === decade.value
                        ? 'border-gold bg-gold/20 text-gold'
                        : 'border-cream/20 text-cream/60 hover:border-cream/40'
                    }`}
                  >
                    <span className="text-lg font-bold">{decade.label}</span>
                    <span className="text-xs block mt-1 opacity-70">{decade.description}</span>
                  </button>
                ))}
              </div>
            </div>

            <Select
              label="Muziekgenre"
              value={musicGenre}
              onChange={(e) => setMusicGenre(e.target.value)}
              options={MUSIC_GENRES.map(g => ({ value: g.value, label: g.label }))}
              placeholder="Selecteer je favoriete genre"
            />

            <Button
              onClick={saveMusicSection}
              disabled={!isMusicValid || isLoading}
              isLoading={isLoading}
              className="w-full"
            >
              Opslaan (+{SECTION_POINTS.music} punten)
            </Button>
          </div>
        );

      case 'quiz':
        return (
          <div className="space-y-4">
            <p className="text-sm text-cream/70">
              Beantwoord minimaal 5 vragen om punten te verdienen. Hoe meer je invult, hoe leuker de quiz wordt!
            </p>

            <Input
              label="Wat is je guilty pleasure song?"
              value={quizAnswers.guiltyPleasureSong || ''}
              onChange={(e) => setQuizAnswers({ ...quizAnswers, guiltyPleasureSong: e.target.value })}
              placeholder="Die ene song die je stiekem luistert..."
            />

            <Input
              label="Beste concert dat je hebt bezocht?"
              value={quizAnswers.bestConcert || ''}
              onChange={(e) => setQuizAnswers({ ...quizAnswers, bestConcert: e.target.value })}
              placeholder="Artiest en locatie"
            />

            <Input
              label="Welke film ken je uit je hoofd?"
              value={quizAnswers.movieByHeart || ''}
              onChange={(e) => setQuizAnswers({ ...quizAnswers, movieByHeart: e.target.value })}
              placeholder="Je favoriet"
            />

            <Input
              label="Wat is je geheime serie-verslaving?"
              value={quizAnswers.secretSeries || ''}
              onChange={(e) => setQuizAnswers({ ...quizAnswers, secretSeries: e.target.value })}
              placeholder="Die serie die je bingewatcht"
            />

            <Input
              label="Raarste eten dat je ooit hebt geprobeerd?"
              value={quizAnswers.weirdestFood || ''}
              onChange={(e) => setQuizAnswers({ ...quizAnswers, weirdestFood: e.target.value })}
              placeholder="Vertel..."
            />

            <Input
              label="Wat is je signature dish?"
              value={quizAnswers.signatureDish || ''}
              onChange={(e) => setQuizAnswers({ ...quizAnswers, signatureDish: e.target.value })}
              placeholder="Je specialiteit in de keuken"
            />

            <Input
              label="Verborgen talent?"
              value={quizAnswers.hiddenTalent || ''}
              onChange={(e) => setQuizAnswers({ ...quizAnswers, hiddenTalent: e.target.value })}
              placeholder="Iets wat niemand weet"
            />

            <p className="text-xs text-cream/50">
              {Object.values(quizAnswers).filter(v => v && v.trim() !== '').length} van minimaal 5 vragen beantwoord
            </p>

            <Button
              onClick={saveQuizSection}
              disabled={!isQuizValid || isLoading}
              isLoading={isLoading}
              className="w-full"
            >
              Opslaan (+{SECTION_POINTS.quiz} punten)
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <main className="min-h-screen pb-8">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-deep-green/95 backdrop-blur-sm border-b border-gold/20">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="p-2 rounded-lg hover:bg-gold/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gold" />
            </Link>
            <div className="flex-1">
              <h1 className="text-xl font-display font-bold text-gold">Profiel Aanvullen</h1>
              <p className="text-sm text-cream/60">Verdien extra punten</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-6">
        {/* Progress Overview */}
        <Card className="border-gold/30 bg-dark-wood/70">
          <CardContent className="py-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center">
                  <Star className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gold">{points}</p>
                  <p className="text-sm text-cream/60">van {TOTAL_PROFILE_POINTS} punten</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-cream">{percentage}%</p>
                <p className="text-xs text-cream/50">compleet</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-3 bg-dark-wood rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-gold to-gold/70"
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Basic Section - Always completed */}
        <Card className="border-l-4 border-l-success-green border-cream/10 bg-dark-wood/80">
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-success-green/20 rounded-full flex items-center justify-center">
                <Check className="w-5 h-5 text-success-green" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-cream">Basis Gegevens</p>
                <p className="text-xs text-cream/60">{formData.name} - {formData.email}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-success-green">+{SECTION_POINTS.basic}</p>
                <p className="text-xs text-cream/50">punten</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expandable Sections */}
        {sections.map((section) => {
          const isCompleted = completedSections[section.id];
          const isExpanded = expandedSection === section.id;
          const Icon = section.icon;

          return (
            <motion.div key={section.id} layout>
              <Card className={isCompleted
                ? 'border-l-4 border-l-success-green border-cream/10 bg-dark-wood/80'
                : 'border-cream/20 bg-dark-wood/50 hover:border-gold/40 transition-colors'
              }>
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full text-left"
                >
                  <CardContent className="py-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isCompleted
                          ? 'bg-success-green/20'
                          : 'bg-gold/20'
                      }`}>
                        {isCompleted ? (
                          <Check className="w-5 h-5 text-success-green" />
                        ) : (
                          <Icon className="w-5 h-5 text-gold" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-cream">{section.title}</p>
                        <p className="text-xs text-cream/60">{section.description}</p>
                      </div>
                      <div className="text-right flex items-center gap-2">
                        <div>
                          <p className={`text-sm font-bold ${isCompleted ? 'text-success-green' : 'text-gold'}`}>
                            {isCompleted ? '+' : ''}{section.points}
                          </p>
                          <p className="text-xs text-cream/50">punten</p>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-cream/40" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-cream/40" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 pt-2 border-t border-gold/10">
                        {renderSectionContent(section.id)}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          );
        })}

        {/* Completion Message */}
        {percentage === 100 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="border-gold bg-gold/10">
              <CardContent className="py-6 text-center">
                <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8 text-gold" />
                </div>
                <h3 className="text-xl font-display font-bold text-gold mb-2">
                  Profiel 100% Compleet!
                </h3>
                <p className="text-cream/70">
                  Je hebt alle {TOTAL_PROFILE_POINTS} profielpunten verdiend.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </main>
  );
}
