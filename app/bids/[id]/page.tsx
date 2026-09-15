import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { AppShell } from '@/components/app-shell';
import { BidWorkspace } from '@/components/bids/bid-workspace';
import { requireAuthorizedSession } from '@/lib/security/session';
import { demoBids, type DemoBid } from '@/lib/bids/demo-data';
import { getDb } from '@/db';
import { bids } from '@/db/schema';

export const dynamic='force-dynamic';
export async function generateMetadata({params}:{params:Promise<{id:string}>}):Promise<Metadata>{const {id}=await params;const bid=demoBids.find((item)=>item.id===id);return{title:bid?.title??'Bid Workspace',description:bid?`${bid.reference} · ${bid.organization}`:'Bid opportunity workspace'};}

export default async function BidDetailPage({params}:{params:Promise<{id:string}>}) {
  const {id}=await params; const session=await requireAuthorizedSession('bids.view',`/bids/${id}`); let bid=demoBids.find((item)=>item.id===id);
  if(!bid){try{const [record]=await getDb().select().from(bids).where(eq(bids.id,id)).limit(1);if(record)bid={id:record.id,reference:record.reference,title:record.title,organization:record.organization,description:'Newly registered opportunity. Complete qualification and requirements from this workspace.',category:record.category??'General supply',location:'Uganda',source:record.source??'Manual',owner:session.name,deadline:record.closesAt.toISOString(),valueMinor:record.estimatedValueMinor??'0',currency:record.currency,stage:record.status as DemoBid['stage'],priority:'Medium',progress:5,qualificationScore:0,watched:false,spendMinor:'0',readiness:0,published:record.publishedAt?.toISOString().slice(0,10)??'',expectedAward:'',procurementMethod:'Not specified'};}catch{/* The detail is unavailable until local D1 is migrated. */}}
  if(!bid)notFound();
  return <AppShell active="Bids & tenders" user={session}><BidWorkspace bid={bid} permissions={[...session.permissions]} currentUser={session.name}/></AppShell>;
}
