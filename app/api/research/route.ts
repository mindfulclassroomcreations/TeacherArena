import OpenAI from 'openai';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { topic, gradeRange } = await request.json();

    const prompt = `You are an expert in educational product development for Teachers Pay Teachers (TPT).

Research and generate 5 high-demand digital product ideas for grades ${gradeRange || '6-12'} related to: ${topic || 'general educational resources'}.

For each product idea, provide:
1. Product Title (creative and specific)
2. Grade Level (specific grades within 6-12)
3. Related Standards (Common Core or subject-specific standards)
4. Notes (brief description, what makes it valuable, and implementation ideas)
5. Category (e.g., Google Forms, Worksheets, Task Cards, Activities, Assessments)

Format your response as a JSON array with objects containing: product_title, grade_level, standards, notes, and category fields.

Focus on trending topics, cross-curricular connections, and products that save teachers time while engaging students.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are an educational product expert specializing in Teachers Pay Teachers resources. Provide responses in valid JSON format only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.8,
      response_format: { type: "json_object" }
    });

    const responseText = completion.choices[0].message.content;
    let productIdeas;

    try {
      const parsed = JSON.parse(responseText || '{}');
      productIdeas = parsed.ideas || parsed.products || parsed;
      
      if (!Array.isArray(productIdeas)) {
        productIdeas = [productIdeas];
      }
    } catch (e) {
      console.error('Error parsing OpenAI response:', e);
      return NextResponse.json(
        { error: 'Failed to parse AI response' },
        { status: 500 }
      );
    }

    // Store product ideas in Supabase
    const { data, error } = await supabase
      .from('product_ideas')
      .insert(productIdeas)
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to store ideas in database', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      ideas: data,
      count: data?.length || 0
    });

  } catch (error: any) {
    console.error('Error in research API:', error);
    return NextResponse.json(
      { error: 'Failed to generate product ideas', details: error.message },
      { status: 500 }
    );
  }
}
