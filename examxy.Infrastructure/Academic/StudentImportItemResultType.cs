namespace examxy.Infrastructure.Academic
{
    public enum StudentImportItemResultType
    {
        CreatedAccount = 1,
        SentInvite = 2,
        SkippedExisting = 3,
        RejectedWrongRole = 4,
        RejectedDuplicate = 5
    }
}
