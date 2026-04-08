namespace examxy.Application.Abstractions.Identity
{
    public static class IdentityRoles
    {
        public const string Admin = "Admin";
        public const string Teacher = "Teacher";
        public const string Student = "Student";
        public const string LegacyUser = "User";

        private static readonly string[] PriorityOrderedRoles =
        {
            Admin,
            Teacher,
            Student
        };

        public static IReadOnlyCollection<string> SupportedRoles => PriorityOrderedRoles;

        public static string GetPrimaryRole(IEnumerable<string> roles)
        {
            var roleSet = new HashSet<string>(roles, StringComparer.OrdinalIgnoreCase);

            foreach (var role in PriorityOrderedRoles)
            {
                if (roleSet.Contains(role))
                {
                    return role;
                }
            }

            return string.Empty;
        }
    }
}
