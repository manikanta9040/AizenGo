import { Link } from 'react-router-dom';
import {
  Cpu,
  Bot,
  HeartPulse,
  Cog,
  Atom,
  Briefcase,
  GraduationCap,
  BarChart3,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react';
import type { CategoryItem } from '../../types/content';
import { useBackendData } from '../../hooks/useBackendData';
import { Badge } from '../common/Badge';

const iconMap: Record<CategoryItem['iconName'], LucideIcon> = {
  Cpu,
  Bot,
  HeartPulse,
  Cog,
  Atom,
  Briefcase,
  GraduationCap,
  BarChart3,
};

export function ConferenceCategories() {
  const categories = useBackendData<CategoryItem>('categories');
  return (
    <section className="az-section az-categories-section" aria-labelledby="categories-heading">
      <div className="az-container">
        <div className="az-section-header az-section-header--center">
          <Badge variant="primary">Domains & Disciplines</Badge>
          <h2 id="categories-heading" className="az-h2" style={{ marginTop: 'var(--az-space-2)' }}>
            Explore Conference Categories
          </h2>
          <p className="az-body" style={{ color: 'var(--az-muted)', maxWidth: '38rem', marginInline: 'auto' }}>
            Find specialized research symposiums, technical summits, and academic tracks tailored to your field.
          </p>
        </div>

        <div className="az-categories-grid">
          {categories.map((cat) => {
            const Icon = iconMap[cat.iconName] || Cpu;
            return (
              <Link
                key={cat.id}
                to={`/conferences?category=${encodeURIComponent(cat.name)}`}
                className="az-category-card"
              >
                <div className="az-category-card__icon-wrap">
                  <Icon size={28} className="az-category-card__icon" aria-hidden="true" />
                </div>
                <h3 className="az-category-card__name">{cat.name}</h3>
                <p className="az-category-card__count az-caption">
                  {cat.conferenceCount} Conferences
                </p>
                <span className="az-category-card__arrow" aria-hidden="true">
                  <ArrowRight size={14} />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default ConferenceCategories;
