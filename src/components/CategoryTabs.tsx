import { categories, type CategoryId } from '../data/tools';

type CategoryTabsProps = {
  active: CategoryId;
  onChange: (id: CategoryId) => void;
};

export function CategoryTabs({ active, onChange }: CategoryTabsProps) {
  return (
    <nav className="category-tabs" aria-label="Categorie strumenti">
      {categories.map((cat) => (
        <button
          key={cat.id}
          type="button"
          className={`category-tab${active === cat.id ? ' category-tab--active' : ''}`}
          onClick={() => onChange(cat.id)}
        >
          <span className="category-tab__icon">{cat.icon}</span>
          {cat.label}
        </button>
      ))}
    </nav>
  );
}
