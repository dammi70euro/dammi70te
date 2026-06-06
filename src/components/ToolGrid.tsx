import { categories, type CategoryId } from '../data/tools';

type ToolGridProps = {
  categoryId: CategoryId;
  embedMode: boolean;
  onOpenTool: (title: string, src: string) => void;
};

export function ToolGrid({ categoryId, embedMode, onOpenTool }: ToolGridProps) {
  const category = categories.find((c) => c.id === categoryId);

  if (!category) return null;

  if (category.isTikTok) {
    return (
      <div className="tiktok-panel">
        <div className="tiktok-panel__frame-wrap">
          <iframe
            src="https://www.tiktok.com/embed/v2/ZNRBYj5sB"
            title="TikTok embed"
            className="tiktok-panel__iframe"
            allow="encrypted-media; autoplay; clipboard-write;"
          />
        </div>
        <a
          className="tool-btn tool-btn--external"
          href="https://vm.tiktok.com/ZNRBYj5sB/"
          target="_blank"
          rel="noreferrer"
        >
          📱 Apri video TikTok
        </a>
      </div>
    );
  }

  return (
    <div className="tool-grid">
      {category.items.map((item) => {
        const href = item.href ?? item.page;
        if (!href) return null;

        if (item.href) {
          return (
            <a
              key={item.label}
              className="tool-btn tool-btn--external"
              href={item.href}
              target="_blank"
              rel="noreferrer"
            >
              {item.label}
            </a>
          );
        }

        return (
          <button
            key={item.label}
            type="button"
            className="tool-btn"
            onClick={() => {
              if (embedMode) {
                onOpenTool(item.label, item.page!);
              } else {
                window.location.href = item.page!;
              }
            }}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
