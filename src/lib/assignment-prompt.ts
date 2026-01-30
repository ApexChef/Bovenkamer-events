import {
  AIAssignment,
  SKILL_CATEGORIES,
  MUSIC_DECADES,
  MUSIC_GENRES,
  QuizAnswers,
  SkillSelections,
} from '@/types';

export interface AssignmentInput {
  name: string;
  skills: SkillSelections;
  additionalSkills?: string;
  musicDecade: string;
  musicGenre: string;
  birthYear: number;
  gender: string;
  selfConfidence: number;
  hasPartner: boolean;
  partnerName?: string;
  dietaryRequirements?: string;
  jkvJoinYear?: number | null;
  jkvExitYear?: number | string | null;
  borrelCount2025: number;
  borrelPlanning2026: number;
  quizAnswers: QuizAnswers;
}

const QUIZ_LABELS: Record<string, string> = {
  guiltyPleasureSong: 'Guilty pleasure nummer',
  bestConcert: 'Beste concert ooit',
  movieByHeart: 'Film die je uit het hoofd kent',
  secretSeries: 'Geheime guilty-pleasure serie',
  weirdestFood: 'Raarste dat je ooit hebt gegeten',
  signatureDish: 'Signature dish',
  foodRefusal: 'Weigert absoluut te eten',
  childhoodNickname: 'Bijnaam als kind',
  childhoodDream: 'Kinderdroom',
  firstCar: 'Eerste auto',
  hiddenTalent: 'Verborgen talent',
  irrationalFear: 'Irrationele angst',
  bucketList: 'Bucketlist item',
  bestJKMoment: 'Beste JK-moment',
  longestKnownMember: 'Langstkennende lid',
};

export function formatSkills(skills: SkillSelections): string {
  const lines: string[] = [];
  const nothingCategories: string[] = [];

  for (const [key, value] of Object.entries(skills)) {
    const category = SKILL_CATEGORIES[key as keyof typeof SKILL_CATEGORIES];
    if (!category) continue;

    if (value === 'nothing') {
      nothingCategories.push(category.label);
    } else {
      const option = category.options.find((o) => o.value === value);
      if (option) {
        lines.push(`${category.label}: ${option.label}`);
      }
    }
  }

  if (nothingCategories.length > 0) {
    lines.push(`Zegt niks te kunnen bij: ${nothingCategories.join(', ')}`);
  }

  return lines.join('\n  - ');
}

export function formatQuizAnswers(quizAnswers: QuizAnswers): string {
  return Object.entries(quizAnswers)
    .filter(([, value]) => value && value.trim() !== '')
    .map(([key, value]) => `${QUIZ_LABELS[key] || key}: ${value}`)
    .join('\n  - ');
}

export function getDecadeLabel(value: string): string {
  return MUSIC_DECADES.find((d) => d.value === value)?.label || value;
}

export function getGenreLabel(value: string): string {
  return MUSIC_GENRES.find((g) => g.value === value)?.label || value;
}

