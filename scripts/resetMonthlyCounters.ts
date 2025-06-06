// scripts/resetMonthlyCounters.ts
import prisma from '../app/lib/prisma';

/**
 * Script para resetear contadores mensuales de QRs
 * Debe ejecutarse como cron job mensualmente
 */
async function resetMonthlyCounters() {
  console.log('🔄 Iniciando reset mensual de contadores...');
  
  try {
    const now = new Date();
    
    // Buscar usuarios que necesitan reset (más de 1 mes desde el último reset)
    const usersToReset = await prisma.user.findMany({
      where: {
        lastMonthReset: {
          lt: new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
        }
      },
      select: {
        id: true,
        email: true,
        monthlyQRCount: true,
        lastMonthReset: true
      }
    });

    console.log(`📊 ${usersToReset.length} usuarios necesitan reset`);

    if (usersToReset.length === 0) {
      console.log('✅ No hay usuarios que requieran reset');
      return;
    }

    // Reset en lotes para mejor performance
    const result = await prisma.user.updateMany({
      where: {
        id: {
          in: usersToReset.map(u => u.id)
        }
      },
      data: {
        monthlyQRCount: 0,
        lastMonthReset: now
      }
    });

    console.log(`✅ Reset completado para ${result.count} usuarios`);
    
    // Log detallado para monitoreo
    for (const user of usersToReset) {
      console.log(`  - ${user.email}: ${user.monthlyQRCount} QRs → 0 QRs`);
    }

  } catch (error) {
    console.error('❌ Error durante el reset mensual:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  resetMonthlyCounters()
    .then(() => {
      console.log('🎉 Reset mensual completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error en reset mensual:', error);
      process.exit(1);
    });
}

export default resetMonthlyCounters;