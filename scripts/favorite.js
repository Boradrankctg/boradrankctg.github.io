  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
      import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
      import { getDatabase, ref, onValue, remove } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

      const dbConfig = {
        apiKey: "AIzaSyAIsOwpONfGwTDFEbfdno8O3sm2G8GObiU",
        authDomain: "loginforme-f4886.firebaseapp.com",
        databaseURL: "https://loginforme-f4886-default-rtdb.asia-southeast1.firebasedatabase.app",
        projectId: "loginforme-f4886",
        storageBucket: "loginforme-f4886.firebasestorage.app",
        messagingSenderId: "634439962888",
        appId: "1:634439962888:web:72b9c573e76c8719f9dcbd"
      };

      const app = initializeApp(dbConfig);
      const db = getDatabase(app);

  document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('userLoggedIn') !== 'true') {
      if (typeof window.requireLogin === 'function') {
        window.requireLogin('Please log in to access your profile.');
        setTimeout(() => { window.location.href = 'login.html'; }, 1000);
      } else {
        alert('Please log in to access your profile.');
        window.location.href = 'login.html';
      }
    }
  });

      const userUID = localStorage.getItem('loggedInUserId');
      
      onValue(ref(db, 'favorites/' + userUID), (snapshot) => {
        const container = document.getElementById('favoritesContainer');
        
        if (!snapshot.exists()) {
          container.innerHTML = '<p style="text-align:center; color:var(--text-muted);">No favorites yet. Start adding from the results page!</p>';
          return;
        }

        container.innerHTML = '';
        const favorites = snapshot.val();
        
        Object.entries(favorites).forEach(([key, fav]) => {
          const card = document.createElement('div');
          card.className = 'popup-content';
          card.style = 'margin-bottom: 20px; position: relative;';
          card.innerHTML = `
            <button onclick="removeFavorite('${key}')" style="position:absolute;top:10px;right:10px;background:#ef4444;color:white;border:none;padding:6px 12px;border-radius:8px;font-weight:700;">
              <i class="fas fa-trash"></i> Remove
            </button>
            <h3 style="color:var(--text);">${fav.name}</h3>
            <p><strong>Roll:</strong> ${fav.roll}</p>
            <p><strong>Institution:</strong> ${fav.institution || 'N/A'}</p>
            <p><strong>GPA:</strong> ${fav.gpa || 'N/A'}</p>
            <p><strong>Exam:</strong> ${fav.exam || 'N/A'} ${fav.year || ''}</p>
            <button onclick="viewResult('${fav.roll}', '${fav.year}', '${fav.group}')" style="margin-top:10px;">
              View Full Result
            </button>
          `;
          container.appendChild(card);
        });
      });

      window.removeFavorite = async function(key) {
        if (confirm('Remove from favorites?')) {
          await remove(ref(db, 'favorites/' + userUID + '/' + key));
        }
      };

      window.viewResult = function(roll, year, group) {
        window.location.href = `index.html?year=${year}&group=${group}&roll=${roll}`;
      };

  document.getElementById('logoutBtn').addEventListener('click', () => {
    if (typeof doLogout === 'function') doLogout();
  });