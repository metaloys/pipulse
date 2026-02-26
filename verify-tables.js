// verify-tables.js
const { prisma } = require('./lib/db.ts');

const requiredTables = [
  'User',
  'Task', 
  'Submission',
  'Transaction',
  'SlotLock',
  'Notification',
  'Dispute',
  'AuditLog',
  'PlatformSettings',
  'Streak',
  'FailedCompletion',
  'TaskVersion'
];

async function verifyTables() {
  try {
    // Try to query each table
    for (const table of requiredTables) {
      try {
        let result;
        switch(table) {
          case 'User':
            result = await prisma.user.findMany({ take: 1 });
            break;
          case 'Task':
            result = await prisma.task.findMany({ take: 1 });
            break;
          case 'Submission':
            result = await prisma.submission.findMany({ take: 1 });
            break;
          case 'Transaction':
            result = await prisma.transaction.findMany({ take: 1 });
            break;
          case 'SlotLock':
            result = await prisma.slotLock.findMany({ take: 1 });
            break;
          case 'Notification':
            result = await prisma.notification.findMany({ take: 1 });
            break;
          case 'Dispute':
            result = await prisma.dispute.findMany({ take: 1 });
            break;
          case 'AuditLog':
            result = await prisma.auditLog.findMany({ take: 1 });
            break;
          case 'PlatformSettings':
            result = await prisma.platformSettings.findMany({ take: 1 });
            break;
          case 'Streak':
            result = await prisma.streak.findMany({ take: 1 });
            break;
          case 'FailedCompletion':
            result = await prisma.failedCompletion.findMany({ take: 1 });
            break;
          case 'TaskVersion':
            result = await prisma.taskVersion.findMany({ take: 1 });
            break;
        }
        console.log(`✅ ${table} table exists`);
      } catch (err) {
        console.log(`❌ ${table} table missing or error: ${err.message}`);
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

verifyTables();
