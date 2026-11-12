// ===================================
// 1. เชื่อมต่อ Supabase
// ===================================

const SUPABASE_URL =
"https://lttdoaokuesnyactnfoq.supabase.co";

const SUPABASE_ANON_KEY =
"sb_publishable_C4XVlrmTB4kGDXjL-xmR3A_0xaNgEJg";

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);


// ===================================
// 2. ระบบลงทะเบียนนักศึกษา
// ===================================

const registerForm = document.getElementById("registerForm");

if (registerForm) {

  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const btn = document.getElementById("submitBtn");
    const message = document.getElementById("message");

    btn.disabled = true;
    btn.textContent = "กำลังบันทึก...";
    message.textContent = "";

    const student = {
      first_name: document.getElementById("first_name").value.trim(),
      last_name: document.getElementById("last_name").value.trim(),
      age: Number(document.getElementById("age").value),
      department: document.getElementById("department").value,
      major: document.getElementById("major").value.trim(),
      student_id: document.getElementById("student_id").value.trim(),
      level: document.getElementById("level").value,
      motto: document.getElementById("motto").value.trim()
    };

    try {

      const { error } = await db
        .from("registrations")
        .insert([student]);

      if (error) throw error;

      message.textContent = "ลงทะเบียนสำเร็จแล้ว!";
      message.style.color = "green";

      registerForm.reset();

    } catch (error) {

      message.textContent = "เกิดข้อผิดพลาด: " + error.message;
      message.style.color = "red";

    } finally {

      btn.disabled = false;
      btn.textContent = "ลงทะเบียน";

    }
  });
}

// ===================================
// 3. ระบบ Admin Login
// ===================================

const loginForm = document.getElementById("loginForm");

if (loginForm) {

  checkAdmin();

  loginForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const message = document.getElementById("loginMessage");

    message.textContent = "กำลังเข้าสู่ระบบ...";

    const { error } = await db.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      message.textContent = "เข้าสู่ระบบไม่สำเร็จ: " + error.message;
      message.style.color = "red";
      return;
    }

    message.textContent = "";
    await checkAdmin();
  });

}

// ===================================
// 4. ตรวจสอบ Admin
// ===================================

async function checkAdmin() {

  if (!document.getElementById("dashboard")) return;

  const { data } = await db.auth.getSession();

  const loggedIn = !!data.session;

  document.getElementById("loginBox").hidden = loggedIn;
  document.getElementById("dashboard").hidden = !loggedIn;

  if (loggedIn) {
    loadStudents();
  }
}

// ===================================
// 5. แสดงข้อมูลนักศึกษา
// ===================================

async function loadStudents() {

  const table = document.getElementById("studentTable");
  const message = document.getElementById("adminMessage");

  table.innerHTML = "<tr><td colspan='8'>กำลังโหลดข้อมูล...</td></tr>";

  try {

    const { data, error } = await db
      .from("registrations")
      .select("*")
      .order("id", { ascending: false });

    if (error) throw error;

    document.getElementById("totalStudents").textContent = data.length;

    table.innerHTML = "";

    if (data.length === 0) {
      table.innerHTML =
        "<tr><td colspan='8'>ยังไม่มีข้อมูลนักศึกษา</td></tr>";
      return;
    }

    data.forEach((s, index) => {

      const tr = document.createElement("tr");

      const values = [
        index + 1,
        `${s.first_name || ""} ${s.last_name || ""}`,
        s.age ?? "-",
        s.department || "-",
        s.major || "-",
        s.student_id || "-",
        s.level || "-",
        s.motto || "-"
      ];

      values.forEach(value => {
        const td = document.createElement("td");
        td.textContent = value;
        tr.appendChild(td);
      });

      table.appendChild(tr);

    });

    message.textContent = "";

  } catch (error) {

    table.innerHTML = "";
    message.textContent = "ไม่สามารถโหลดข้อมูลได้: " + error.message;
    message.style.color = "red";

  }
}

// ===================================
// 6. ปุ่มรีเฟรช
// ===================================

const refreshBtn = document.getElementById("refreshBtn");

if (refreshBtn) {
  refreshBtn.addEventListener("click", loadStudents);
}

// ===================================
// 7. ออกจากระบบ
// ===================================

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {

  logoutBtn.addEventListener("click", async () => {

    const { error } = await db.auth.signOut();

    if (error) {
      alert(error.message);
      return;
    }

    location.reload();

  });

}
