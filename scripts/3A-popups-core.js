// 3A-popups-core.js — Help popup, Student details popup, comparison, copy/link, PDF export

// ====== Safe fallback for error popup (only if not provided elsewhere) ======
if (typeof window.showErrorPopup !== 'function') {
  window.showErrorPopup = function(msg) {
    openPopup(`
      <div class="popup-content">
        <span class="close-btn" onclick="closePopup()">&times;</span>
        <p>${String(msg || 'Something went wrong.')}</p>
      </div>
    `);
  };
}


// ====== Help / Tips popup ======
function showRankTipsPopup() {
  if (document.querySelector('.popup')) return;

  const popup = document.createElement('div');
  popup.className = 'popup';
  popup.innerHTML = `
    <div class="popup-content help-popup">
      <span class="close-btn" onclick="closePopup()">&times;</span>
      <h2>How to use BoardRankCTG</h2>

      <div class="help-grid">
        <div class="help-item">
          <div class="help-item-icon"><i class="fas fa-calendar-check"></i></div>
          <div class="help-item-text">
            <h3>1. Choose exam & year</h3>
            <p>Select SSC / HSC and the year from the dropdown or the big year cards.</p>
          </div>
        </div>

        <div class="help-item">
          <div class="help-item-icon"><i class="fas fa-layer-group"></i></div>
          <div class="help-item-text">
            <h3>2. Pick your group</h3>
            <p>Choose Science, Business (Commerce) or Humanities to see that group’s ranking table.</p>
          </div>
        </div>

        <div class="help-item">
          <div class="help-item-icon"><i class="fas fa-search"></i></div>
          <div class="help-item-text">
            <h3>3. Search students</h3>
            <p>Use <strong>Name</strong> or <strong>Roll</strong> search. Click a row to open full marks and GPA details.</p>
          </div>
        </div>

        <div class="help-item">
          <div class="help-item-icon"><i class="fas fa-school"></i></div>
          <div class="help-item-text">
            <h3>4. School performance</h3>
            <p>Use <strong>Top Schools</strong> and school-wise view (login required) to see institution performance.</p>
          </div>
        </div>

        <div class="help-item">
          <div class="help-item-icon"><i class="fas fa-sliders-h"></i></div>
          <div class="help-item-text">
            <h3>5. Advanced filters</h3>
            <p>On mobile, use the Filter button (login required) to filter by total marks, GPA and school.</p>
          </div>
        </div>

        <div class="help-item">
          <div class="help-item-icon"><i class="fas fa-user-check"></i></div>
          <div class="help-item-text">
            <h3>6. Sign in for extras</h3>
            <p>Sign in to save favourites, view history, compare students and skip verification popups.</p>
          </div>
        </div>
      </div>

      <div class="help-chips-row">
        <button class="help-chip" type="button"><i class="fas fa-trophy"></i> Top schools view</button>
        <button class="help-chip" type="button"><i class="fas fa-user-friends"></i> Compare two students</button>
        <button class="help-chip" type="button"><i class="fas fa-heart"></i> Save favourite result</button>
      </div>

      <p class="help-note">
        This is an <strong>unofficial</strong> ranking built from publicly available result data.
        Always cross‑check with the official Education Board result.
      </p>
    </div>
  `;
  document.body.appendChild(popup);
  document.body.classList.add('locked');

  // Admin-only hide bar (guard roll var safely to avoid ReferenceError)
  (function(){
    const pc = popup.querySelector('.popup-content');
    if (!pc) return;
    const r = (typeof roll !== 'undefined') ? String(roll) : '';

    if (r && isAdmin()) {
      const bar = document.createElement('div');
      bar.className = 'admin-hidebar';
      bar.innerHTML = `
        <span>Admin</span>
        <button id="hrHideBtn" class="btn-secondary" style="margin-left:8px;">Hide</button>
        <button id="hrUnhideBtn" class="btn-secondary" style="margin-left:6px;display:none;">Unhide</button>
      `;
      pc.appendChild(bar);

      const applyState = () => {
        const hidden = window.__br_hiddenRolls?.has(r);
        pc.classList.toggle('admin-blur', hidden);
        bar.querySelector('#hrHideBtn').style.display = hidden ? 'none' : 'inline-block';
        bar.querySelector('#hrUnhideBtn').style.display = hidden ? 'inline-block' : 'none';
      };
      applyState();

      bar.querySelector('#hrHideBtn')?.addEventListener('click', async ()=>{ await window.hideResultRoll?.(r); applyState(); });
      bar.querySelector('#hrUnhideBtn')?.addEventListener('click', async ()=>{ await window.unhideResultRoll?.(r); applyState(); });
    } else if (r && window.__br_hiddenRolls?.has(r)) {
      closePopup();
      showErrorPopup("This result has been hidden by admin.");
    }
  })();

  // Wire quick commands → open bot and send
  popup.querySelectorAll('.help-chip').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const cmd = btn.getAttribute('data-cmd') || '';
      const launcher = document.getElementById('hb-launcher');

      if (typeof togglePanel === 'function') togglePanel(true);
      else launcher?.click();

      setTimeout(()=>{
        const i = document.getElementById('hb-input');
        const s = document.getElementById('hb-send');
        if (i && s) {
          i.value = cmd;
          s.click();
        }
      }, 180);
    });
  });
}

