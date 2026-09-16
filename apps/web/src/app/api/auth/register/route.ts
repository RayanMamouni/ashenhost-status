import { NextResponse } from 'next/server';
import { prisma } from '@ashenhost/database';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { name, email, password, organizationName } = await req.json();

    if (!email || !password || !organizationName) {
      return NextResponse.json(
        { error: 'Email, password, and Organization name are required.' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 400 }
      );
    }

    const slug = organizationName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const existingOrg = await prisma.organization.findUnique({
      where: { slug },
    });

    const finalSlug = existingOrg ? `${slug}-${Math.floor(Math.random() * 1000)}` : slug;
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user, organization and membership in transaction
    const result = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: organizationName,
          slug: finalSlug,
          plan: 'starter',
        },
      });

      const user = await tx.user.create({
        data: {
          email: email.toLowerCase().trim(),
          name: name || email.split('@')[0],
          passwordHash,
        },
      });

      await tx.membership.create({
        data: {
          userId: user.id,
          organizationId: org.id,
          role: 'admin',
        },
      });

      // Default status page
      await tx.statusPage.create({
        data: {
          organizationId: org.id,
          name: `${organizationName} Status`,
          slug: finalSlug,
          description: `Official status and uptime monitor for ${organizationName}.`,
          isPublic: true,
        },
      });

      return { user, org };
    });

    return NextResponse.json({
      success: true,
      user: { id: result.user.id, email: result.user.email },
      organization: { id: result.org.id, slug: result.org.slug },
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred during registration.' },
      { status: 500 }
    );
  }
}
