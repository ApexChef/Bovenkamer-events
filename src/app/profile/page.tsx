'use client';

import { useState, useEffect, useMemo } from 'react';
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
  Briefcase,
  Music,
  HelpCircle,
  Award,
  Beer
} from 'lucide-react';
import { useRegistrationStore, useAuthStore, SECTION_POINTS, TOTAL_PROFILE_POINTS } from '@/lib/store';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Select } from '@/components/ui';
import { Slider } from '@/components/ui/Slider';
import {
  SKILL_CATEGORIES,
  SkillSelections,
  SkillCategoryKey,
  MUSIC_DECADES,
  MUSIC_GENRES,
  JKV_JOIN_YEARS,
  JKV_EXIT_YEARS,
  JKV_STILL_ACTIVE
} from '@/types';

// Event date for age calculation
const EVENT_DATE = new Date('2026-01-31');

// Validate birth date - soft validation
function validateBirthDate(dateStr: string): { isValid: boolean; warning?: string } {
  if (!dateStr) return { isValid: false };

  const birthDate = new Date(dateStr);
  const birthYear = birthDate.getFullYear();

  // Calculate age on event date
  let age = EVENT_DATE.getFullYear() - birthYear;
  const monthDiff = EVENT_DATE.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && EVENT_DATE.getDate() < birthDate.getDate())) {
    age--;
  }

  // Hard validation: born after 1980 is too young for this group
  if (birthYear > 1986) {
    return { isValid: true, warning: `Je bent ${age} jaar op de Winterproef. Normaal zijn gasten 40+, maar je bent welkom!` };
  }

  // Hard validation: born before 1960 seems too old
  if (birthYear < 1960) {
    return { isValid: true, warning: `Geboortejaar ${birthYear} - weet je zeker dat dit klopt?` };
  }

  // Soft validation: should be at least 40 on event date
  if (age < 40) {
    return { isValid: true, warning: `Je bent ${age} jaar op de Winterproef. Normaal zijn gasten 40+, maar je bent welkom!` };
  }

  return { isValid: true };
}

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

