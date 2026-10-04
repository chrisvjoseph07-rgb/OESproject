/**
 * Examination Engine
 * Handles Real-time Proctoring, Timer, Randomization, Answer Persistence, Navigation, and Auto-Scoring.
 */

const ExamEngine = {
  exam: null,
  questions: [],
  currentIndex: 0,
  answers: {}, // { [qid]: value }
  markedForReview: new Set(),
  startTime: null,
  timeRemaining: 0, // seconds
  timerInterval: null,
  tabSwitches: 0,
  storageKey: null,
  student: null,
  isSubmitting: false,

  init() {
    if (!Auth.requireAuth('student')) return;

    this.student = Auth.getCurrentUser();
    const urlParams = new URLSearchParams(window.location.search);
    const examId = urlParams.get('id');

    if (!examId) {
      alert('No examination specified.');
      window.location.href = 'exams.html';
      return;
    }

    this.exam = window.storage.getExamById(examId);
    if (!this.exam || this.exam.status !== 'published') {
      alert('This examination is not available.');
      window.location.href = 'exams.html';
      return;
    }

    this.storageKey = `oes_attempt_${this.student.id}_${this.exam.id}`;

    // Load Exam Questions
    const allBankQuestions = window.storage.getQuestions();
    let examQuestions = (this.exam.questionIds || [])
      .map(id => allBankQuestions.find(q => q.id === id))
      .filter(Boolean);

    if (examQuestions.length === 0) {
      alert('This examination does not contain any questions yet.');
      window.location.href = 'exams.html';
      return;
    }

    // Restore or Initialize Attempt
    const savedAttempt = localStorage.getItem(this.storageKey);
    if (savedAttempt) {
      try {
        const parsed = JSON.parse(savedAttempt);
        this.questions = parsed.questions || examQuestions;
        this.answers = parsed.answers || {};
        this.markedForReview = new Set(parsed.markedForReview || []);
        this.currentIndex = parsed.currentIndex || 0;
        this.startTime = parsed.startTime;
        this.tabSwitches = parsed.tabSwitches || 0;

        // Calculate Remaining Time from wall clock
        const elapsedSeconds = Math.floor((Date.now() - new Date(this.startTime).getTime()) / 1000);
        const totalSeconds = this.exam.durationMinutes * 60;
        this.timeRemaining = Math.max(0, totalSeconds - elapsedSeconds);
      } catch (e) {
        console.error('Error restoring attempt, re-initializing', e);
        this.setupNewAttempt(examQuestions);
      }
    } else {
      this.setupNewAttempt(examQuestions);
    }

    // Bind UI & Anti-Cheating
    this.bindAntiCheating();
    this.renderHeader();
    this.startTimer();
    this.renderPalette();
    this.renderCurrentQuestion();

    // Check if initial time already expired
    if (this.timeRemaining <= 0) {
      alert('The time allocated for this exam has already expired. Auto-submitting now.');
      this.submitExam(true);
    }
  },

  setupNewAttempt(examQuestions) {
    // Randomize if configured
    if (this.exam.randomizeQuestions) {
      // Fisher-Yates shuffle
      this.questions = [...examQuestions].sort(() => Math.random() - 0.5);
    } else {
      this.questions = [...examQuestions];
    }

    this.answers = {};
    this.markedForReview = new Set();
    this.currentIndex = 0;
    this.startTime = new Date().toISOString();
    this.timeRemaining = this.exam.durationMinutes * 60;
    this.tabSwitches = 0;
    this.saveState();
  },

  saveState() {
    if (this.isSubmitting) return;
    const state = {
      questions: this.questions,
      answers: this.answers,
      markedForReview: Array.from(this.markedForReview),
      currentIndex: this.currentIndex,
      startTime: this.startTime,
      tabSwitches: this.tabSwitches
    };
    localStorage.setItem(this.storageKey, JSON.stringify(state));
  },

  // ================= TIMER =================
  startTimer() {
    this.updateTimerDisplay();
    this.timerInterval = setInterval(() => {
      this.timeRemaining--;

      this.updateTimerDisplay();

      if (this.timeRemaining <= 0) {
        clearInterval(this.timerInterval);
        this.updateTimerDisplay();
        alert('⏰ TIME IS UP! Your examination is being submitted automatically.');
        this.submitExam(true);
      }
    }, 1000);
  },

  updateTimerDisplay() {
    const el = document.getElementById('exam-timer');
    if (!el) return;

    const m = Math.floor(Math.max(0, this.timeRemaining) / 60);
    const s = Math.max(0, this.timeRemaining) % 60;
    el.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

    const parent = el.parentElement;
    if (this.timeRemaining <= 60) {
      parent.className = 'timer-box timer-critical';
    } else if (this.timeRemaining <= 300) {
      parent.className = 'timer-box timer-warning';
    } else {
      parent.className = 'timer-box';
    }
  },

  // ================= ANTI-CHEATING =================
  bindAntiCheating() {
    const ac = this.exam.antiCheat || {};

    // 1. Prevent Right-Click & Copy-Paste
    if (ac.blockCopyPaste) {
      document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        Toast.warning('Right-click is disabled during examination.');
      });
      document.addEventListener('copy', (e) => e.preventDefault());
      document.addEventListener('cut', (e) => e.preventDefault());
      document.addEventListener('paste', (e) => e.preventDefault());
    }

    // 2. Refresh / Leave Warning
    window.addEventListener('beforeunload', (e) => {
      if (!this.isSubmitting) {
        e.preventDefault();
        e.returnValue = 'You have an ongoing examination. Leaving now will not pause your timer.';
      }
    });

    // 3. Tab-Switch Detection
    if (ac.enableTabSwitchDetection) {
      const handleVisibilityChange = () => {
        if (document.hidden && !this.isSubmitting) {
          this.tabSwitches++;
          this.saveState();
          this.updateViolationBadge();

          const max = ac.maxAllowedTabSwitches || 3;
          if (this.tabSwitches >= max) {
            alert(`⚠️ EXAM TERMINATED: You exceeded the allowed tab switches (${this.tabSwitches}/${max}). Your test will now be submitted immediately.`);
            this.submitExam(true);
          } else {
            alert(`⚠️ WARNING: Tab or window switch detected! (${this.tabSwitches} of ${max} allowed). Do not leave this tab again or your exam will be terminated.`);
          }
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('blur', () => {
        // Fallback for window blur
        if (!document.hidden) handleVisibilityChange();
      });
    }

    // 4. Fullscreen enforcement modal
    if (ac.enableFullscreen) {
      this.promptFullscreen();
      document.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement && !this.isSubmitting) {
          Toast.warning('Exam requires fullscreen mode. Please return to fullscreen.');
        }
      });
    }
  },

  promptFullscreen() {
    const requestFs = () => {
      const el = document.documentElement;
      if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    };

    // Auto-request or user click
    setTimeout(requestFs, 500);
  },

  updateViolationBadge() {
    const badge = document.getElementById('violation-counter');
    if (badge) {
      const max = (this.exam.antiCheat && this.exam.antiCheat.maxAllowedTabSwitches) || 3;
      badge.textContent = `Tab Switches: ${this.tabSwitches} / ${max}`;
      badge.className = this.tabSwitches > 0 ? 'badge badge-danger' : 'badge badge-neutral';
    }
  },

  // ================= RENDERING =================
  renderHeader() {
    document.getElementById('exam-title-display').textContent = this.exam.title;
    document.getElementById('candidate-name-display').textContent = this.student.name;
    this.updateViolationBadge();
  },

  renderPalette() {
    const grid = document.getElementById('question-palette-grid');
    if (!grid) return;

    grid.innerHTML = this.questions.map((q, idx) => {
      const isCurrent = idx === this.currentIndex;
      const isAnswered = this.answers[q.id] !== undefined && this.answers[q.id] !== null && this.answers[q.id] !== '';
      const isMarked = this.markedForReview.has(q.id);

      let statusClass = 'unvisited';
      if (isMarked) statusClass = 'marked';
      else if (isAnswered) statusClass = 'answered';

      return `
        <button
          type="button"
          class="palette-btn ${statusClass} ${isCurrent ? 'current' : ''}"
          onclick="ExamEngine.goToQuestion(${idx})"
          title="Question ${idx + 1}"
        >
          ${idx + 1}
        </button>
      `;
    }).join('');

    // Update Counts
    let answered = 0;
    this.questions.forEach(q => {
      if (this.answers[q.id] !== undefined && this.answers[q.id] !== null && this.answers[q.id] !== '') answered++;
    });
    const marked = this.markedForReview.size;

    document.getElementById('count-answered').textContent = answered;
    document.getElementById('count-marked').textContent = marked;
    document.getElementById('count-remaining').textContent = this.questions.length - answered;
  },

  renderCurrentQuestion() {
    const q = this.questions[this.currentIndex];
    if (!q) return;

    // Header info
    document.getElementById('q-current-number').textContent = `Question ${this.currentIndex + 1} of ${this.questions.length}`;
    document.getElementById('q-points-badge').textContent = `${q.points} Points`;
    document.getElementById('q-type-badge').textContent = q.type.toUpperCase();

    // Prompt
    document.getElementById('q-prompt-text').textContent = q.title;

    // Render Answer Area
    const answerArea = document.getElementById('q-answer-area');
    const savedAns = this.answers[q.id];

    if (q.type === 'mcq') {
      answerArea.innerHTML = q.options.map((opt, optIdx) => {
        const isSelected = savedAns === optIdx;
        const letter = String.fromCharCode(65 + optIdx);
        return `
          <div
            class="mcq-option ${isSelected ? 'selected' : ''}"
            onclick="ExamEngine.selectMCQOption(${optIdx})"
          >
            <div class="mcq-option-key">${letter}</div>
            <div style="font-size: 1rem; color: var(--text-main);">${opt}</div>
          </div>
        `;
      }).join('');
    } else {
      // Essay question
      const val = savedAns || '';
      const words = val.trim().split(/\s+/).filter(Boolean).length;
      answerArea.innerHTML = `
        <div style="margin-bottom: 0.5rem;" class="flex justify-between items-center text-xs text-muted">
          <span>Min: ${q.minWords || 50} words • Max: ${q.maxWords || 300} words</span>
          <span id="essay-word-count">Word Count: <strong>${words}</strong></span>
        </div>
        <textarea
          id="essay-textarea"
          class="form-control"
          style="min-height: 240px; font-size: 1rem; line-height: 1.6;"
          placeholder="Type your essay answer here. Work is saved automatically..."
          oninput="ExamEngine.onEssayInput(this.value)"
        >${val}</textarea>
      `;
    }

    // Update Mark for Review Button state
    const markBtn = document.getElementById('btn-mark-review');
    if (markBtn) {
      if (this.markedForReview.has(q.id)) {
        markBtn.textContent = '★ Unmark Review';
        markBtn.className = 'btn btn-warning btn-sm';
      } else {
        markBtn.textContent = '☆ Mark for Review';
        markBtn.className = 'btn btn-secondary btn-sm';
      }
    }

    // Toggle Previous Button
    const prevBtn = document.getElementById('btn-prev');
    if (prevBtn) prevBtn.disabled = this.currentIndex === 0;

    // Toggle Next / Review Finish Button
    const nextBtn = document.getElementById('btn-next');
    if (nextBtn) {
      if (this.currentIndex === this.questions.length - 1) {
        nextBtn.textContent = 'Review & Submit →';
        nextBtn.className = 'btn btn-success';
      } else {
        nextBtn.textContent = 'Next Question →';
        nextBtn.className = 'btn btn-primary';
      }
    }

    this.renderPalette();
  },

  // ================= ACTIONS =================
  selectMCQOption(idx) {
    const q = this.questions[this.currentIndex];
    this.answers[q.id] = idx;
    this.saveState();
    this.renderCurrentQuestion();
  },

  onEssayInput(text) {
    const q = this.questions[this.currentIndex];
    this.answers[q.id] = text;
    this.saveState();

    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const counter = document.getElementById('essay-word-count');
    if (counter) counter.innerHTML = `Word Count: <strong>${words}</strong>`;

    this.renderPalette();
  },

  clearCurrentAnswer() {
    const q = this.questions[this.currentIndex];
    delete this.answers[q.id];
    this.saveState();
    this.renderCurrentQuestion();
  },

  toggleMarkForReview() {
    const q = this.questions[this.currentIndex];
    if (this.markedForReview.has(q.id)) {
      this.markedForReview.delete(q.id);
    } else {
      this.markedForReview.add(q.id);
    }
    this.saveState();
    this.renderCurrentQuestion();
  },

  goToQuestion(idx) {
    if (idx >= 0 && idx < this.questions.length) {
      this.currentIndex = idx;
      this.saveState();
      this.renderCurrentQuestion();
    }
  },

  nextQuestion() {
    if (this.currentIndex < this.questions.length - 1) {
      this.currentIndex++;
      this.saveState();
      this.renderCurrentQuestion();
    } else {
      this.openSubmitModal();
    }
  },

  prevQuestion() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.saveState();
      this.renderCurrentQuestion();
    }
  },

  // ================= SUBMISSION =================
  openSubmitModal() {
    let answered = 0;
    this.questions.forEach(q => {
      if (this.answers[q.id] !== undefined && this.answers[q.id] !== null && this.answers[q.id] !== '') answered++;
    });
    const marked = this.markedForReview.size;
    const unanswered = this.questions.length - answered;

    document.getElementById('modal-ans-count').textContent = answered;
    document.getElementById('modal-marked-count').textContent = marked;
    document.getElementById('modal-unans-count').textContent = unanswered;

    document.getElementById('submit-confirm-modal').classList.add('active');
  },

  submitExam(isAuto = false) {
    if (this.isSubmitting) return;
    this.isSubmitting = true;

    if (this.timerInterval) clearInterval(this.timerInterval);

    // Calculate MCQ Score immediately
    let mcqScore = 0;
    let mcqMaxScore = 0;
    let totalMaxScore = 0;
    let hasEssay = false;

    this.questions.forEach(q => {
      totalMaxScore += q.points;
      if (q.type === 'mcq') {
        mcqMaxScore += q.points;
        if (this.answers[q.id] === q.correctAnswer) {
          mcqScore += q.points;
        }
      } else {
        hasEssay = true;
      }
    });

    const elapsedSeconds = (this.exam.durationMinutes * 60) - Math.max(0, this.timeRemaining);

    // Initial total score & status
    const initialTotalScore = mcqScore;
    const initialPercentage = Number(((initialTotalScore / totalMaxScore) * 100).toFixed(1));
    const passed = initialPercentage >= this.exam.passingPercentage;
    const status = hasEssay ? 'pending_review' : 'graded';

    const submissionRecord = {
      id: 'sub_' + Date.now(),
      examId: this.exam.id,
      studentId: this.student.id,
      studentName: this.student.name,
      studentRollNo: this.student.rollNo,
      examTitle: this.exam.title,
      startedAt: this.startTime,
      submittedAt: new Date().toISOString(),
      timeSpentSeconds: elapsedSeconds,
      tabSwitches: this.tabSwitches,
      answers: this.answers,
      mcqScore: mcqScore,
      mcqMaxScore: mcqMaxScore,
      essayScores: {},
      essayFeedback: {},
      totalScore: initialTotalScore,
      maxScore: totalMaxScore,
      percentage: initialPercentage,
      status: status,
      passed: passed
    };

    window.storage.addSubmission(submissionRecord);

    // Clear active temp state
    localStorage.removeItem(this.storageKey);

    // Exit fullscreen if active
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }

    if (!isAuto) {
      Toast.success('Exam submitted successfully!');
    }

    setTimeout(() => {
      window.location.href = `results.html?subId=${submissionRecord.id}`;
    }, 500);
  }
};

window.ExamEngine = ExamEngine;
