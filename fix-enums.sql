-- Fix TaskCategory enum values to match app expectations
ALTER TYPE "TaskCategory" RENAME VALUE 'SURVEY' TO 'survey';
ALTER TYPE "TaskCategory" RENAME VALUE 'APP_TESTING' TO 'app-testing';
ALTER TYPE "TaskCategory" RENAME VALUE 'PHOTO_CAPTURE' TO 'photo-capture';
ALTER TYPE "TaskCategory" RENAME VALUE 'CONTENT_REVIEW' TO 'content-review';
ALTER TYPE "TaskCategory" RENAME VALUE 'DATA_LABELING' TO 'data-labeling';
ALTER TYPE "TaskCategory" RENAME VALUE 'TRANSLATION' TO 'translation';
ALTER TYPE "TaskCategory" RENAME VALUE 'AUDIO_RECORDING' TO 'audio-recording';
