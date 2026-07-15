import Link from "next/link";

export function StatusPanel({ title, message }: { title: string; message: string }) {
  return (
    <div className="status-panel">
      <p className="eyebrow">The projector paused</p>
      <h1>{title}</h1>
      <p>{message}</p>
      <Link className="button button-primary" href="/">Return home</Link>
    </div>
  );
}
