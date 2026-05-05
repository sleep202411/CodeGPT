-- 指定管理员账号（毕业设计演示用）
-- 如需更换管理员邮箱，修改下方 WHERE 条件。

UPDATE public.profiles
SET user_role = '管理员', updated_at = now()
WHERE lower(user_email) = lower('3247716708@qq.com');