// ===== Onboarding wizard (first-time after login) =====
function showOnboardingWizard(displayName, uid, startStep = 0) {  try {
    if (document.querySelector('.onb-overlay')) return;
    const safeName = String(displayName || 'User').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

    const totalSteps = 8;
    const doneKey = uid ? ('onboardingDone_v1_' + uid) : null;
    const neverKey = uid ? ('onb_never_v1_' + uid) : null;
    const stepKey = uid ? ('onb_step_v1_' + uid) : null;
    let current = Math.max(0, Math.min(startStep || 0, totalSteps - 1));
    const overlay = document.createElement('div');
    overlay.className = 'onb-overlay';
    overlay.innerHTML = `
    <div class="onb-card">
      <div class="onb-step-indicator"><span id="onbStepLabel"></span></div>
      <div id="onbContent" class="onb-content"></div>
      <div class="onb-actions" id="onbActions"></div>
 
    </div>
  `;
    document.body.appendChild(overlay);
    document.body.classList.add('locked');

    const stepLabelEl = overlay.querySelector('#onbStepLabel');
    const contentEl = overlay.querySelector('#onbContent');
    const actionsEl = overlay.querySelector('#onbActions');
    const neverChk = overlay.querySelector('#onbNeverChk');

    function finish() {
      try {
        if (uid) {
          // mark as done on this device
          localStorage.setItem('onboardingDone_v1_' + uid, '1');
        }

        // if "never show again" is checked, store that in DB
        const neverChk = overlay.querySelector('#onbNeverChk');
        if (uid && neverChk && neverChk.checked) {
          // also keep a local hint (only for this browser)
          localStorage.setItem('onb_never_v1_' + uid, '1');

          // best-effort write to users/<uid>/onboardingNeverShow = true
          (async () => {
            try {
              const { initializeApp, getApps, getApp } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
              const { getDatabase, ref, update } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js');
              const cfg = {
                apiKey: "AIzaSyAIsOwpONfGwTDFEbfdno8O3sm2G8GObiU",
                authDomain: "loginforme-f4886.firebaseapp.com",
                databaseURL: "https://loginforme-f4886-default-rtdb.asia-southeast1.firebasedatabase.app",
                projectId: "loginforme-f4886",
                storageBucket: "loginforme-f4886.firebasestorage.app",
                messagingSenderId: "634439962888",
                appId: "1:634439962888:web:72b9c573e76c8719f9dcbd"
              };
              const app = getApps().length ? getApp() : initializeApp(cfg, 'onb-app');
              const db = getDatabase(app);
              await update(ref(db, 'users/' + uid), { onboardingNeverShow: true });
            } catch (e) {
              console.warn('onboarding neverShow DB update failed', e);
            }
          })();
        }

        localStorage.removeItem('onboardingPendingFor');
      } catch(e){}
      overlay.remove();
      document.body.classList.remove('locked');
    }


    function setThemeFromToggle(isDark) {
      document.body.classList.toggle('dark-mode', isDark);
      try {
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
      } catch(e){}
      const navToggle = document.getElementById('themeToggle');
      if (navToggle) navToggle.checked = isDark;
    }

    function renderStep() {
      stepLabelEl.textContent = `Step ${current + 1} of ${totalSteps}`;
      if (stepKey) {
        try { localStorage.setItem(stepKey, String(current)); } catch (_) {}
      }
      let html = '';
      let actions = '';

      if (current === 0) {
        html = `
          <h3>Choose Your Theme</h3>
          <p>
            Welcome! Let’s start by choosing how you want the site to look.<br>
            Select the theme that feels best for your eyes —
            <span style="color:#facc15;font-weight:800;">Light Mode</span> or
            <span style="color:#38bdf8;font-weight:800;">Dark Mode</span>.<br>
            <small style="color:#9ca3af;">(You can change this anytime from the theme switch in the menu.)</small>
          </p>
          <div class="onb-theme-toggle">
            <span>Light</span>
            <label class="theme-switch">
              <input type="checkbox" id="onbThemeToggle" />
              <span class="slider"></span>
            </label>
            <span>Dark</span>
          </div>
        `;
        actions = `
          <div class="onb-actions-right">
            <button class="onb-btn primary" id="onbNext">Next</button>
          </div>
        `;
      } else if (current === 1) {
        html = `
          <h3>Welcome to Board Rank</h3>
          <p>
            Hi <strong style="color:#f97316;">${safeName}</strong>, welcome to
            <strong style="color:#38bdf8;">Board Rank</strong>!<br>
            Here, you can explore every <span style="color:#22c55e;">SSC</span> and
            <span style="color:#22c55e;">HSC</span> result from the Chattogram Board, starting from
            <strong style="color:#facc15;">2022</strong>.<br>
            Let’s walk you through the main features so you can get the most out of your experience.
          </p>
        `;
        actions = `
          <div class="onb-actions-right">
            <button class="onb-btn primary" id="onbNext">Next</button>
          </div>
        `;
      } else if (current === 2) {
        html = `
          <h3>How to Use the Website</h3>
          <ul class="onb-list">
            <li>Tap on a student’s <strong style="color:#38bdf8;">name</strong> to view their full marksheet.</li>
            <li>Tap on a <strong style="color:#22c55e;">school name</strong> to see that school’s full ranking.</li>
            <li>Use the <strong style="color:#facc15;">search bar</strong> to look up results by name, roll, or school.</li>
            <li>Use <strong style="color:#f97316;">Advanced Filters</strong> to fine‑tune your search on mobile.</li>
            <li>Check out <strong style="color:#eab308;">Top Schools</strong> to see the strongest performers, sorted by % of GPA‑5 achievers.</li>
          </ul>
        `;
        actions = `
          <div class="onb-actions-right">
            <button class="onb-btn primary" id="onbNext">Next</button>
          </div>
        `;
      } else if (current === 3) {
        html = `
          <h3>Important Disclaimer</h3>
          <p>
            Our ranking system is
            <strong style="color:#f97316;text-decoration:underline;">NOT official</strong>.<br>
            All data is collected from <span style="color:#22c55e;">publicly available</span> records on the BISE Chattogram website.
          </p>
          <p>
            Your <span style="color:#38bdf8;font-weight:800;">privacy</span> matters to us.<br>
            If you want your information removed, go to
            <strong style="color:#facc15;">Contact</strong> in the navigation bar, submit the form, and our team will review your request within about
            <strong style="color:#facc15;">72 hours</strong>.
          </p>
        `;
        actions = `
          <button class="onb-btn link" id="onbContact">Request Now</button>
          <div class="onb-actions-right">
            <button class="onb-btn primary" id="onbNext">Next</button>
          </div>
        `;
      } else if (current === 4) {
        html = `
          <h3>Your Profile</h3>
          <p>
            Your <strong style="color:#38bdf8;">Profile</strong> page lets you customize your details and view your browsing history.
          </p>
          <p>
            For your safety, please
            <strong style="color:#f97316;">do not enter sensitive information or passwords</strong> here.<br>
            Keep it simple — school, goals, and achievements are enough.
          </p>
        `;
        actions = `
          <button class="onb-btn link" id="onbProfile">Customize Now</button>
          <div class="onb-actions-right">
            <button class="onb-btn primary" id="onbNext">Next</button>
          </div>
        `;
      } else if (current === 5) {
        html = `
          <h3>Favourites</h3>
          <p>
            Whenever you open a student’s result, you’ll see an
            <strong style="color:#f97316;">Add to Favourite</strong> button.
          </p>
          <p>
            All your favourite students are saved in the
            <strong style="color:#22c55e;">Favourites</strong> page from the navigation bar,
            so you can easily return to them anytime.
          </p>
        `;
        actions = `
          <button class="onb-btn link" id="onbFav">Favourite Page</button>
          <div class="onb-actions-right">
            <button class="onb-btn primary" id="onbNext">Next</button>
          </div>
        `;
      } else if (current === 6) {
        html = `
          <h3>Leave a Review</h3>
          <p>
            Before you continue — consider leaving a short review.
          </p>
          <p>
            Whether you praise me or curse me, your message genuinely makes my day.<br>
          </p>
        `;
        actions = `
          <button class="onb-btn link" id="onbReview">Leave a Review</button>
          <div class="onb-actions-right">
            <button class="onb-btn primary" id="onbNext">Next</button>
          </div>
        `;
      } else { // current === 7
        html = `
          <h3 style="color:#facc15;">The ULTIMATE Question</h3>
          <p>
            <strong style="color:#22c55e;">
              Do you accept that <span style="color:#38bdf8;">Cristiano Ronaldo</span> is the GOAT? 
            </strong>
          </p>
          <img class="onb-cr7-img" src="asset/cr7.jpeg" alt="Cristiano Ronaldo">
        `;
        actions = `
          <div class="onb-actions-right">
            <button class="onb-btn primary" id="onbAccept">Accept</button>
            <button class="onb-btn" id="onbReject">Reject</button>
          </div>
        `;
      }

      contentEl.innerHTML = html;
      actionsEl.innerHTML = actions;

      // Wire Next
      const nextBtn = document.getElementById('onbNext');
      if (nextBtn) {
        nextBtn.addEventListener('click', () => {
          if (current < totalSteps - 1) {
            current += 1;
            renderStep();
          } else {
            finish();
          }
        });
      }

      // Step-specific actions
      if (current === 0) {
        const t = document.getElementById('onbThemeToggle');
        if (t) {
          let saved = null;
          try { saved = localStorage.getItem('theme'); } catch(e){}
          const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
          const isDark = saved ? (saved === 'dark') : prefersDark;
          t.checked = isDark;
          setThemeFromToggle(isDark);
          t.addEventListener('change', () => setThemeFromToggle(t.checked));
        }
      } else if (current === 3) {
        const cBtn = document.getElementById('onbContact');
        if (cBtn) {
          cBtn.addEventListener('click', () => {
            window.location.href = 'contactus.html';
          });
        }
      } else if (current === 4) {
        const pBtn = document.getElementById('onbProfile');
        if (pBtn) {
          pBtn.addEventListener('click', () => {
            window.location.href = 'profile.html';
          });
        }
      } else if (current === 5) {
        const fBtn = document.getElementById('onbFav');
        if (fBtn) {
          fBtn.addEventListener('click', () => {
            window.location.href = 'favorite.html';
          });
        }
      } else if (current === 6) {
        const rBtn = document.getElementById('onbReview');
        if (rBtn) {
          rBtn.addEventListener('click', () => {
            window.location.href = 'review.html';
          });
        }
      } else if (current === 7) {
        const aBtn = document.getElementById('onbAccept');
        const rejBtn = document.getElementById('onbReject');
        if (aBtn) aBtn.addEventListener('click', finish);
        if (rejBtn) {
          rejBtn.addEventListener('click', (e) => {
            e.preventDefault();
            rejBtn.classList.add('onb-broken');
            setTimeout(() => rejBtn.classList.remove('onb-broken'), 400);
          });
        }
      }
    }

    renderStep();
  } catch (e) {
    console.error('Onboarding wizard error:', e);
  }
}
window.showOnboardingWizard = showOnboardingWizard;

