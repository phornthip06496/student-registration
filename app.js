// ========================================
// ตั้งค่า Supabase
// ใช้ Project URL และ Publishable/anon key เท่านั้น
// ห้ามใส่ service_role หรือ secret key ในไฟล์นี้
// ========================================

const SUPABASE_URL = "https://lttdoaokuesnyactnfoq.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_C4XVlrmTB4kGDXjL-xmR3A_0xaNgEJg";

if (!window.supabase) {
  console.error("โหลด Supabase library ไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ต");
  alert("ไม่สามารถโหลด Supabase ได้ กรุณารีเฟรชหน้าเว็บ");
}

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


// ========================================
// 1) หน้าลงทะเบียนนักศึกษา (index.html)
// ========================================

const registerForm = document.getElementById("registerForm");

if (registerForm) {
  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const button = document.getElementById("submitBtn");
    const message = document.getElementById("message");

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

    if (!student.first_name || !student.last_name || !student.student_id ||
        !student.department || !student.major || !student.level ||
        !student.motto || !Number.isInteger(student.age) || student.age < 1) {
      message.textContent = "กรุณากรอกข้อมูลให้ครบและตรวจสอบอายุ";
      message.style.color = "red";
      return;
    }

    button.disabled = true;
    button.textContent = "กำลังบันทึก...";
    message.textContent = "";

    try {
      const { error } = await db
        .from("registrations")
        .insert([student]);

      if (error) throw error;

      message.textContent = "ลงทะเบียนสำเร็จแล้ว!";
      message.style.color = "green";
      registerForm.reset();

    } catch (error) {
      console.error("Registration error:", error);
      message.textContent = "บันทึกไม่สำเร็จ: " + error.message;
      message.style.color = "red";

    } finally {
      button.disabled = false;
      button.textContent = "ลงทะเบียน";
    }
  });
}


// ========================================
// 2) ระบบเข้าสู่ระบบ Admin (admin.html)
// ========================================

const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const message = document.getElementById("loginMessage");
    const button = document.getElementById("loginBtn");

    button.disabled = true;
    message.textContent = "กำลังเข้าสู่ระบบ...";
    message.style.color = "#2563eb";

    try {
      const { error } = await db.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const allowed = await checkAdmin();

      if (!allowed) {
        await db.auth.signOut();
        throw new Error("บัญชีนี้ยังไม่ได้รับสิทธิ์ Admin");
      }

      message.textContent = "";
    } catch (error) {
      console.error("Login error:", error);
      message.textContent = error.message;
      message.style.color = "red";
    } finally {
      button.disabled = false;
    }
  });
}


// ========================================
// 3) ตรวจสอบ Session และสิทธิ์ Admin
// สิทธิ์จริงต้องถูกบังคับโดย RLS ใน Supabase ด้วย
// ========================================

async function checkAdmin() {
  const dashboard = document.getElementById("dashboard");
  const loginBox = document.getElementById("loginBox");

  // ฟังก์ชันนี้ใช้เฉพาะหน้า admin.html
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

    const { data: admin, error: adminError } = await db
      .from("admin_users")
      .select("user_id")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (adminError) throw adminError;

    if (!admin) {
      dashboard.hidden = true;
      if (loginBox) loginBox.hidden = false;
      return false;
    }

    if (loginBox) loginBox.hidden = true;
    dashboard.hidden = false;

    await loadStudents();
    return true;

  } catch (error) {
    console.error("Admin verification error:", error);
    dashboard.hidden = true;
    if (loginBox) loginBox.hidden = false;

    const adminMessage = document.getElementById("adminMessage");
    if (adminMessage) {
      adminMessage.textContent = "ตรวจสอบสิทธิ์ไม่สำเร็จ: " + error.message;
      adminMessage.style.color = "red";
    }
    return false;
  }
}


// ========================================
// 4) โหลดข้อมูลนักศึกษามาแสดงใน Dashboard
// ========================================

async function loadStudents() {
  const table = document.getElementById("studentTable");
  const total = document.getElementById("totalStudents");
  const message = document.getElementById("adminMessage");

  if (!table) return;

  table.innerHTML = "<tr><td colspan='8'>กำลังโหลดข้อมูล...</td></tr>";
  if (message) message.textContent = "";

  try {
    // ตรวจสิทธิ์ซ้ำก่อนอ่านข้อมูล
    const { data: sessionData, error: sessionError } =
      await db.auth.getSession();

    if (sessionError) throw sessionError;
    if (!sessionData.session) throw new Error("กรุณาเข้าสู่ระบบใหม่");

    const { data: admin, error: adminError } = await db
      .from("admin_users")
      .select("user_id")
      .eq("user_id", sessionData.session.user.id)
      .maybeSingle();

    if (adminError) throw adminError;
    if (!admin) throw new Error("ไม่มีสิทธิ์เข้าถึงข้อมูล");

    const { data, error } = await db
      .from("registrations")
      .select("id, first_name, last_name, age, department, major, student_id, level, motto")
      .order("id", { ascending: false });

    if (error) throw error;

    total.textContent = data.length;
    table.innerHTML = "";

    if (data.length === 0) {
      table.innerHTML = "<tr><td colspan='8'>ยังไม่มีข้อมูลนักศึกษา</td></tr>";
      return;
    }

    data.forEach((student, index) => {
      const row = document.createElement("tr");
      const values = [
        index + 1,
        `${student.first_name || ""} ${student.last_name || ""}`.trim(),
        student.age ?? "-",
        student.department || "-",
        student.major || "-",
        student.student_id || "-",
        student.level || "-",
        student.motto || "-"
      ];

      values.forEach((value) => {
        const cell = document.createElement("td");
        // ใช้ textContent เพื่อไม่ให้ข้อความจากฟอร์มถูกแปลเป็น HTML
        cell.textContent = String(value);
        row.appendChild(cell);
      });

      table.appendChild(row);
    });

  } catch (error) {
    console.error("Load students error:", error);
    table.innerHTML = "<tr><td colspan='8'>ไม่สามารถโหลดข้อมูลได้</td></tr>";

    if (message) {
      message.textContent = "เกิดข้อผิดพลาด: " + error.message;
      message.style.color = "red";
    }
  }
}


// ========================================
// 5) ปุ่มรีเฟรชข้อมูล
// ========================================

const refreshButton = document.getElementById("refreshBtn");

if (refreshButton) {
  refreshButton.addEventListener("click", async () => {
    refreshButton.disabled = true;
    await loadStudents();
    refreshButton.disabled = false;
  });
}


// ========================================
// 6) ออกจากระบบ
// ========================================

const logoutButton = document.getElementById("logoutBtn");

if (logoutButton) {
  logoutButton.addEventListener("click", async () => {
    logoutButton.disabled = true;

    const { error } = await db.auth.signOut();

    if (error) {
      alert("ออกจากระบบไม่สำเร็จ: " + error.message);
      logoutButton.disabled = false;
      return;
    }

    window.location.reload();
  });
}


// ========================================
// 7) เมื่อเปิดหน้า admin ให้ตรวจ Session ทันที
// ========================================

if (document.getElementById("dashboard")) {
  checkAdmin();
}
