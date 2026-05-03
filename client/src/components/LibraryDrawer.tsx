import Button from "./Button";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function LibraryDrawer({ open, onClose }: Props) {
  return (
    <div className={`drawer ${open ? "drawer--open" : ""}`} onClick={onClose}>
      <div className="drawer__panel" onClick={e => e.stopPropagation()}>
        <div className="drawer__header">
          <span className="drawer__title">Audio Library</span>
          <Button variant="ghost" size="sm" icon onClick={onClose}>✕</Button>
        </div>
        <div className="drawer__body">
          <p className="drawer__empty">No audio files yet.</p>
        </div>
      </div>
    </div>
  );
}