document.getElementById('helpBtn')?.addEventListener('click', showRankTipsPopup);
document.addEventListener("DOMContentLoaded", () => {
    // Always show Profile & Favourite in the navbar, even if not logged in
  ['profile.html', 'favorite.html'].forEach(href => {
    const a = document.querySelector(`.nav-links a[href="${href}"]`);
    if (a && a.closest('li')) {
      a.closest('li').style.display = 'block'; // force show
      a.addEventListener('click', (e) => {
        if (localStorage.getItem('userLoggedIn') !== 'true') {
          e.preventDefault();
         if (typeof requireLogin === 'function') {
  requireLogin('Please log in to access your profile/favourites.');
} else {
  showModal({
    title: 'Login required',
    message: 'Please log in to access your profile/favourites.',
    buttons: [
      { text: 'Go to login', onClick: () => { window.location.href = 'login.html'; } },
      { text: 'Cancel', variant: 'secondary' }
    ]
  });
}
        }
      });
    }
  });

  const email = (localStorage.getItem("userEmail") || '').toLowerCase();
  if (email !== 'hasnyne2007@gmail.com') document.getElementById("visitorsLink")?.remove();

  document.getElementById('helpBtnHero')?.addEventListener('click', showRankTipsPopup);
  initThemeToggle();
  initNavToggle();
   // Onboarding: show only once, right after first login for this user
   try {
    const uid = localStorage.getItem('loggedInUserId');
    const pendingFor = localStorage.getItem('onboardingPendingFor');
    const doneKey = uid ? ('onboardingDone_v1_' + uid) : null;
    const neverKey = uid ? ('onb_never_v1_' + uid) : null;
    const stepKey = uid ? ('onb_step_v1_' + uid) : null;
    const alreadyDone = doneKey ? localStorage.getItem(doneKey) === '1' : false;
    const never = neverKey ? localStorage.getItem(neverKey) === '1' : false;

    // Only show onboarding on home page (index)
    const path = location.pathname || '';
    const isHome = /(?:^|\/)(index\.html)?$/.test(path) || path.endsWith('/rank/') || path.endsWith('/rank');

    if (uid && pendingFor === uid && !alreadyDone && !never && isHome) {
      const displayName = localStorage.getItem('userName') || 'User';
      let startStep = 0;
      if (stepKey) {
        const raw = localStorage.getItem(stepKey);
        const n = parseInt(raw || '0', 10);
        if (!isNaN(n) && n >= 0) startStep = n;
      }
      setTimeout(() => {
        if (typeof showOnboardingWizard === 'function') {
          showOnboardingWizard(displayName, uid, startStep);
        }
      }, 800);
    }
  } catch (e) {
    console.warn('Onboarding check failed', e);
  }
  // Log page view (if logged in)
(async () => {
  try {
    if (localStorage.getItem('userLoggedIn') === 'true') {
      const uid = localStorage.getItem('loggedInUserId');
      if (uid) {
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
        const { getDatabase, ref, push } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js');
        const cfg = {
          apiKey: "AIzaSyAIsOwpONfGwTDFEbfdno8O3sm2G8GObiU",
          authDomain: "loginforme-f4886.firebaseapp.com",
          databaseURL: "https://loginforme-f4886-default-rtdb.asia-southeast1.firebasedatabase.app",
          projectId: "loginforme-f4886",
          storageBucket: "loginforme-f4886.firebasestorage.app",
          messagingSenderId: "634439962888",
          appId: "1:634439962888:web:72b9c573e76c8719f9dcbd"
        };
        const app = window.__br_logApp || initializeApp(cfg, 'logApp');
        window.__br_logApp = app;
        const dbv = getDatabase(app);
        const url = location.href.split('#')[0];
        const title = document.title || 'Page';
        push(ref(dbv, `userLogs/${uid}/pages`), { url, title, ts: Date.now() });
      }
    }
  } catch (e) {
    console.warn('Page view log failed', e);
  }
})();

  if (localStorage.getItem('userLoggedIn') === 'true') {
    document.querySelectorAll('.logged-in-only').forEach(el => el.style.display = 'block');
    document.querySelectorAll('.logged-out-only').forEach(el => el.style.display = 'none');
  }
});

