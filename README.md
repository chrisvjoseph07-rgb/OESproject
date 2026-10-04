# ApexExam - Online Examination & Assessment System

[![GitHub Pages](https://img.shields.io/badge/Hosted%20on-GitHub%20Pages-blue?style=for-the-badge&logo=github)](https://chrisvjoseph07-rgb.github.io/OESproject/)
[![Pure Vanilla JS](https://img.shields.io/badge/Stack-HTML5%20%7C%20CSS3%20%7C%20Vanilla%20JS-yellow?style=for-the-badge)](https://chrisvjoseph07-rgb.github.io/OESproject/)
[![Zero Backend](https://img.shields.io/badge/Storage-LocalStorage-green?style=for-the-badge)](https://chrisvjoseph07-rgb.github.io/OESproject/)

ApexExam is a modern, responsive, and secure client-side Online Examination and Proctoring Platform built with **HTML5, CSS3, Vanilla JavaScript, and LocalStorage**. It requires zero external backend dependencies or server setup to run.

---

## 🌐 Live Hosted Website

Access the live application hosted on GitHub Pages:
### **👉 [https://chrisvjoseph07-rgb.github.io/OESproject/](https://chrisvjoseph07-rgb.github.io/OESproject/)**

---

## ✨ Core Features

### 🛡️ Examination Engine & Proctoring
- **Precision Countdown Timer:** Real-time timer with visual alerts (warning at 5m, pulse critical at 1m) and automatic submission upon expiration.
- **Tab-Switch & Blur Detection:** Monitors examinee focus with violation tracking and auto-submits when thresholds are breached.
- **Fullscreen Enforcement:** Tracks window states and prompts examinees when fullscreen is bypassed.
- **Answer State Persistence:** All keystrokes and chosen options persist in `localStorage` in real-time (`oes_attempt_*`), preventing data loss during accidental reloads.
- **Interactive Question Palette:** Color-coded navigation grid showing *Answered*, *Marked for Review*, *Unvisited*, and *Current* questions.
- **Anti-Cheat Restrictions:** Disabled right-click context menu, blocked copy/cut/paste, and exit confirmation warnings.

### ⚙️ Faculty & Administrator Module
- **Faculty Dashboard:** Live metrics for total exams, published modules, student cohorts, and pending essay reviews.
- **Exam Management:** Complete CRUD operations (duration, passing percentage, question picker, shuffle toggle, proctoring settings).
- **Central Question Bank:** Curate single-choice MCQs and open-ended Essay questions with rubrics and point weights.
- **Student Roster:** Search examinees, monitor participation, toggle access status (Active/Blocked), and reset passwords.
- **Essay Evaluation Center:** Review candidate submissions, compare MCQ responses against answer keys, score subjective essays, and write instructor feedback.

### 🎓 Student Candidate Module
- **Candidate Workspace:** Overview cards with test attempts, average score percentage, passed count, and catalog of available exams.
- **Exam Catalog:** Search modules by subject, code, or difficulty with detailed rules and proctoring modals.
- **Official Scorecards & Reports:** View score breakdowns by question, review instructor feedback, and print verified score sheets (`window.print()`).
- **Profile Management:** Update registration details and change security passwords.

---

## 👥 Demo Accounts

The system automatically initializes demo data in LocalStorage on first launch:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Administrator** | `admin@exam.com` | `admin123` |
| **Student** | `john@student.com` | `student123` |
| **Student** | `sarah@student.com` | `student123` |

> *You can also create brand-new Administrator and Student accounts anytime via the registration portals.*

---

## 🚀 Local Setup & Execution

Since the project is built purely with standard web technologies, no build tools or package managers are required:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/chrisvjoseph07-rgb/OESproject.git
   cd OESproject
   ```

2. **Open directly in browser:**
   Double click `index.html` or open it with your browser.

3. **Or run with local server (optional):**
   ```bash
   node server.js
   ```
   Open `http://localhost:3000` in your web browser.

---

## 🧪 Verification & Testing

Run the automated test suite verifying all 62 assertions:
```bash
node test-suite.js
```
