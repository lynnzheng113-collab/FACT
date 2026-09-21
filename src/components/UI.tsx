import type { ReactNode } from "react";
import { Check, X } from "lucide-react";
import { copy } from "../constants/copy";

export type Tone = "success" | "warning" | "danger" | "info" | "neutral";

export function Button({
  children,
  onClick,
  variant = "secondary",
  icon,
  disabled = false,
  className = "",
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "quiet" | "danger";
  icon?: ReactNode;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      className={`button button--${variant} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}

export function IconButton({
  label,
  children,
  onClick,
  active = false,
  disabled = false,
}: {
  label: string;
  children: ReactNode;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={`icon-button ${active ? "is-active" : ""}`}
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: Tone }) {
  return <span className={`badge badge--${tone}`}>{children}</span>;
}

export function PriorityBadge({ priority }: { priority: "P0" | "P1" }) {
  return (
    <span className={`priority priority--${priority.toLowerCase()}`}>
      {priority === "P0" ? copy.common.priorityP0 : copy.common.priorityP1}
    </span>
  );
}

export function PageHeader({
  title,
  subtitle,
  ids,
  priorities = ["P0", "P1"],
  actions,
}: {
  title: string;
  subtitle: string;
  ids: string;
  priorities?: Array<"P0" | "P1">;
  actions?: ReactNode;
}) {
  return (
    <header className="page-header">
      <div className="page-header__copy">
        <div className="page-header__eyebrow">
          {priorities.map((priority) => (
            <PriorityBadge key={priority} priority={priority} />
          ))}
          <span className="feature-ids">{ids}</span>
        </div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </header>
  );
}

export function Panel({
  title,
  subtitle,
  actions,
  children,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      {(title || actions) && (
        <div className="panel__header">
          <div>
            {title && <h2>{title}</h2>}
            {subtitle && <p>{subtitle}</p>}
          </div>
          {actions && <div className="panel__actions">{actions}</div>}
        </div>
      )}
      <div className="panel__body">{children}</div>
    </section>
  );
}

export function Progress({ value, tone = "info", showValue = true }: { value: number; tone?: Tone; showValue?: boolean }) {
  return (
    <div className="progress-wrap">
      <div className="progress" aria-hidden="true">
        <span className={`progress__bar progress__bar--${tone}`} style={{ width: `${value}%` }} />
      </div>
      {showValue && <span className="progress__value">{value}%</span>}
    </div>
  );
}

export function Tabs({
  items,
  active,
  onChange,
}: {
  items: readonly string[];
  active: string;
  onChange: (item: string) => void;
}) {
  return (
    <div className="tabs" role="tablist">
      {items.map((item) => (
        <button
          type="button"
          role="tab"
          aria-selected={active === item}
          className={active === item ? "is-active" : ""}
          key={item}
          onClick={() => onChange(item)}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

export function Field({
  label,
  children,
  hint,
  required = false,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
  required?: boolean;
}) {
  return (
    <div className="field">
      <span className="field__label">
        {label}
        {required && <Badge tone="danger">{copy.review.required}</Badge>}
      </span>
      {children}
      {hint && <span className="field__hint">{hint}</span>}
    </div>
  );
}

export function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="toggle-row">
      <button
        type="button"
        className={`toggle ${checked ? "is-on" : ""}`}
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={onChange}
      >
        <span />
      </button>
      <span>{label}</span>
    </label>
  );
}

export function CheckRow({
  label,
  checked,
  onChange,
  disabled = false,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <label className={`check-row ${disabled ? "is-disabled" : ""}`}>
      <button
        type="button"
        className={`checkbox ${checked ? "is-checked" : ""}`}
        role="checkbox"
        aria-checked={checked}
        aria-label={label}
        onClick={onChange}
        disabled={disabled}
      >
        {checked && <Check size={14} aria-hidden="true" />}
      </button>
      <span>{label}</span>
    </label>
  );
}

export function Modal({
  open,
  title,
  children,
  footer,
  onClose,
  wide = false,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="overlay" role="presentation" onMouseDown={onClose}>
      <section
        className={`modal ${wide ? "modal--wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="modal__header">
          <h2>{title}</h2>
          <IconButton label={copy.common.close} onClick={onClose}>
            <X size={18} />
          </IconButton>
        </header>
        <div className="modal__body">{children}</div>
        {footer && <footer className="modal__footer">{footer}</footer>}
      </section>
    </div>
  );
}

export function Drawer({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="overlay overlay--drawer" role="presentation" onMouseDown={onClose}>
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}>
        <header className="drawer__header">
          <h2>{title}</h2>
          <IconButton label={copy.common.close} onClick={onClose}>
            <X size={18} />
          </IconButton>
        </header>
        <div className="drawer__body">{children}</div>
      </aside>
    </div>
  );
}

export function Toast({ message, tone = "success", onClose }: { message: string | null; tone?: Tone; onClose: () => void }) {
  if (!message) return null;
  return (
    <div className={`toast toast--${tone}`} role="status">
      <Check size={18} aria-hidden="true" />
      <span>{message}</span>
      <IconButton label={copy.common.close} onClick={onClose}>
        <X size={16} />
      </IconButton>
    </div>
  );
}

export function Pagination() {
  return (
    <div className="pagination">
      <span>{copy.common.rowsPerPage}</span>
      <span className="pagination__count">{copy.common.paginationRange}</span>
      <span>{copy.common.paginationTotal}</span>
    </div>
  );
}
