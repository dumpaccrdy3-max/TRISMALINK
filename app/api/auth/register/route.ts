import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { registerSchema } from '@/lib/validations'
import { checkRateLimit, sanitizeInput, logSecurityEvent } from '@/lib/security'

export async function POST(req: NextRequest) {
  try {
    // Rate limiting: 5 registrations per hour per IP
    const rateLimit = checkRateLimit(req, { maxRequests: 5, windowMs: 3600000 })
    if (rateLimit.limited) {
      logSecurityEvent('RATE_LIMIT_EXCEEDED', { 
        endpoint: '/api/auth/register',
        ip: req.headers.get('x-forwarded-for') 
      })
      return NextResponse.json(
        { error: 'Too many registration attempts. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await req.json()
    
    // Validate input
    const validation = registerSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { username, email, password } = validation.data

    // Sanitize inputs
    const sanitizedUsername = sanitizeInput(username)
    const sanitizedEmail = sanitizeInput(email)

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: sanitizedEmail },
          { username: sanitizedUsername }
        ]
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: existingUser.email === sanitizedEmail ? 'Email already registered' : 'Username already taken' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        username: sanitizedUsername,
        email: sanitizedEmail,
        password: hashedPassword,
      },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
      }
    })

    logSecurityEvent('USER_REGISTERED', { userId: user.id, username: user.username })

    return NextResponse.json(
      { message: 'User registered successfully', user },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
