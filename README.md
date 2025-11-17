Got it. Below is a safe, step-by-step plan with exact “search/replace” and “add after this line” instructions. Follow in order. Make a backup first.
odule from admin-91.html into here)

Part A — index.html changes
1) Update scroll-to-top image path
- Find (search exactly):
  <img src="arrow-up.png" alt="Scroll to top">
- Replace with:
  <img src="asset/arrow-up.png" alt="Scroll to top">

2) Load page scripts from scripts folder
- Find (search exactly):
  <script src="script.js"></script>
- Replace with:
  <script src="scripts/index.js"></script>

Part B — review.html changes
1) Replace inline module with external file
- Find the only inline Firebase module (starts with):
  <script type="module">
- Delete everything until its closing:
  </script>
- After deleting, insert this in the same place:
  <script type="module" src="scripts/review.js"></script>

2) Use new common/index script
- Find:
  <script src="script.js"></script>
- Replace with:
  <script src="scripts/index.js"></script>

3) Add “Sort by” control (likes default; can switch to newest)
- Find (search exactly):
  <h3>All Reviews</h3>
- Add this right AFTER it:
  <div id="reviewSortRow" style="margin:8px 0;">
    Sort by:
    <select id="reviewSort">
      <option value="likes" selected>Most liked</option>
      <option value="newest">Newest first</option>
    </select>
  </div>



Part C — admin-91.html changes
1) Replace inline module with external file
- Find:
  <script type="module">
- Delete everything until:
  </script>
- Insert instead:
  <script type="module" src="scripts/admin-91.js"></script>

2) Use new common/index script
- Find:
  <script src="script.js"></script>
- Replace with:
  <script src="scripts/index.js"></script>

Part D — styles.css changes
1) Update search icon paths (2 occurrences)
- Find:
  background:url('search.png')
- Replace with:
  background:url('asset/search.png')

- Find:
  input#InstituationDropdown[list]{background:url('search.png')
- Replace the url piece to:
  input#InstituationDropdown[list]{background:url('asset/search.png')

2) Make Featured boxes white (light) and near-black (dark)
- Add these CSS variables near top (under :root{ ... }):
  --featured-bg-light:#ffffff;
  --featured-bg-dark:#0f172a;

- Find (search exactly, there are two .featured-box blocks; change THIS one under “/* ========== FEATURED YEAR CARDS ========== */”):
  .featured-box,#featuredBox{position:relative;width:min(90vw, 300px);aspect-ratio:1/1;border-radius:18px;background:rgb(2, 32, 76);color:white;box-shadow:var(--shadow-strong);display:grid;place-items:center;font-size:2.25rem;font-weight:900;cursor:pointer;overflow:hidden;transition:transform .25s ease,box-shadow .25s ease;}
- Replace that whole rule with:
  .featured-box,#featuredBox{
    position:relative;width:min(90vw, 300px);aspect-ratio:1/1;border-radius:18px;
    background:var(--featured-bg-light); color:var(--text);
    box-shadow:var(--shadow-strong);display:grid;place-items:center;
    font-size:2.25rem;font-weight:900;cursor:pointer;overflow:hidden;
    transition:transform .25s ease,box-shadow .25s ease;
  }
- Add this dark-mode override near the bottom with other dark-mode overrides:
  body.dark-mode .featured-box, body.dark-mode #featuredBox{
    background:var(--featured-bg-dark); color:var(--text);
  }

Part E — scripts/index.js (this is your old script.js with edits)
1) Put script.js into scripts/index.js
- Create scripts/index.js and paste the entire content of your current script.js into it.
- Then do the edits below in scripts/index.js.

2) Update DATA paths (3 places)
- Find (first occurrence):
  const mainDataUrl = `data_${year}_${group.toLowerCase()}.txt`;
- Replace with:
  const mainDataUrl = `DATA/data_${year}_${group.toLowerCase()}.txt`;

