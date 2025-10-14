import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET all product ideas
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('product_ideas')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch ideas', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ideas: data });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch ideas', details: error.message },
      { status: 500 }
    );
  }
}

// POST new product idea
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { data, error } = await supabase
      .from('product_ideas')
      .insert([body])
      .select();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create idea', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ idea: data[0] });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to create idea', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE product idea
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('product_ideas')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete idea', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to delete idea', details: error.message },
      { status: 500 }
    );
  }
}

// PUT (update) product idea
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('product_ideas')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update idea', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ idea: data[0] });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to update idea', details: error.message },
      { status: 500 }
    );
  }
}
