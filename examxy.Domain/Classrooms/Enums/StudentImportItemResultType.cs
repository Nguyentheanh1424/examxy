namespace examxy.Domain.Classrooms
{
    public enum StudentImportItemResultType
    {
        CreatedAccount = 1,
        SentInvite = 2,
        SkippedExisting = 3,
        RejectedDuplicate = 4,
        RejectedWrongRole = 5
    }
}