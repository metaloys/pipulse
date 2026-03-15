import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { validateRequest } from '@/lib/validators';
import { z } from 'zod';

/**
 * Create a new task with Prisma
 * POST /api/tasks/create
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log('📝 Task creation request:', { 
      title: body.title, 
      category: body.category, 
      piReward: body.piReward, 
      slotsAvailable: body.slotsAvailable, 
      employerId: body.employerId 
    });

    // Validate input with flexible schema
    const schema = z.object({
      title: z.string().min(3, 'Title required').max(200),
      description: z.string().min(10, 'Description required').max(2000),
      category: z.string().refine(cat => ['app-testing', 'survey', 'translation', 'audio-recording', 'photo-capture', 'content-review', 'data-labeling'].includes(cat), 'Invalid category'),
      piReward: z.number().min(0.01, 'Minimum 0.01π').max(1000),
      slotsAvailable: z.number().min(1, 'Min 1 slot').max(100, 'Max 100 slots'),
      employerId: z.string().uuid('Invalid employer ID'),
      deadline: z.string().optional(),
      estimatedDuration: z.number().min(1).max(1440).optional(),
    });

    const validation = validateRequest(schema, body);
    if (!validation.success) {
      console.error('❌ Validation error:', validation.error);
      return NextResponse.json({ error: 'Invalid input: ' + validation.error }, { status: 400 });
    }

    const {
      title,
      description,
      category,
      piReward,
      slotsAvailable,
      employerId,
      deadline,
      estimatedDuration,
    } = validation.data;

    // Verify employer exists and has EMPLOYER role
    const employer = await prisma.user.findUnique({
      where: { id: employerId },
    });

    if (!employer) {
      console.error('❌ Employer not found:', employerId);
      return NextResponse.json({ error: 'Employer not found' }, { status: 404 });
    }

    if (employer.userRole !== 'EMPLOYER') {
      console.error('❌ User is not an employer:', employerId);
      return NextResponse.json({ error: 'User must have EMPLOYER role to create tasks' }, { status: 403 });
    }

    // Create task using Prisma
    console.log('➕ Creating task with Prisma...');
    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        category,
        piReward,
        slotsAvailable,
        slotsRemaining: slotsAvailable,
        estimatedDuration: estimatedDuration || 60,
        expiresAt: deadline ? new Date(deadline) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'AVAILABLE',
        employerId,
        createdAt: new Date(),
      },
    });

    console.log('✅ Task created successfully:', {
      id: task.id,
      title: task.title,
      employerId: task.employerId,
      piReward: task.piReward,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Task created successfully',
        task,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('❌ Task create error:', {
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
