import { StarAfricaLogo } from '@/components/star-africa-logo';

export default function Loading() {
  return <main className="brand-loading" aria-busy="true" aria-label="Loading Star Africa workspace"><StarAfricaLogo size="large" /><strong>STAR AFRICA OS</strong><span>Loading workspace...</span><i /></main>;
}
