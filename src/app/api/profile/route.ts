import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

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
    const profile = {
      name: user.name,
      email: user.email,
      birthYear: registration.birth_year,
      hasPartner: registration.has_partner,
      partnerName: registration.partner_name,
      dietaryRequirements: registration.dietary_requirements,
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
    };

    // Calculate completed sections
    const completedSections = {
      basic: true, // Always true if user exists
      personal: registration.birth_year !== null,
      skills: registration.skills && Object.keys(registration.skills).length === 8,
      music: registration.music_decade && registration.music_genre,
      jkvHistorie: registration.jkv_join_year !== null && registration.jkv_exit_year !== null,
      borrelStats: true, // Sliders always have values
      quiz: registration.quiz_answers && Object.keys(registration.quiz_answers).length >= 3,
    };

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
          birth_year: data.birthYear,
          has_partner: data.hasPartner,
          partner_name: data.partnerName || null,
          dietary_requirements: data.dietaryRequirements || null,
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

    return NextResponse.json({
      success: true,
      message: `Section ${section} saved successfully`,
    });
  } catch (error) {
    console.error('Profile POST error:', error);
    return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 });
  }
}