type SectionId = 'personal' | 'skills' | 'music' | 'jkvHistorie' | 'borrelStats' | 'quiz';

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
    id: 'jkvHistorie',
    title: 'JKV Historie',
    description: 'Je Junior Kamer verleden',
    points: SECTION_POINTS.jkvHistorie,
    icon: Award
  },
  {
    id: 'borrelStats',
    title: 'Borrel Statistieken',
    description: 'Aanwezigheid 2025 & planning 2026',
    points: SECTION_POINTS.borrelStats,
    icon: Beer
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
  const { currentUser, isAuthenticated, _hasHydrated: authHydrated } = useAuthStore();
  const {
    formData,
    setFormData,
    completedSections,
    setCompletedSections,
    markSectionComplete,
    attendance,
    _hasHydrated: registrationHydrated
  } = useRegistrationStore();

  const [expandedSection, setExpandedSection] = useState<SectionId | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form state for each section
  // Pre-fill partner info from attendance if available
  const [birthDate, setBirthDate] = useState<string>(formData.birthDate || '');
  const [birthDateWarning, setBirthDateWarning] = useState<string>('');
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

  // JKV Historie
  const [jkvJoinYear, setJkvJoinYear] = useState<number | null>(formData.jkvJoinYear);
  const [jkvExitYear, setJkvExitYear] = useState<number | string | null>(formData.jkvExitYear);

  // Borrel Stats
  const [borrelCount2025, setBorrelCount2025] = useState(formData.borrelCount2025 ?? 0);
  const [borrelPlanning2026, setBorrelPlanning2026] = useState(formData.borrelPlanning2026 ?? 0);

  const [quizAnswers, setQuizAnswers] = useState(formData.quizAnswers);

  // Redirect if not authenticated (wait for BOTH stores to hydrate)
  useEffect(() => {
    if (registrationHydrated && authHydrated && !isAuthenticated) {
      router.push('/login');
    }
  }, [registrationHydrated, authHydrated, isAuthenticated, router]);

  // Load profile data from database on mount
  useEffect(() => {
    const loadProfileFromDb = async () => {
      if (!registrationHydrated || !authHydrated || !formData.email) return;

      try {
        const response = await fetch(`/api/profile?email=${encodeURIComponent(formData.email)}`);
        if (response.ok) {
          const data = await response.json();
          if (data.profile) {
            // Update local state with database values
            setFormData(data.profile);
            // Update ALL completed sections from API (overwrite to sync with actual points)
            if (data.completedSections) {
              setCompletedSections({
                basic: !!data.completedSections.basic,
                personal: !!data.completedSections.personal,
                skills: !!data.completedSections.skills,
                music: !!data.completedSections.music,
                jkvHistorie: !!data.completedSections.jkvHistorie,
                borrelStats: !!data.completedSections.borrelStats,
                quiz: !!data.completedSections.quiz,
              });
            }
          }
        }
      } catch (error) {
        console.error('Error loading profile from database:', error);
      }
    };

    loadProfileFromDb();
  }, [registrationHydrated, authHydrated, formData.email, setFormData, setCompletedSections]);

  // Sync local state with store after hydration
  useEffect(() => {
    if (registrationHydrated && authHydrated) {
      setBirthDate(formData.birthDate || '');
      setHasPartner(formData.hasPartner || attendance.bringingPlusOne === true);
      setPartnerName(formData.partnerName || attendance.plusOneName || '');
      setDietaryRequirements(formData.dietaryRequirements);
      setSkills(formData.skills || DEFAULT_SKILLS);
      setAdditionalSkills(formData.additionalSkills);
      setMusicDecade(formData.musicDecade);
      setMusicGenre(formData.musicGenre);
      setJkvJoinYear(formData.jkvJoinYear);
      setJkvExitYear(formData.jkvExitYear);
      setBorrelCount2025(formData.borrelCount2025 ?? 0);
      setBorrelPlanning2026(formData.borrelPlanning2026 ?? 0);
      setQuizAnswers(formData.quizAnswers);
    }
  }, [registrationHydrated, authHydrated, formData, attendance]);

  // Calculate points directly from Zustand's completedSections (which is synced from DB)
  // Using completedSections directly ensures React re-renders when values change
  // NOTE: This hook must be called unconditionally (before any early returns)
  const points = useMemo(() => {
    let pts = 0;
    if (completedSections.basic) pts += SECTION_POINTS.basic;
    if (completedSections.personal) pts += SECTION_POINTS.personal;
    if (completedSections.skills) pts += SECTION_POINTS.skills;
    if (completedSections.music) pts += SECTION_POINTS.music;
    if (completedSections.jkvHistorie) pts += SECTION_POINTS.jkvHistorie;
    if (completedSections.borrelStats) pts += SECTION_POINTS.borrelStats;
    if (completedSections.quiz) pts += SECTION_POINTS.quiz;
    return pts;
  }, [completedSections]);

  // Validate birth date when it changes
  // NOTE: This hook must be called unconditionally (before any early returns)
  useEffect(() => {
    if (birthDate) {
      const validation = validateBirthDate(birthDate);
      setBirthDateWarning(validation.warning || '');
    } else {
      setBirthDateWarning('');
    }
  }, [birthDate]);

  const percentage = Math.round((points / TOTAL_PROFILE_POINTS) * 100);

  if (!registrationHydrated || !authHydrated) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const toggleSection = (sectionId: SectionId) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  // Helper to save section to database
  const saveSectionToDb = async (section: string, data: Record<string, unknown>) => {
    try {
      await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          section,
          data,
        }),
      });
    } catch (error) {
      console.error('Error saving to database:', error);
    }
  };

  const savePersonalSection = async () => {
    setIsLoading(true);
    try {
      // Extract year from birthDate for backward compatibility
      const birthYear = birthDate ? new Date(birthDate).getFullYear() : null;
      const data = {
        birthDate,
        birthYear,
        hasPartner,
        partnerName,
        dietaryRequirements,
      };
      setFormData(data);
      await saveSectionToDb('personal', data);
      markSectionComplete('personal');
      setExpandedSection(null);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSkillsSection = async () => {
    setIsLoading(true);
    try {
      const data = {
        skills,
        additionalSkills,
      };
      setFormData(data);
      await saveSectionToDb('skills', data);
      markSectionComplete('skills');
      setExpandedSection(null);
    } finally {
      setIsLoading(false);
    }
  };

  const saveMusicSection = async () => {
    setIsLoading(true);
    try {
      const data = {
        musicDecade,
        musicGenre,
      };
      setFormData(data);
      await saveSectionToDb('music', data);
      markSectionComplete('music');
      setExpandedSection(null);
    } finally {
      setIsLoading(false);
    }
  };

  const saveJkvHistorieSection = async () => {
    setIsLoading(true);
    try {
      // Calculate bovenkamerJoinYear from jkvExitYear
      const bovenkamerJoinYear = jkvExitYear === JKV_STILL_ACTIVE
        ? new Date().getFullYear()
        : typeof jkvExitYear === 'number' ? jkvExitYear : null;

      const data = {
        jkvJoinYear,
        jkvExitYear,
        bovenkamerJoinYear,
      };
      setFormData(data);
      await saveSectionToDb('jkvHistorie', data);
      markSectionComplete('jkvHistorie');
      setExpandedSection(null);
    } finally {
      setIsLoading(false);
    }
  };

  const saveBorrelStatsSection = async () => {
    setIsLoading(true);
    try {
      const data = {
        borrelCount2025,
        borrelPlanning2026,
      };
      setFormData(data);
      await saveSectionToDb('borrelStats', data);
      markSectionComplete('borrelStats');
      setExpandedSection(null);
    } finally {
      setIsLoading(false);
    }
  };

  const saveQuizSection = async () => {
    setIsLoading(true);
    try {
      const data = {
        quizAnswers,
      };
      setFormData(data);
      await saveSectionToDb('quiz', data);
      markSectionComplete('quiz');
      setExpandedSection(null);
    } finally {
      setIsLoading(false);
    }
  };

  const isPersonalValid = birthDate !== '' && validateBirthDate(birthDate).isValid;
  // All 8 skill categories must be selected
  const isSkillsValid = Object.values(skills).every(skill => skill !== '');
  const filledSkillsCount = Object.values(skills).filter(skill => skill !== '').length;
  const isMusicValid = musicDecade !== '' && musicGenre !== '';
  const isJkvHistorieValid = jkvJoinYear !== null && jkvExitYear !== null;
  const isBorrelStatsValid = true; // Sliders always have valid values
  const isQuizValid = Object.keys(quizAnswers).length >= 3; // At least 3 answers for closed questions

  const renderSectionContent = (sectionId: SectionId) => {
    switch (sectionId) {
      case 'personal':
        // Check if partner info comes from attendance (pre-filled)
        const hasPartnerFromAttendance = attendance.bringingPlusOne === true;

        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-cream">
                Geboortedatum
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                max="1986-12-31"
                min="1940-01-01"
                className="w-full px-4 py-3 bg-dark-wood/50 border border-cream/20 rounded-lg text-cream focus:outline-none focus:border-gold/50 [color-scheme:dark]"
              />
              {birthDateWarning && (
                <p className="text-sm text-yellow-500 mt-1">{birthDateWarning}</p>
              )}
            </div>

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
          <div className="space-y-6">
            <p className="text-sm text-cream/70">
              Selecteer per categorie wat je het beste kunt. &quot;Niks&quot; is ook een valide keuze!
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
                        onClick={() => setSkills({ ...skills, [categoryKey]: option.value })}
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

      case 'jkvHistorie':
        return (
          <div className="space-y-4">
            <p className="text-sm text-cream/70">
              Vertel ons over je Junior Kamer Venray historie.
            </p>

            <Select
              label="Wanneer ben je lid geworden van JKV?"
              value={jkvJoinYear?.toString() || ''}
              onChange={(e) => setJkvJoinYear(e.target.value ? parseInt(e.target.value) : null)}
              options={JKV_JOIN_YEARS.map(year => ({ value: year.toString(), label: year.toString() }))}
              placeholder="Selecteer jaar"
            />

            <div className="space-y-2">
              <label className="block text-sm font-medium text-cream">
                Wanneer ben je gestopt bij JKV?
              </label>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setJkvExitYear(JKV_STILL_ACTIVE)}
                  className={`px-4 py-3 rounded-lg border transition-all ${
                    jkvExitYear === JKV_STILL_ACTIVE
                      ? 'border-gold bg-gold/20 text-gold'
                      : 'border-cream/20 text-cream/60 hover:border-cream/40'
                  }`}
                >
                  Nog actief! 🎉
                </button>
                <button
                  type="button"
                  onClick={() => setJkvExitYear(null)}
                  className={`px-4 py-3 rounded-lg border transition-all ${
                    jkvExitYear !== JKV_STILL_ACTIVE && jkvExitYear !== null
                      ? 'border-gold bg-gold/20 text-gold'
                      : jkvExitYear === null
                        ? 'border-cream/20 text-cream/60 hover:border-cream/40'
                        : 'border-cream/20 text-cream/60 hover:border-cream/40'
                  }`}
                >
                  Gestopt in...
                </button>
              </div>
              {jkvExitYear !== JKV_STILL_ACTIVE && (
                <Select
                  value={typeof jkvExitYear === 'number' ? jkvExitYear.toString() : ''}
                  onChange={(e) => setJkvExitYear(e.target.value ? parseInt(e.target.value) : null)}
                  options={JKV_EXIT_YEARS.map(year => ({ value: year.toString(), label: year.toString() }))}
                  placeholder="Selecteer jaar"
                />
              )}
            </div>

            {jkvJoinYear && jkvExitYear && (
              <div className="p-3 bg-gold/10 rounded-lg border border-gold/20">
                <p className="text-sm text-cream/70">
                  {jkvExitYear === JKV_STILL_ACTIVE ? (
                    <>Je bent al <span className="text-gold font-bold">{new Date().getFullYear() - jkvJoinYear} jaar</span> lid van JKV! 💪</>
                  ) : (
                    <>Je was <span className="text-gold font-bold">{(jkvExitYear as number) - jkvJoinYear} jaar</span> lid van JKV</>
                  )}
                </p>
              </div>
            )}

            <Button
              onClick={saveJkvHistorieSection}
              disabled={!isJkvHistorieValid || isLoading}
              isLoading={isLoading}
              className="w-full"
            >
              Opslaan (+{SECTION_POINTS.jkvHistorie} punten)
            </Button>
          </div>
        );

      case 'borrelStats':
        return (
          <div className="space-y-6">
            <p className="text-sm text-cream/70">
              Hoe vaak was je bij de Bovenkamer borrels? (Elke 4e donderdag van de maand)
            </p>

            <Slider
              label="Borrels bezocht in 2025"
              min={0}
              max={10}
              value={borrelCount2025}
              onChange={(e) => setBorrelCount2025(parseInt(e.target.value))}
              unit=" borrels"
              hint="Jan t/m nov 2025 (10 borrels)"
            />

            <Slider
              label="Borrels gepland voor 2026"
              min={0}
              max={10}
              value={borrelPlanning2026}
              onChange={(e) => setBorrelPlanning2026(parseInt(e.target.value))}
              unit=" borrels"
              hint="Hoeveel denk je te komen?"
            />

            <div className="p-3 bg-gold/10 rounded-lg border border-gold/20">
              <p className="text-sm text-cream/70">
                {borrelCount2025 === 0 && borrelPlanning2026 === 0 && (
                  <>Tijd om vaker langs te komen! 😄</>
                )}
                {borrelCount2025 > 0 && borrelCount2025 <= 3 && (
                  <>Af en toe laat je je gezicht zien 👍</>
                )}
                {borrelCount2025 > 3 && borrelCount2025 <= 6 && (
                  <>Een trouwe bezoeker! 🍻</>
                )}
                {borrelCount2025 > 6 && (
                  <>Een echte stamgast! 🏆</>
                )}
                {borrelPlanning2026 > borrelCount2025 && (
                  <> En je bent van plan vaker te komen in 2026, top!</>
                )}
              </p>
            </div>

            <Button
              onClick={saveBorrelStatsSection}
              disabled={!isBorrelStatsValid || isLoading}
              isLoading={isLoading}
              className="w-full"
            >
              Opslaan (+{SECTION_POINTS.borrelStats} punten)
            </Button>
          </div>
        );

      case 'quiz':
        // Quiz options for closed questions
        const guiltyPleasureOptions = [
          { value: 'abba', label: 'ABBA - Dancing Queen' },
          { value: 'backstreet', label: 'Backstreet Boys - I Want It That Way' },
          { value: 'spice', label: 'Spice Girls - Wannabe' },
          { value: 'aqua', label: 'Aqua - Barbie Girl' },
          { value: 'rickroll', label: 'Rick Astley - Never Gonna Give You Up' },
          { value: 'andre', label: 'André Hazes - Bloed, Zweet en Tranen' },
        ];

        const concertOptions = [
          { value: 'never', label: 'Nog nooit geweest 😅' },
          { value: 'small', label: 'Klein lokaal optreden' },
          { value: 'medium', label: 'Club of theater' },
          { value: 'large', label: 'Arena/Stadion' },
          { value: 'festival', label: 'Festival (Pinkpop, Lowlands, etc.)' },
        ];

        const movieGenreOptions = [
          { value: 'action', label: 'Actie & Avontuur' },
          { value: 'comedy', label: 'Komedie' },
          { value: 'drama', label: 'Drama' },
          { value: 'horror', label: 'Horror' },
          { value: 'scifi', label: 'Sci-Fi & Fantasy' },
          { value: 'romance', label: 'Romantiek' },
        ];

        const cookingSkillOptions = [
          { value: 'none', label: 'Ik kan water koken 🔥' },
          { value: 'basic', label: 'Basis gerechten' },
          { value: 'good', label: 'Best goed, als ik zeg zo zelf' },
          { value: 'chef', label: 'Ik word regelmatig gevraagd te koken' },
          { value: 'master', label: 'Masterchef niveau' },
        ];

        const hiddenTalentOptions = [
          { value: 'music', label: 'Muzikaal (instrument/zingen)' },
          { value: 'sports', label: 'Sportief talent' },
          { value: 'art', label: 'Creatief/Kunst' },
          { value: 'tech', label: 'Technisch/Handig' },
          { value: 'social', label: 'Mensen vermaken' },
          { value: 'none', label: 'Ik hou het geheim 🤫' },
        ];

        const answeredCount = Object.values(quizAnswers).filter(v => v && v.trim() !== '').length;

        return (
          <div className="space-y-5">
            <p className="text-sm text-cream/70">
              Beantwoord minimaal 3 vragen. Deze worden gebruikt in de quiz tijdens het event!
            </p>

            {/* Guilty Pleasure Song */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-cream">
                Guilty pleasure song? 🎵
              </label>
              <div className="grid grid-cols-2 gap-2">
                {guiltyPleasureOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setQuizAnswers({ ...quizAnswers, guiltyPleasureSong: option.value })}
                    className={`px-3 py-2 text-sm rounded-lg border transition-all text-left ${
                      quizAnswers.guiltyPleasureSong === option.value
                        ? 'border-gold bg-gold/20 text-gold'
                        : 'border-cream/20 text-cream/70 hover:border-cream/40'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Concert Experience */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-cream">
                Grootste concert ervaring? 🎸
              </label>
              <div className="grid grid-cols-1 gap-2">
                {concertOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setQuizAnswers({ ...quizAnswers, bestConcert: option.value })}
                    className={`px-3 py-2 text-sm rounded-lg border transition-all text-left ${
                      quizAnswers.bestConcert === option.value
                        ? 'border-gold bg-gold/20 text-gold'
                        : 'border-cream/20 text-cream/70 hover:border-cream/40'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Favorite Movie Genre */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-cream">
                Favoriete film genre? 🎬
              </label>
              <div className="grid grid-cols-2 gap-2">
                {movieGenreOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setQuizAnswers({ ...quizAnswers, movieByHeart: option.value })}
                    className={`px-3 py-2 text-sm rounded-lg border transition-all text-left ${
                      quizAnswers.movieByHeart === option.value
                        ? 'border-gold bg-gold/20 text-gold'
                        : 'border-cream/20 text-cream/70 hover:border-cream/40'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Cooking Skill */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-cream">
                Hoe goed kun je koken? 👨‍🍳
              </label>
              <div className="grid grid-cols-1 gap-2">
                {cookingSkillOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setQuizAnswers({ ...quizAnswers, signatureDish: option.value })}
                    className={`px-3 py-2 text-sm rounded-lg border transition-all text-left ${
                      quizAnswers.signatureDish === option.value
                        ? 'border-gold bg-gold/20 text-gold'
                        : 'border-cream/20 text-cream/70 hover:border-cream/40'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Hidden Talent */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-cream">
                Verborgen talent? 🌟
              </label>
              <div className="grid grid-cols-2 gap-2">
                {hiddenTalentOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setQuizAnswers({ ...quizAnswers, hiddenTalent: option.value })}
                    className={`px-3 py-2 text-sm rounded-lg border transition-all text-left ${
                      quizAnswers.hiddenTalent === option.value
                        ? 'border-gold bg-gold/20 text-gold'
                        : 'border-cream/20 text-cream/70 hover:border-cream/40'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-xs text-cream/50 text-center">
              {answeredCount} van minimaal 3 vragen beantwoord
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
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold text-gold">Profiel Aanvullen</h1>
          <p className="text-sm text-cream/60">Verdien extra punten</p>
        </div>
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
    </DashboardLayout>
  );
}
