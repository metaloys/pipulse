-- Add parentTaskId column to Task table for tracking reposted tasks
ALTER TABLE "Task" ADD COLUMN "parentTaskId" TEXT;

-- Create foreign key constraint for parentTaskId
ALTER TABLE "Task" ADD CONSTRAINT "Task_parentTaskId_fkey" FOREIGN KEY ("parentTaskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create index for faster queries on parentTaskId
CREATE INDEX "Task_parentTaskId_idx" ON "Task"("parentTaskId");
