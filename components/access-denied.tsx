import Link from 'next/link';
import { LockKeyhole } from 'lucide-react';

export function AccessDenied({role,position,returnTo}:{role:string;position:string;returnTo:string}){
  return <div className="page-content access-denied-wrap"><section className="access-denied-card"><span><LockKeyhole/></span><p className="eyebrow">PERMISSION CHECK</p><h1>Access restricted</h1><p>Your registered position does not have permission to view this workspace.</p><dl><div><dt>Position</dt><dd>{position}</dd></div><div><dt>System role</dt><dd>{role.replaceAll('_',' ')}</dd></div></dl><Link href={returnTo}>Return to your workspace</Link></section></div>;
}
