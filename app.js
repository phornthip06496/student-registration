// ===================================
// 1. เชื่อมต่อ Supabase
// ===================================

const SUPABASE_URL = "https://lttdoaokuesnyactnfoq.supabase.co";

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

    if (btn) {
      btn.disabled = true;
      btn.textContent = "กำลังบันทึก...";
    }

    if (message) message.textContent = "";

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

      if (message) {
        message.textContent = "ลงทะเบียนสำเร็จแล้ว!";
        message.style.color = "green";
      }

      registerForm.reset();

    } catch (error) {
      if (message) {
        message.textContent = "เกิดข้อผิดพลาด: " + error.message;
        message.style.color = "red";
      }

    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = "ลงทะเบียน";
      }
    }
  });
}


// ===================================
// 3. ระบบ Admin Login
// ===================================

const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const message = document.getElementById("loginMessage");

    const loginBtn = loginForm.querySelector(
      'button[type="submit"], input[type="submit"]'
    );

    if (loginBtn) loginBtn.disabled = true;

    if (message) {
      message.textContent = "กำลังเข้าสู่ระบบ...";
      message.style.color = "blue";
    }

    try {
      const { error } = await db.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      const isAdmin = await checkAdmin();

      if (!isAdmin) {
        throw new Error("บัญชีนี้ไม่มีสิทธิ์เข้าใช้งาน Admin");
      }

      if (message) {
        message.textContent = "เข้าสู่ระบบสำเร็จ";
        message.style.color = "green";
      }

    } catch (error) {
      if (message) {
        message.textContent = error.message;
        message.style.color = "red";
      }

      await db.auth.signOut();

    } finally {
      if (loginBtn) loginBtn.disabled = false;
    }
  });
}


// ===================================
// 4. ตรวจสอบสิทธิ์ Admin
// ===================================

async function checkAdmin() {
  const dashboard = document.getElementById("dashboard");
  const loginBox = document.getElementById("loginBox");

  if (!dashboard) return false;

  try {
    const { data: sessionData, error: sessionError } =
      await db.auth.getSession();

    if (sessionError) throw sessionError;

    const session = sessionData.session;

    if (!session) {
      dashboard.hidden = true;
      if (loginBox) loginBox.hidden = false;
      return false;
    }

    // ตรวจสอบว่า user_id อยู่ในตาราง admin_users หรือไม่
    const { data: admin, error } = await db
      .from("admin_users")
      .select("user_id")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (error) throw error;

    if (!admin) {
      dashboard.hidden = true;
      if (loginBox) loginBox.hidden = false;

      await db.auth.signOut();

      const message = document.getElementById("loginMessage");

      if (message) {
        message.textContent = "บัญชีนี้ไม่มีสิทธิ์ Admin";
        message.style.color = "red";
      }

      return false;
    }

    if (loginBox) loginBox.hidden = true;
    dashboard.hidden = false;

    await loadStudents();

    return true;

  } catch (error) {
    console.error("Admin check error:", error);

    dashboard.hidden = true;
    if (loginBox) loginBox.hidden = false;

    const message = document.getElementById("adminMessage");

    if (message) {
      message.textContent =
        "ตรวจสอบสิทธิ์ไม่สำเร็จ: " + error.message;
      message.style.color = "red";
    }

    return false;
  }
}


// ===================================
// 5. แสดงข้อมูลนักศึกษา
// ===================================

async function loadStudents() {
  const table = document.getElementById("studentTable");
  const message = document.getElementById("adminMessage");
  const total = document.getElementById("totalStudents");

  if (!table) return;

  table.innerHTML =
    "<tr><td colspan='8'>กำลังโหลดข้อมูล...</td></tr>";

  try {
    const { data, error } = await db
      .from("registrations")
      .select("*")
      .order("id", { ascending: false });

    if (error) throw error;

    if (total) total.textContent = data.length;

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
        td.textContent = String(value);
        tr.appendChild(td);
      });

      table.appendChild(tr);
    });

    if (message) message.textContent = "";

  } catch (error) {
    table.innerHTML = "";

    if (message) {
      message.textContent =
        "ไม่สามารถโหลดข้อมูลได้: " + error.message;
      message.style.color = "red";
    }

    console.error(error);
  }
}


// ===================================
// 6. ปุ่มรีเฟรชข้อมูล
// ===================================

const refreshBtn = document.getElementById("refreshBtn");

if (refreshBtn) {
  refreshBtn.addEventListener("click", async () => {
    await loadStudents();
  });
}


// ===================================
// 7. ระบบออกจากระบบ
// ===================================

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    const { error } = await db.auth.signOut();

    if (error) {
      alert("ออกจากระบบไม่สำเร็จ: " + error.message);
      return;
    }

    location.reload();
  });
}


// ===================================
// 8. เริ่มต้นตรวจสอบเมื่อเปิดหน้า Admin
// ===================================

if (document.getElementById("dashboard")) {
  checkAdmin();
}
