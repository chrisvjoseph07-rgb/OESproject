/**
 * Admin Module Controller
 * Handles Dashboard analytics, Exam CRUD, Question Bank CRUD, Student management, and Essay Grading.
 */

const AdminController = {
  init() {
    // Route guard
    if (!Auth.requireAuth('admin')) return;
    Auth.bindUserUI();
  },

  // ================= DASHBOARD =================
  renderDashboard() {
    this.init();
    const exams = window.storage.getExams();
    const questions = window.storage.getQuestions();
    const users = window.storage.getUsers();
    const students = users.filter(u => u.role === 'student');
    const submissions = window.storage.getSubmissions();
    const pendingGrading = submissions.filter(s => s.status === 'pending_review');

    // Update Stats
    document.getElementById('stat-total-exams').textContent = exams.length;
    document.getElementById('stat-active-exams').textContent = exams.filter(e => e.status === 'published').length;
    document.getElementById('stat-total-students').textContent = students.length;
    document.getElementById('stat-submissions').textContent = submissions.length;
    document.getElementById('stat-pending-grading').textContent = pendingGrading.length;

    // Render Recent Submissions Table
    const tbody = document.getElementById('recent-submissions-tbody');
    if (!tbody) return;

    if (submissions.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-muted" style="text-align: center; padding: 2rem;">No test submissions recorded yet.</td></tr>`;
      return;
    }

    const recent = [...submissions].reverse().slice(0, 5);
    tbody.innerHTML = recent.map(sub => {
      const isPending = sub.status === 'pending_review';
      const statusBadge = isPending
        ? `<span class="badge badge-warning">Pending Review</span>`
        : `<span class="badge ${sub.passed ? 'badge-success' : 'badge-danger'}">${sub.passed ? 'Passed' : 'Failed'} (${sub.percentage}%)</span>`;

      const warningTag = sub.tabSwitches > 0
        ? `<span class="badge badge-danger text-xs" title="${sub.tabSwitches} tab-switch violations">⚠️ ${sub.tabSwitches}</span>`
        : `<span class="badge badge-neutral text-xs">0</span>`;

      return `
        <tr>
          <td>
            <div class="font-semibold">${sub.studentName}</div>
            <div class="text-xs text-muted">${sub.studentRollNo || 'N/A'}</div>
          </td>
          <td>${sub.examTitle}</td>
          <td>${new Date(sub.submittedAt).toLocaleDateString()} ${new Date(sub.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
          <td>${warningTag}</td>
          <td>${statusBadge}</td>
          <td>
            <a href="results.html?subId=${sub.id}" class="btn btn-secondary btn-sm">
              ${isPending ? 'Grade Essay ✍️' : 'View Details 👁️'}
            </a>
          </td>
        </tr>
      `;
    }).join('');
  },

  // ================= EXAM MANAGEMENT =================
  renderExamsList() {
    this.init();
    const exams = window.storage.getExams();
    const tbody = document.getElementById('exams-table-body');
    const searchInput = document.getElementById('exam-search');
    const filterStatus = document.getElementById('exam-status-filter');

    const filterAndRender = () => {
      const q = (searchInput ? searchInput.value : '').toLowerCase().trim();
      const status = filterStatus ? filterStatus.value : 'all';

      const filtered = exams.filter(e => {
        const matchesQuery = e.title.toLowerCase().includes(q) || e.code.toLowerCase().includes(q) || e.category.toLowerCase().includes(q);
        const matchesStatus = status === 'all' || e.status === status;
        return matchesQuery && matchesStatus;
      });

      if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-muted" style="text-align:center; padding: 2.5rem;">No examinations match your filter.</td></tr>`;
        return;
      }

      tbody.innerHTML = filtered.map(exam => {
        const qCount = exam.questionIds ? exam.questionIds.length : 0;
        const statusBadge = exam.status === 'published'
          ? `<span class="badge badge-success">Published</span>`
          : `<span class="badge badge-neutral">Draft</span>`;

        return `
          <tr>
            <td>
              <span class="font-mono text-sm font-semibold text-primary">${exam.code}</span>
            </td>
            <td>
              <div class="font-semibold">${exam.title}</div>
              <div class="text-xs text-muted">${exam.category}</div>
            </td>
            <td>${exam.durationMinutes} mins</td>
            <td>${qCount} questions</td>
            <td>${exam.passingPercentage}%</td>
            <td>${statusBadge}</td>
            <td>
              <div class="flex gap-2">
                <a href="edit-exam.html?id=${exam.id}" class="btn btn-secondary btn-sm" title="Edit Exam">Edit</a>
                <button onclick="AdminController.toggleExamStatus('${exam.id}')" class="btn btn-outline btn-sm" title="Toggle Publish State">
                  ${exam.status === 'published' ? 'Unpublish' : 'Publish'}
                </button>
                <button onclick="AdminController.deleteExam('${exam.id}')" class="btn btn-danger btn-sm" title="Delete">Delete</button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    };

    if (searchInput) searchInput.addEventListener('input', filterAndRender);
    if (filterStatus) filterStatus.addEventListener('change', filterAndRender);
    filterAndRender();
  },

  toggleExamStatus(id) {
    const exam = window.storage.getExamById(id);
    if (!exam) return;
    const newStatus = exam.status === 'published' ? 'draft' : 'published';
    window.storage.updateExam(id, { status: newStatus });
    Toast.success(`Exam status updated to ${newStatus}.`);
    this.renderExamsList();
  },

  deleteExam(id) {
    const exam = window.storage.getExamById(id);
    if (!exam) return;
    if (confirm(`Are you sure you want to delete "${exam.title}"? Submissions will remain archived.`)) {
      window.storage.deleteExam(id);
      Toast.success('Exam removed successfully.');
      this.renderExamsList();
    }
  },

  // Create or Edit Exam Form Helper
  initExamForm(isEdit = false) {
    this.init();
    const urlParams = new URLSearchParams(window.location.search);
    const examId = urlParams.get('id');
    const questions = window.storage.getQuestions();
    let currentExam = null;

    if (isEdit && examId) {
      currentExam = window.storage.getExamById(examId);
      if (!currentExam) {
        Toast.error('Exam not found.');
        setTimeout(() => window.location.href = 'exams.html', 1500);
        return;
      }
      // Populate fields
      document.getElementById('exam-title').value = currentExam.title;
      document.getElementById('exam-code').value = currentExam.code;
      document.getElementById('exam-category').value = currentExam.category;
      document.getElementById('exam-duration').value = currentExam.durationMinutes;
      document.getElementById('exam-pass').value = currentExam.passingPercentage;
      document.getElementById('exam-description').value = currentExam.description || '';
      document.getElementById('exam-status').value = currentExam.status;
      document.getElementById('exam-randomize').checked = !!currentExam.randomizeQuestions;

      // Anti-cheat
      const ac = currentExam.antiCheat || {};
      document.getElementById('ac-fullscreen').checked = !!ac.enableFullscreen;
      document.getElementById('ac-tabswitch').checked = !!ac.enableTabSwitchDetection;
      document.getElementById('ac-copypaste').checked = !!ac.blockCopyPaste;
      document.getElementById('ac-max-tabs').value = ac.maxAllowedTabSwitches || 3;
    }

    // Render Question Picker Checkboxes
    const container = document.getElementById('question-picker-container');
    const selectedQIds = new Set(currentExam ? (currentExam.questionIds || []) : []);

    const updatePointsSummary = () => {
      let totalPts = 0;
      let count = 0;
      document.querySelectorAll('.q-picker-checkbox:checked').forEach(cb => {
        totalPts += parseInt(cb.dataset.points || '0', 10);
        count++;
      });
      const badge = document.getElementById('selected-questions-summary');
      if (badge) {
        badge.textContent = `${count} questions selected (${totalPts} total points)`;
      }
    };

    if (questions.length === 0) {
      container.innerHTML = `<div class="text-muted p-4">No questions exist in the Question Bank yet. Please add questions first!</div>`;
    } else {
      container.innerHTML = questions.map(q => {
        const isChecked = selectedQIds.has(q.id) ? 'checked' : '';
        return `
          <label class="card flex items-center justify-between gap-4 p-3" style="cursor: pointer; margin-bottom: 0.5rem;">
            <div class="flex items-center gap-3">
              <input type="checkbox" class="q-picker-checkbox" value="${q.id}" data-points="${q.points}" ${isChecked}>
              <div>
                <div class="font-semibold text-sm">${q.title}</div>
                <div class="flex gap-2 text-xs text-muted" style="margin-top: 0.2rem;">
                  <span class="badge ${q.type === 'mcq' ? 'badge-primary' : 'badge-neutral'}">${q.type.toUpperCase()}</span>
                  <span>${q.category}</span>
                  <span>•</span>
                  <span>${q.difficulty}</span>
                </div>
              </div>
            </div>
            <div class="font-bold text-sm text-primary whitespace-nowrap">
              ${q.points} pts
            </div>
          </label>
        `;
      }).join('');

      container.querySelectorAll('.q-picker-checkbox').forEach(cb => {
        cb.addEventListener('change', updatePointsSummary);
      });
      updatePointsSummary();
    }

    // Submit handler
    const form = document.getElementById('exam-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const selected = Array.from(document.querySelectorAll('.q-picker-checkbox:checked')).map(cb => cb.value);
      if (selected.length === 0) {
        Toast.warning('Please select at least one question for this examination.');
        return;
      }

      const examPayload = {
        title: document.getElementById('exam-title').value.trim(),
        code: document.getElementById('exam-code').value.trim().toUpperCase(),
        category: document.getElementById('exam-category').value.trim(),
        durationMinutes: parseInt(document.getElementById('exam-duration').value, 10),
        passingPercentage: parseInt(document.getElementById('exam-pass').value, 10),
        description: document.getElementById('exam-description').value.trim(),
        status: document.getElementById('exam-status').value,
        randomizeQuestions: document.getElementById('exam-randomize').checked,
        antiCheat: {
          enableFullscreen: document.getElementById('ac-fullscreen').checked,
          enableTabSwitchDetection: document.getElementById('ac-tabswitch').checked,
          blockCopyPaste: document.getElementById('ac-copypaste').checked,
          maxAllowedTabSwitches: parseInt(document.getElementById('ac-max-tabs').value, 10) || 3
        },
        questionIds: selected
      };

      if (isEdit) {
        window.storage.updateExam(examId, examPayload);
        Toast.success('Exam configuration updated successfully!');
      } else {
        examPayload.id = 'exam_' + Date.now();
        examPayload.createdAt = new Date().toISOString();
        window.storage.addExam(examPayload);
        Toast.success('New examination published successfully!');
      }

      setTimeout(() => {
        window.location.href = 'exams.html';
      }, 700);
    });
  },

  // ================= QUESTION BANK =================
  renderQuestionBank() {
    this.init();
    const questions = window.storage.getQuestions();
    const tbody = document.getElementById('questions-table-body');
    const searchInput = document.getElementById('q-search');
    const typeFilter = document.getElementById('q-type-filter');
    const catFilter = document.getElementById('q-cat-filter');

    const render = () => {
      const q = (searchInput ? searchInput.value : '').toLowerCase().trim();
      const type = typeFilter ? typeFilter.value : 'all';
      const cat = catFilter ? catFilter.value : 'all';

      const filtered = questions.filter(item => {
        const matchesQ = item.title.toLowerCase().includes(q) || (item.explanation && item.explanation.toLowerCase().includes(q));
        const matchesType = type === 'all' || item.type === type;
        const matchesCat = cat === 'all' || item.category === cat;
        return matchesQ && matchesType && matchesCat;
      });

      if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-muted" style="text-align: center; padding: 2.5rem;">No questions found matching criteria.</td></tr>`;
        return;
      }

      tbody.innerHTML = filtered.map(item => {
        const typeBadge = item.type === 'mcq'
          ? `<span class="badge badge-primary">MCQ</span>`
          : `<span class="badge badge-warning">Essay</span>`;

        const diffBadge = item.difficulty === 'Easy'
          ? `<span class="badge badge-success">Easy</span>`
          : item.difficulty === 'Medium'
            ? `<span class="badge badge-warning">Medium</span>`
            : `<span class="badge badge-danger">Hard</span>`;

        return `
          <tr>
            <td>${typeBadge}</td>
            <td>
              <div class="font-semibold">${item.title}</div>
              <div class="text-xs text-muted" style="margin-top: 0.25rem;">
                ${item.type === 'mcq' ? `${item.options.length} Choices • Correct: Option ${String.fromCharCode(65 + item.correctAnswer)}` : `Rubric: ${item.rubric || 'Evaluator criteria specified'}`}
              </div>
            </td>
            <td>${item.category}</td>
            <td>${diffBadge}</td>
            <td class="font-bold text-primary">${item.points} pts</td>
            <td>
              <div class="flex gap-2">
                <button onclick="AdminController.openEditQuestionModal('${item.id}')" class="btn btn-secondary btn-sm">Edit</button>
                <button onclick="AdminController.deleteQuestion('${item.id}')" class="btn btn-danger btn-sm">Delete</button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    };

    if (searchInput) searchInput.addEventListener('input', render);
    if (typeFilter) typeFilter.addEventListener('change', render);
    if (catFilter) catFilter.addEventListener('change', render);

    render();
  },

  openAddQuestionModal() {
    document.getElementById('q-modal-title').textContent = 'Add Question to Repository';
    document.getElementById('question-form').reset();
    document.getElementById('q-edit-id').value = '';
    this.toggleQuestionTypeFields('mcq');
    document.getElementById('question-modal').classList.add('active');
  },

  openEditQuestionModal(id) {
    const q = window.storage.getQuestionById(id);
    if (!q) return;

    document.getElementById('q-modal-title').textContent = 'Edit Question';
    document.getElementById('q-edit-id').value = q.id;
    document.getElementById('q-type').value = q.type;
    document.getElementById('q-title').value = q.title;
    document.getElementById('q-category').value = q.category;
    document.getElementById('q-difficulty').value = q.difficulty;
    document.getElementById('q-points').value = q.points;

    this.toggleQuestionTypeFields(q.type);

    if (q.type === 'mcq') {
      document.getElementById('q-opt-0').value = q.options[0] || '';
      document.getElementById('q-opt-1').value = q.options[1] || '';
      document.getElementById('q-opt-2').value = q.options[2] || '';
      document.getElementById('q-opt-3').value = q.options[3] || '';
      document.getElementById('q-correct').value = q.correctAnswer;
      document.getElementById('q-explanation').value = q.explanation || '';
    } else {
      document.getElementById('q-min-words').value = q.minWords || 50;
      document.getElementById('q-max-words').value = q.maxWords || 300;
      document.getElementById('q-rubric').value = q.rubric || '';
    }

    document.getElementById('question-modal').classList.add('active');
  },

  toggleQuestionTypeFields(type) {
    const mcqFields = document.getElementById('mcq-specific-fields');
    const essayFields = document.getElementById('essay-specific-fields');
    if (type === 'mcq') {
      mcqFields.style.display = 'block';
      essayFields.style.display = 'none';
    } else {
      mcqFields.style.display = 'none';
      essayFields.style.display = 'block';
    }
  },

  saveQuestionFromModal() {
    const editId = document.getElementById('q-edit-id').value;
    const type = document.getElementById('q-type').value;
    const title = document.getElementById('q-title').value.trim();
    const category = document.getElementById('q-category').value.trim();
    const difficulty = document.getElementById('q-difficulty').value;
    const points = parseInt(document.getElementById('q-points').value, 10);

    if (!title || !category || isNaN(points)) {
      Toast.error('Please complete all required fields.');
      return;
    }

    let questionPayload = {
      type,
      title,
      category,
      difficulty,
      points
    };

    if (type === 'mcq') {
      const opt0 = document.getElementById('q-opt-0').value.trim();
      const opt1 = document.getElementById('q-opt-1').value.trim();
      const opt2 = document.getElementById('q-opt-2').value.trim();
      const opt3 = document.getElementById('q-opt-3').value.trim();
      if (!opt0 || !opt1 || !opt2 || !opt3) {
        Toast.error('Please provide all 4 options for the MCQ.');
        return;
      }
      questionPayload.options = [opt0, opt1, opt2, opt3];
      questionPayload.correctAnswer = parseInt(document.getElementById('q-correct').value, 10);
      questionPayload.explanation = document.getElementById('q-explanation').value.trim();
    } else {
      questionPayload.minWords = parseInt(document.getElementById('q-min-words').value, 10) || 50;
      questionPayload.maxWords = parseInt(document.getElementById('q-max-words').value, 10) || 300;
      questionPayload.rubric = document.getElementById('q-rubric').value.trim();
    }

    if (editId) {
      window.storage.updateQuestion(editId, questionPayload);
      Toast.success('Question updated successfully!');
    } else {
      questionPayload.id = 'q_' + Date.now();
      window.storage.addQuestion(questionPayload);
      Toast.success('New question added to bank!');
    }

    document.getElementById('question-modal').classList.remove('active');
    this.renderQuestionBank();
  },

  deleteQuestion(id) {
    if (confirm('Are you sure you want to delete this question? It will be unlinked from existing exams.')) {
      window.storage.deleteQuestion(id);
      Toast.success('Question removed.');
      this.renderQuestionBank();
    }
  },

  // ================= STUDENT MANAGEMENT =================
  renderStudentsList() {
    this.init();
    const users = window.storage.getUsers();
    const students = users.filter(u => u.role === 'student');
    const submissions = window.storage.getSubmissions();
    const tbody = document.getElementById('students-table-body');
    const searchInput = document.getElementById('student-search');

    const render = () => {
      const q = (searchInput ? searchInput.value : '').toLowerCase().trim();
      const filtered = students.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        (s.rollNo && s.rollNo.toLowerCase().includes(q)) ||
        (s.department && s.department.toLowerCase().includes(q))
      );

      if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-muted" style="text-align: center; padding: 2.5rem;">No registered students match search.</td></tr>`;
        return;
      }

      tbody.innerHTML = filtered.map(student => {
        const studentSubs = submissions.filter(sub => sub.studentId === student.id);
        const avgScore = studentSubs.length > 0
          ? (studentSubs.reduce((acc, s) => acc + (s.percentage || 0), 0) / studentSubs.length).toFixed(1) + '%'
          : 'N/A';

        const statusBadge = student.status === 'blocked'
          ? `<span class="badge badge-danger">Blocked</span>`
          : `<span class="badge badge-success">Active</span>`;

        return `
          <tr>
            <td>
              <div class="font-semibold">${student.name}</div>
              <div class="text-xs text-muted">${student.email}</div>
            </td>
            <td><span class="font-mono text-sm">${student.rollNo || 'N/A'}</span></td>
            <td>${student.department || 'General'}</td>
            <td>${studentSubs.length} exams (${avgScore} avg)</td>
            <td>${statusBadge}</td>
            <td>
              <div class="flex gap-2">
                <button onclick="AdminController.toggleStudentStatus('${student.id}')" class="btn btn-outline btn-sm">
                  ${student.status === 'blocked' ? 'Unblock' : 'Block'}
                </button>
                <button onclick="AdminController.resetStudentPassword('${student.id}')" class="btn btn-secondary btn-sm">
                  Reset Pwd
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    };

    if (searchInput) searchInput.addEventListener('input', render);
    render();
  },

  toggleStudentStatus(id) {
    const student = window.storage.findUserById(id);
    if (!student) return;
    const newStatus = student.status === 'blocked' ? 'active' : 'blocked';
    window.storage.updateUser(id, { status: newStatus });
    Toast.success(`Student account is now ${newStatus}.`);
    this.renderStudentsList();
  },

  resetStudentPassword(id) {
    const newPass = prompt('Enter new password for this student:', 'student123');
    if (newPass && newPass.trim().length >= 6) {
      window.storage.updateUser(id, { password: newPass.trim() });
      Toast.success('Password updated successfully.');
    } else if (newPass) {
      Toast.error('Password must be at least 6 characters.');
    }
  },

  // ================= RESULTS & ESSAY GRADING =================
  renderResultsManagement() {
    this.init();
    const submissions = window.storage.getSubmissions();
    const exams = window.storage.getExams();
    const tbody = document.getElementById('results-table-body');
    const examFilter = document.getElementById('results-exam-filter');
    const statusFilter = document.getElementById('results-status-filter');

    // Populate exam filter dropdown
    if (examFilter && examFilter.options.length <= 1) {
      exams.forEach(e => {
        const opt = document.createElement('option');
        opt.value = e.id;
        opt.textContent = e.title;
        examFilter.appendChild(opt);
      });
    }

    const render = () => {
      const selectedExam = examFilter ? examFilter.value : 'all';
      const selectedStatus = statusFilter ? statusFilter.value : 'all';

      const filtered = [...submissions].reverse().filter(s => {
        const matchesExam = selectedExam === 'all' || s.examId === selectedExam;
        const matchesStatus = selectedStatus === 'all' || s.status === selectedStatus;
        return matchesExam && matchesStatus;
      });

      if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-muted" style="text-align: center; padding: 2.5rem;">No test submissions found.</td></tr>`;
        return;
      }

      tbody.innerHTML = filtered.map(sub => {
        const isPending = sub.status === 'pending_review';
        const statusBadge = isPending
          ? `<span class="badge badge-warning">Needs Essay Grading</span>`
          : `<span class="badge ${sub.passed ? 'badge-success' : 'badge-danger'}">${sub.passed ? 'PASSED' : 'FAILED'}</span>`;

        const antiCheatBadge = sub.tabSwitches > 0
          ? `<span class="badge badge-danger text-xs font-semibold">⚠️ ${sub.tabSwitches} Switch(es)</span>`
          : `<span class="badge badge-success text-xs">✓ Clean</span>`;

        return `
          <tr>
            <td>
              <div class="font-semibold">${sub.studentName}</div>
              <div class="text-xs text-muted">${sub.studentRollNo || 'N/A'}</div>
            </td>
            <td>
              <div class="font-semibold">${sub.examTitle}</div>
              <div class="text-xs text-muted">${new Date(sub.submittedAt).toLocaleDateString()} ${new Date(sub.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            </td>
            <td>${antiCheatBadge}</td>
            <td>${sub.mcqScore} / ${sub.mcqMaxScore}</td>
            <td>${sub.essayScores ? Object.values(sub.essayScores).reduce((a, b) => a + b, 0) : 0} pts</td>
            <td>
              <strong>${sub.totalScore} / ${sub.maxScore}</strong>
              <div class="text-xs text-muted">${sub.percentage}%</div>
            </td>
            <td>${statusBadge}</td>
            <td>
              <button onclick="AdminController.openGradeModal('${sub.id}')" class="btn btn-primary btn-sm">
                ${isPending ? 'Grade Essays ✍️' : 'Review / Re-grade'}
              </button>
            </td>
          </tr>
        `;
      }).join('');
    };

    if (examFilter) examFilter.addEventListener('change', render);
    if (statusFilter) statusFilter.addEventListener('change', render);

    render();

    // Check if query param subId is provided
    const urlParams = new URLSearchParams(window.location.search);
    const targetSubId = urlParams.get('subId');
    if (targetSubId) {
      setTimeout(() => this.openGradeModal(targetSubId), 200);
    }
  },

  openGradeModal(submissionId) {
    const sub = window.storage.getSubmissionById(submissionId);
    if (!sub) return;

    const exam = window.storage.getExamById(sub.examId);
    const questions = window.storage.getQuestions();

    document.getElementById('grade-modal-student').textContent = `${sub.studentName} (${sub.studentRollNo || 'N/A'})`;
    document.getElementById('grade-modal-exam').textContent = sub.examTitle;
    document.getElementById('grade-sub-id').value = sub.id;

    // Render questions breakdown
    const qContainer = document.getElementById('grade-questions-container');
    const examQIds = exam ? exam.questionIds : Object.keys(sub.answers);

    qContainer.innerHTML = examQIds.map((qid, idx) => {
      const q = questions.find(item => item.id === qid);
      if (!q) return '';

      const answer = sub.answers[qid];

      if (q.type === 'mcq') {
        const isCorrect = answer === q.correctAnswer;
        const studentChoice = (answer !== undefined && answer !== null) ? q.options[answer] : 'No Answer';
        const correctChoice = q.options[q.correctAnswer];

        return `
          <div class="card p-3" style="margin-bottom: 1rem; border-left: 4px solid ${isCorrect ? 'var(--success)' : 'var(--danger)'};">
            <div class="flex justify-between items-center">
              <span class="badge ${isCorrect ? 'badge-success' : 'badge-danger'}">Question ${idx + 1} • MCQ (${isCorrect ? q.points : 0} / ${q.points} pts)</span>
              <span class="text-xs text-muted">${q.category}</span>
            </div>
            <div class="font-semibold" style="margin: 0.5rem 0;">${q.title}</div>
            <div class="text-sm">
              <div><strong>Student Answer:</strong> <span style="color: ${isCorrect ? 'var(--success)' : 'var(--danger)'};">${studentChoice}</span></div>
              ${!isCorrect ? `<div><strong>Correct Answer:</strong> <span class="text-success">${correctChoice}</span></div>` : ''}
              ${q.explanation ? `<div class="text-xs text-muted" style="margin-top: 0.25rem;"><em>Explanation:</em> ${q.explanation}</div>` : ''}
            </div>
          </div>
        `;
      } else {
        // Essay Question
        const essayAnswerText = answer || '<em>No answer provided</em>';
        const wordCount = answer ? answer.trim().split(/\s+/).filter(Boolean).length : 0;
        const currentEssayScore = (sub.essayScores && sub.essayScores[qid] !== undefined) ? sub.essayScores[qid] : 0;
        const currentFeedback = (sub.essayFeedback && sub.essayFeedback[qid]) ? sub.essayFeedback[qid] : '';

        return `
          <div class="card p-4" style="margin-bottom: 1rem; border-left: 4px solid var(--warning); background: #fffdf5;">
            <div class="flex justify-between items-center">
              <span class="badge badge-warning">Question ${idx + 1} • Essay (Max ${q.points} pts)</span>
              <span class="text-xs text-muted">Word count: ${wordCount} words</span>
            </div>
            <div class="font-semibold" style="margin: 0.6rem 0;">${q.title}</div>

            <div style="background: var(--bg-surface); border: 1px solid var(--border-light); border-radius: var(--radius-md); padding: 1rem; margin-bottom: 1rem;">
              <div class="text-xs font-semibold text-muted" style="margin-bottom: 0.35rem;">STUDENT ESSAY SUBMISSION:</div>
              <p style="white-space: pre-wrap; font-size: 0.95rem; color: var(--text-main);">${essayAnswerText}</p>
            </div>

            <div class="text-xs text-muted" style="margin-bottom: 1rem;">
              <strong>Grading Rubric:</strong> ${q.rubric || 'Evaluate clarity, accuracy, and completeness.'}
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label" style="font-size: 0.85rem;">Award Points (Max ${q.points}) *</label>
                <input type="number" class="form-control essay-grade-input" data-qid="${qid}" data-max="${q.points}" min="0" max="${q.points}" value="${currentEssayScore}" required>
              </div>
              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label" style="font-size: 0.85rem;">Instructor Feedback</label>
                <input type="text" class="form-control essay-feedback-input" data-qid="${qid}" placeholder="Constructive remarks..." value="${currentFeedback}">
              </div>
            </div>
          </div>
        `;
      }
    }).join('');

    document.getElementById('grade-modal').classList.add('active');
  },

  saveGrades() {
    const subId = document.getElementById('grade-sub-id').value;
    const sub = window.storage.getSubmissionById(subId);
    if (!sub) return;

    const exam = window.storage.getExamById(sub.examId);
    const essayInputs = document.querySelectorAll('.essay-grade-input');
    const feedbackInputs = document.querySelectorAll('.essay-feedback-input');

    const essayScores = { ...(sub.essayScores || {}) };
    const essayFeedback = { ...(sub.essayFeedback || {}) };

    let totalEssayScore = 0;

    for (let input of essayInputs) {
      const qid = input.dataset.qid;
      const maxPts = parseInt(input.dataset.max, 10);
      const score = Math.max(0, Math.min(maxPts, parseInt(input.value, 10) || 0));
      essayScores[qid] = score;
      totalEssayScore += score;
    }

    for (let input of feedbackInputs) {
      const qid = input.dataset.qid;
      essayFeedback[qid] = input.value.trim();
    }

    const totalScore = (sub.mcqScore || 0) + totalEssayScore;
    const percentage = Number(((totalScore / sub.maxScore) * 100).toFixed(1));
    const passThreshold = exam ? exam.passingPercentage : 50;
    const passed = percentage >= passThreshold;

    window.storage.updateSubmission(subId, {
      essayScores,
      essayFeedback,
      totalScore,
      percentage,
      passed,
      status: 'graded'
    });

    Toast.success('Evaluation saved! Scorecard updated.');
    document.getElementById('grade-modal').classList.remove('active');
    this.renderResultsManagement();
  }
};

window.AdminController = AdminController;