- Find:
  const individualDataUrl = `data_${year}_${group.toLowerCase()}_individual.txt`;
- Replace with:
  const individualDataUrl = `DATA/data_${year}_${group.toLowerCase()}_individual.txt`;

- Find (inside startComparison):
  const dataFile = `data_${year}_${group.toLowerCase()}_individual.txt`;
- Replace with:
  const dataFile = `DATA/data_${year}_${group.toLowerCase()}_individual.txt`;

- Find (in the overridden fetchData near bottom):
  const mainDataUrl = `data_${year}_${group.toLowerCase()}.txt`;
- Replace with:
  const mainDataUrl = `DATA/data_${year}_${group.toLowerCase()}.txt`;

  and:
  const individualDataUrl = `data_${year}_${group.toLowerCase()}_individual.txt`;
- Replace with:
  const individualDataUrl = `DATA/data_${year}_${group.toLowerCase()}_individual.txt`;

3) Update JSON-LD download URL to DATA folder
- Find inside function injectDatasetForYearGroup(year, group):
  "contentUrl": ${location.origin}${location.pathname.replace(/index\.html?$/,'')}data_${year}_${group.toLowerCase()}.txt
- Replace with:
  "contentUrl": ${location.origin}${location.pathname.replace(/index\.html?$/,'')}DATA/data_${year}_${group.toLowerCase()}.txt

4) Remove “Go to SSC from HSC” feature
- Remove the button from HSC result popup:
  - Find (inside showIndividualResult HSC markup):
    <button onclick="showSSCResultFromHSC('
  - Delete that whole line (the “Watch SSC Result” button).

- Remove the linking functions block
  - Find (search exactly):
    function _br_normalizeName(s) {
  - Delete everything from that line DOWN TO (but not including) this line:
    // === Smart suggestions ===
  This will remove all helper functions used only for the HSC→SSC link.

5) Remove “Open as Page” everywhere
- Delete the buttons:
  - Find:
    > Open as Page
  - Remove each button line:
    - In showIndividualResult (HSC block): the line with onclick="openEntityPage('student'..."
    - In showIndividualResult (SSC block): the line with onclick="openEntityPage('student'..."
    - In showSchoolRanking: the line with onclick="openEntityPage('school'..."

- Delete the function itself:
  - Find:
    function openEntityPage(type, year, group, value) {
  - Delete the whole function block.

- Update share link to current page (no entity.html)
  - Find function copyStudentResultLink(btn)
  - Find the line:
    const url = `https://boradrankctg.github.io/rank/entity.html?year=${year}&group=${encodeURIComponent(group)}&roll=${roll}`;
  - Replace with:
    const url = `${location.origin}${location.pathname}?year=${encodeURIComponent(year)}&group=${encodeURIComponent(group)}&roll=${encodeURIComponent(roll)}`;

- Update updateSEOForStudent() to not point to entity.html
  - Find function updateSEOForStudent(year, group, studentName, roll)
  - Replace the URL building lines:
    Remove this line:
      const pagePath = location.pathname.includes('entity.html') ? location.pathname : '/rank/entity.html';
    Replace the next line:
      const url   = `${location.origin}${pagePath}?year=${encodeURIComponent(year)}&group=${encodeURIComponent(group)}&roll=${encodeURIComponent(roll)}`;
    With:
      const url   = `${location.origin}${location.pathname}?year=${encodeURIComponent(year)}&group=${encodeURIComponent(group)}&roll=${encodeURIComponent(roll)}`;

6) Merge duplicate filter functions (keep the better combined one)
- Remove the simpler, older functions (we’ll keep the combined one near the bottom):
  - Delete this block:
    function handleSearchInput() {
        const searchTerm = document.getElementById('searchInput').value.trim().toLowerCase();
        filteredData = allData.filter(student => student.name.toLowerCase().includes(searchTerm));
        currentPage = 1;
        updatePage();
    }
  - Delete this block:
    function handleRollSearchInput() {
        const rollSearchTerm = document.getElementById('searchRollInput').value.trim();
        filteredData = allData.filter(student => student.roll.toString().includes(rollSearchTerm));
        currentPage = 1;
        updatePage();
    }
  - Delete this entire earlier block (the one taking (InstituationName = null, fromTable = false)):
    function filterByInstituation(InstituationName = null, fromTable = false) {
      ...
    }

