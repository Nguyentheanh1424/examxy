using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;

namespace examxy.Infrastructure.Academic
{
    internal static partial class AcademicCodeFactory
    {
        private const string InviteAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        private const string LowerAlphabet = "abcdefghijkmnopqrstuvwxyz";
        private const string UpperAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ";
        private const string DigitAlphabet = "23456789";

        public static string NormalizeEmail(string email)
        {
            return email.Trim().ToUpperInvariant();
        }

        public static string HashValue(string value)
        {
            var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(value));
            return Convert.ToHexString(bytes);
        }

        public static string GenerateInviteCode(int length = 10)
        {
            return GenerateRandomString(InviteAlphabet, length);
        }

        public static string GenerateClassCode(string name)
        {
            var prefix = SlugCharactersRegex()
                .Replace(name.ToUpperInvariant(), string.Empty);

            if (string.IsNullOrWhiteSpace(prefix))
            {
                prefix = "CLASS";
            }

            prefix = prefix.Length > 6 ? prefix[..6] : prefix;
            return $"{prefix}-{GenerateRandomString(InviteAlphabet, 4)}";
        }

        public static string GenerateTemporaryPassword()
        {
            return string.Concat(
                GenerateRandomString(UpperAlphabet, 4),
                GenerateRandomString(LowerAlphabet, 4),
                GenerateRandomString(DigitAlphabet, 4));
        }

        public static string CreateUserNameSeed(string email, string studentCode = "")
        {
            var localPart = email.Split('@', 2)[0];
            var preferredSeed = string.IsNullOrWhiteSpace(studentCode) ? localPart : studentCode;
            var compact = NonWordCharactersRegex()
                .Replace(preferredSeed.ToLowerInvariant(), string.Empty);

            if (string.IsNullOrWhiteSpace(compact))
            {
                compact = "student";
            }

            return compact.Length <= 20 ? compact : compact[..20];
        }

        private static string GenerateRandomString(string alphabet, int length)
        {
            var chars = new char[length];

            for (var index = 0; index < length; index++)
            {
                chars[index] = alphabet[RandomNumberGenerator.GetInt32(alphabet.Length)];
            }

            return new string(chars);
        }

        [GeneratedRegex("[^A-Z0-9]")]
        private static partial Regex SlugCharactersRegex();

        [GeneratedRegex("[^a-z0-9]")]
        private static partial Regex NonWordCharactersRegex();
    }
}
