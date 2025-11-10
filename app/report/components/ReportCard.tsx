interface ReportCardProps {
  id: number;
  title: string;
  description: string;
  status: string;
  createdAt: string;
}

export default function ReportCard({ id, title, description, status, createdAt }: ReportCardProps) {
  return (
    <div className="card bg-base-100 shadow-md">
      <div className="card-body">
        <h2 className="card-title">{title}</h2>
        <p>{description}</p>
        <div className="card-actions justify-between">
          <span className="text-sm text-base-content/60">상태: {status}</span>
          <span className="text-sm text-base-content/60">{createdAt}</span>
        </div>
      </div>
    </div>
  );
}