export function buildAssignmentPrompt(input: AssignmentInput): string {
  const {
    name, skills, additionalSkills, musicDecade, musicGenre,
    birthYear, gender, selfConfidence, hasPartner, partnerName,
    dietaryRequirements, jkvJoinYear, jkvExitYear,
    borrelCount2025, borrelPlanning2026, quizAnswers,
  } = input;

  const decadeLabel = getDecadeLabel(musicDecade);
  const genreLabel = getGenreLabel(musicGenre);
  const skillsFormatted = formatSkills(skills);
  const quizFormatted = formatQuizAnswers(quizAnswers);

  const exitYearText = jkvExitYear === 'nog_actief' ? 'Nog actief' : jkvExitYear ?? 'onbekend';

  return `Je bent de BOVENKAMER WINTERPROEF COMMISSIE - een sarcastische maar vriendelijke jury die taken toewijst voor een nieuwjaars-BBQ van een alumni-groep (oud-leden Junior Kamer Venray, geboren 1980-1986).

De humor is droog en ironisch: wijs vaak het TEGENOVERGESTELDE toe van wat iemand claimt goed in te zijn. Maar houd het vriendelijk en grappig, niet gemeen. Gebruik zoveel mogelijk van de persoonlijke info om de toewijzing écht persoonlijk te maken.

PERSOON:
- Naam: ${name}
- Geboortejaar: ${birthYear}
- Geslacht: ${gender}
- Zelfvertrouwen: ${selfConfidence}/10
- Partner: ${hasPartner ? (partnerName || 'Ja') : 'Nee'}

VAARDIGHEDEN:
  - ${skillsFormatted}
${additionalSkills ? `- Extra talenten: ${additionalSkills}` : ''}

ETEN & DRINKEN:
- Dieet: ${dietaryRequirements || 'geen beperkingen'}

JKV ACHTERGROND:
- Lid geworden: ${jkvJoinYear ?? 'onbekend'}
- Vertrokken: ${exitYearText}

SOCIALE BETROKKENHEID:
- Borrels bezocht in 2025: ${borrelCount2025}/10
- Borrels gepland voor 2026: ${borrelPlanning2026}/10

MUZIEKVOORKEUR:
- ${genreLabel} uit de ${decadeLabel}

${quizFormatted ? `QUIZ ANTWOORDEN:\n  - ${quizFormatted}` : ''}

OPDRACHT:
Genereer een JSON object met EXACT deze structuur (in het Nederlands):
{
  "officialTitle": "Een grappige officiële titel (bijv. 'Sous-Chef Derde Klasse', 'Hoofd Vuurverzorger', 'Minister van Schuimbeleid')",
  "task": "Een concrete, ironische taak (bijv. 'U mag de sla wassen', 'Verantwoordelijk voor het omdraaien van de worstjes... maar alleen de vegetarische')",
  "reasoning": "Een sarcastische maar vriendelijke motivatie van 2-3 zinnen waarom deze taak perfect is voor deze persoon",
  "warningLevel": "GROEN, GEEL, ORANJE of ROOD (afhankelijk van hoe 'gevaarlijk' hun taak is)",
  "specialPrivilege": "Een klein privilege als bonus (bijv. 'Mag eerste biertje inschenken', 'Krijgt de beste stoel bij het vuur')"
}

Geef ALLEEN het JSON object terug, geen andere tekst.`;
}

export function generateFallbackAssignment(name: string): AIAssignment {
  const fallbacks: AIAssignment[] = [
    {
      officialTitle: 'Sous-Chef Derde Klasse',
      task: 'U mag de sla wassen en de komkommers in perfecte plakjes snijden',
      reasoning: `De commissie heeft ${name}'s aanmelding uitvoerig bestudeerd en concludeert dat dit de meest verantwoorde inzet is. Iedereen begint onderaan.`,
      warningLevel: 'GEEL',
      specialPrivilege: 'Mag het mes vasthouden (onder toezicht)',
    },
    {
      officialTitle: 'Minister van Schuimbeleid',
      task: 'Verantwoordelijk voor het monitoren van het schuimniveau op alle glazen',
      reasoning: `${name} wordt ingezet op een cruciale post waar de commissie nog een vacature had. Het schuim wacht op niemand.`,
      warningLevel: 'GROEN',
      specialPrivilege: 'Mag als eerste "proost" roepen',
    },
    {
      officialTitle: 'Hoofd Vuurveiligheid',
      task: 'U houdt de brandblusser vast en let op dat niemand te dicht bij het vuur komt',
      reasoning: `De commissie acht ${name} geschikt voor deze verantwoordelijke positie. Preventie is beter dan blussen.`,
      warningLevel: 'ROOD',
      specialPrivilege: 'Krijgt een reflecterend hesje',
    },
    {
      officialTitle: 'Officiële Aanwezige',
      task: 'Uw taak is aanwezig zijn en af en toe instemmend knikken',
      reasoning: `Na uitvoerige analyse heeft de commissie besloten dat ${name}'s grootste bijdrage de aanwezigheid zelf is. Soms is dat genoeg.`,
      warningLevel: 'GROEN',
      specialPrivilege: 'Mag zitten waar u wilt',
    },
    {
      officialTitle: 'Algemeen Medewerker',
      task: 'U wordt ingezet waar nodig, wanneer nodig, en hoe de commissie dat nodig acht',
      reasoning: `De commissie heeft ${name}'s aanmelding ontvangen en beraadt zich nog over de meest passende taak. Voorlopig: flexibele inzet.`,
      warningLevel: 'GEEL',
      specialPrivilege: 'Mag als eerste het bierblikje openen',
    },
  ];

  return fallbacks[name.length % fallbacks.length];
}

export function parseAssignmentResponse(content: string): AIAssignment | null {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const assignment: AIAssignment = JSON.parse(jsonMatch[0]);
      if (
        assignment.officialTitle &&
        assignment.task &&
        assignment.reasoning &&
        assignment.warningLevel &&
        assignment.specialPrivilege
      ) {
        return assignment;
      }
    }
  } catch {
    // parse error — return null
  }
  return null;
}
