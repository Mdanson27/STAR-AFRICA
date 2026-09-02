'use client';

import { Button } from '@/components/ui/button';
import { StarAfricaLogo } from '@/components/star-africa-logo';

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="not-found"><StarAfricaLogo size="medium" /><p>RECOVERABLE ERROR</p><h1>We couldn’t open this workspace.</h1><span>Your records were not changed. Try loading the module again.</span><Button onClick={reset}>Try again</Button></main>;
}
