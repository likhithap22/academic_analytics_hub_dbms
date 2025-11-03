// Demo admin credentials (change if needed)
const ADMIN_USER = "admin";
const ADMIN_PASS = "password123";

// Simple localStorage helpers
function loadStudents(){ try { return JSON.parse(localStorage.getItem("srms_students")||"[]"); } catch(e) { return []; } }
function saveStudents(list){ localStorage.setItem("srms_students", JSON.stringify(list||[])); }

// Calculate total, percent, grade
function calcMarks(m){
  const math = Number(m.math||0), science = Number(m.science||0), english = Number(m.english||0);
  const total = math + science + english;
  const percent = Math.round((total / 300) * 10000) / 100;
  let grade = "Fail";
  if(percent >= 90) grade = "A+";
  else if(percent >= 75) grade = "A";
  else if(percent >= 60) grade = "B";
  else if(percent >= 40) grade = "C";
  return { total, percent, grade };
}

// ===== Login =====
function login(){
  const u = (document.getElementById("user") || {}).value.trim();
const p = (document.getElementById("pass") || {}).value.trim();
  if(u === ADMIN_USER && p === ADMIN_PASS){
    // mark logged (optional) and redirect
    localStorage.setItem("srms_logged","1");
    location.href = "admin-dashboard.html";
  } else {
    const msg = document.getElementById("msg");
    if(msg) msg.innerText = "Invalid credentials";
  }
}

// ===== Logout =====
function logout(){
  localStorage.removeItem("srms_logged");
  location.href = "home.html";
}

// ===== Save Result =====
function saveResult(){
  const rollEl = document.getElementById("roll");
  const nameEl = document.getElementById("name");
  const mathEl = document.getElementById("math");
  const scienceEl = document.getElementById("science");
  const englishEl = document.getElementById("english");
  const msg = document.getElementById("msg");

  if(!rollEl || !nameEl){ if(msg) msg.innerText="Form elements missing"; return; }

  const roll = rollEl.value.trim();
  const name = nameEl.value.trim();
  if(!roll || !name){ if(msg) msg.innerText="Please enter roll and name"; return; }

  const payload = { roll, name, math: mathEl.value, science: scienceEl.value, english: englishEl.value };
  const cal = calcMarks(payload);
  const record = { ...payload, ...cal, created: Date.now() };

  let list = loadStudents();
  const idx = list.findIndex(s => s.roll === roll);
  if(idx >= 0) list[idx] = record; else list.push(record);
  saveStudents(list);

  if(msg) msg.innerText = "Saved ✓";
  setTimeout(()=> location.href = "view-result.html", 700);
}

// ===== Render Table =====
function renderTable(){
  const tableBody = document.querySelector("#resultsTable tbody");
  const raw = document.getElementById("filter");
  const q = (raw && raw.value || "").toLowerCase();

  const list = loadStudents().filter(s => {
    if(!q) return true;
    return (s.name||"").toLowerCase().includes(q) || (s.roll||"").toLowerCase().includes(q);
  });

  if(!tableBody) return;
  tableBody.innerHTML = "";

  list.forEach(s => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${s.roll}</td>
                    <td>${s.name}</td>
                    <td>${s.total}</td>
                    <td>${s.percent}%</td>
                    <td>${s.grade}</td>
                    <td>
                      <button class="btn" onclick="editRecord('${s.roll}')">Edit</button>
                      <button class="btn ghost" onclick="deleteRecord('${s.roll}')">Delete</button>
                    </td>`;
    tableBody.appendChild(tr);
  });
}

// ===== Edit/Delete helpers =====
function editRecord(roll){
  localStorage.setItem("srms_edit", roll);
  location.href = "add-result.html";
}
function deleteRecord(roll){
  if(!confirm("Delete this record?")) return;
  let list = loadStudents().filter(s => s.roll !== roll);
  saveStudents(list);
  renderTable();
  renderDashboardStats();
}

// ===== Search by roll (public) =====
function searchRoll(){
  const q = (document.getElementById("qroll") || {}).value || "";
  const out = document.getElementById("searchOut");
  if(!q){ if(out) out.innerHTML = "<p class='lead' style='color:#ff9b9b'>Enter roll number</p>"; return; }
  const s = loadStudents().find(x => x.roll === q.trim());
  if(!s){ if(out) out.innerHTML = "<p class='lead' style='color:#ff9b9b'>Not found</p>"; return; }
  localStorage.setItem("srms_view", s.roll);
  location.href = "student-result.html";
}

// ===== Render single student result page =====
function renderStudentResult(){
  const view = localStorage.getItem("srms_view");
  const container = document.getElementById("resultCard");
  if(!container) return;
  if(!view){ container.innerHTML = "<p class='lead'>No student selected</p>"; return; }
  const s = loadStudents().find(x => x.roll === view);
  if(!s){ container.innerHTML = "<p class='lead'>Student not found</p>"; return; }

  container.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;gap:12px">
      <div>
        <h2 class="title">${s.name}</h2>
        <p class="lead">Roll: <span class="badge">${s.roll}</span></p>
      </div>
      <div>
        <p class="lead">Generated: ${new Date(s.created).toLocaleString()}</p>
      </div>
    </div>
    <table class="table" style="margin-top:16px">
      <tr><th>Subject</th><th>Marks</th></tr>
      <tr><td>Mathematics</td><td>${s.math}</td></tr>
      <tr><td>Science</td><td>${s.science}</td></tr>
      <tr><td>English</td><td>${s.english}</td></tr>
      <tr><th>Total</th><th>${s.total}</th></tr>
      <tr><th>Percentage</th><th>${s.percent}%</th></tr>
      <tr><th>Grade</th><th>${s.grade}</th></tr>
    </table>`;
}

// ===== Dashboard stats =====
function renderDashboardStats(){
  const list = loadStudents();
  const totEl = document.getElementById("totStudents");
  const avgEl = document.getElementById("avgPercent");
  const topEl = document.getElementById("topper");

  if(totEl) totEl.innerText = list.length;
  if(avgEl) avgEl.innerText = list.length ? (Math.round((list.reduce((a,b) => a + (b.percent||0), 0) / list.length) * 100) / 100) + "%" : "0%";
  if(topEl) topEl.innerText = list.length ? list.slice().sort((a,b)=>b.percent-a.percent)[0].name + " (" + list.slice().sort((a,b)=>b.percent-a.percent)[0].percent + "%)" : "—";
}

// ===== Prefill edit when opening add-result.html after 'Edit' =====
function prefillEdit(){
  const edit = localStorage.getItem("srms_edit");
  if(!edit) return;
  const s = loadStudents().find(x => x.roll === edit);
  if(!s) return;
  if(document.getElementById("roll")) document.getElementById("roll").value = s.roll;
  if(document.getElementById("name")) document.getElementById("name").value = s.name;
  if(document.getElementById("math")) document.getElementById("math").value = s.math;
  if(document.getElementById("science")) document.getElementById("science").value = s.science;
  if(document.getElementById("english")) document.getElementById("english").value = s.english;
  localStorage.removeItem("srms_edit");
}

// ===== On DOM load =====
window.addEventListener("DOMContentLoaded", () => {
  renderDashboardStats();
  renderTable();
  renderStudentResult();
  prefillEdit();
});