// ESC to close popups
document.addEventListener('keydown', function(e) { if (e.key === 'Escape') closePopup(); });


// ====== Progress bars for subject marks ======
function getProgressBarHtml(score, totalMark) {
  const percentage = (parseFloat(score) / totalMark) * 100;
  const barId = `pb_${Math.random().toString(36).substr(2, 9)}`;
  const numId = `num_${Math.random().toString(36).substr(2, 9)}`;

  setTimeout(() => {
    animateProgressBar(barId, percentage);
    animateNumber(numId, score); 
  }, 100);

  return `
    <span id="${numId}">0</span>
    <div class="progress-bar-container">
      <div id="${barId}" class="progress-bar">0%</div>
    </div>
  `;
}

function animateProgressBar(id, targetPercentage) {
  const bar = document.getElementById(id);
  if (!bar) return;
  let current = 0;

  function update() {
    current += 1;
    if (current > targetPercentage) current = targetPercentage;

    let color = 'red';
    let additionalClass = '';
    if (current >= 95) {
      color = 'indigo';
    } else if (current >= 90) {
      color = 'blue';
    } else if (current >= 80) {
      color = 'green';
    } else if (current >= 70) {
      color = 'yellow';
      additionalClass = 'yellow';
    } else if (current >= 34) {
      color = 'orange';
    }

    bar.style.width = `${current}%`;
    bar.style.backgroundColor = color;
    bar.textContent = `${current.toFixed(0)}%`;

    if (current < targetPercentage) {
      requestAnimationFrame(update);
    } else {
      bar.style.width = `${targetPercentage}%`;
      bar.textContent = `${targetPercentage.toFixed(2)}%`;
    }
  }

  update();
}

function animateNumber(elementId, targetNumber) {
  const el = document.getElementById(elementId);
  if (!el) return;
  let current = 0;
  const duration = 1000;
  const stepTime = Math.max(Math.floor(duration / targetNumber), 10);

  const timer = setInterval(() => {
    current += 1;
    if (current >= targetNumber) {
      current = targetNumber;
      clearInterval(timer);
    }
    el.textContent = current;
  }, stepTime);
}


