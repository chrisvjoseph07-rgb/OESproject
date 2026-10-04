/**
 * Storage Service - LocalStorage persistence and Demo Data Seeding
 * Online Examination System (OES)
 */

const STORAGE_KEYS = {
  USERS: 'oes_users',
  EXAMS: 'oes_exams',
  QUESTIONS: 'oes_questions',
  SUBMISSIONS: 'oes_submissions',
  SESSION: 'oes_session'
};

// Initial Demo Data
const INITIAL_USERS = [
  {
    id: 'user_admin_1',
    name: 'Dr. Evelyn Reed',
    email: 'admin@exam.com',
    password: 'admin123', // Plaintext for demo simplicity
    role: 'admin',
    department: 'Department of Computer Science',
    status: 'active',
    createdAt: '2026-01-15T09:00:00.000Z'
  },
  {
    id: 'user_student_1',
    name: 'John Doe',
    email: 'john@student.com',
    password: 'student123',
    role: 'student',
    rollNo: 'CS-2026-042',
    department: 'Software Engineering',
    status: 'active',
    createdAt: '2026-02-01T10:30:00.000Z'
  },
  {
    id: 'user_student_2',
    name: 'Sarah Connor',
    email: 'sarah@student.com',
    password: 'student123',
    role: 'student',
    rollNo: 'CS-2026-088',
    department: 'Artificial Intelligence',
    status: 'active',
    createdAt: '2026-02-05T11:15:00.000Z'
  },
  {
    id: 'user_student_3',
    name: 'Alex Rivera',
    email: 'alex@student.com',
    password: 'student123',
    role: 'student',
    rollNo: 'CS-2026-103',
    department: 'Cyber Security',
    status: 'active',
    createdAt: '2026-02-10T14:20:00.000Z'
  }
];

