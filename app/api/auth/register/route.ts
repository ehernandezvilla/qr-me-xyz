// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createUserWithFreePlan } from '@/app/lib/auth';
import prisma from '@/app/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, username, email, password } = body;

    // Validaciones básicas
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Formato de email inválido' },
        { status: 400 }
      );
    }

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          ...(username ? [{ username: username }] : [])
        ]
      }
    });

    if (existingUser) {
      const duplicatedField = existingUser.email === email ? 'email' : 'username';
      return NextResponse.json(
        { error: `Ya existe un usuario con ese ${duplicatedField}` },
        { status: 409 }
      );
    }

    // Crear usuario con plan gratuito
    const user = await createUserWithFreePlan({
      email,
      password,
      name: name || null,
      username: username || null,
    });

    // Devolver usuario sin la contraseña
    const { password: _, ...userWithoutPassword } = user;

    if (_) {
        void _ // Evitar que el campo de contraseña se incluya en la respuesta
    }

    return NextResponse.json({
      message: 'Usuario creado exitosamente',
      user: userWithoutPassword
    }, { status: 201 });

  } catch (error) {
    console.error('Error en registro:', error);

    // Manejar errores específicos de Prisma
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'El email o username ya está en uso' },
          { status: 409 }
        );
      }
      
      if (error.message.includes('Free plan not found')) {
        return NextResponse.json(
          { error: 'Error de configuración del sistema. Contacte al administrador.' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}