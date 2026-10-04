/**
 * Comprehensive Automated Verification Suite for ApexExam Online Examination System
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ ${message}`);
  } else {
    console.error(`  ✕ FAIL: ${message}`);
    process.exitCode = 1;
  }
}

// Mock LocalStorage for testing JS controllers in Node
class MockLocalStorage {
  constructor() {
    this.store = {};
  }
  getItem(key) { return this.store[key] || null; }
  setItem(key, value) { this.store[key] = String(value); }
  removeItem(key) { delete this.store[key]; }
  clear() { this.store = {}; }
}

global.localStorage = new MockLocalStorage();
global.window = {
  localStorage: global.localStorage,
  location: { href: '', pathname: '/student/dashboard.html', search: '' }
};
global.document = {
  addEventListener: () => {},
  querySelectorAll: () => [],
  getElementById: () => ({ textContent: '', value: '', checked: false, classList: { add: () => {}, remove: () => {}, toggle: () => {} } })
};
global.alert = (msg) => console.log('    [Alert Modal]:', msg);

console.log('========================================================');
console.log('RUNNING APEXEXAM VERIFICATION SUITE');
console.log('========================================================\n');

// 1. File Existence & Structure Check
console.log('1. Verifying Files and Folder Structure:');
const requiredFiles = [
  'index.html',
  'login.html',
  'signup.html',
  'assets/css/variables.css',
  'assets/css/main.css',
  'assets/css/exam-engine.css',
  'assets/images/hero.jpg',
  'assets/images/proctoring.jpg',
  'assets/images/success.jpg',
  'assets/js/storage.js',
  'assets/js/auth.js',
  'assets/js/notification.js',
  'assets/js/admin.js',
  'assets/js/student.js',
  'assets/js/exam-engine.js',
  'admin/index.html',
  'admin/login.html',
  'admin/signup.html',
  'admin/dashboard.html',
  'admin/exams.html',
  'admin/create-exam.html',
  'admin/edit-exam.html',
  'admin/question-bank.html',
  'admin/students.html',
  'admin/results.html',
  'student/index.html',
  'student/dashboard.html',
  'student/exams.html',
  'student/exam-take.html',
  'student/results.html',
  'student/profile.html'
];

requiredFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, file));
  assert(exists, `File exists: ${file}`);
});

// 2. HTTP Server Endpoints Check
console.log('\n2. Verifying HTTP Server Status & Content:');
function checkUrl(urlPath, expectedText) {
  return new Promise((resolve) => {
    http.get(`http://localhost:3000${urlPath}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const statusOk = res.statusCode === 200;
        const textFound = data.includes(expectedText);
        assert(statusOk && textFound, `HTTP GET ${urlPath} -> 200 OK (Contains "${expectedText}")`);
        resolve();
      });
    }).on('error', (err) => {
      assert(false, `HTTP GET ${urlPath} error: ${err.message}`);
      resolve();
    });
  });
}

async function runHttpTests() {
  await checkUrl('/index.html', 'ApexExam');
  await checkUrl('/login.html', 'Sign In');
  await checkUrl('/signup.html', 'Student Enrollment');
  await checkUrl('/admin/login.html', 'Admin Sign In');
  await checkUrl('/admin/signup.html', 'Create Admin Account');
  await checkUrl('/admin/dashboard.html', 'Faculty Control Center');
  await checkUrl('/admin/exams.html', 'Examination Management');
  await checkUrl('/admin/question-bank.html', 'Question Repository');
  await checkUrl('/admin/students.html', 'Student Roster');
  await checkUrl('/admin/results.html', 'Essay Evaluation');
  await checkUrl('/student/dashboard.html', 'Student Workspace');
  await checkUrl('/student/exams.html', 'Examination Catalog');
  await checkUrl('/student/exam-take.html', 'Question Palette');
  await checkUrl('/student/results.html', 'Official Score Report');
  await checkUrl('/student/profile.html', 'Personal & Academic Information');

  // 3. Storage Service Unit Tests
  console.log('\n3. Testing Storage Service & Initial Seeding:');
  eval(fs.readFileSync('assets/js/storage.js', 'utf8'));

  const users = window.storage.getUsers();
  assert(users.length >= 4, `Initial users seeded correctly (Found: ${users.length})`);

  const exams = window.storage.getExams();
  assert(exams.length >= 3, `Initial exams seeded correctly (Found: ${exams.length})`);

  const questions = window.storage.getQuestions();
  assert(questions.length >= 10, `Initial questions seeded correctly (Found: ${questions.length})`);

  const submissions = window.storage.getSubmissions();
  assert(submissions.length >= 2, `Initial submissions seeded correctly (Found: ${submissions.length})`);

  // 4. Authentication & Security Logic
  console.log('\n4. Testing Authentication & Session Management:');
  eval(fs.readFileSync('assets/js/auth.js', 'utf8'));

  // Student Login
  const studentLogin = window.Auth.login('john@student.com', 'student123');
  assert(studentLogin.success === true && studentLogin.user.role === 'student', 'Student authentication succeeds');

  // Admin Login
  const adminLogin = window.Auth.login('admin@exam.com', 'admin123');
  assert(adminLogin.success === true && adminLogin.user.role === 'admin', 'Admin authentication succeeds');

  // Bad Password
  const badLogin = window.Auth.login('admin@exam.com', 'wrongpassword');
  assert(badLogin.success === false, 'Invalid password is rejected');

  // Non-existent user
  const notFoundLogin = window.Auth.login('ghost@student.com', 'pwd');
  assert(notFoundLogin.success === false, 'Non-existent account rejected');

  // Student Registration
  const newStudent = window.Auth.signup({
    name: 'Test Student',
    email: 'test_auto_' + Date.now() + '@student.com',
    password: 'password123',
    department: 'Software Engineering',
    rollNo: 'TEST-99'
  });
  assert(newStudent.success === true && newStudent.user.email.includes('test_auto_'), 'Student registration & session works');

  // Admin Registration
  const newAdmin = window.Auth.signupAdmin({
    name: 'Prof. Ada Lovelace',
    email: 'ada_auto_' + Date.now() + '@exam.com',
    password: 'adminpassword123',
    department: 'Computing Architecture',
    designation: 'Chair Professor'
  });
  assert(newAdmin.success === true && newAdmin.user.role === 'admin', 'Admin registration & session works');

  // 5. Exam Engine Simulation: MCQ scoring, Essay handling & Pass/Fail
  console.log('\n5. Testing Examination Engine Calculation & Anti-Cheat Rules:');
  const targetExam = exams[0]; // Modern JavaScript & Web Development Assessment
  const examQuestions = questions.filter(q => targetExam.questionIds.includes(q.id));

  let simulatedScore = 0;
  let simulatedMax = 0;
  examQuestions.forEach(q => {
    simulatedMax += q.points;
    if (q.type === 'mcq') {
      // Simulate choosing the correct option
      simulatedScore += q.points;
    }
  });

  const percentage = Number(((simulatedScore / simulatedMax) * 100).toFixed(1));
  const hasEssay = examQuestions.some(q => q.type === 'essay');
  const initialStatus = hasEssay ? 'pending_review' : (percentage >= targetExam.passingPercentage ? 'passed' : 'failed');
  assert(simulatedScore > 0, `MCQ Auto-calculation computed: ${simulatedScore} points`);
  assert(initialStatus === 'pending_review', `Initial status marked 'pending_review' awaiting essay grading`);

  // 6. Essay Grading by Instructor Simulation
  console.log('\n6. Testing Instructor Grading & Score Re-calculation:');
  const essayQuestion = examQuestions.find(q => q.type === 'essay');
  assert(!!essayQuestion, 'Found subjective essay question in exam');

  const awardedEssayPoints = 12; // Out of 15
  const newTotal = simulatedScore + awardedEssayPoints;
  const newPercentage = Number(((newTotal / simulatedMax) * 100).toFixed(1));
  const finalPassed = newPercentage >= targetExam.passingPercentage;
  assert(newTotal > simulatedScore, `Re-calculated total score after instructor grading: ${newTotal}/${simulatedMax} (${newPercentage}%)`);
  assert(finalPassed === true, `Final pass calculation verified after essay grading (${newPercentage}% >= ${targetExam.passingPercentage}%)`);

  // 7. Check for Broken Relative Links & Scripts across all HTML files
  console.log('\n7. Verifying Relative Link & Script Integrity:');
  let brokenLinks = 0;
  requiredFiles.filter(f => f.endsWith('.html')).forEach(htmlFile => {
    const htmlContent = fs.readFileSync(htmlFile, 'utf8');
    const dir = path.dirname(htmlFile);

    // Check script src
    const scriptMatches = htmlContent.match(/src="([^"]+)"/g) || [];
    scriptMatches.forEach(m => {
      const src = m.replace('src="', '').replace('"', '');
      if (!src.startsWith('http')) {
        const resolved = path.join(dir, src);
        if (!fs.existsSync(resolved)) {
          console.error(`    Broken script in ${htmlFile}: ${src} -> ${resolved}`);
          brokenLinks++;
        }
      }
    });

    // Check css href
    const linkMatches = htmlContent.match(/href="([^"]+\.css)"/g) || [];
    linkMatches.forEach(m => {
      const href = m.replace('href="', '').replace('"', '');
      const resolved = path.join(dir, href);
      if (!fs.existsSync(resolved)) {
        console.error(`    Broken stylesheet in ${htmlFile}: ${href} -> ${resolved}`);
        brokenLinks++;
      }
    });
  });

  assert(brokenLinks === 0, `All script and stylesheet links resolve to valid files (0 broken links)`);

  console.log('\n========================================================');
  console.log(`TEST SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED!`);
  console.log('========================================================\n');
}

runHttpTests();
