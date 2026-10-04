/**
 * Student Module Controller
 * Handles Student Dashboard, Available Exams, Detailed Result History, and Profile management.
 */

const StudentController = {
  init() {
    if (!Auth.requireAuth('student')) return;
    Auth.bindUserUI();
  },

  // ================= STUDENT DASHBOARD =================
  renderDashboard() {
    this.init();
    const user = Auth.getCurrentUser();
    const exams = window.storage.getExams().filter(e => e.status === 'published');
    const allSubs = window.storage.getSubmissions();
    const mySubs = allSubs.filter(s => s.studentId === user.id);

    // Compute Metrics
    const totalAttempted = mySubs.length;
    const passedCount = mySubs.filter(s => s.passed).length;
    const avgScore = totalAttempted > 0
      ? (mySubs.reduce((acc, s) => acc + (s.percentage || 0), 0) / totalAttempted).toFixed(1)
      : 0;

    document.getElementById('stat-my-exams').textContent = totalAttempted;
    document.getElementById('stat-my-avg').textContent = `${avgScore}%`;
    document.getElementById('stat-my-passed').textContent = passedCount;
    document.getElementById('stat-available-exams').textContent = exams.length;

    // Render Available Exams (Top 3)
    const availableContainer = document.getElementById('dashboard-available-exams');
    if (availableContainer) {
      if (exams.length === 0) {
        availableContainer.innerHTML = `<div class="text-muted p-4 text-center">No active examinations are currently published.</div>`;
      } else {
        availableContainer.innerHTML = exams.slice(0, 3).map(exam => {
          const hasTaken = mySubs.some(s => s.examId === exam.id);
          const qCount = exam.questionIds ? exam.questionIds.length : 0;

          return `
            <div class="card card-hover flex justify-between items-center gap-4 p-4" style="margin-bottom: 0.75rem;">
              <div>
                <span class="badge badge-primary text-xs" style="margin-bottom: 0.35rem;">${exam.category}</span>
                <div class="font-bold text-base">${exam.title}</div>
                <div class="flex gap-3 text-xs text-muted" style="margin-top: 0.25rem;">
                  <span>⏱️ ${exam.durationMinutes} mins</span>
                  <span>•</span>
                  <span>📝 ${qCount} questions</span>
                  <span>•</span>
                  <span>🎯 Pass: ${exam.passingPercentage}%</span>
                </div>
              </div>
              <div>
                <a href="exam-take.html?id=${exam.id}" class="btn btn-primary btn-sm">
                  ${hasTaken ? 'Retake Exam →' : 'Start Exam →'}
                </a>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // Render Recent Results Table
    const recentTbody = document.getElementById('dashboard-recent-results');
    if (recentTbody) {
      if (mySubs.length === 0) {
        recentTbody.innerHTML = `<tr><td colspan="5" class="text-muted" style="text-align: center; padding: 2rem;">You haven't completed any assessments yet.</td></tr>`;
      } else {
        const recent = [...mySubs].reverse().slice(0, 5);
        recentTbody.innerHTML = recent.map(sub => {
          const isPending = sub.status === 'pending_review';
          const badge = isPending
            ? `<span class="badge badge-warning">Pending Review</span>`
            : `<span class="badge ${sub.passed ? 'badge-success' : 'badge-danger'}">${sub.passed ? 'PASSED' : 'FAILED'}</span>`;

          return `
            <tr>
              <td>
                <div class="font-semibold">${sub.examTitle}</div>
                <div class="text-xs text-muted">${new Date(sub.submittedAt).toLocaleDateString()}</div>
              </td>
              <td>${sub.totalScore} / ${sub.maxScore}</td>
              <td class="font-bold">${sub.percentage}%</td>
              <td>${badge}</td>
              <td>
                <a href="results.html?subId=${sub.id}" class="btn btn-secondary btn-sm">View Result</a>
              </td>
            </tr>
          `;
        }).join('');
      }
    }
  },

  // ================= AVAILABLE EXAMS CATALOG =================
  renderExamsCatalog() {
    this.init();
    const user = Auth.getCurrentUser();
    const exams = window.storage.getExams().filter(e => e.status === 'published');
    const mySubs = window.storage.getSubmissionsByStudent(user.id);
    const container = document.getElementById('exams-catalog-grid');
    const searchInput = document.getElementById('catalog-search');
    const catFilter = document.getElementById('catalog-cat-filter');

    const render = () => {
      const q = (searchInput ? searchInput.value : '').toLowerCase().trim();
      const cat = catFilter ? catFilter.value : 'all';

      const filtered = exams.filter(e => {
        const matchQ = e.title.toLowerCase().includes(q) || e.code.toLowerCase().includes(q) || (e.description && e.description.toLowerCase().includes(q));
        const matchCat = cat === 'all' || e.category === cat;
        return matchQ && matchCat;
      });

      if (filtered.length === 0) {
        container.innerHTML = `<div class="empty-state" style="grid-column: 1 / -1;">No examinations found matching your criteria.</div>`;
        return;
      }

      container.innerHTML = filtered.map(exam => {
        const qCount = exam.questionIds ? exam.questionIds.length : 0;
        const mySubmissionsForExam = mySubs.filter(s => s.examId === exam.id);
        const hasTaken = mySubmissionsForExam.length > 0;
        const bestScore = hasTaken ? Math.max(...mySubmissionsForExam.map(s => s.percentage || 0)) : null;

        return `
          <div class="card card-hover flex flex-col justify-between" style="border-top: 4px solid var(--primary);">
            <div>
              <div class="flex justify-between items-center" style="margin-bottom: 0.75rem;">
                <span class="badge badge-primary text-xs">${exam.category}</span>
                <span class="font-mono text-xs font-semibold text-muted">${exam.code}</span>
              </div>

              <h3 style="font-size: 1.2rem; margin-bottom: 0.5rem;">${exam.title}</h3>
              <p class="text-sm text-secondary" style="margin-bottom: 1.25rem; min-height: 48px;">
                ${exam.description || 'Proctored examination testing theoretical and practical competency.'}
              </p>

              <div class="grid grid-cols-3 gap-2 p-3" style="background: var(--bg-subtle); border-radius: var(--radius-md); margin-bottom: 1.25rem; text-align: center;">
                <div>
                  <div class="text-xs text-muted">Duration</div>
                  <div class="font-bold text-sm text-main">${exam.durationMinutes}m</div>
                </div>
                <div>
                  <div class="text-xs text-muted">Questions</div>
                  <div class="font-bold text-sm text-main">${qCount}</div>
                </div>
                <div>
                  <div class="text-xs text-muted">Passing</div>
                  <div class="font-bold text-sm text-main">${exam.passingPercentage}%</div>
                </div>
              </div>

              ${hasTaken ? `
                <div class="flex justify-between items-center text-xs p-2" style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: var(--radius-sm); margin-bottom: 1rem;">
                  <span class="text-success font-semibold">✓ Previous Attempt: ${bestScore}%</span>
                  <span class="text-muted">${mySubmissionsForExam.length} attempt(s)</span>
                </div>
              ` : ''}
            </div>

            <div class="flex gap-2" style="margin-top: 1rem;">
              <button onclick="StudentController.openExamDetailsModal('${exam.id}')" class="btn btn-secondary btn-sm flex-1">
                Rules & Details
              </button>
              <a href="exam-take.html?id=${exam.id}" class="btn btn-primary btn-sm flex-1">
                ${hasTaken ? 'Retake Exam' : 'Start Exam'}
              </a>
            </div>
          </div>
        `;
      }).join('');
    };

    if (searchInput) searchInput.addEventListener('input', render);
    if (catFilter) catFilter.addEventListener('change', render);

    render();
  },

  openExamDetailsModal(examId) {
    const exam = window.storage.getExamById(examId);
    if (!exam) return;

    document.getElementById('modal-exam-title').textContent = exam.title;
    document.getElementById('modal-exam-code').textContent = exam.code;
    document.getElementById('modal-exam-category').textContent = exam.category;
    document.getElementById('modal-exam-duration').textContent = `${exam.durationMinutes} Minutes`;
    document.getElementById('modal-exam-questions').textContent = `${exam.questionIds ? exam.questionIds.length : 0} Questions`;
    document.getElementById('modal-exam-pass').textContent = `${exam.passingPercentage}%`;
    document.getElementById('modal-exam-desc').textContent = exam.description || 'Read all questions carefully. Auto-submission will trigger when the timer reaches zero.';

    const ac = exam.antiCheat || {};
    document.getElementById('modal-exam-proctoring').innerHTML = `
      <ul style="padding-left: 1.25rem; font-size: 0.875rem; color: var(--text-secondary); line-height: 1.7;">
        <li>${ac.enableFullscreen ? '🔒 Fullscreen mode is strictly monitored.' : 'Fullscreen mode optional.'}</li>
        <li>${ac.enableTabSwitchDetection ? `⚠️ Tab switching is restricted. Maximum allowed switches: <strong>${ac.maxAllowedTabSwitches || 3}</strong>.` : 'Tab switching allowed.'}</li>
        <li>${ac.blockCopyPaste ? '🚫 Copying, pasting, and right-click context menu are disabled.' : 'Copy paste allowed.'}</li>
        <li>⏱️ Automatic submission occurs if time expires.</li>
      </ul>
    `;

    document.getElementById('modal-start-btn').href = `exam-take.html?id=${exam.id}`;
    document.getElementById('exam-details-modal').classList.add('active');
  },

  // ================= RESULTS HISTORY =================
  renderResultsHistory() {
    this.init();
    const user = Auth.getCurrentUser();
    const submissions = window.storage.getSubmissionsByStudent(user.id);
    const tbody = document.getElementById('student-results-tbody');

    if (!tbody) return;

    if (submissions.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-muted" style="text-align: center; padding: 2.5rem;">You haven't completed any assessments yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = [...submissions].reverse().map(sub => {
      const isPending = sub.status === 'pending_review';
      const statusBadge = isPending
        ? `<span class="badge badge-warning">Needs Instructor Grading</span>`
        : `<span class="badge ${sub.passed ? 'badge-success' : 'badge-danger'} font-bold">${sub.passed ? 'PASSED' : 'FAILED'}</span>`;

      return `
        <tr>
          <td>
            <div class="font-semibold">${sub.examTitle}</div>
            <div class="text-xs text-muted">${new Date(sub.submittedAt).toLocaleDateString()} at ${new Date(sub.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
          </td>
          <td>${Math.floor(sub.timeSpentSeconds / 60)}m ${sub.timeSpentSeconds % 60}s</td>
          <td>${sub.tabSwitches > 0 ? `<span class="badge badge-danger text-xs">⚠️ ${sub.tabSwitches}</span>` : `<span class="badge badge-success text-xs">Clean</span>`}</td>
          <td>${sub.mcqScore} / ${sub.mcqMaxScore}</td>
          <td>
            <strong>${sub.totalScore} / ${sub.maxScore}</strong>
            <div class="text-xs text-muted">${sub.percentage}%</div>
          </td>
          <td>${statusBadge}</td>
          <td>
            <button onclick="StudentController.openScorecardModal('${sub.id}')" class="btn btn-secondary btn-sm">
              View Scorecard 📜
            </button>
          </td>
        </tr>
      `;
    }).join('');

    // Check query param for subId
    const urlParams = new URLSearchParams(window.location.search);
    const targetSubId = urlParams.get('subId');
    if (targetSubId) {
      setTimeout(() => this.openScorecardModal(targetSubId), 250);
    }
  },

  openScorecardModal(submissionId) {
    const sub = window.storage.getSubmissionById(submissionId);
    if (!sub) return;

    const exam = window.storage.getExamById(sub.examId);
    const questions = window.storage.getQuestions();

    document.getElementById('scorecard-exam-title').textContent = sub.examTitle;
    document.getElementById('scorecard-student').textContent = `${sub.studentName} (${sub.studentRollNo || 'N/A'})`;
    document.getElementById('scorecard-date').textContent = new Date(sub.submittedAt).toLocaleString();
    document.getElementById('scorecard-total').textContent = `${sub.totalScore} / ${sub.maxScore}`;
    document.getElementById('scorecard-percentage').textContent = `${sub.percentage}%`;

    const badge = document.getElementById('scorecard-badge');
    if (sub.status === 'pending_review') {
      badge.className = 'badge badge-warning';
      badge.textContent = 'Pending Essay Review';
    } else {
      badge.className = `badge ${sub.passed ? 'badge-success' : 'badge-danger'}`;
      badge.textContent = sub.passed ? 'PASSED' : 'FAILED';
    }

    // Breakdown list
    const container = document.getElementById('scorecard-breakdown');
    const examQIds = exam ? exam.questionIds : Object.keys(sub.answers);

    container.innerHTML = examQIds.map((qid, idx) => {
      const q = questions.find(item => item.id === qid);
      if (!q) return '';

      const answer = sub.answers[qid];

      if (q.type === 'mcq') {
        const isCorrect = answer === q.correctAnswer;
        const studentChoice = (answer !== undefined && answer !== null) ? q.options[answer] : 'No Answer';
        const correctChoice = q.options[q.correctAnswer];

        return `
          <div class="card p-3" style="margin-bottom: 0.75rem; border-left: 4px solid ${isCorrect ? 'var(--success)' : 'var(--danger)'};">
            <div class="flex justify-between items-center text-xs">
              <span class="badge ${isCorrect ? 'badge-success' : 'badge-danger'}">Question ${idx + 1} • MCQ</span>
              <span class="font-bold">${isCorrect ? q.points : 0} / ${q.points} pts</span>
            </div>
            <div class="font-semibold text-sm" style="margin: 0.4rem 0;">${q.title}</div>
            <div class="text-xs">
              <div>Your Answer: <strong style="color: ${isCorrect ? 'var(--success)' : 'var(--danger)'};">${studentChoice}</strong></div>
              ${!isCorrect ? `<div>Correct Answer: <strong class="text-success">${correctChoice}</strong></div>` : ''}
              ${q.explanation ? `<div class="text-muted" style="margin-top: 0.25rem;"><em>Explanation:</em> ${q.explanation}</div>` : ''}
            </div>
          </div>
        `;
      } else {
        // Essay question
        const essayScore = (sub.essayScores && sub.essayScores[qid] !== undefined) ? sub.essayScores[qid] : 'Pending';
        const feedback = (sub.essayFeedback && sub.essayFeedback[qid]) ? sub.essayFeedback[qid] : null;

        return `
          <div class="card p-3" style="margin-bottom: 0.75rem; border-left: 4px solid var(--warning); background: #fffdf5;">
            <div class="flex justify-between items-center text-xs">
              <span class="badge badge-warning">Question ${idx + 1} • Essay</span>
              <span class="font-bold">${essayScore} / ${q.points} pts</span>
            </div>
            <div class="font-semibold text-sm" style="margin: 0.4rem 0;">${q.title}</div>
            <div style="background: var(--bg-surface); border: 1px solid var(--border-light); border-radius: var(--radius-sm); padding: 0.6rem; font-size: 0.85rem; margin-top: 0.5rem;">
              <strong>Your Submitted Text:</strong>
              <p style="white-space: pre-wrap; color: var(--text-secondary); margin-top: 0.25rem;">${answer || 'No response submitted'}</p>
            </div>
            ${feedback ? `
              <div class="text-xs" style="margin-top: 0.5rem; color: #1e40af; background: #eff6ff; padding: 0.5rem; border-radius: var(--radius-sm);">
                <strong>Faculty Feedback:</strong> ${feedback}
              </div>
            ` : '<div class="text-xs text-muted" style="margin-top: 0.4rem;"><em>Evaluation pending instructor review.</em></div>'}
          </div>
        `;
      }
    }).join('');

    document.getElementById('scorecard-modal').classList.add('active');
  },

  // ================= PROFILE MANAGEMENT =================
  renderProfile() {
    this.init();
    const user = Auth.getCurrentUser();
    const fullUser = window.storage.findUserById(user.id);
    if (!fullUser) return;

    document.getElementById('profile-name').value = fullUser.name;
    document.getElementById('profile-email').value = fullUser.email;
    document.getElementById('profile-roll').value = fullUser.rollNo || '';
    document.getElementById('profile-dept').value = fullUser.department || '';

    // Calculate user stats
    const mySubs = window.storage.getSubmissionsByStudent(user.id);
    document.getElementById('profile-stat-exams').textContent = mySubs.length;
    const avg = mySubs.length > 0
      ? (mySubs.reduce((acc, s) => acc + (s.percentage || 0), 0) / mySubs.length).toFixed(1)
      : 0;
    document.getElementById('profile-stat-avg').textContent = `${avg}%`;

    // Handle Form Submit
    document.getElementById('profile-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const newName = document.getElementById('profile-name').value.trim();
      const newRoll = document.getElementById('profile-roll').value.trim();
      const newDept = document.getElementById('profile-dept').value.trim();

      const updated = window.storage.updateUser(user.id, {
        name: newName,
        rollNo: newRoll,
        department: newDept
      });

      // Update session
      Auth.login(fullUser.email, fullUser.password);
      Toast.success('Profile details updated successfully!');
      setTimeout(() => window.location.reload(), 600);
    });

    // Handle Password Change
    document.getElementById('password-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const currentPass = document.getElementById('pass-current').value;
      const newPass = document.getElementById('pass-new').value;
      const confirmPass = document.getElementById('pass-confirm').value;

      if (currentPass !== fullUser.password) {
        Toast.error('Current password is incorrect.');
        return;
      }
      if (newPass.length < 6) {
        Toast.error('New password must be at least 6 characters.');
        return;
      }
      if (newPass !== confirmPass) {
        Toast.error('New passwords do not match.');
        return;
      }

      window.storage.updateUser(user.id, { password: newPass });
      Toast.success('Password changed successfully!');
      document.getElementById('password-form').reset();
    });
  }
};

window.StudentController = StudentController;
