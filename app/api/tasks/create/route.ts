import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      title,
      description,
      category,
      proofType,
      piReward,
      slotsAvailable,
      deadline,
      employerId,
      paymentId,
    } = body;

    // Validate required fields
    if (!title?.trim()) {
      return Response.json({ error: 'Title is required' }, { status: 400 });
    }
    if (!description?.trim()) {
      return Response.json({ error: 'Description is required' }, { status: 400 });
    }
    if (!category) {
      return Response.json({ error: 'Category is required' }, { status: 400 });
    }
    if (!proofType) {
      return Response.json({ error: 'Proof type is required' }, { status: 400 });
    }
    if (!piReward || piReward < 0.01) {
      return Response.json({ error: 'Pi reward must be at least 0.01π' }, { status: 400 });
    }
    if (!slotsAvailable || slotsAvailable < 1 || slotsAvailable > 100) {
      return Response.json(
        { error: 'Slots must be between 1 and 100' },
        { status: 400 }
      );
    }
    if (!employerId) {
      return Response.json({ error: 'Employer ID is required' }, { status: 400 });
    }

    // Create task in database
    const { data, error } = await supabase
      .from('Task')
      .insert([
        {
          title: title.trim(),
          description: description.trim(),
          category: category.toLowerCase(),
          piReward: piReward,
          timeEstimate: 60, // Default 60 minutes
          requirements: [],
          slotsAvailable: slotsAvailable,
          slotsRemaining: slotsAvailable,
          deadline: deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days default
          employerId: employerId,
          taskStatus: 'available',
          instructions: body.instructions || `Complete this ${category} task. Proof type: ${proofType}`,
          proofType: proofType,
          paymentId: paymentId || null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ])
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error creating task:', error);
      return Response.json(
        { error: 'Failed to create task', details: error.message },
        { status: 500 }
      );
    }

    return Response.json(
      {
        success: true,
        message: 'Task created successfully',
        task: data,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('Task create error:', JSON.stringify({
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      error: err,
    }, null, 2));
    return Response.json(
      {
        error: 'Internal server error',
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
