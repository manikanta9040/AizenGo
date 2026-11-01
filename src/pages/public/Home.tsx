import { useEffect } from 'react';
import { HeroSection } from '../../components/home/HeroSection';
import { ConferenceSearchSection } from '../../components/home/ConferenceSearchSection';
import { ConferenceCategories } from '../../components/home/ConferenceCategories';
import { WhyAizenGo } from '../../components/home/WhyAizenGo';
import { StatisticsSection } from '../../components/home/StatisticsSection';
import { HowItWorks } from '../../components/home/HowItWorks';
import { CTASection } from '../../components/home/CTASection';
import { NewsletterSection } from '../../components/home/NewsletterSection';

export default function Home() {
  useEffect(() => {
    document.title = 'AizenGo | Global Conferences & Events';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        'content',
        'AizenGo connects researchers, professionals, academics and industry leaders through global conferences and knowledge-sharing events.'
      );
    }
  }, []);

  return (
    <div className="az-home-page">
      <HeroSection />
      <ConferenceSearchSection />
      <ConferenceCategories />
      <WhyAizenGo />
      <StatisticsSection />
      <HowItWorks />
      <CTASection />
      <NewsletterSection />
    </div>
  );
}
