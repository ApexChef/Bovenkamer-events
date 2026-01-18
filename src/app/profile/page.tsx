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
  HelpCircle,
  Award,
  Beer,
  AlertTriangle
} from 'lucide-react';
import { useRegistrationStore, useAuthStore, SECTION_POINTS, TOTAL_PROFILE_POINTS } from '@/lib/store';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Select } from '@/components/ui';
import {
  SKILL_OPTIONS,
  MUSIC_DECADES,
  MUSIC_GENRES,
  GENDER_OPTIONS,
  JKV_JOIN_YEARS,
  JKV_EXIT_YEARS,
  JKV_STILL_ACTIVE
} from '@/types';

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
    description: 'Geboortedatum, geslacht en zelfvertrouwen',
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
    title: 'JKV/Bovenkamer Historie',
    description: 'Wanneer lid geworden en vertrokken?',
    points: SECTION_POINTS.jkvHistorie,
    icon: Award
  },
  {
    id: 'borrelStats',
    title: 'Borrel Statistieken',
    description: 'Welke borrels heb je bezocht?',
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
  // Personal section
  const [birthDate, setBirthDate] = useState(formData.birthDate || '');
  const [gender, setGender] = useState(formData.gender || '');
  const [selfConfidence, setSelfConfidence] = useState(formData.selfConfidence || 5);
  // Pre-fill partner info from attendance if available
  const [hasPartner, setHasPartner] = useState(
    formData.hasPartner || attendance.bringingPlusOne === true
  );
  const [partnerName, setPartnerName] = useState(
    formData.partnerName || attendance.plusOneName || ''
  );
  const [dietaryRequirements, setDietaryRequirements] = useState(formData.dietaryRequirements);

  // Skills section
  const [primarySkill, setPrimarySkill] = useState(formData.primarySkill);
  const [additionalSkills, setAdditionalSkills] = useState(formData.additionalSkills);

  // Music section
  const [musicDecade, setMusicDecade] = useState(formData.musicDecade);
  const [musicGenre, setMusicGenre] = useState(formData.musicGenre);

  // JKV Historie section
  const [jkvJoinYear, setJkvJoinYear] = useState<number | null>(formData.jkvJoinYear);
  const [jkvExitYear, setJkvExitYear] = useState<number | string | null>(formData.jkvExitYear);

  // Borrel Stats section
  const [borrelCount2025, setBorrelCount2025] = useState<number>(formData.borrelCount2025 || 0);
  const [borrelPlanning2026, setBorrelPlanning2026] = useState<number>(formData.borrelPlanning2026 || 0);

  // Quiz section
  const [quizAnswers, setQuizAnswers] = useState(formData.quizAnswers);

  // Validation warnings
  const [birthDateWarning, setBirthDateWarning] = useState<string | null>(null);

  useEffect(() => {
    if (_hasHydrated && !isAuthenticated) {
      router.push('/login');
    }
  }, [_hasHydrated, isAuthenticated, router]);

  // Sync local state with store after hydration
  useEffect(() => {
    if (_hasHydrated) {
      setBirthDate(formData.birthDate || '');
      setGender(formData.gender || '');
      setSelfConfidence(formData.selfConfidence || 5);
      setHasPartner(formData.hasPartner || attendance.bringingPlusOne === true);
      setPartnerName(formData.partnerName || attendance.plusOneName || '');
      setDietaryRequirements(formData.dietaryRequirements || '');
      setPrimarySkill(formData.primarySkill || '');
      setAdditionalSkills(formData.additionalSkills || '');
      setMusicDecade(formData.musicDecade || '');
      setMusicGenre(formData.musicGenre || '');
      setJkvJoinYear(formData.jkvJoinYear);
      setJkvExitYear(formData.jkvExitYear);
      setBorrelCount2025(formData.borrelCount2025 || 0);
      setBorrelPlanning2026(formData.borrelPlanning2026 || 0);
      setQuizAnswers(formData.quizAnswers || {});
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
        birthDate,
        gender,
        selfConfidence,
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
        primarySkill,
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

  const saveJkvSection = async () => {
    setIsLoading(true);
    try {
      // Calculate bovenkamerJoinYear from jkvExitYear
      const bovenkamerYear = jkvExitYear === JKV_STILL_ACTIVE ? null : (jkvExitYear as number);
      setFormData({
        jkvJoinYear,
        jkvExitYear,
        bovenkamerJoinYear: bovenkamerYear,
      });
      markSectionComplete('jkvHistorie');
      setExpandedSection(null);
    } finally {
      setIsLoading(false);
    }
  };

  const saveBorrelSection = async () => {
    setIsLoading(true);
    try {
      setFormData({
        borrelCount2025,
        borrelPlanning2026,
      });
      markSectionComplete('borrelStats');
      setExpandedSection(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Check birth date for 40+ warning
  const checkBirthDateWarning = (dateStr: string) => {
    if (!dateStr) {
      setBirthDateWarning(null);
      return;
    }
    const birthDate = new Date(dateStr);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    if (age < 40) {
      setBirthDateWarning(`Je bent ${age} jaar. De Bovenkamer is normaal voor 40+, maar je bent welkom!`);
    } else {
      setBirthDateWarning(null);
    }
  };

  const isPersonalValid = birthDate !== '' && gender !== '';
  const isSkillsValid = primarySkill !== '';
  const isMusicValid = musicDecade !== '' && musicGenre !== '';
  const isJkvValid = jkvJoinYear !== null && jkvExitYear !== null &&
    (jkvExitYear === JKV_STILL_ACTIVE || (typeof jkvExitYear === 'number' && jkvExitYear >= jkvJoinYear));
  const isBorrelValid = true; // Always valid, optional
  const isQuizValid = Object.keys(quizAnswers).length >= 5; // At least 5 answers

  const renderSectionContent = (sectionId: SectionId) => {
    switch (sectionId) {
      case 'personal':
        // Check if partner info comes from attendance (pre-filled)
        const hasPartnerFromAttendance = attendance.bringingPlusOne === true;

        return (
          <div className="space-y-4">
            {/* Geboortedatum */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-cream">
                Geboortedatum
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => {
                  setBirthDate(e.target.value);
                  checkBirthDateWarning(e.target.value);
                }}
                className="w-full px-4 py-3 bg-dark-wood/50 border border-cream/20 rounded-lg text-cream focus:outline-none focus:border-gold/50"
              />
              {birthDateWarning && (
                <div className="flex items-center gap-2 text-yellow-500 text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{birthDateWarning}</span>
                </div>
              )}
            </div>

            {/* Geslacht */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-cream">
                Geslacht
              </label>
              <div className="grid grid-cols-2 gap-2">
                {GENDER_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setGender(option.value)}
                    className={`px-4 py-3 rounded-lg border transition-all ${
                      gender === option.value
                        ? 'border-gold bg-gold/20 text-gold'
                        : 'border-cream/20 text-cream/60 hover:border-cream/40'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Zelfvertrouwen slider */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-cream">
                Zelfvertrouwen: {selfConfidence}/10
              </label>
              <div className="flex items-center gap-4">
                <span className="text-xs text-cream/50 w-20">Ik kan niks</span>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={selfConfidence}
                  onChange={(e) => setSelfConfidence(parseInt(e.target.value))}
                  className="flex-1 h-2 bg-dark-wood rounded-lg appearance-none cursor-pointer accent-gold"
                />
                <span className="text-xs text-cream/50 w-20 text-right">Ik ben de beste</span>
              </div>
              <div className="text-center">
                <span className="text-2xl">
                  {selfConfidence <= 2 ? '😅' :
                   selfConfidence <= 4 ? '🙂' :
                   selfConfidence <= 6 ? '😊' :
                   selfConfidence <= 8 ? '😎' : '🏆'}
                </span>
              </div>
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
            <div className="space-y-2">
              <label className="block text-sm font-medium text-cream">
                Primaire vaardigheid
              </label>
              <div className="grid grid-cols-2 gap-2">
                {SKILL_OPTIONS.map((skill) => (
                  <button
                    key={skill.value}
                    type="button"
                    onClick={() => setPrimarySkill(skill.value)}
                    className={`px-3 py-2 rounded-lg border text-left transition-all ${
                      primarySkill === skill.value
                        ? 'border-gold bg-gold/20 text-gold'
                        : 'border-cream/20 text-cream/60 hover:border-cream/40'
                    }`}
                  >
                    <span className="text-sm font-medium">{skill.label}</span>
                  </button>
                ))}
              </div>
            </div>

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
              Vertel ons over je JKV en Bovenkamer geschiedenis.
            </p>

            {/* JKV Join Year */}
            <Select
              label="Wanneer lid geworden van JKV?"
              value={jkvJoinYear?.toString() || ''}
              onChange={(e) => setJkvJoinYear(e.target.value ? parseInt(e.target.value) : null)}
              options={JKV_JOIN_YEARS.map(year => ({ value: year.toString(), label: year.toString() }))}
              placeholder="Selecteer jaar"
            />

            {/* JKV Exit Year */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-cream">
                Wanneer gestopt bij JKV?
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
                  Nog actief in JKV
                </button>
              </div>
              {jkvExitYear !== JKV_STILL_ACTIVE && (
                <Select
                  value={typeof jkvExitYear === 'number' ? jkvExitYear.toString() : ''}
                  onChange={(e) => setJkvExitYear(e.target.value ? parseInt(e.target.value) : null)}
                  options={JKV_EXIT_YEARS.filter(y => !jkvJoinYear || y >= jkvJoinYear).map(year => ({
                    value: year.toString(),
                    label: year.toString()
                  }))}
                  placeholder="Selecteer uittreed jaar"
                />
              )}
            </div>

            {/* Validation message */}
            {jkvJoinYear && jkvExitYear && jkvExitYear !== JKV_STILL_ACTIVE && (jkvExitYear as number) < jkvJoinYear && (
              <div className="flex items-center gap-2 text-warm-red text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>Uittreed jaar moet na instap jaar zijn</span>
              </div>
            )}

            {/* Bovenkamer Join Year (derived) */}
            {jkvExitYear && jkvExitYear !== JKV_STILL_ACTIVE && (
              <div className="p-4 bg-gold/10 border border-gold/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-gold" />
                  <span className="text-sm text-cream">Bovenkamer lid sinds: <strong className="text-gold">{jkvExitYear}</strong></span>
                </div>
              </div>
            )}

            <Button
              onClick={saveJkvSection}
              disabled={!isJkvValid || isLoading}
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
              Hoe vaak kom je naar de maandelijkse borrel? (10x per jaar, elke 4e donderdag)
            </p>

            {/* 2025 Borrels */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-cream">
                Borrels 2025: <span className="text-gold">{borrelCount2025}</span> van 10 bezocht
              </label>
              <div className="flex items-center gap-4">
                <span className="text-xs text-cream/50 w-12">Nooit</span>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={borrelCount2025}
                  onChange={(e) => setBorrelCount2025(parseInt(e.target.value))}
                  className="flex-1 h-2 bg-dark-wood rounded-lg appearance-none cursor-pointer accent-gold"
                />
                <span className="text-xs text-cream/50 w-12 text-right">Altijd</span>
              </div>
              <div className="text-center">
                <span className="text-2xl">
                  {borrelCount2025 === 0 ? '😢' :
                   borrelCount2025 <= 3 ? '🙂' :
                   borrelCount2025 <= 6 ? '😊' :
                   borrelCount2025 <= 9 ? '🍻' : '🏆'}
                </span>
                <p className="text-xs text-cream/50 mt-1">
                  {borrelCount2025 === 0 ? 'Nog nooit geweest' :
                   borrelCount2025 <= 3 ? 'Af en toe' :
                   borrelCount2025 <= 6 ? 'Regelmatig' :
                   borrelCount2025 <= 9 ? 'Trouwe bezoeker' : 'Nooit gemist!'}
                </p>
              </div>
            </div>

            {/* 2026 Planning */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-cream">
                Borrels 2026: <span className="text-gold">{borrelPlanning2026}</span> van 10 gepland
              </label>
              <div className="flex items-center gap-4">
                <span className="text-xs text-cream/50 w-12">Geen</span>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={borrelPlanning2026}
                  onChange={(e) => setBorrelPlanning2026(parseInt(e.target.value))}
                  className="flex-1 h-2 bg-dark-wood rounded-lg appearance-none cursor-pointer accent-gold"
                />
                <span className="text-xs text-cream/50 w-12 text-right">Allemaal</span>
              </div>
              <div className="text-center">
                <span className="text-2xl">
                  {borrelPlanning2026 === 0 ? '😢' :
                   borrelPlanning2026 <= 3 ? '🤔' :
                   borrelPlanning2026 <= 6 ? '👍' :
                   borrelPlanning2026 <= 9 ? '🎉' : '🌟'}
                </span>
                <p className="text-xs text-cream/50 mt-1">
                  {borrelPlanning2026 === 0 ? 'Geen plannen' :
                   borrelPlanning2026 <= 3 ? 'Misschien een paar' :
                   borrelPlanning2026 <= 6 ? 'Goede intenties' :
                   borrelPlanning2026 <= 9 ? 'Enthousiast!' : 'Superfan!'}
                </p>
              </div>
            </div>

            <Button
              onClick={saveBorrelSection}
              disabled={isLoading}
              isLoading={isLoading}
              className="w-full"
            >
              Opslaan (+{SECTION_POINTS.borrelStats} punten)
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
                ? 'border-l-4 border-l-success-green border-cream/10 bg-dark-wood/80 hover:border-gold/40 transition-colors'
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
                        {isCompleted && (
                          <p className="text-xs text-success-green mb-4 flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Al opgeslagen - je kunt aanpassen
                          </p>
                        )}
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
