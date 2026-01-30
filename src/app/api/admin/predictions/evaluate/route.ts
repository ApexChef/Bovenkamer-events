import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getUserFromRequest, isAdmin } from '@/lib/auth/jwt';
import { AIAssignment, Predictions } from '@/types';

interface PredictionField {
  key: string;
  label: string;
  type: 'numeric' | 'person' | 'boolean' | 'time';
}

const PREDICTION_FIELDS: PredictionField[] = [
  { key: 'wineBottles', label: 'Flessen wijn', type: 'numeric' },
  { key: 'beerCrates', label: 'Kratten bier', type: 'numeric' },
  { key: 'meatKilos', label: "Kilo's vlees", type: 'numeric' },
  { key: 'firstSleeper', label: 'Eerste slaper', type: 'person' },
  { key: 'spontaneousSinger', label: 'Spontane zanger', type: 'person' },
  { key: 'firstToLeave', label: 'Eerste vertrekker', type: 'person' },
  { key: 'lastToLeave', label: 'Laatste vertrekker', type: 'person' },
  { key: 'loudestLaugher', label: 'Luidste lacher', type: 'person' },
  { key: 'longestStoryTeller', label: 'Langste verhaal', type: 'person' },
  { key: 'somethingBurned', label: 'Iets aangebrand', type: 'boolean' },
  { key: 'outsideTemp', label: 'Buitentemperatuur', type: 'numeric' },
  { key: 'lastGuestTime', label: 'Laatste gast vertrokken', type: 'time' },
];

function formatPredictionValue(value: unknown, type: string, participantMap: Map<string, string>): string {
  if (value === undefined || value === null) return '(niet ingevuld)';
  if (type === 'boolean') return value ? 'Ja' : 'Nee';
  if (type === 'person') return participantMap.get(String(value)) || String(value);
  return String(value);
}

function buildEvaluationPrompt(
  userName: string,
  originalAssignment: AIAssignment | null,
  predictions: Predictions,
  actualResults: Record<string, unknown>,
  breakdown: Record<string, number>,
  totalPoints: number,
  maxPoints: number,
  rank: number,
  totalUsers: number,
  participantMap: Map<string, string>,
): string {
  const predictionLines = PREDICTION_FIELDS.map((field) => {
    const predicted = (predictions as Record<string, unknown>)[field.key];
    const actual = actualResults[field.key];
    const points = breakdown[field.key] ?? 0;
    const predStr = formatPredictionValue(predicted, field.type, participantMap);
    const actStr = formatPredictionValue(actual, field.type, participantMap);
    return `- ${field.label}: voorspeld "${predStr}", werkelijk "${actStr}" → ${points} punten`;
  }).join('\n');

  const originalTitle = originalAssignment?.officialTitle
    ? `- Originele functietitel: "${originalAssignment.officialTitle}"`
    : '';

  return `Je bent de BOVENKAMER WINTERPROEF COMMISSIE. Beoordeel de voorspelkwaliteiten van deze persoon op basis van hun voorspellingen vs de werkelijkheid.

De humor is droog en ironisch. Verwijs specifiek naar hun voorspellingen. Maak het persoonlijk en grappig. Gebruik het Nederlands.

PERSOON:
- Naam: ${userName}
${originalTitle}

VOORSPELLINGEN vs WERKELIJKHEID:
${predictionLines}

TOTAAL: ${totalPoints} van ${maxPoints} punten (rank #${rank} van ${totalUsers})

Genereer een JSON object met EXACT deze structuur (in het Nederlands):
{
  "officialTitle": "Een grappige titel op basis van hun voorspelkwaliteiten (bijv. 'Nostradamus van Venray', 'De Blinde Mol', 'Orakel van de Bovenkamer')",
  "task": "Een sarcastische aanbeveling of opdracht op basis van hoe goed/slecht ze voorspelden",
  "reasoning": "Een droog-humoristische analyse van 2-3 zinnen met specifieke verwijzingen naar hun meest opvallende voorspellingen",
  "warningLevel": "GROEN (als ze goed voorspelden) of GEEL (gemiddeld) of ORANJE (matig) of ROOD (hopeloos)",
  "specialPrivilege": "Een passend privilege of straf op basis van hun score"
}

Geef ALLEEN het JSON object terug, geen andere tekst.`;
}

