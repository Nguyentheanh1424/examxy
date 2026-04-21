namespace examxy.Domain.Assessments
{
    public enum AssessmentScanSubmissionStatus
    {
        Received = 1,
        AutoGraded = 2,
        NeedsReview = 3,
        Finalized = 4,
        Rejected = 5
    }
}