const INITIAL_QUESTIONS = [
  // Web Development Questions
  {
    id: 'q_js_1',
    type: 'mcq',
    category: 'Web Development',
    title: 'Which statement accurately describes JavaScript event loop behavior?',
    options: [
      'Microtasks (e.g. Promises) execute before the next macrotask (e.g. setTimeout)',
      'setTimeout always executes before Promise.then()',
      'The call stack is emptied only after all macrotasks finish',
      'Microtasks run asynchronously on a separate background thread in the browser'
    ],
    correctAnswer: 0,
    points: 5,
    difficulty: 'Medium',
    explanation: 'Promises are queued in the microtask queue, which has higher priority and runs before macrotasks like setTimeout callbacks.'
  },
  {
    id: 'q_js_2',
    type: 'mcq',
    category: 'Web Development',
    title: 'What will `typeof NaN` return in JavaScript?',
    options: ['"undefined"', '"number"', '"nan"', '"object"'],
    correctAnswer: 1,
    points: 5,
    difficulty: 'Easy',
    explanation: 'In JavaScript, NaN (Not-a-Number) is formally of type "number" per the ECMAScript IEEE 754 specification.'
  },
  {
    id: 'q_js_3',
    type: 'mcq',
    category: 'Web Development',
    title: 'Which keyword creates a block-scoped variable that cannot be reassigned?',
    options: ['var', 'let', 'const', 'static'],
    correctAnswer: 2,
    points: 5,
    difficulty: 'Easy',
    explanation: '`const` defines a block-scoped reference that cannot be reassigned.'
  },
  {
    id: 'q_js_4',
    type: 'essay',
    category: 'Web Development',
    title: 'Explain the difference between Client-Side Rendering (CSR) and Server-Side Rendering (SSR). Discuss SEO and Initial Load considerations.',
    minWords: 50,
    maxWords: 300,
    points: 15,
    difficulty: 'Hard',
    rubric: 'Candidate must clearly define CSR (browser renders HTML via JS bundle) vs SSR (server generates ready HTML on demand), and evaluate SEO indexing and First Contentful Paint (FCP).'
  },
  // Data Structures & Algorithms Questions
  {
    id: 'q_dsa_1',
    type: 'mcq',
    category: 'Data Structures',
    title: 'What is the worst-case time complexity of QuickSort?',
    options: ['O(N log N)', 'O(N)', 'O(N^2)', 'O(log N)'],
    correctAnswer: 2,
    points: 5,
    difficulty: 'Medium',
    explanation: 'When the chosen pivot is repeatedly the smallest or largest element (e.g., already sorted array without random pivot), QuickSort degrades to O(N^2).'
  },
  {
    id: 'q_dsa_2',
    type: 'mcq',
    category: 'Data Structures',
    title: 'Which data structure follows the LIFO (Last-In-First-Out) principle?',
    options: ['Queue', 'Stack', 'Array', 'Linked List'],
    correctAnswer: 1,
    points: 5,
    difficulty: 'Easy',
    explanation: 'A Stack is a LIFO data structure where the last item pushed is the first to be popped.'
  },
  {
    id: 'q_dsa_3',
    type: 'essay',
    category: 'Data Structures',
    title: 'Compare Hash Tables and Balanced Binary Search Trees (e.g., Red-Black Tree) for lookup, insertion, and ordered traversal.',
    minWords: 50,
    maxWords: 250,
    points: 15,
    difficulty: 'Hard',
    rubric: 'Hash Tables offer O(1) average lookup/insert but lack ordering. Balanced BSTs provide O(log N) worst-case time and in-order O(N) sorted traversals.'
  },
  // Database Questions
  {
    id: 'q_db_1',
    type: 'mcq',
    category: 'Databases',
    title: 'What does the "A" in ACID database properties stand for?',
    options: ['Availability', 'Atomicity', 'Authentication', 'Asynchrony'],
    correctAnswer: 1,
    points: 5,
    difficulty: 'Easy',
    explanation: 'ACID stands for Atomicity, Consistency, Isolation, and Durability.'
  },
  {
    id: 'q_db_2',
    type: 'mcq',
    category: 'Databases',
    title: 'Which SQL clause is used to filter records resulting from a GROUP BY aggregation?',
    options: ['WHERE', 'ORDER BY', 'HAVING', 'FILTER'],
    correctAnswer: 2,
    points: 5,
    difficulty: 'Medium',
    explanation: 'The HAVING clause filters aggregated groups, whereas WHERE filters individual rows before grouping.'
  },
  {
    id: 'q_db_3',
    type: 'essay',
    category: 'Databases',
    title: 'Define Database Normalization (1NF through 3NF) and discuss why denormalization might be deliberately chosen in high-traffic read systems.',
    minWords: 50,
    maxWords: 300,
    points: 15,
    difficulty: 'Hard',
    rubric: 'Clear description of eliminating repeating groups (1NF), partial dependency removal (2NF), transitive dependency removal (3NF), and denormalization benefits for eliminating expensive JOINs in read-heavy analytics.'
  }
];

const INITIAL_EXAMS = [
  {
    id: 'exam_js_101',
    code: 'CS-JS-101',
    title: 'Modern JavaScript & Web Development Assessment',
    category: 'Web Development',
    description: 'Comprehensive test assessing ES6+, Event Loop mechanics, DOM APIs, and architectural rendering paradigms.',
    durationMinutes: 15,
    passingPercentage: 60,
    status: 'published', // 'published', 'draft', 'archived'
    randomizeQuestions: true,
    antiCheat: {
      enableFullscreen: true,
      enableTabSwitchDetection: true,
      maxAllowedTabSwitches: 3,
      blockCopyPaste: true
    },
    questionIds: ['q_js_1', 'q_js_2', 'q_js_3', 'q_js_4'],
    createdAt: '2026-02-10T12:00:00.000Z'
  },
  {
    id: 'exam_dsa_201',
    code: 'CS-DSA-201',
    title: 'Data Structures & Algorithmic Complexity',
    category: 'Data Structures',
    description: 'Core evaluation on stacks, queues, hash tables, asymptotic notation, and tree balancing algorithms.',
    durationMinutes: 20,
    passingPercentage: 70,
    status: 'published',
    randomizeQuestions: true,
    antiCheat: {
      enableFullscreen: true,
      enableTabSwitchDetection: true,
      maxAllowedTabSwitches: 2,
      blockCopyPaste: true
    },
    questionIds: ['q_dsa_1', 'q_dsa_2', 'q_dsa_3'],
    createdAt: '2026-02-12T14:00:00.000Z'
  },
  {
    id: 'exam_db_301',
    code: 'CS-DB-301',
    title: 'Relational Database Design & SQL Internals',
    category: 'Databases',
    description: 'Relational algebra, normalization theories, indexing performance, and ACID transaction isolation guarantees.',
    durationMinutes: 15,
    passingPercentage: 50,
    status: 'published',
    randomizeQuestions: false,
    antiCheat: {
      enableFullscreen: true,
      enableTabSwitchDetection: true,
      maxAllowedTabSwitches: 3,
      blockCopyPaste: true
    },
    questionIds: ['q_db_1', 'q_db_2', 'q_db_3'],
    createdAt: '2026-02-15T16:00:00.000Z'
  }
];