function generateFallbackEvaluation(name: string, totalPoints: number, maxPoints: number): AIAssignment {
  const ratio = maxPoints > 0 ? totalPoints / maxPoints : 0;

  if (ratio >= 0.5) {
    return {
      officialTitle: 'Redelijk Ziener',
      task: 'Mag volgend jaar weer voorspellen (maar verwacht er niet te veel van)',
      reasoning: `${name} heeft een behoorlijke score neergezet. De commissie is mild onder de indruk, maar waarschuwt voor overmoedigheid.`,
      warningLevel: 'GROEN',
      specialPrivilege: 'Mag als eerste de uitslag zien bij het volgende event',
    };
  } else if (ratio >= 0.25) {
    return {
      officialTitle: 'Gokker Zonder Richting',
      task: 'Wordt aangeraden een muntje te gebruiken bij toekomstige voorspellingen',
      reasoning: `${name} had evenveel kans gehad door willekeurig te gokken. De commissie adviseert een carrièreswitch naar iets met minder onzekerheid.`,
      warningLevel: 'ORANJE',
      specialPrivilege: 'Krijgt een troostprijs: een kop koffie',
    };
  } else {
    return {
      officialTitle: 'De Blinde Mol',
      task: 'Mag volgend jaar niet meer voorspellen zonder begeleiding',
      reasoning: `${name} heeft er werkelijk niets van gebakken. De commissie overweegt een voorspelverbod.`,
      warningLevel: 'ROOD',
      specialPrivilege: 'Mag het scorebord vasthouden (zodat iedereen kan zien hoe het niet moet)',
    };
  }
}

