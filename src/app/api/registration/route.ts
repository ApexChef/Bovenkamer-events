import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { RegistrationFormData, AIAssignment } from '@/types';

interface RegistrationRequest {
  formData: RegistrationFormData;
  aiAssignment: AIAssignment;
}

export async function POST(request: NextRequest) {
  try {
    const { formData, aiAssignment }: RegistrationRequest = await request.json();
    const supabase = createServerClient();

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', formData.email)
      .single();

    let userId: string;

    if (existingUser) {
      // Update existing user
      userId = existingUser.id;
      await supabase
        .from('users')
        .update({ name: formData.name })
        .eq('id', userId);
    } else {
      // Create new user
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({
          email: formData.email,
          name: formData.name,
          role: 'participant',
        })
        .select('id')
        .single();

      if (userError) {
        console.error('Error creating user:', userError);
        return NextResponse.json({ error: 'Kon gebruiker niet aanmaken' }, { status: 500 });
      }
      userId = newUser.id;
    }

    // Check if registration already exists
    const { data: existingReg } = await supabase
      .from('registrations')
      .select('id')
      .eq('user_id', userId)
      .single();

    const registrationData = {
      user_id: userId,
      birth_year: formData.birthYear,
      has_partner: formData.hasPartner,
      partner_name: formData.partnerName || null,
      dietary_requirements: formData.dietaryRequirements || null,
      skills: formData.skills,
      additional_skills: formData.additionalSkills || null,
      music_decade: formData.musicDecade,
      music_genre: formData.musicGenre,
      quiz_answers: formData.quizAnswers,
      ai_assignment: aiAssignment,
      updated_at: new Date().toISOString(),
    };

    if (existingReg) {
      // Update existing registration
      const { error: regError } = await supabase
        .from('registrations')
        .update(registrationData)
        .eq('id', existingReg.id);

      if (regError) {
        console.error('Error updating registration:', regError);
        return NextResponse.json({ error: 'Kon registratie niet updaten' }, { status: 500 });
      }
    } else {
      // Create new registration
      const { error: regError } = await supabase
        .from('registrations')
        .insert(registrationData);

      if (regError) {
        console.error('Error creating registration:', regError);
        return NextResponse.json({ error: 'Kon registratie niet opslaan' }, { status: 500 });
      }

      // Add points for registration
      await supabase.from('points_ledger').insert({
        user_id: userId,
        source: 'registration',
        points: 10,
        description: 'Registratie voltooid',
      });
    }

    return NextResponse.json({
      success: true,
      userId,
      message: 'Registratie succesvol opgeslagen'
    });
  } catch (error) {
    console.error('Registration API error:', error);
    return NextResponse.json(
      { error: 'Er ging iets mis bij het opslaan' },
      { status: 500 }
    );
  }
}

// Get all registrations (for admin)
export async function GET() {
  try {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('registrations')
      .select(`
        *,
        users (
          id,
          name,
          email
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching registrations:', error);
      return NextResponse.json({ error: 'Kon registraties niet ophalen' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Registrations GET error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}
