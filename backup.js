// backup.js
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// 1. File paths
const SOURCE_FILE = '/data/form_submissions.xlsx'; // where Render stores the Excel
const BACKUP_DIR = '/data/backups';               // persistent backups folder
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');
const BACKUP_FILE = path.join(BACKUP_DIR, `form_backup_${TIMESTAMP}.xlsx`);

// 2. Ensure backup folder exists
fs.mkdirSync(BACKUP_DIR, { recursive: true });

// 3. Copy the file
if (fs.existsSync(SOURCE_FILE)) {
  fs.copyFileSync(SOURCE_FILE, BACKUP_FILE);
  console.log(`✅ Backup created: ${BACKUP_FILE}`);
} else {
  console.log(`⚠️ Source file not found: ${SOURCE_FILE}`);
}