const INITIAL_SUBMISSIONS = [
  {
    id: 'sub_demo_1',
    examId: 'exam_js_101',
    studentId: 'user_student_1',
    studentName: 'John Doe',
    studentRollNo: 'CS-2026-042',
    examTitle: 'Modern JavaScript & Web Development Assessment',
    startedAt: '2026-02-18T10:00:00.000Z',
    submittedAt: '2026-02-18T10:14:15.000Z',
    timeSpentSeconds: 855,
    tabSwitches: 0,
    answers: {
      'q_js_1': 0, // Correct
      'q_js_2': 1, // Correct
      'q_js_3': 2, // Correct
      'q_js_4': 'Client-Side Rendering (CSR) downloads an empty HTML skeleton and a JavaScript bundle that renders components inside the browser. Server-Side Rendering (SSR) generates full HTML on the web server for each request, sending interactive content ready for the DOM. SSR provides superior SEO since crawlers instantly index the complete markup, while CSR requires specialized bot rendering. Initial load (FCP) is generally much faster with SSR, whereas CSR delivers faster subsequent client-side route transitions.'
    },
    mcqScore: 15, // 3 * 5
    mcqMaxScore: 15,
    essayScores: {
      'q_js_4': 14 // Evaluated by Dr. Reed
    },
    essayFeedback: {
      'q_js_4': 'Outstanding explanation covering FCP, bot indexing, and client hydration.'
    },
    totalScore: 29,
    maxScore: 30,
    percentage: 96.7,
    status: 'graded', // 'graded', 'pending_review'
    passed: true
  },
  {
    id: 'sub_demo_2',
    examId: 'exam_dsa_201',
    studentId: 'user_student_2',
    studentName: 'Sarah Connor',
    studentRollNo: 'CS-2026-088',
    examTitle: 'Data Structures & Algorithmic Complexity',
    startedAt: '2026-02-19T14:00:00.000Z',
    submittedAt: '2026-02-19T14:18:40.000Z',
    timeSpentSeconds: 1120,
    tabSwitches: 1,
    answers: {
      'q_dsa_1': 2, // Correct (O(N^2))
      'q_dsa_2': 1, // Correct (Stack)
      'q_dsa_3': 'Hash tables provide amortized O(1) time complexity for lookup and insert via hash keys, but cannot efficiently output items in sorted order without O(N log N) post-sort. Balanced BSTs such as Red-Black trees guarantee strict O(log N) lookup and insertion even in adversarial worst cases, and can stream elements in sorted sequence via in-order tree traversal in O(N).'
    },
    mcqScore: 10,
    mcqMaxScore: 10,
    essayScores: {
      'q_dsa_3': 13
    },
    essayFeedback: {
      'q_dsa_3': 'Solid breakdown of worst-case vs amortized complexities.'
    },
    totalScore: 23,
    maxScore: 25,
    percentage: 92.0,
    status: 'graded',
    passed: true
  }
];

class StorageService {
  constructor() {
    this.init();
  }