// ====== Student detail popup ======
function showIndividualResult(roll, year, group) {
  if (!isAdmin() && window.__br_hiddenRolls?.has(String(roll))) {
    showErrorPopup("This result has been hidden by admin.");
    return;
  }

  if (document.querySelector('.popup')) return; // Prevent multiple popups

  const fileName = `DATA/data_${year}_${group.toLowerCase()}_individual.txt`;
  const isHSC = fileName.includes("hsc");
  const newUrl = `${location.pathname}?year=${year}&group=${group}&roll=${roll}`;
  history.pushState({}, '', newUrl);

  fetch(fileName)
    .then(response => response.text())
    .then(data => {
      const rows = data.trim().split('\n');
      const individualData = rows.find(row => row.split('\t')[0].replace(/^0+/, '') === roll.toString().replace(/^0+/, ''));

      let popupContent;
      let student = null;  // <-- ADD THIS LINE
      if (individualData) {
        const parts = individualData.split('\t');
        let subject1Name, subject2Name, subject3Name;

        if (group === 'Commerce') {
          subject1Name = 'Science';
          subject2Name = 'Accounting';
          subject3Name = 'Finance';
        } else if (group === 'Arts') {
          subject1Name = 'Science';
          subject2Name = 'Geography';
          subject3Name = 'Civics';
        } else {
          subject1Name = 'BGS';
          subject2Name = 'Physics';
          subject3Name = 'Chemistry';
        }

        if (isHSC) {
          if (parts.length < 8) {
            popupContent = `<div class="popup-content"><p>Result not found</p><button class="back-button" onclick="closePopup()">Back</button></div>`;
          } else {
            const [rollStr, bangla, english, ICT, physics, chemistry, compulsory, optional] = parts;
            student = allData.find(student => student.roll === parseInt(rollStr));
            try { updateSEOForStudent(year, group, student.name, rollStr); } catch(e) {}

            const combinedRank = allData.findIndex(student => student.roll === parseInt(rollStr)) + 1;
            try {
              const examType = (year && year.includes('hsc')) ? 'HSC' : 'SSC';
              const formattedYear = (year || '').replace('hsc_', '');
              document.title = `${student.name} | ${formattedYear} ${examType}`;
            } catch (e) { /* no-op */ }

            popupContent = `
              <div class="popup-content">
                <span class="close-btn" onclick="closePopup()">&times;</span>
                <p>Name: ${student.name}</p>
                <p>Institution: ${student.Instituation}</p>
                <p>Roll: ${rollStr}</p>
                <p>GPA: ${student.gpa}</p>
                <p>Board Rank: ${combinedRank}</p>
                <p>Total Marks: ${student.total}</p>

                <p>Bangla: ${getProgressBarHtml(bangla, 200)}</p>
                <p>English: ${getProgressBarHtml(english, 200)}</p>
                <p>ICT: ${getProgressBarHtml(ICT, 100)}</p>
                <p>Physics: ${getProgressBarHtml(physics, 200)}</p>
                <p>Chemistry: ${getProgressBarHtml(chemistry, 200)}</p>
                <p>Compulsory: ${getProgressBarHtml(compulsory, 200)}</p>
                <p>Optional: ${getProgressBarHtml(optional, 200)}</p>

                <button onclick='promptComparison(${student.roll}, "${year}", "${group}")'>Compare with Other Student</button>
${localStorage.getItem('userLoggedIn') === 'true' ? `
<button onclick="toggleFavorite('${student.name}', '${roll}', '${student.Instituation}', '${student.gpa}', '${year}', '${group}')" style="background:#fff;color:#ef4444;border:2px solid #ef4444;font-weight:800;">
  <i class="fas fa-heart"></i> Add to Favorites
</button>
` : ''}
                <div class="popup-footer">
                  <button onclick="copyFullResult(this)" class="icon-btn footer-btn" title="Copy Result"><i class="fas fa-copy"></i></button>
                  <button onclick="closePopup()" class="icon-btn footer-btn" title="Close"><i class="fas fa-times"></i></button>
                  <button onclick="copyStudentResultLink(this)" class="icon-btn footer-btn" title="Copy Link"><i class="fas fa-link"></i></button>
                  <button onclick="downloadStudentPDF(this)" class="icon-btn footer-btn" title="Download PDF"><i class="fas fa-file-pdf"></i></button>
                </div>
              </div>
            `;
          }
        } else {
          if (parts.length < 13) {
            popupContent = `<div class="popup-content"><p>Result not found</p><button class="back-button" onclick="closePopup()">Back</button></div>`;
          } else {
            const [rollStr, bangla, english, math, bgs, religion, physics, chemistry, Compulsory, ICT, Optional, Physical, Career] = parts;
            student = allData.find(student => student.roll === parseInt(rollStr));
            try { updateSEOForStudent(year, group, student.name, rollStr); } catch(e) {}
            const combinedRank = allData.findIndex(student => student.roll === parseInt(rollStr)) + 1;
            try {
              const examType = (year && year.includes('hsc')) ? 'HSC' : 'SSC';
              const formattedYear = (year || '').replace('hsc_', '');
              document.title = `${student.name} | ${formattedYear} ${examType}`;
            } catch (e) { /* no-op */ }

            popupContent = `
              <div class="popup-content">
                <span class="close-btn" onclick="closePopup()">&times;</span>
                <p>Name: ${student.name}</p>
                <p>Institution: ${student.Instituation}</p>
                <p>Roll: ${rollStr}</p>
                <p>GPA: ${student.gpa}</p>
                <p>Board Rank: ${combinedRank}</p>
                <p>Total Marks: ${student.total}</p>

                <p>Bangla: ${getProgressBarHtml(bangla, 200)}</p>
                <p>English: ${getProgressBarHtml(english, 200)}</p>
                <p>Mathematics: ${getProgressBarHtml(math, 100)}</p>
                <p>${subject1Name}: ${getProgressBarHtml(bgs, 100)}</p>
                <p>Religion: ${getProgressBarHtml(religion, 100)}</p>
                <p>${subject2Name}: ${getProgressBarHtml(physics, 100)}</p>
                <p>${subject3Name}: ${getProgressBarHtml(chemistry, 100)}</p>
                <p>Compulsory: ${getProgressBarHtml(Compulsory, 100)}</p>
                <p>ICT: ${getProgressBarHtml(ICT, 50)}</p>
                <p>Optional: ${getProgressBarHtml(Optional, 100)}</p>
                <p>Physical: ${getProgressBarHtml(Physical, 100)}</p>
                <p>Career: ${getProgressBarHtml(Career, 50)}</p>

                <button onclick='promptComparison(${student.roll}, "${year}", "${group}")'>Compare with Other Student</button>
${localStorage.getItem('userLoggedIn') === 'true' ? `
<button onclick="toggleFavorite('${student.name}', '${roll}', '${student.Instituation}', '${student.gpa}', '${year}', '${group}')" style="background:#fff;color:#ef4444;border:2px solid #ef4444;font-weight:800;">
  <i class="fas fa-heart"></i> Add to Favorites
</button>
` : ''}
                <div class="popup-footer">
                  <button onclick="copyFullResult(this)" class="icon-btn footer-btn" title="Copy Result"><i class="fas fa-copy"></i></button>
                  <button onclick="closePopup()" class="icon-btn footer-btn" title="Close"><i class="fas fa-times"></i></button>
                  <button onclick="copyStudentResultLink(this)" class="icon-btn footer-btn" title="Copy Link"><i class="fas fa-link"></i></button>
                  <button onclick="downloadStudentPDF(this)" class="icon-btn footer-btn" title="Download PDF"><i class="fas fa-file-pdf"></i></button>
                </div>
              </div>
            `;
          }
        }
      } else {
        popupContent = `<div class="popup-content"><p>Result not found</p><button class="back-button" onclick="closePopup()">Back</button></div>`;
      }

      const popup = document.createElement('div');
      popup.classList.add('popup');
      popup.innerHTML = popupContent;
      document.body.appendChild(popup);
      document.body.classList.add('locked');
// Log viewed student (if logged-in)
(async () => {
  try {
    if (localStorage.getItem('userLoggedIn') === 'true') {
      const uid = localStorage.getItem('loggedInUserId');
      if (uid) {
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
        const { getDatabase, ref, push } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js');
        const cfg = {
          apiKey: "AIzaSyAIsOwpONfGwTDFEbfdno8O3sm2G8GObiU",
          authDomain: "loginforme-f4886.firebaseapp.com",
          databaseURL: "https://loginforme-f4886-default-rtdb.asia-southeast1.firebasedatabase.app",
          projectId: "loginforme-f4886",
          storageBucket: "loginforme-f4886.firebasestorage.app",
          messagingSenderId: "634439962888",
          appId: "1:634439962888:web:72b9c573e76c8719f9dcbd"
        };
        const app = window.__br_logApp || initializeApp(cfg, 'logApp');
        window.__br_logApp = app;
        const dbv = getDatabase(app);
        await push(ref(dbv, `userLogs/${uid}/views`), {
          roll: String(roll),
          name: (student && student.name) || '',
          year,
          group,
          institution: (student && student.Instituation) || '',
          ts: Date.now()
        });
      }
    }
  } catch (e) {
    console.warn('Failed to log viewed student', e);
  }
})();
      // Admin hide/unhide bar in student popup
      (function(){
        const pc = popup.querySelector('.popup-content');
        if (!pc) return;
        const r = String(roll);

        if (isAdmin()) {
          const bar = document.createElement('div');
          bar.className = 'admin-hidebar';
          bar.innerHTML = `
            <span>Admin</span>
            <button id="hrHideBtn" class="btn-secondary" style="margin-left:8px;">Hide</button>
            <button id="hrUnhideBtn" class="btn-secondary" style="margin-left:6px;display:none;">Unhide</button>
          `;
          pc.appendChild(bar);

          const applyState = () => {
            const hidden = window.__br_hiddenRolls?.has(r);
            pc.classList.toggle('admin-blur', hidden);
            bar.querySelector('#hrHideBtn').style.display = hidden ? 'none' : 'inline-block';
            bar.querySelector('#hrUnhideBtn').style.display = hidden ? 'inline-block' : 'none';
          };
          applyState();

          bar.querySelector('#hrHideBtn')?.addEventListener('click', async ()=>{ await window.hideResultRoll?.(r); applyState(); });
          bar.querySelector('#hrUnhideBtn')?.addEventListener('click', async ()=>{ await window.unhideResultRoll?.(r); applyState(); });
        } else if (window.__br_hiddenRolls?.has(r)) {
          closePopup();
          showErrorPopup("This result has been hidden by admin.");
        }
      })();
    })
    .catch(error => {
      console.error('Error loading individual data:', error);
      const popup = document.createElement('div');
      popup.classList.add('popup');
      popup.innerHTML = `<div class="popup-content"><p>Result not found</p><button class="back-button" onclick="closePopup()">Back</button></div>`;
      document.body.appendChild(popup);
      document.body.classList.add('locked'); 
    });
}
// Favorite functionality
async function toggleFavorite(name, roll, institution, gpa, year, group) {
  try {
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js");
    const { getDatabase, ref, get, set } = await import("https://www.gstatic.com/firebasejs/10.11.1/firebase-database.js");

    // Reuse the same app for favourites
    const dbApp = window.__br_favApp || initializeApp({
      apiKey: "AIzaSyAIsOwpONfGwTDFEbfdno8O3sm2G8GObiU",
      authDomain: "loginforme-f4886.firebaseapp.com",
      databaseURL: "https://loginforme-f4886-default-rtdb.asia-southeast1.firebasedatabase.app",
      projectId: "loginforme-f4886",
      storageBucket: "loginforme-f4886.firebasestorage.app",
      messagingSenderId: "634439962888",
      appId: "1:634439962888:web:72b9c573e76c8719f9dcbd"
    }, "favApp");
    window.__br_favApp = dbApp;

    const db = getDatabase(dbApp);
    const userUID = localStorage.getItem('loggedInUserId');
    if (!userUID) {
      alert('Please log in to use favourites.');
      return;
    }

    // Use a stable key: year_group_roll
    const favKey = `${year}_${group}_${roll}`;
    const favRef = ref(db, 'favorites/' + userUID + '/' + favKey);

    const existing = await get(favRef);
    if (existing.exists()) {
      alert('This student is already in your favourites.');
      return;
    }

    await set(favRef, {
      name,
      roll,
      institution,
      gpa,
      year,
      group,
      exam: String(year).includes('hsc') ? 'HSC' : 'SSC',
      addedAt: Date.now()
    });

    alert('Added to favourites!');
  } catch (error) {
    console.error('Error adding favourite:', error);
    alert('Could not add to favourites. Please try again.');
  }
}

