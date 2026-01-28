import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// Points per profile section (must match SECTION_POINTS in store.ts)
const SECTION_POINTS: Record<string, number> = {
  basic: 10,
  personal: 50,
  foodDrinks: 20,
  skills: 40,
  music: 20,
  jkvHistorie: 30,
  borrelStats: 30,
  quiz: 80,
};

// Validate if a section has meaningful data filled in
function isSectionDataValid(section: string, data: Record<string, unknown>): boolean {
  switch (section) {
    case 'personal':
      // Require at least birth year to be set
      return !!(data.birthYear || data.birthDate);

    case 'foodDrinks':
      // Food preferences are always valid (sliders have default values)
      return true;

    case 'skills':
      // Require at least one skill to have a non-empty value
      if (!data.skills || typeof data.skills !== 'object') return false;
      return Object.values(data.skills as Record<string, string>).some(v => v && v !== '');

    case 'music':
      // Require at least decade or genre to be set
      return !!(data.musicDecade || data.musicGenre);

    case 'jkvHistorie':
      // Require at least one year field to be set (and not 0)
      return !!(data.jkvJoinYear || data.jkvExitYear || data.bovenkamerJoinYear);

    case 'borrelStats':
      // Require at least one borrel stat to be greater than 0
      const count2025 = typeof data.borrelCount2025 === 'number' ? data.borrelCount2025 : 0;
      const planning2026 = typeof data.borrelPlanning2026 === 'number' ? data.borrelPlanning2026 : 0;
      return count2025 > 0 || planning2026 > 0;

    case 'quiz':
      // Require at least one quiz answer
      if (!data.quizAnswers || typeof data.quizAnswers !== 'object') return false;
      return Object.keys(data.quizAnswers as Record<string, unknown>).length > 0;

    default:
      return true;
  }
}

// GET profile data for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const supabase = createServerClient();

    // Get user and registration data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { data: registration, error: regError } = await supabase
      .from('registrations')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (regError) {
      // No registration yet, return empty profile
      return NextResponse.json({
        user,
        profile: null,
      });
    }

    // Map database fields to frontend format
    // Extract firstName/lastName from registration or fallback to splitting user.name
    const firstName = registration.first_name || user.name?.split(' ')[0] || '';
    const lastName = registration.last_name || user.name?.split(' ').slice(1).join(' ') || '';
    const partnerFirstName = registration.partner_first_name || registration.partner_name?.split(' ')[0] || '';
    const partnerLastName = registration.partner_last_name || registration.partner_name?.split(' ').slice(1).join(' ') || '';

    const profile = {
      firstName,
      lastName,
      name: user.name,
      email: user.email,
      birthDate: registration.birth_date || '',
      birthYear: registration.birth_year,
      hasPartner: registration.has_partner,
      partnerFirstName,
      partnerLastName,
      partnerName: registration.partner_name,
      dietaryRequirements: registration.dietary_requirements,
      partnerDietaryRequirements: registration.partner_dietary_requirements || '',
      meatDistribution: registration.meat_distribution || null,
      drinkDistribution: registration.drink_distribution || null,
      foodPreferences: registration.food_preferences || null,
      skills: registration.skills || {},
      additionalSkills: registration.additional_skills,
      musicDecade: registration.music_decade,
      musicGenre: registration.music_genre,
      jkvJoinYear: registration.jkv_join_year,
      jkvExitYear: registration.jkv_exit_year,
      bovenkamerJoinYear: registration.bovenkamer_join_year,
      borrelCount2025: registration.borrel_count_2025 || 0,
      borrelPlanning2026: registration.borrel_planning_2026 || 0,
      quizAnswers: registration.quiz_answers || {},
      aiAssignment: registration.ai_assignment,
      // Attendance data
      attendanceConfirmed: registration.attendance_confirmed,
    };

    // Calculate completed sections based on what points have been awarded
    // This reflects sections the user has explicitly saved (via POST)
    // Also check for "Registratie voltooid" which is the original basic points entry
    const { data: existingPointsEntries } = await supabase
      .from('points_ledger')
      .select('description')
      .eq('user_id', user.id);

    const allDescriptions = new Set(
      (existingPointsEntries || []).map((e: { description: string }) => e.description)
    );

    // Check if basic points were awarded (either via "profile_basic" or "Registratie voltooid")
    const hasBasicPoints = allDescriptions.has('profile_basic') || allDescriptions.has('Registratie voltooid');

    // Extract profile sections from descriptions
    const awardedSections = new Set(
      (existingPointsEntries || [])
        .filter((e: { description: string }) => e.description.startsWith('profile_'))
        .map((e: { description: string }) => e.description.replace('profile_', ''))
    );

    // Sections are "complete" only if points have been awarded (user explicitly saved)
    const completedSections: Record<string, boolean> = {
      basic: hasBasicPoints, // True if any basic points awarded
      personal: awardedSections.has('personal'),
      foodDrinks: awardedSections.has('foodDrinks'),
      skills: awardedSections.has('skills'),
      music: awardedSections.has('music'),
      jkvHistorie: awardedSections.has('jkvHistorie'),
      borrelStats: awardedSections.has('borrelStats'),
      quiz: awardedSections.has('quiz'),
    };

    // Only award basic points if neither "profile_basic" nor "Registratie voltooid" exists
    // This prevents duplicate basic points
    if (!hasBasicPoints) {
      await supabase
        .from('points_ledger')
        .insert({
          user_id: user.id,
          source: 'registration',
          points: SECTION_POINTS['basic'],
          description: 'profile_basic',
        });
      completedSections.basic = true;
    }

    return NextResponse.json({
      user,
      profile,
      completedSections,
    });
  } catch (error) {
    console.error('Profile GET error:', error);
    return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 });
  }
}

