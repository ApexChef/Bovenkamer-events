import { NextRequest, NextResponse } from 'next/server';
import { AIAssignment, SKILL_OPTIONS, MUSIC_DECADES, MUSIC_GENRES, QuizAnswers } from '@/types';

interface AssignmentRequest {
  name: string;
  skill: string;
  additionalSkills?: string;
  musicDecade: string;
  musicGenre: string;
  birthYear: number;
  quizAnswers: QuizAnswers;
}

// Get human-readable labels
function getSkillLabel(value: string): string {
  return SKILL_OPTIONS.find((s) => s.value === value)?.label || value;
}

function getDecadeLabel(value: string): string {
  return MUSIC_DECADES.find((d) => d.value === value)?.label || value;
}

function getGenreLabel(value: string): string {
  return MUSIC_GENRES.find((g) => g.value === value)?.label || value;
}

export async function POST(request: NextRequest) {
  try {
    const body: AssignmentRequest = await request.json();
    const { name, skill, additionalSkills, musicDecade, musicGenre, birthYear, quizAnswers } = body;

    const skillLabel = getSkillLabel(skill);
    const decadeLabel = getDecadeLabel(musicDecade);
    const genreLabel = getGenreLabel(musicGenre);

    // Build context from quiz answers
    const quizContext = Object.entries(quizAnswers)
      .filter(([, value]) => value && value.trim() !== '')
      .slice(0, 3)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');

    const prompt = `Je bent de BOVENKAMER WINTERPROEF COMMISSIE - een sarcastische maar vriendelijke jury die taken toewijst voor een nieuwjaars-BBQ van een alumni-groep (oud-leden Junior Kamer Venray, geboren 1980-1986).

De humor is droog en ironisch: wijs vaak het TEGENOVERGESTELDE toe van wat iemand claimt goed in te zijn. Maar houd het vriendelijk en grappig, niet gemeen.

PERSOON:
- Naam: ${name}
- Geboortejaar: ${birthYear}
- Claimt goed te zijn in: ${skillLabel}
${additionalSkills ? `- Extra talenten: ${additionalSkills}` : ''}
- Muziekvoorkeur: ${genreLabel} uit de ${decadeLabel}
${quizContext ? `- Quiz info: ${quizContext}` : ''}

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

    // Check if we have an API key
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      // Return a fallback assignment if no API key
      console.log('No ANTHROPIC_API_KEY configured, using fallback assignment');
      return NextResponse.json(generateFallbackAssignment(name, skillLabel));
    }

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error('Claude API error:', await response.text());
      return NextResponse.json(generateFallbackAssignment(name, skillLabel));
    }

    const data = await response.json();
    const content = data.content[0]?.text;

    if (!content) {
      return NextResponse.json(generateFallbackAssignment(name, skillLabel));
    }

    // Parse JSON from response
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const assignment: AIAssignment = JSON.parse(jsonMatch[0]);

        // Validate required fields
        if (
          assignment.officialTitle &&
          assignment.task &&
          assignment.reasoning &&
          assignment.warningLevel &&
          assignment.specialPrivilege
        ) {
          return NextResponse.json(assignment);
        }
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
    }

    return NextResponse.json(generateFallbackAssignment(name, skillLabel));
  } catch (error) {
    console.error('Assignment API error:', error);
    return NextResponse.json(
      { error: 'Kon toewijzing niet genereren' },
      { status: 500 }
    );
  }
}

function generateFallbackAssignment(name: string, skill: string): AIAssignment {
  // Fallback assignments based on claimed skill
  const fallbacks: Record<string, AIAssignment> = {
    cooking: {
      officialTitle: 'Sous-Chef Derde Klasse',
      task: 'U mag de sla wassen en de komkommers in perfecte plakjes snijden',
      reasoning: `${name} claimt een meesterchef te zijn. De commissie heeft besloten dit talent te kanaliseren richting taken waar weinig schade kan worden aangericht.`,
      warningLevel: 'GEEL',
      specialPrivilege: 'Mag het mes vasthouden (onder toezicht)',
    },
    bbq: {
      officialTitle: 'Assistent Roostermeester',
      task: 'Verantwoordelijk voor het omdraaien van de vegetarische burgers (de echte vlees wordt door professionals gedaan)',
      reasoning: `De commissie heeft nota genomen van ${name}'s passie voor vlees. Om schade te beperken, worden voorlopig alleen plantaardige producten toevertrouwd.`,
      warningLevel: 'ORANJE',
      specialPrivilege: 'Krijgt een extra servet',
    },
    wine: {
      officialTitle: 'Sommelier-in-Opleiding',
      task: 'U mag de wijn inschenken, maar alleen nadat een volwassene de fles heeft geopend',
      reasoning: `${name} noemt zichzelf een sommelier. De commissie vermoedt dat dit vooral gebaseerd is op het lezen van wijnkaarten bij de Albert Heijn.`,
      warningLevel: 'GEEL',
      specialPrivilege: 'Mag de kurken bewaren',
    },
    beer: {
      officialTitle: 'Minister van Schuimbeleid',
      task: 'Verantwoordelijk voor het monitoren van het schuimniveau op alle glazen',
      reasoning: `${name} beweert foutloos te kunnen tappen. De commissie heeft preventief besloten de tap op afstand te houden en enkel kwaliteitscontrole toe te staan.`,
      warningLevel: 'GROEN',
      specialPrivilege: 'Mag als eerste "proost" roepen',
    },
    fire: {
      officialTitle: 'Hoofd Vuurveiligheid',
      task: 'U houdt de brandblusser vast en let op dat niemand te dicht bij het vuur komt',
      reasoning: `Een "pyromaan in ruste" zoals ${name} zichzelf noemt, wordt uiteraard niet in de buurt van daadwerkelijk vuur gelaten. Preventie is beter dan blussen.`,
      warningLevel: 'ROOD',
      specialPrivilege: 'Krijgt een reflecterend hesje',
    },
    nothing: {
      officialTitle: 'Officiële Aanwezige',
      task: 'Uw taak is aanwezig zijn en af en toe instemmend knikken',
      reasoning: `${name} geeft eerlijk toe nergens goed in te zijn. De commissie waardeert deze zelfreflectie en beloont dit met een taak die perfect aansluit bij deze capaciteiten.`,
      warningLevel: 'GROEN',
      specialPrivilege: 'Mag zitten waar u wilt',
    },
  };

  return (
    fallbacks[skill] || {
      officialTitle: 'Algemeen Medewerker',
      task: 'U wordt ingezet waar nodig, wanneer nodig, en hoe de commissie dat nodig acht',
      reasoning: `De commissie heeft ${name}'s aanmelding ontvangen en beraadt zich nog over de meest passende taak. Voorlopig: flexibele inzet.`,
      warningLevel: 'GEEL',
      specialPrivilege: 'Mag als eerste het bierblikje openen',
    }
  );
}
