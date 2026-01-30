import { NextRequest, NextResponse } from 'next/server';
import {
  AssignmentInput,
  buildAssignmentPrompt,
  generateFallbackAssignment,
  parseAssignmentResponse,
} from '@/lib/assignment-prompt';

export async function POST(request: NextRequest) {
  try {
    const body: AssignmentInput = await request.json();
    const prompt = buildAssignmentPrompt(body);

    // Check if we have an API key
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      // Return a fallback assignment if no API key
      console.log('No ANTHROPIC_API_KEY configured, using fallback assignment');
      return NextResponse.json(generateFallbackAssignment(body.name));
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
        max_tokens: 800,
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
      return NextResponse.json(generateFallbackAssignment(body.name));
    }

    const data = await response.json();
    const content = data.content[0]?.text;

    if (!content) {
      return NextResponse.json(generateFallbackAssignment(body.name));
    }

    const assignment = parseAssignmentResponse(content);
    if (assignment) {
      return NextResponse.json(assignment);
    }

    return NextResponse.json(generateFallbackAssignment(body.name));
  } catch (error) {
    console.error('Assignment API error:', error);
    return NextResponse.json(
      { error: 'Kon toewijzing niet genereren' },
      { status: 500 }
    );
  }
}
