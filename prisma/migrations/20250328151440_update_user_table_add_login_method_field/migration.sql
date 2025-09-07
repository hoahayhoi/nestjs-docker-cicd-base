-- AlterTable
ALTER TABLE "User" ADD COLUMN     "login_method" VARCHAR(20) NOT NULL DEFAULT 'email';
