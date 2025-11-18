import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getDatabase, ref, set, get, update } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// Firebase config (same as your existing)
const firebaseConfig = {
  apiKey: "AIzaSyBaKVrTWKeaUxa0EaiDBR8OGpGCAjxAcUA",
  authDomain: "boardrankctg.firebaseapp.com",
  databaseURL: "https://boardrankctg-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "boardrankctg",
  storageBucket: "boardrankctg.firebasestorage.app",
  messagingSenderId: "751761229963",
  appId: "1:751761229963:web:43f9dbf71feef6dc9cec8e",
  measurementId: "G-3Y6J44NWNH"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const googleProvider = new GoogleAuthProvider();

// Global auth state
window.__authUser = null;

// Listen to auth changes
onAuthStateChanged(auth, async (user) => {
  window.__authUser = user;
  updateUIForAuth(user);
  
  if (user) {
    // Save/update user data in database
    const userData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || 'User',
      photoURL: user.photoURL || '',
      lastLogin: Date.now(),
      createdAt: (await get(ref(db, `users/${user.uid}/createdAt`))).val() || Date.now()
    };
    await set(ref(db, `users/${user.uid}`), userData);
    
    // Mark as verified
    localStorage.setItem('userAuthenticated', '1');
    localStorage.setItem('visitorInfoGiven', '1');
  } else {
    localStorage.removeItem('userAuthenticated');
  }
});

// Update UI based on auth state
function updateUIForAuth(user) {
  const signInBtn = document.getElementById('authSignInBtn');
  const userMenu = document.getElementById('authUserMenu');
  const userName = document.getElementById('authUserName');
  const userAvatar = document.getElementById('authUserAvatar');
  
  if (user) {
    if (signInBtn) signInBtn.style.display = 'none';
    if (userMenu) {
      userMenu.style.display = 'flex';
      if (userName) userName.textContent = user.displayName || user.email.split('@')[0];
      if (userAvatar && user.photoURL) {
        userAvatar.src = user.photoURL;
      } else if (userAvatar) {
        userAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email)}&background=2563eb&color=fff`;
      }
    }
  } else {
    if (signInBtn) signInBtn.style.display = 'flex';
    if (userMenu) userMenu.style.display = 'none';
  }
}

// Sign in with Google
window.signInWithGoogle = async function() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    showToast("✅ Signed in successfully!");
    closeAuthModal();
  } catch (error) {
    console.error('Google sign in error:', error);
    showToast("❌ Sign in failed: " + error.message);
  }
};

// Sign in with email
window.signInWithEmail = async function() {
  const email = document.getElementById('authEmail').value;
  const password = document.getElementById('authPassword').value;
  
  if (!email || !password) {
    showToast("Please enter email and password");
    return;
  }
  
  try {
    await signInWithEmailAndPassword(auth, email, password);
    showToast("✅ Signed in successfully!");
    closeAuthModal();
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      // Auto create account
      try {
        await createUserWithEmailAndPassword(auth, email, password);
        showToast("✅ Account created & signed in!");
        closeAuthModal();
      } catch (createError) {
        showToast("❌ " + createError.message);
      }
    } else {
      showToast("❌ " + error.message);
    }
  }
};

// Sign out
window.signOutUser = async function() {
  try {
    await signOut(auth);
    showToast("👋 Signed out successfully");
    window.location.href = 'index.html';
  } catch (error) {
    showToast("❌ Sign out failed");
  }
};

// Check if user is authenticated
window.isUserAuthenticated = function() {
  return window.__authUser !== null;
};

// Open auth modal
window.openAuthModal = function() {
  if (document.getElementById('authModal')) {
    document.getElementById('authModal').style.display = 'flex';
    document.body.classList.add('locked');
    return;
  }
  
  const modal = document.createElement('div');
  modal.id = 'authModal';
  modal.className = 'auth-modal';
  modal.innerHTML = `
    <div class="auth-content">
      <button class="auth-close" onclick="closeAuthModal()">×</button>
      <div class="auth-header">
        <h2>Welcome to BoardRankCTG</h2>
        <p>Sign in to unlock all features</p>
      </div>
      
      <div class="auth-benefits">
        <div class="benefit-item">✓ Skip all verification popups</div>
        <div class="benefit-item">✓ Submit and reply to reviews</div>
        <div class="benefit-item">✓ Access your personal profile</div>
        <div class="benefit-item">✓ Save your preferences</div>
      </div>
      
      <div class="auth-providers">
        <button class="auth-google-btn" onclick="signInWithGoogle()">
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google">
          Continue with Google
        </button>
        
        <div class="auth-divider">OR</div>
        
        <div class="auth-email-form">
          <input type="email" id="authEmail" placeholder="Email address" />
          <input type="password" id="authPassword" placeholder="Password" />
          <button class="auth-email-btn" onclick="signInWithEmail()">
            Sign In / Sign Up
          </button>
          <p class="auth-note">New users will be automatically registered</p>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  document.body.classList.add('locked');
};

// Close auth modal
window.closeAuthModal = function() {
  const modal = document.getElementById('authModal');
  if (modal) {
    modal.style.display = 'none';
    document.body.classList.remove('locked');
  }
};

// Helper toast function if not exists
if (typeof showToast !== 'function') {
  window.showToast = function(message) {
    const toast = document.createElement('div');
    toast.className = 'auth-toast';
    toast.textContent = message;
    toast.style = `
      position: fixed;
      bottom: 30px;
      left: 50%;
      transform: translateX(-50%);
      background: #333;
      color: #fff;
      padding: 12px 20px;
      border-radius: 8px;
      z-index: 99999;
      animation: slideUp 0.3s ease;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };
}