window.toggleFavorite = toggleFavorite;

// ====== Copy / link / entity nav ======
function copyFullResult(btn) {
  const popup = btn.closest('.popup-content');
  if (!popup) return;

  let text = '';
  const fields = popup.querySelectorAll('p'); 
  fields.forEach(p => {
    if (p.querySelector('.progress-bar')) return;
    const clean = p.textContent.trim();
    if (clean) text += `${clean}\n`;
  });

  navigator.clipboard.writeText(text).then(() => {
    showToast("📋 Result copied to clipboard");
  }).catch(() => {
    const input = document.createElement('textarea');
    input.value = text;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    showToast("📋 Result copied (fallback)");
  });
}

function copyStudentResultLink(btn) {
  const popup = btn.closest('.popup-content');
  const roll = popup?.innerHTML.match(/Roll:\s*(\d+)/)?.[1];
  const year = currentYear?.textContent?.trim();
  const group = currentGroup?.textContent?.split(' ')[0];
  const url = `https://boradrankctg.github.io/rank/entity.html?year=${year}&group=${encodeURIComponent(group)}&roll=${roll}`;

  navigator.clipboard.writeText(url).then(() => {
    showToast("🔗 Link copied");
  }).catch(() => {
    const input = document.createElement('input');
    input.value = url;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    showToast("🔗 Link copied (fallback)");
  });
}




