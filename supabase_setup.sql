-- รันใน Supabase > SQL Editor
-- ใช้หลังจากมีตาราง public.registrations อยู่แล้ว
-- ตาราง registrations ต้องมีคอลัมน์:
-- id, first_name, last_name, age, department, major,
-- student_id, level, motto

-- 1) สร้างตารางรายชื่อผู้ดูแลระบบ (ถ้ายังไม่มี)
CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2) เปิด RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- 3) ลบ policy ที่ใช้ชื่อเดียวกันก่อนสร้างใหม่
DROP POLICY IF EXISTS "Admin can read own admin record"
ON public.admin_users;

DROP POLICY IF EXISTS "Public can submit registration"
ON public.registrations;

DROP POLICY IF EXISTS "Admins can read registrations"
ON public.registrations;

-- 4) ผู้ใช้ที่ล็อกอินอ่านได้เฉพาะแถว Admin ของตัวเอง
CREATE POLICY "Admin can read own admin record"
ON public.admin_users
FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid()));

-- 5) อนุญาตให้ผู้เยี่ยมชมส่งแบบฟอร์มลงทะเบียนได้
CREATE POLICY "Public can submit registration"
ON public.registrations
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 6) อนุญาตให้ Admin อ่านข้อมูลนักศึกษาเท่านั้น
CREATE POLICY "Admins can read registrations"
ON public.registrations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.admin_users AS a
    WHERE a.user_id = (SELECT auth.uid())
  )
);

-- 7) ให้สิทธิ์ระดับตารางตามการใช้งาน
GRANT SELECT ON public.admin_users TO authenticated;
GRANT INSERT ON public.registrations TO anon, authenticated;
GRANT SELECT ON public.registrations TO authenticated;

-- หมายเหตุ:
-- อย่าเพิ่ม policy SELECT สำหรับ anon
-- อย่าใส่ service_role/secret key ใน app.js
-- ถ้ามี policy เก่าที่เปิด SELECT ให้ anon หรือทุกคน
-- ให้ตรวจสอบและลบ/ปิด policy เก่านั้นด้วย
