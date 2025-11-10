interface PostCardProps {
  id: number;
  title: string;
  content: string;
  author: string;
  createdAt: string;
}

export default function PostCard({ id, title, content, author, createdAt }: PostCardProps) {
  return (
    <div className="card bg-base-100 shadow-md">
      <div className="card-body">
        <h2 className="card-title">{title}</h2>
        <p>{content}</p>
        <div className="card-actions justify-between">
          <span className="text-sm text-base-content/60">작성자: {author}</span>
          <span className="text-sm text-base-content/60">{createdAt}</span>
        </div>
      </div>
    </div>
  );
}