function promptComparison(roll, year, group) {
  if (localStorage.getItem('userLoggedIn') !== 'true') {
    requireLogin('Please log in to access Compare Students.');
    return;
  }
  const baseStudent = allData.find(s => s.roll === roll);
  if (!baseStudent) return showModal({ title:'Not found', message:'Base student not found.' });



  const popup = document.createElement('div');
  popup.classList.add('popup');
  popup.innerHTML = `
    <div class="popup-content">
      <span class="close-btn" onclick="closePopup()">&times;</span>
      <p>Compare <b>${baseStudent.name}</b> with another student</p>
      <input type="text" id="compareRollInput" placeholder="Enter roll number to compare" style="width: 100%; padding: 10px; margin: 10px 0; border-radius: 5px; border: 1px solid #000;">
      <button onclick="startComparison(${baseStudent.roll}, '${year}', '${group}')">Compare</button>
    </div>
  `;
  document.body.appendChild(popup);
  document.body.classList.add('locked');
}
function startComparison(roll1, year, group) {
  if (localStorage.getItem('userLoggedIn') !== 'true') {
    requireLogin('Please log in to access Compare Students.');
    return;
  }
  const roll2 = document.getElementById("compareRollInput").value.trim();

if (!roll2) return showModal({ 
  title:'Missing roll', 
  message:'Please enter a roll number to compare.' 
});

  const dataFile = `DATA/data_${year}_${group.toLowerCase()}_individual.txt`;

  fetch(dataFile)
    .then(res => res.text())
    .then(text => {
      const lines = text.trim().split('\n');
      const row1 = lines.find(r => r.split('\t')[0] === roll1.toString());
      const row2 = lines.find(r => r.split('\t')[0] === roll2.toString());
      if (!row2) return alert("Second roll not found.");

      const parts1 = row1.split('\t');
      const parts2 = row2.split('\t');

      const student1 = allData.find(s => s.roll === parseInt(roll1));
      const student2 = allData.find(s => s.roll === parseInt(roll2));
      if (!student1 || !student2) return alert("Student data not found.");

      let labels = [];
      const isHSC = year.includes("hsc");

      if (isHSC) {
        if (group === "Science") {
          labels = ["Bangla", "English", "ICT", "Physics", "Chemistry", "Compulsory", "Optional"];
        } else if (group === "Commerce") {
          labels = ["Bangla", "English", "ICT", "Accounting", "Finance", "Business Studies", "Optional"];
        } else if (group === "Arts") {
          labels = ["Bangla", "English", "ICT", "Geography", "Civics", "History", "Optional"];
        }
      } else {
        if (group === "Science") {
          labels = ["Bangla", "English", "Math", "BGS", "Religion", "Physics", "Chemistry", "Compulsory", "ICT", "Optional", "Physical", "Career"];
        } else if (group === "Commerce") {
          labels = ["Bangla", "English", "Math", "Science", "Religion", "Accounting", "Finance", "Compulsory", "ICT", "Optional", "Physical", "Career"];
        } else if (group === "Arts") {
          labels = ["Bangla", "English", "Math", "Science", "Religion", "Geography", "Civics", "Compulsory", "ICT", "Optional", "Physical", "Career"];
        }
      }

      let rows = `
        <h2 style="text-align:center; margin-top: 10px;">🎯 Student Comparison</h2>
        <p style="text-align:center; font-weight:bold;">${student1.name} <span style="color:green;">vs</span> ${student2.name}</p>
        <div class="compare-table-container">
          <table class="compare-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>${student1.name}</th>
                <th>${student2.name}</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>GPA</td><td>${student1.gpa}</td><td>${student2.gpa}</td></tr>
              <tr><td>Total Marks</td><td>${student1.total}</td><td>${student2.total}</td></tr>
      `;

      for (let i = 1; i < Math.min(parts1.length, parts2.length); i++) {
        const label = labels[i - 1] || `Subject ${i}`;
        rows += `<tr><td>${label}</td><td>${parts1[i]}</td><td>${parts2[i]}</td></tr>`;
      }

      rows += `
            </tbody>
          </table>
        </div>
        <button class="back-button" onclick="closePopup()">Close</button>
      `;

      closePopup(); // Close input popup
      const popup = document.createElement('div');
      popup.classList.add('popup');
      popup.innerHTML = `<div class="popup-content"><span class="close-btn" onclick="closePopup()">&times;</span>${rows}</div>`;
      document.body.appendChild(popup);
      document.body.classList.add('locked');
      // Log comparison (if logged-in)
(async () => {
  try {
    if (localStorage.getItem('userLoggedIn') === 'true') {
      const uid = localStorage.getItem('loggedInUserId');
      if (uid) {
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
        const { getDatabase, ref, push } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js');
        const cfg = {
          apiKey: "AIzaSyAIsOwpONfGwTDFEbfdno8O3sm2G8GObiU",
          authDomain: "loginforme-f4886.firebaseapp.com",
          databaseURL: "https://loginforme-f4886-default-rtdb.asia-southeast1.firebasedatabase.app",
          projectId: "loginforme-f4886",
          storageBucket: "loginforme-f4886.firebasestorage.app",
          messagingSenderId: "634439962888",
          appId: "1:634439962888:web:72b9c573e76c8719f9dcbd"
        };
        const app = window.__br_logApp || initializeApp(cfg, 'logApp');
        window.__br_logApp = app;
        const dbv = getDatabase(app);
        await push(ref(dbv, `userLogs/${uid}/comparisons`), {
          roll1: String(roll1),
          roll2: String(roll2),
          year,
          group,
          ts: Date.now()
        });
      }
    }
  } catch (e) {
    console.warn('Failed to log comparison', e);
  }
})();
    });
}


