import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getUserFromRequest, isAdmin } from '@/lib/auth/jwt';
import {
  AssignmentInput,
  buildAssignmentPrompt,
  generateFallbackAssignment,
  parseAssignmentResponse,
} from '@/lib/assignment-prompt';

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

    // Fetch all registrations (personal data + skills + quiz all live here)
    const { data: registrations, error: regError } = await supabase
      .from('registrations')
      .select('*');

    if (regError) {
      console.error('Registrations query error:', regError);
      return NextResponse.json(
        { error: 'DATABASE_ERROR', message: `Kon registraties niet ophalen: ${regError.message}` },
        { status: 500 },
      );
    }

    if (!registrations || registrations.length === 0) {
      return NextResponse.json(
        { error: 'NO_DATA', message: 'Geen registraties gevonden' },
        { status: 400 },
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    let generated = 0;
    let failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < registrations.length; i++) {
      const reg = registrations[i];

      // Build assignment input — all data lives on the registrations table
      // Use optional chaining since some columns may not exist yet
      const r = reg as Record<string, unknown>;
      const input: AssignmentInput = {
        name: (r.name as string) || 'Onbekend',
        skills: ((r.skills || {}) as AssignmentInput['skills']),
        additionalSkills: (r.additional_skills as string) || undefined,
        musicDecade: (r.music_decade as string) || '90s',
        musicGenre: (r.music_genre as string) || 'pop',
        birthYear: (r.birth_year as number) || 1985,
        gender: 'onbekend',
        selfConfidence: 5,
        hasPartner: (r.has_partner as boolean) ?? false,
        partnerName: (r.partner_name as string) || undefined,
        dietaryRequirements: (r.dietary_requirements as string) || undefined,
        jkvJoinYear: (r.jkv_join_year as number) || null,
        jkvExitYear: (r.jkv_exit_year as number | string) || null,
        borrelCount2025: (r.borrel_count_2025 as number) ?? 0,
        borrelPlanning2026: (r.borrel_planning_2026 as number) ?? 0,
        quizAnswers: ((r.quiz_answers || {}) as AssignmentInput['quizAnswers']),
      };

      const name = input.name;
      const prompt = buildAssignmentPrompt(input);
      let assignment;

      if (apiKey) {
        try {
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
            console.error(`Claude API error for ${name}:`, await response.text());
            assignment = generateFallbackAssignment(name);
          } else {
            const data = await response.json();
            const content = data.content[0]?.text;
            assignment = (content && parseAssignmentResponse(content)) || generateFallbackAssignment(name);
          }

          // Rate limit: wait between API calls
          if (i < registrations.length - 1) {
            await delay(200);
          }
        } catch (err) {
          console.error(`Error generating assignment for ${name}:`, err);
          assignment = generateFallbackAssignment(name);
          errors.push(`${name}: ${err instanceof Error ? err.message : 'Onbekende fout'}`);
        }
      } else {
        assignment = generateFallbackAssignment(name);
      }

      // Update the registration with the new assignment
      const { error: updateError } = await supabase
        .from('registrations')
        .update({ ai_assignment: assignment })
        .eq('user_id', r.user_id as string);

      if (updateError) {
        console.error(`Update error for ${name}:`, updateError);
        errors.push(`${name}: ${updateError.message}`);
        failed++;
      } else {
        generated++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `${generated} toewijzingen gegenereerd`,
      generated,
      failed,
      total: registrations.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Generate assignments error:', error);
    const message = error instanceof Error ? error.message : 'Onbekende fout';
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: `Er ging iets mis: ${message}` },
      { status: 500 },
    );
  }
}
