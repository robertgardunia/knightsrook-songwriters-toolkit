import { useState } from "react";
import { Show, useClerk, useUser } from "@clerk/react";
import Button from "./Button";

interface Props {
  open: boolean;
  onClose: () => void;
}

function Toggle({ label, defaultOn = false }: { label: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="settings-row">
      <span>{label}</span>
      <button
        className={`toggle-btn${on ? " toggle-btn--on" : ""}`}
        onClick={() => setOn(o => !o)}
        aria-pressed={on}
      />
    </div>
  );
}

function AccountSection() {
  const { openUserProfile, openSignIn } = useClerk();
  const { user } = useUser();
  return (
    <div className="settings-account">
      <Show when="signed-in">
        <div className="settings-account__profile">
          <img src={user?.imageUrl} alt="" className="settings-account__avatar" />
          <div className="settings-account__info">
            <span className="settings-account__name">{user?.fullName ?? user?.username}</span>
            <span className="settings-account__email">{user?.primaryEmailAddress?.emailAddress}</span>
          </div>
        </div>
        <Button size="sm" onClick={() => openUserProfile()}>Manage Account</Button>
      </Show>
      <Show when="signed-out">
        <Button onClick={() => openSignIn()}>Sign In</Button>
      </Show>
    </div>
  );
}

export default function SettingsDrawer({ open, onClose }: Props) {
  return (
    <div className={`drawer ${open ? "drawer--open" : ""}`} onClick={onClose}>
      <div className="drawer__panel" onClick={e => e.stopPropagation()}>
        <div className="drawer__header">
          <span className="drawer__title">Settings</span>
          <Button variant="ghost" size="sm" icon onClick={onClose}>✕</Button>
        </div>
        <div className="drawer__body settings-body">
          <p className="settings-section-label">Account</p>
          <AccountSection />

          <p className="settings-section-label">Editing</p>
          <Toggle label="Auto-save lyrics" defaultOn />
          <Toggle label="Spell-check" defaultOn />

          <p className="settings-section-label">Display</p>
          <Toggle label="Compact track list" />
          <Toggle label="Show track numbers" defaultOn />

          <p className="settings-section-label">Device</p>
          <Toggle label="Haptic feedback" defaultOn />
          <Toggle label="Keep screen on" />
        </div>
      </div>
    </div>
  );
}
