import Link from 'next/link';
import { StarAfricaLogo } from '@/components/star-africa-logo';
import { buttonVariants } from '@/components/ui/button';

export default function NotFound() {
  return <main className="not-found"><StarAfricaLogo size="medium" /><p>STAR AFRICA OS</p><h1>That workspace could not be found.</h1><span>The link may be incomplete or your role may not have access.</span><Link href="/" className={buttonVariants()}>Return to dashboard</Link></main>;
}
