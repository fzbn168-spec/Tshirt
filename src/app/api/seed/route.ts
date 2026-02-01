import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    // Simple protection to prevent accidental resets
    // In production, use a proper secret key environment variable
    if (secret !== 'setup123') {
       return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
    }

    const email = 'admin@example.com';
    const password = 'password123'; 

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.upsert({
      where: { email },
      update: {}, // Don't update if exists
      create: {
        email,
        password: hashedPassword,
        name: 'Admin User',
      },
    });

    return NextResponse.json({ 
        success: true, 
        message: 'Admin user created successfully',
        user: { email: user.email, name: user.name } 
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: 'Failed to seed database', details: String(error) }, { status: 500 });
  }
}