// Update profile section
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, section, data } = body;

    if (!email || !section) {
      return NextResponse.json({ error: 'Email and section are required' }, { status: 400 });
    }

    const supabase = createServerClient();

    // Get user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Build update data based on section
    let updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    switch (section) {
      case 'personal':
        updateData = {
          ...updateData,
          first_name: data.firstName || null,
          last_name: data.lastName || null,
          name: data.name || null, // Full name for backward compatibility
          birth_date: data.birthDate || null,
          birth_year: data.birthYear || (data.birthDate ? new Date(data.birthDate).getFullYear() : null),
          has_partner: data.hasPartner,
          partner_first_name: data.partnerFirstName || null,
          partner_last_name: data.partnerLastName || null,
          partner_name: data.partnerName || null, // Full name for backward compatibility
        };
        break;

      case 'foodDrinks':
        updateData = {
          ...updateData,
          dietary_requirements: data.dietaryRequirements || null,
          partner_dietary_requirements: data.partnerDietaryRequirements || null,
          meat_distribution: data.meatDistribution || null,
          drink_distribution: data.drinkDistribution || null,
          food_preferences: data.foodPreferences || null,
        };
        break;

      case 'skills':
        updateData = {
          ...updateData,
          skills: data.skills,
          additional_skills: data.additionalSkills || null,
        };
        break;

      case 'music':
        updateData = {
          ...updateData,
          music_decade: data.musicDecade,
          music_genre: data.musicGenre,
        };
        break;

      case 'jkvHistorie':
        updateData = {
          ...updateData,
          jkv_join_year: data.jkvJoinYear,
          jkv_exit_year: data.jkvExitYear,
          bovenkamer_join_year: data.bovenkamerJoinYear,
        };
        break;

      case 'borrelStats':
        updateData = {
          ...updateData,
          borrel_count_2025: data.borrelCount2025,
          borrel_planning_2026: data.borrelPlanning2026,
        };
        break;

      case 'quiz':
        updateData = {
          ...updateData,
          quiz_answers: data.quizAnswers,
        };
        break;

      case 'attendance':
        // Attendance is stored in has_partner/partner_name fields
        // but doesn't award points - it's just for tracking attendance
        updateData = {
          ...updateData,
          attendance_confirmed: data.attendanceConfirmed,
          has_partner: data.hasPartner,
          partner_name: data.partnerName || null,
        };
        break;

      default:
        return NextResponse.json({ error: 'Invalid section' }, { status: 400 });
    }

    // Check if registration exists
    const { data: existingReg } = await supabase
      .from('registrations')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (existingReg) {
      // Update existing registration
      const { error: updateError } = await supabase
        .from('registrations')
        .update(updateData)
        .eq('id', existingReg.id);

      if (updateError) {
        console.error('Error updating profile section:', updateError);
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
      }
    } else {
      // Create new registration with this section
      const { error: insertError } = await supabase
        .from('registrations')
        .insert({
          user_id: user.id,
          ...updateData,
        });

      if (insertError) {
        console.error('Error creating registration:', insertError);
        return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
      }
    }

    // Award points for completing this section (if not already awarded AND data is valid)
    const pointsDescription = `profile_${section}`;
    const sectionPoints = SECTION_POINTS[section];
    let pointsAwarded = 0;

    // Only award points if the section has meaningful data
    if (sectionPoints && isSectionDataValid(section, data)) {
      // Check if points for this section were already awarded
      const { data: existingPoints } = await supabase
        .from('points_ledger')
        .select('id')
        .eq('user_id', user.id)
        .eq('description', pointsDescription)
        .single();

      if (!existingPoints) {
        // Award points for this section
        const { error: pointsError } = await supabase
          .from('points_ledger')
          .insert({
            user_id: user.id,
            source: 'registration',
            points: sectionPoints,
            description: pointsDescription,
          });

        if (pointsError) {
          console.error('Error awarding points:', pointsError);
          // Don't fail the request, just log the error
        } else {
          pointsAwarded = sectionPoints;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Section ${section} saved successfully`,
      pointsAwarded,
    });
  } catch (error) {
    console.error('Profile POST error:', error);
    return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 });
  }
}
