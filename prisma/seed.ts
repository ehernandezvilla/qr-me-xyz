// prisma/seed.js
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Crear planes de suscripción
  const freePlan = await prisma.plan.upsert({
    where: { name: 'free' },
    update: {},
    create: {
      name: 'free',
      displayName: 'Plan Gratuito',
      description: 'Perfecto para empezar',
      price: 0,
      currency: 'USD',
      interval: 'month',
      maxQRCodes: 10,
      maxScans: 1000,
      maxApiCalls: 100,
      hasAnalytics: false,
      hasCustomDomain: false,
      hasBulkExport: false,
      hasTeamAccess: false,
    },
  })

  const proPlan = await prisma.plan.upsert({
    where: { name: 'pro' },
    update: {},
    create: {
      name: 'pro',
      displayName: 'Plan Pro',
      description: 'Para profesionales y pequeñas empresas',
      price: 9.99,
      currency: 'USD',
      interval: 'month',
      maxQRCodes: 100,
      maxScans: 10000,
      maxApiCalls: 1000,
      hasAnalytics: true,
      hasCustomDomain: false,
      hasBulkExport: true,
      hasTeamAccess: false,
    },
  })

  const enterprisePlan = await prisma.plan.upsert({
    where: { name: 'enterprise' },
    update: {},
    create: {
      name: 'enterprise',
      displayName: 'Plan Enterprise',
      description: 'Para grandes empresas',
      price: 29.99,
      currency: 'USD',
      interval: 'month',
      maxQRCodes: -1, // Ilimitado
      maxScans: -1,   // Ilimitado
      maxApiCalls: -1, // Ilimitado
      hasAnalytics: true,
      hasCustomDomain: true,
      hasBulkExport: true,
      hasTeamAccess: true,
    },
  })

  console.log('✅ Plans created:', { freePlan, proPlan, enterprisePlan })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })