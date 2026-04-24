-- Add visibility flag for student catalog
ALTER TABLE "courses"
ADD COLUMN "isVisibleToStudents" BOOLEAN NOT NULL DEFAULT true;
