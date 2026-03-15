import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { CreateUserSchema, validateRequest } from '@/lib/validators';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('📥 Request body:', body);

    // Validate input using Zod
    const validation = validateRequest(CreateUserSchema, body);
    if (!validation.success) {
      console.error('❌ Validation error:', validation.error);
      return NextResponse.json({ error: 'Invalid input: ' + validation.error }, { status: 400 });
    }

    const { piUid, piUsername } = validation.data;
    console.log('📝 Validated input:', { piUid, piUsername });

    // Check if user exists by piUid first (CRITICAL - piUid is immutable, piUsername can change)
    console.log('🔍 Checking for existing user with piUid:', piUid);
    const existingByUid = await prisma.user.findUnique({
      where: { piUid },
    });

    if (existingByUid) {
      console.log('✅ User already exists by piUid:', piUid);
      return NextResponse.json({ user: existingByUid }, { status: 200 });
    }

    // Fallback check by piUsername (in case piUid lookup fails for legacy users)
    console.log('🔍 Checking for existing user with piUsername fallback:', piUsername);
    const existingByUsername = await prisma.user.findFirst({
      where: { piUsername },
    });

    if (existingByUsername) {
      console.log('✅ User already exists by piUsername:', piUsername);
      return NextResponse.json({ user: existingByUsername }, { status: 200 });
    }

    // Create new user with initial data
    console.log('➕ Creating new user with Prisma:', { piUid, piUsername });
    const newUser = await prisma.user.create({
      data: {
        piUid,
        piUsername,
        userRole: 'WORKER',
        level: 'NEWCOMER',
        status: 'ACTIVE',
        totalEarnings: 0,
        totalTasksCompleted: 0,
        currentStreak: 0,
      },
    });

    console.log('✅ User created successfully:', {
      id: newUser.id,
      piUsername: newUser.piUsername,
      userRole: newUser.userRole,
      createdAt: newUser.createdAt,
    });

    return NextResponse.json({ user: newUser }, { status: 200 });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json({ error: String(error), stack: error instanceof Error ? error.stack : undefined }, { status: 500 });
  }
}