// ====== PDF Export ======
function downloadStudentPDF(btn) {
  const safe = s => String(s == null ? '' : s).trim();

  const popup = (btn && btn.closest && (btn.closest('.popup') || btn.closest('.popup-content'))) || 
                document.querySelector('.popup .popup-content') || null;
  if (!popup) {
    showModal({ 
  title:'Not found', 
  message:'No result popup found.' 
});

    return;
  }

  const data = { name: '', roll: '', institution: '', gpa: '', subjects: [] };

  const els = Array.from(popup.querySelectorAll('p,div,span,li,td'));
  els.forEach(el => {
    const txt = safe(el.textContent);
    if (!txt) return;
    const colon = txt.match(/^([^:]{1,40})\s*[:\-]\s*(.+)$/);
    if (colon) {
      const key = colon[1].toLowerCase();
      const val = colon[2].trim();
      if (key.includes('name') && !data.name) data.name = val;
      else if (key.includes('roll') && !data.roll) data.roll = val;
      else if ((key.includes('institution') || key.includes('school') || key.includes('college')) && !data.institution) data.institution = val;
      else if (key.includes('gpa') && !key.includes('subject') && !data.gpa) data.gpa = val;
      else if (!key.includes('board rank')) {
        data.subjects.push({ name: colon[1].trim(), mark: val });
      }
    }
  });

  data.subjects = data.subjects.filter(s => !/board\s*rank/i.test(s.name));

  function markToGrade(markStr, subjectName) {
    const m = parseFloat(String(markStr).replace(/[^0-9.\-]/g, ''));
    if (isNaN(m)) return { gp: '-', grade: '-' };

    const nameLower = (subjectName || '').toLowerCase();

    let yearText = '';
    try {
      if (typeof currentYear !== 'undefined' && currentYear && currentYear.textContent) {
        yearText = String(currentYear.textContent).toLowerCase();
      }
    } catch (e) { yearText = ''; }
    const popupText = (document.querySelector('.popup .popup-content')?.textContent || '').toLowerCase();
    const isHSC = (yearText.includes('hsc') || popupText.includes('hsc'));

    let totalMarks;
    if (isHSC) {
      if (nameLower.includes('ict')) totalMarks = 100;
      else totalMarks = 200;
    } else {
      if (nameLower.includes('ict') || nameLower.includes('career')) totalMarks = 50;
      else if (nameLower.includes('bangla') || nameLower.includes('english')) totalMarks = 200;
      else totalMarks = 100;
    }

    const percentage = (m / totalMarks) * 100;

    if (percentage >= 79.5) return { gp: 5.00, grade: 'A+' };
    if (percentage >= 70)   return { gp: 4.00, grade: 'A' };
    if (percentage >= 60)   return { gp: 3.50, grade: 'A-' };
    if (percentage >= 50)   return { gp: 3.00, grade: 'B' };
    if (percentage >= 40)   return { gp: 2.00, grade: 'C' };
    if (percentage >= 33)   return { gp: 1.00, grade: 'D' };
    return { gp: 0.00, grade: 'F' };
  }

  const filename = `${(data.name || 'marksheet').replace(/[^\w\- ]/g, '')}.pdf`;

  function loadJsPdf(cb) {
    if (window.jspdf && window.jspdf.jsPDF) return cb();
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    s.onload = cb;
    document.head.appendChild(s);
  }

  loadJsPdf(() => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 15;
    let y = 18;

    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('SSC 2025 Board Rank of Chittagong', margin, y);
    y += 12;

    const infoW = pageW - margin * 2;
    const colW = infoW / 4;
    const infoH = 20;
    const fields = [
      { label: 'Name', value: data.name || '-' },
      { label: 'Roll', value: data.roll || '-' },
      { label: 'Institution', value: data.institution || '-' },
      { label: 'GPA', value: data.gpa || '-' }
    ];
    doc.setLineWidth(0.3);
    doc.rect(margin, y, infoW, infoH);
    for (let i = 0; i < fields.length; i++) {
      const x = margin + i * colW;
      doc.rect(x, y, colW, infoH);
      doc.setFontSize(9);
      doc.text(fields[i].label + ':', x + 2, y + 6);

      doc.setFont(undefined, 'bold');
      const wrapped = doc.splitTextToSize(fields[i].value, colW - 4);
      doc.setFontSize(10);
      let textY = y + 12;
      wrapped.forEach(line => { doc.text(line, x + 2, textY); textY += 4; });
      doc.setFont(undefined, 'normal');
    }
    y += infoH + 8;

    const tblW = pageW - margin * 2;
    const col1 = Math.round(tblW * 0.5 * 100) / 100; 
    const col2 = Math.round(tblW * 0.25 * 100) / 100; 
    const col3 = tblW - col1 - col2; 
    const rowH = 8;

    doc.setFillColor(240);
    doc.rect(margin, y, col1, rowH, 'F');
    doc.rect(margin + col1, y, col2, rowH, 'F');
    doc.rect(margin + col1 + col2, y, col3, rowH, 'F');
    doc.setFont(undefined, 'bold');
    doc.text('Subject', margin + 2, y + 6);
    doc.text('Marks', margin + col1 + col2 - 2, y + 6, { align: 'right' });
    doc.text('GPA', margin + col1 + col2 + col3 - 2, y + 6, { align: 'right' });
    y += rowH;
    doc.setFont(undefined, 'normal');

    data.subjects.forEach(row => {
      const g = markToGrade(row.mark, row.name);

      doc.rect(margin, y, col1, rowH);
      doc.rect(margin + col1, y, col2, rowH);
      doc.rect(margin + col1 + col2, y, col3, rowH);

      doc.text(row.name, margin + 2, y + 5);
      doc.text(String(row.mark), margin + col1 + col2 - 2, y + 5, { align: 'right' });
      doc.text(`${typeof g.gp === 'number' ? g.gp.toFixed(2) : g.gp} (${g.grade})`, margin + col1 + col2 + col3 - 2, y + 5, { align: 'right' });
      y += rowH;
    });

    doc.setFontSize(9);
    doc.text(`Generated on ${new Date().toLocaleString()}`, margin, 285);
    doc.text('Unofficial printable copy', pageW - margin, 285, { align: 'right' });

    doc.save(filename);
    showToast("📥 Download started");
  });
}