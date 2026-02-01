const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, '.env.example');

// Check if .env already exists
if (fs.existsSync(envPath)) {
  console.log('✅ .env file already exists');
  console.log('📍 Location: backend/.env');
  
  // Check if JWT_SECRET exists in the file
  const envContent = fs.readFileSync(envPath, 'utf8');
  const jwtSecretMatch = envContent.match(/JWT_SECRET=(.*)$/m);
  const jwtSecretValue = jwtSecretMatch ? jwtSecretMatch[1].trim() : '';
  
  if (!jwtSecretMatch || !jwtSecretValue || jwtSecretValue === '""' || jwtSecretValue === "''") {
    console.log('\n⚠️  WARNING: JWT_SECRET appears to be missing or empty in your .env file');
    console.log('   Please add: JWT_SECRET=your_secure_random_secret_key_here');
    console.log('   Tip: Use a long random string (at least 32 characters)');
    process.exit(1);
  }
  
  console.log('✅ JWT_SECRET is configured');
  process.exit(0);
}

// Create .env from template
const envTemplate = `PORT=5001
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=beauty_parlor
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_${Date.now()}
JWT_EXPIRE=7d
NODE_ENV=development
`;

try {
  fs.writeFileSync(envPath, envTemplate);
  console.log('✅ .env file created successfully');
  console.log('📍 Location: backend/.env');
  console.log('\n⚠️  Next steps:');
  console.log('   1. Update DB_PASSWORD in backend/.env with your MySQL password');
  console.log('   2. Optionally change JWT_SECRET to a more secure value');
  console.log('   3. Run: npm start\n');
} catch (error) {
  console.error('❌ Error creating .env file:', error.message);
  process.exit(1);
}

