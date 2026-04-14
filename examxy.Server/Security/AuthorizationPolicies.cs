namespace examxy.Server.Security
{
    public static class AuthorizationPolicies
    {
        public const string TeacherOnly = "teacher_only";
        public const string StudentOnly = "student_only";
        public const string AdminOnly = "admin_only";
        public const string InternalAdminSecret = "internal_admin_secret";
    }
}
