// ------------------------------
//  Report 관련 타입 정의
// ------------------------------

export type ReportStatus =
  | "WAITING"
  | "APPROVED"
  | "REJECTED";

export type ReportCategory =
  | "ABUSE"
  | "SCAM"
  | "INAPPROPRIATE"
  | "OTHER";

export interface AdminReport {
  id: number;
  targetMemberId: number;
  reportedMsgContent: string;
  status: ReportStatus;
  category: ReportCategory;
  reportedReason: string;
  createdAt: string;
}