// Reuse scoring logic from calculate route
function getBreakdown(
  predictions: Predictions,
  actual: Record<string, unknown>,
): { total: number; breakdown: Record<string, number> } {
  let total = 0;
  const breakdown: Record<string, number> = {};

  const scoreNumeric = (predicted: number | undefined, actualVal: number | undefined, key: string) => {
    if (predicted === undefined || actualVal === undefined) return;
    const diff = Math.abs(predicted - actualVal);
    const percentDiff = actualVal !== 0 ? (diff / actualVal) * 100 : (diff === 0 ? 0 : 100);
    if (diff === 0) { breakdown[key] = 50; total += 50; }
    else if (percentDiff <= 10) { breakdown[key] = 25; total += 25; }
    else if (percentDiff <= 25) { breakdown[key] = 10; total += 10; }
    else { breakdown[key] = 0; }
  };

  const scoreExact = (predicted: unknown, actualVal: unknown, key: string) => {
    if (predicted === undefined || actualVal === undefined) return;
    if (predicted === actualVal) { breakdown[key] = 50; total += 50; }
    else { breakdown[key] = 0; }
  };

  const scoreTime = (predicted: number | undefined, actualVal: number | undefined, key: string) => {
    if (predicted === undefined || actualVal === undefined) return;
    const diff = Math.abs(predicted - actualVal);
    if (diff === 0) { breakdown[key] = 50; total += 50; }
    else if (diff <= 1) { breakdown[key] = 25; total += 25; }
    else if (diff <= 2) { breakdown[key] = 10; total += 10; }
    else { breakdown[key] = 0; }
  };

  scoreNumeric(predictions.wineBottles, actual.wineBottles as number | undefined, 'wineBottles');
  scoreNumeric(predictions.beerCrates, actual.beerCrates as number | undefined, 'beerCrates');
  scoreNumeric(predictions.meatKilos, actual.meatKilos as number | undefined, 'meatKilos');
  scoreExact(predictions.firstSleeper, actual.firstSleeper, 'firstSleeper');
  scoreExact(predictions.spontaneousSinger, actual.spontaneousSinger, 'spontaneousSinger');
  scoreExact(predictions.firstToLeave, actual.firstToLeave, 'firstToLeave');
  scoreExact(predictions.lastToLeave, actual.lastToLeave, 'lastToLeave');
  scoreExact(predictions.loudestLaugher, actual.loudestLaugher, 'loudestLaugher');
  scoreExact(predictions.longestStoryTeller, actual.longestStoryTeller, 'longestStoryTeller');
  scoreExact(predictions.somethingBurned, actual.somethingBurned, 'somethingBurned');
  scoreNumeric(predictions.outsideTemp, actual.outsideTemp as number | undefined, 'outsideTemp');
  scoreTime(predictions.lastGuestTime, actual.lastGuestTime as number | undefined, 'lastGuestTime');

  return { total, breakdown };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(request: NextRequest) {
  try {
    const adminUser = await getUserFromRequest(request);
    if (!adminUser || !isAdmin(adminUser)) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Admin toegang vereist' },
        { status: 403 },
      );
    }

    const supabase = createServerClient();

    // 1. Fetch actual results
    const { data: resultsData, error: resultsError } = await supabase
      .from('prediction_results')
      .select('results')
      .limit(1)
      .single();

    if (resultsError || !resultsData?.results) {
      return NextResponse.json(
        { error: 'NO_RESULTS', message: 'Geen uitkomsten gevonden. Vul eerst de uitkomsten in.' },
        { status: 400 },
      );
    }

    const actualResults: Record<string, unknown> = resultsData.results;

    // 2. Fetch all registrations with predictions + user data
    const { data: registrations, error: regError } = await supabase
      .from('registrations')
      .select('user_id, predictions, ai_assignment');

    if (regError) {
      return NextResponse.json(
        { error: 'DATABASE_ERROR', message: 'Kon registraties niet ophalen' },
        { status: 500 },
      );
    }

    // 4. Fetch user names
    const { data: users } = await supabase
      .from('users')
      .select('id, name');

    const userNameMap = new Map((users || []).map((u) => [u.id, u.name]));

    // 5. Fetch participant list for formatting person fields
    const { data: participantsRaw } = await supabase
      .from('users')
      .select('id, name')
      .eq('is_active', true);

    const participantMap = new Map((participantsRaw || []).map((p) => [p.id, p.name]));

    // 6. Calculate scores and rankings for all users
    const scoredUsers: {
      userId: string;
      name: string;
      predictions: Predictions;
      aiAssignment: AIAssignment | null;
      total: number;
      breakdown: Record<string, number>;
    }[] = [];

    for (const reg of registrations || []) {
      if (!reg.predictions || Object.keys(reg.predictions).length === 0) continue;
      const { total, breakdown } = getBreakdown(reg.predictions as Predictions, actualResults);
      scoredUsers.push({
        userId: reg.user_id,
        name: userNameMap.get(reg.user_id) || 'Onbekend',
        predictions: reg.predictions as Predictions,
        aiAssignment: reg.ai_assignment as AIAssignment | null,
        total,
        breakdown,
      });
    }

    // Sort by score descending for ranking
    scoredUsers.sort((a, b) => b.total - a.total);

    const maxPoints = PREDICTION_FIELDS.length * 50; // 12 fields × 50 max each
    const totalUsers = scoredUsers.length;
    const apiKey = process.env.ANTHROPIC_API_KEY;

    let generated = 0;
    let failed = 0;
    const errors: string[] = [];

    // 7. Generate evaluation for each user
    for (let i = 0; i < scoredUsers.length; i++) {
      const user = scoredUsers[i];
      const rank = i + 1;

      let evaluation: AIAssignment;

      if (apiKey) {
        try {
          const prompt = buildEvaluationPrompt(
            user.name,
            user.aiAssignment,
            user.predictions,
            actualResults,
            user.breakdown,
            user.total,
            maxPoints,
            rank,
            totalUsers,
            participantMap,
          );

          const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey,
              'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
              model: 'claude-3-haiku-20240307',
              max_tokens: 800,
              messages: [{ role: 'user', content: prompt }],
            }),
          });

          if (!response.ok) {
            console.error(`Claude API error for ${user.name}:`, await response.text());
            evaluation = generateFallbackEvaluation(user.name, user.total, maxPoints);
          } else {
            const data = await response.json();
            const content = data.content[0]?.text;
            const jsonMatch = content?.match(/\{[\s\S]*\}/);

            if (jsonMatch) {
              const parsed: AIAssignment = JSON.parse(jsonMatch[0]);
              if (parsed.officialTitle && parsed.task && parsed.reasoning && parsed.warningLevel && parsed.specialPrivilege) {
                evaluation = parsed;
              } else {
                evaluation = generateFallbackEvaluation(user.name, user.total, maxPoints);
              }
            } else {
              evaluation = generateFallbackEvaluation(user.name, user.total, maxPoints);
            }
          }

          // Rate limit: wait between API calls
          if (i < scoredUsers.length - 1) {
            await delay(200);
          }
        } catch (err) {
          console.error(`Error generating evaluation for ${user.name}:`, err);
          evaluation = generateFallbackEvaluation(user.name, user.total, maxPoints);
          errors.push(`${user.name}: ${err instanceof Error ? err.message : 'Onbekende fout'}`);
          failed++;
        }
      } else {
        evaluation = generateFallbackEvaluation(user.name, user.total, maxPoints);
      }

      // 8. Upsert into user_evaluations
      const { error: upsertError } = await supabase
        .from('user_evaluations')
        .upsert(
          {
            user_id: user.userId,
            type: 'prediction',
            evaluation,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,type' },
        );

      if (upsertError) {
        console.error(`Upsert error for ${user.name}:`, upsertError);
        errors.push(`${user.name}: ${upsertError.message}`);
        failed++;
      } else {
        generated++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `${generated} evaluaties gegenereerd`,
      generated,
      failed,
      total: totalUsers,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Evaluate predictions error:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Er ging iets mis bij het genereren van evaluaties' },
      { status: 500 },
    );
  }
}
