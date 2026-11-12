ชุดระบบลงทะเบียนนักศึกษา + Admin Dashboard

ไฟล์ในชุด:
1. index.html          หน้าลงทะเบียนนักศึกษา
2. admin.html          หน้าเข้าสู่ระบบและจัดการข้อมูล
3. app.js              JavaScript เชื่อม Supabase
4. style.css           รูปแบบเว็บไซต์
5. supabase_setup.sql  คำสั่งตั้งค่า RLS และสิทธิ์

วิธีนำไฟล์ไปใส่ใน VS Code:
1. แตกไฟล์ ZIP
2. เปิดโฟลเดอร์โปรเจกต์เดิมใน VS Code
3. สำรองไฟล์เดิมไว้ก่อน
4. นำ index.html, admin.html, app.js, style.css ไปวางทับไฟล์ชื่อเดียวกัน
5. เปิด Supabase > SQL Editor แล้วตรวจสอบ/รัน supabase_setup.sql
6. ตรวจสอบว่าตาราง registrations มีคอลัมน์ตามที่ระบุใน SQL และใน app.js
7. สร้างบัญชี Admin ที่ Authentication > Users
8. นำ UID ของบัญชี Admin ไปเพิ่มใน public.admin_users ด้วยคำสั่ง:
   INSERT INTO public.admin_users (user_id)
   VALUES ('ใส่-UID-จริง')
   ON CONFLICT (user_id) DO NOTHING;
9. ทดสอบ index.html ลงทะเบียน แล้วเปิด admin.html เข้าระบบ

สำคัญ:
- ใน app.js ใช้ Project URL และ Publishable key ของโปรเจกต์นี้ตามที่ผู้ใช้ให้มา
- ห้ามใช้ service_role key หรือ secret key ในเว็บไซต์
- RLS เป็นตัวบังคับสิทธิ์จริง ไม่ใช่แค่การซ่อนหน้าเว็บ
- SQL นี้ตั้ง policy สำหรับ insert และ select เท่านั้น ยังไม่มี update/delete
- หากมี policy เก่าเปิดอ่านข้อมูล registrations ให้ทุกคน ต้องตรวจสอบและลบ policy เก่านั้น
