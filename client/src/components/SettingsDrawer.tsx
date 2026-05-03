import { UserButton } from "@clerk/react";
import Button from "./Button";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function SettingsDrawer({ open, onClose }: Props) {
  return (
    <div className={`drawer ${open ? "drawer--open" : ""}`} onClick={onClose}>
      <div className="drawer__panel" onClick={e => e.stopPropagation()}>
        <div className="drawer__header">
          <span className="drawer__title">Settings</span>
          <Button variant="ghost" size="sm" icon onClick={onClose}>✕</Button>
        </div>
        <div className="drawer__body">
          <div className="settings-row">
            <span>Account</span>
            <UserButton />
          </div>
        </div>
      </div>
    </div>
  );
}