  init() {
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      this.save(STORAGE_KEYS.USERS, INITIAL_USERS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.QUESTIONS)) {
      this.save(STORAGE_KEYS.QUESTIONS, INITIAL_QUESTIONS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.EXAMS)) {
      this.save(STORAGE_KEYS.EXAMS, INITIAL_EXAMS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SUBMISSIONS)) {
      this.save(STORAGE_KEYS.SUBMISSIONS, INITIAL_SUBMISSIONS);
    }
  }

  get(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error(`Error reading ${key} from localStorage`, e);
      return null;
    }
  }

  save(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error(`Error saving ${key} to localStorage`, e);
      return false;
    }
  }

  // Users
  getUsers() { return this.get(STORAGE_KEYS.USERS) || []; }
  saveUsers(users) { return this.save(STORAGE_KEYS.USERS, users); }
  findUserByEmail(email) {
    const users = this.getUsers();
    return users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }
  findUserById(id) {
    return this.getUsers().find(u => u.id === id);
  }
  addUser(user) {
    const users = this.getUsers();
    users.push(user);
    this.saveUsers(users);
    return user;
  }
  updateUser(id, updates) {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...updates };
      this.saveUsers(users);
      return users[idx];
    }
    return null;
  }

  // Questions
  getQuestions() { return this.get(STORAGE_KEYS.QUESTIONS) || []; }
  saveQuestions(q) { return this.save(STORAGE_KEYS.QUESTIONS, q); }
  getQuestionById(id) {
    return this.getQuestions().find(q => q.id === id);
  }
  addQuestion(question) {
    const questions = this.getQuestions();
    questions.push(question);
    this.saveQuestions(questions);
    return question;
  }
  updateQuestion(id, updates) {
    const questions = this.getQuestions();
    const idx = questions.findIndex(q => q.id === id);
    if (idx !== -1) {
      questions[idx] = { ...questions[idx], ...updates };
      this.saveQuestions(questions);
      return questions[idx];
    }
    return null;
  }
  deleteQuestion(id) {
    let questions = this.getQuestions();
    questions = questions.filter(q => q.id !== id);
    this.saveQuestions(questions);
    // Also remove from any exam references
    const exams = this.getExams();
    exams.forEach(exam => {
      if (exam.questionIds && exam.questionIds.includes(id)) {
        exam.questionIds = exam.questionIds.filter(qid => qid !== id);
      }
    });
    this.saveExams(exams);
    return true;
  }

  // Exams
  getExams() { return this.get(STORAGE_KEYS.EXAMS) || []; }
  saveExams(exams) { return this.save(STORAGE_KEYS.EXAMS, exams); }
  getExamById(id) {
    return this.getExams().find(e => e.id === id);
  }
  addExam(exam) {
    const exams = this.getExams();
    exams.push(exam);
    this.saveExams(exams);
    return exam;
  }
  updateExam(id, updates) {
    const exams = this.getExams();
    const idx = exams.findIndex(e => e.id === id);
    if (idx !== -1) {
      exams[idx] = { ...exams[idx], ...updates };
      this.saveExams(exams);
      return exams[idx];
    }
    return null;
  }
  deleteExam(id) {
    let exams = this.getExams();
    exams = exams.filter(e => e.id !== id);
    return this.saveExams(exams);
  }

  // Submissions
  getSubmissions() { return this.get(STORAGE_KEYS.SUBMISSIONS) || []; }
  saveSubmissions(subs) { return this.save(STORAGE_KEYS.SUBMISSIONS, subs); }
  getSubmissionById(id) {
    return this.getSubmissions().find(s => s.id === id);
  }
  getSubmissionsByStudent(studentId) {
    return this.getSubmissions().filter(s => s.studentId === studentId);
  }
  getSubmissionsByExam(examId) {
    return this.getSubmissions().filter(s => s.examId === examId);
  }
  addSubmission(submission) {
    const subs = this.getSubmissions();
    subs.push(submission);
    this.saveSubmissions(subs);
    return submission;
  }
  updateSubmission(id, updates) {
    const subs = this.getSubmissions();
    const idx = subs.findIndex(s => s.id === id);
    if (idx !== -1) {
      subs[idx] = { ...subs[idx], ...updates };
      this.saveSubmissions(subs);
      return subs[idx];
    }
    return null;
  }

  // Session
  getSession() { return this.get(STORAGE_KEYS.SESSION); }
  setSession(user) { return this.save(STORAGE_KEYS.SESSION, user); }
  clearSession() { localStorage.removeItem(STORAGE_KEYS.SESSION); }

  // Reset to Factory Demo State
  resetAll() {
    this.save(STORAGE_KEYS.USERS, INITIAL_USERS);
    this.save(STORAGE_KEYS.QUESTIONS, INITIAL_QUESTIONS);
    this.save(STORAGE_KEYS.EXAMS, INITIAL_EXAMS);
    this.save(STORAGE_KEYS.SUBMISSIONS, INITIAL_SUBMISSIONS);
    this.clearSession();
  }
}

// Export singleton instance
window.storage = new StorageService();