- Keep the later unified versions (already in your file):
  function handleSearchInput() { ... matchesName && matchesRoll && matchesInstituation ... }
  function handleRollSearchInput() { handleSearchInput(); }
  function filterByInstituation() { handleSearchInput(); }  // and the datalist one at the very end that calls showSchoolRanking(input)

- Remove duplicate “attachMobileFilterLiveListeners”
  - Find the first occurrence:
    function attachMobileFilterLiveListeners() {
      const liveApply = debounce(applyMobileFilters, 120);
      ...
    }
  - If this appears twice, delete the first duplicate (keep the one right above filterSchoolList/applyMobileFilters block).

7) Remove the extra popstate listener (keep the smarter one)
- Find (exact):
  window.addEventListener('popstate', function() {
      closePopup();
  });
- Delete this small listener (keep the later one that re-loads by year/group/roll).

8) Make group buttons look like featured boxes + move icons to asset
- Find inside function loadYear(year) the block that builds group buttons. Find this exact HTML:
  contentDiv.innerHTML = `
      <p>Select your group:</p>
      <div class="group-buttons">
          <button onclick="loadGroup('${year}', 'Science')">
              <img src="sci.png" alt="Science Icon">Science
          </button>
          <button onclick="loadGroup('${year}', 'Commerce')">
              <img src="com.png" alt="Commerce Icon">Business
          </button>
          <button onclick="loadGroup('${year}', 'Arts')">
              <img src="hum.png" alt="Arts Icon">Humanities
          </button>
      </div>
  `;
- Replace that whole block with:
  contentDiv.innerHTML = `
    <p>Select your group:</p>
    <div class="new-box-wrapper">
      <div class="featured-box" onclick="loadGroup('${year}', 'Science')" title="Science">
        <div class="featured-text">SCIENCE</div>
        <img src="asset/sci.png" alt="Science" style="position:absolute;bottom:10px;right:10px;width:48px;height:48px;opacity:.9;">
      </div>
      <div class="featured-box" onclick="loadGroup('${year}', 'Commerce')" title="Business Studies">
        <div class="featured-text">BUSINESS</div>
        <img src="asset/com.png" alt="Business" style="position:absolute;bottom:10px;right:10px;width:48px;height:48px;opacity:.9;">
      </div>
      <div class="featured-box" onclick="loadGroup('${year}', 'Arts')" title="Humanities">
        <div class="featured-text">HUMANITIES</div>
        <img src="asset/hum.png" alt="Humanities" style="position:absolute;bottom:10px;right:10px;width:48px;height:48px;opacity:.9;">
      </div>
    </div>
  `;

Part F — scripts/review.js (move from review.html inline module)
1) Create scripts/review.js and paste the exact code currently inside review.html’s <script type="module">...</script>.

