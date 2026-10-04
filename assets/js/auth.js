/**
 * Authentication and Session Guard Service
 */

const Auth = {
  getCurrentUser() {
    return window.storage.getSession();
  },

  isLoggedIn() {
    return !!this.getCurrentUser();
  },

  requireAuth(allowedRole = null) {
    const user = this.getCurrentUser();
    // Resolve base path dynamically
    const currentPath = window.location.pathname;
    const isInAdmin = currentPath.includes('/admin/');
    const isInStudent = currentPath.includes('/student/');
    const prefix = (isInAdmin || isInStudent) ? '../' : './';

    if (!user) {
      if (allowedRole === 'admin' || isInAdmin) {
        window.location.href = `${prefix}admin/login.html?redirect=${encodeURIComponent(window.location.href)}`;
      } else {
        window.location.href = `${prefix}login.html?redirect=${encodeURIComponent(window.location.href)}`;
      }
      return false;
    }

    if (user.status === 'blocked') {
      alert('Your account has been deactivated. Please contact the administrator.');
      this.logout();
      return false;
    }

    if (allowedRole && user.role !== allowedRole) {
      if (user.role === 'admin') {
        window.location.href = `${prefix}admin/dashboard.html`;
      } else {
        window.location.href = `${prefix}student/dashboard.html`;
      }
      return false;
    }

    return true;
  },

  login(email, password) {
    const user = window.storage.findUserByEmail(email.trim());
    if (!user) {
      return { success: false, message: 'No account found with this email address.' };
    }
    if (user.status === 'blocked') {
      return { success: false, message: 'This account has been deactivated. Contact administration.' };
    }
    if (user.password !== password) {
      return { success: false, message: 'Incorrect password entered.' };
    }

    // Set Session
    const sessionData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department || '',
      rollNo: user.rollNo || ''
    };
    window.storage.setSession(sessionData);

    return {
      success: true,
      user: sessionData,
      redirect: user.role === 'admin' ? 'admin/dashboard.html' : 'student/dashboard.html'
    };
  },

  signup(data) {
    const existing = window.storage.findUserByEmail(data.email.trim());
    if (existing) {
      return { success: false, message: 'An account with this email already exists.' };
    }

    const newUser = {
      id: 'user_student_' + Date.now(),
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      password: data.password,
      role: 'student',
      rollNo: data.rollNo ? data.rollNo.trim() : `STU-${Math.floor(1000 + Math.random() * 9000)}`,
      department: data.department || 'General Science & Computing',
      status: 'active',
      createdAt: new Date().toISOString()
    };

    window.storage.addUser(newUser);

    // Auto-login
    const sessionData = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      department: newUser.department,
      rollNo: newUser.rollNo
    };
    window.storage.setSession(sessionData);

    return {
      success: true,
      user: sessionData,
      redirect: 'student/dashboard.html'
    };
  },

  signupAdmin(data) {
    const existing = window.storage.findUserByEmail(data.email.trim());
    if (existing) {
      return { success: false, message: 'An account with this email address already exists.' };
    }

    const newAdmin = {
      id: 'user_admin_' + Date.now(),
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      password: data.password,
      role: 'admin',
      designation: data.designation ? data.designation.trim() : 'Faculty Member',
      department: data.department ? data.department.trim() : 'Academic Department',
      status: 'active',
      createdAt: new Date().toISOString()
    };

    window.storage.addUser(newAdmin);

    // Auto-login to session
    const sessionData = {
      id: newAdmin.id,
      name: newAdmin.name,
      email: newAdmin.email,
      role: newAdmin.role,
      department: newAdmin.department
    };
    window.storage.setSession(sessionData);

    return {
      success: true,
      user: sessionData,
      redirect: 'admin/dashboard.html'
    };
  },

  logout() {
    const current = this.getCurrentUser();
    const isAdmin = current && current.role === 'admin';
    window.storage.clearSession();
    const currentPath = window.location.pathname;
    const prefix = (currentPath.includes('/admin/') || currentPath.includes('/student/')) ? '../' : './';
    if (isAdmin || currentPath.includes('/admin/')) {
      window.location.href = `${prefix}admin/login.html`;
    } else {
      window.location.href = `${prefix}login.html`;
    }
  },

  // Setup header / sidebar profile tags
  bindUserUI() {
    const user = this.getCurrentUser();
    if (!user) return;

    const nameElements = document.querySelectorAll('.current-user-name');
    nameElements.forEach(el => el.textContent = user.name);

    const emailElements = document.querySelectorAll('.current-user-email');
    emailElements.forEach(el => el.textContent = user.email);

    const roleElements = document.querySelectorAll('.current-user-role');
    roleElements.forEach(el => {
      el.textContent = user.role.toUpperCase();
      el.className = `badge badge-${user.role === 'admin' ? 'danger' : 'primary'} current-user-role`;
    });

    const rollElements = document.querySelectorAll('.current-user-roll');
    rollElements.forEach(el => el.textContent = user.rollNo || 'N/A');

    const deptElements = document.querySelectorAll('.current-user-dept');
    deptElements.forEach(el => el.textContent = user.department || 'General');

    const avatarElements = document.querySelectorAll('.user-avatar-initials');
    const initials = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    avatarElements.forEach(el => el.textContent = initials);
  }
};

window.Auth = Auth;
document.addEventListener('DOMContentLoaded', () => {
  Auth.bindUserUI();
});
