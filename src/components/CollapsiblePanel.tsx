import { useState, type ReactNode } from 'react';

interface CollapsiblePanelProps {
  tag: string;
  id: string;
  className?: string;
  defaultCollapsed?: boolean;
  children: ReactNode;
}

export function CollapsiblePanel({
  tag,
  id,
  className = '',
  defaultCollapsed = false,
  children,
}: CollapsiblePanelProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <section
      className={`panel ${className} ${collapsed ? 'panel--collapsed' : ''}`.trim()}
    >
      <button
        type="button"
        className="panel__header"
        onClick={() => setCollapsed((value) => !value)}
        aria-expanded={!collapsed}
        aria-controls={`panel-body-${id}`}
      >
        <span className="panel__tag">{tag}</span>
        <span className="panel__header-right">
          <span className="panel__id">{id}</span>
          <span className="panel__chevron" aria-hidden="true">
            {collapsed ? '▸' : '▾'}
          </span>
        </span>
      </button>

      {!collapsed && (
        <div className="panel__body" id={`panel-body-${id}`}>
          {children}
        </div>
      )}
    </section>
  );
}