2) Default sort by likes and allow “Newest first”
- In your loadReviews() function, modify it to read the dropdown and sort:
  - Find:
    function loadReviews() {
      const container = document.getElementById("reviewsContainer");
      const reviewsRef = ref(db, "reviews");

      onValue(reviewsRef, (snapshot) => {
        container.innerHTML = "";
        const data = snapshot.val();
        if (!data) return;

        Object.entries(data)
          .reverse()
          .forEach(([id, review]) => {
          ...
  - Replace the sorting area with this:
    const sortMode = (document.getElementById('reviewSort')?.value) || localStorage.getItem('reviewSort') || 'likes';
    if (document.getElementById('reviewSort')) {
      document.getElementById('reviewSort').value = sortMode;
      document.getElementById('reviewSort').onchange = (e) => {
        localStorage.setItem('reviewSort', e.target.value);
        loadReviews();
      };
    }

    const entries = Object.entries(data);
    // sort
    if (sortMode === 'likes') {
      entries.sort((a,b) => ((b[1]?.likes||0) - (a[1]?.likes||0)) || ((b[1]?.timestamp||0) - (a[1]?.timestamp||0)));
    } else {
      entries.sort((a,b) => (b[1]?.timestamp||0) - (a[1]?.timestamp||0));
    }

    entries.forEach(([id, review]) => {
      ...

3) Block the word “ADMIN” in names/comments/replies
- Add this helper near the top of the module (under ADMIN_ID line is fine):
  function blocksAdminWord(s) {
    return /admin/i.test(String(s||''));
  }

- In submitReview():
  - Find:
    if (!name || !comment || rating === 0) {
  - Replace with:
    if (!name || !comment || rating === 0) {
      alert("Please fill in all fields and select a rating.");
      return;
    }
    if (blocksAdminWord(name) || blocksAdminWord(comment)) {
      alert('The word “admin” is not allowed.');
      return;
    }

- In window.submitReply = async function (id) { ... }:
  - Find:
    const text = (input.value || '').trim();
    if (!text) return;
  - Replace with:
    const text = (input.value || '').trim();
    if (!text) return;
    if (blocksAdminWord(text)) { alert('The word “admin” is not allowed.'); return; }

- Remove the ADMIN badge in UI:
  - Find in loadReviews() replies mapping:
    const adminTag = r.isAdmin ? `<span class="badge-admin">[ADMIN]</span>` : "";
  - Replace with:
    const adminTag = "";
  - Also in submitReply(), remove saving isAdmin:
    Change:
      await set(replyRef, {
        text,
        isAdmin: userId === ADMIN_ID,
        userId: userId,
        likes: 0,
        timestamp: Date.now()
      });
    To:
      await set(replyRef, {
        text,
        userId: userId,
        likes: 0,
        timestamp: Date.now()
      });

Part G — scripts/admin-91.js
- Create scripts/admin-91.js and paste the full inline module code from admin-91.html into it (no functional changes needed).
- Nothing else needed for admin beyond moving to scripts/admin-91.js.

Part H — tiny polish (optional but recommended)
- In index.html, you still have firebase-setup.js as module. Keep it as-is.
- If any image paths other than sci/com/hum/search/arrow are local, put them into asset and update paths similarly.

What you’ll have after changes
- index.html uses scripts/index.js (your old script.js moved + cleaned).
- review.html uses scripts/review.js (new file) + scripts/index.js for nav/theme.
- admin-91.html uses scripts/admin-91.js (new file) + scripts/index.js for nav/theme.
- All data fetches point to DATA folder.
- “Go to SSC from HSC” feature removed (button + functions).
- “Open as Page” removed (buttons + function).
- Filters de-duplicated (keep the combined one).
- Group selection now uses featured-style cards and assets from asset folder.
- Featured boxes are white in light mode and near-black in dark mode.
- Reviews default sort = Most liked; selectable to Newest; word “admin” is blocked in name/comment/replies.

Quick test plan (do these after changes)
- Open index.html:
  - Choose a year/group; data should load (loader shows).
  - Search works with name/roll/institution.
  - Group selection page shows three big featured-like tiles (SCIENCE/BUSINESS/HUMANITIES) with icons.
  - Open a student popup; no “Open as Page” / no “Watch SSC Result” buttons.
  - Copy Link copies current page URL with ?year&group&roll.
- Open review.html:
  - See “Sort by” dropdown above reviews; default is Most liked.
  - Try adding a review with name/comment containing “admin” → blocked.
  - Try replying with “admin” → blocked.
- Open admin-91.html:
  - Scripts load; login etc works as before.

If you want, I can generate the ready-to-paste scripts/index.js, scripts/review.js, and the exact CSS snippet with all replacements already applied.