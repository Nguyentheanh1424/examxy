namespace examxy.Server.Realtime
{
    internal static class RealtimeGroupNames
    {
        public static string ForUser(string userId) => $"user:{userId}";

        public static string ForClass(Guid classId) => $"class:{classId:N}";
    }
}
