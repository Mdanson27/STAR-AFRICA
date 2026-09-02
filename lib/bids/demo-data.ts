import type { BidStage } from './domain';

export type DemoBid = {
  id: string; reference: string; title: string; organization: string; description: string; category: string; location: string; source: string; owner: string;
  deadline: string; valueMinor: string; currency: string; stage: BidStage; priority: 'Critical' | 'High' | 'Medium' | 'Low'; progress: number; qualificationScore: number;
  watched: boolean; spendMinor: string; readiness: number; published: string; expectedAward: string; procurementMethod: string;
};

export const demoBids: DemoBid[] = [
  { id:'moh-lab-2026', reference:'MOH/SUPLS/26/114', title:'National laboratory equipment framework', organization:'Ministry of Health', description:'Supply, installation and commissioning of laboratory equipment for regional referral hospitals.', category:'Laboratory equipment', location:'Kampala & regional hospitals', source:'Manual', owner:'Irene Adoch', deadline:'2026-09-05T11:00:00+03:00', valueMinor:'152000000000', currency:'UGX', stage:'ready_for_submission', priority:'Critical', progress:91, qualificationScore:86, watched:true, spendMinor:'1240000000', readiness:88, published:'2026-08-02', expectedAward:'2026-10-28', procurementMethod:'Open domestic bidding' },
  { id:'kcca-drainage-2026', reference:'KCCA/WRKS/26/044', title:'Drainage rehabilitation — Lot 2', organization:'Kampala Capital City Authority', description:'Rehabilitation of priority drainage channels and associated civil works.', category:'Construction', location:'Kampala', source:'CSV Import', owner:'Irene Adoch', deadline:'2026-09-11T10:00:00+03:00', valueMinor:'286000000000', currency:'UGX', stage:'preparing', priority:'High', progress:64, qualificationScore:78, watched:true, spendMinor:'880000000', readiness:59, published:'2026-08-12', expectedAward:'2026-11-15', procurementMethod:'Open domestic bidding' },
  { id:'unicef-furniture-2026', reference:'UNICEF/UGA/2026/881', title:'School furniture supply framework', organization:'UNICEF Uganda', description:'Manufacture and delivery of durable classroom desks and teacher furniture.', category:'Furniture', location:'Northern Uganda', source:'Demo Provider', owner:'Irene Adoch', deadline:'2026-09-19T15:00:00+03:00', valueMinor:'94000000000', currency:'UGX', stage:'qualification', priority:'Medium', progress:31, qualificationScore:67, watched:false, spendMinor:'190000000', readiness:28, published:'2026-08-20', expectedAward:'2026-11-30', procurementMethod:'Request for proposal' },
  { id:'nwsc-refurb-2026', reference:'NWSC/CONS/26/209', title:'Regional office refurbishment', organization:'National Water & Sewerage Corporation', description:'Interior refurbishment, furniture and electrical works for regional offices.', category:'Construction', location:'Mbarara', source:'Manual', owner:'Irene Adoch', deadline:'2026-09-26T11:00:00+03:00', valueMinor:'68000000000', currency:'UGX', stage:'reviewing', priority:'Medium', progress:18, qualificationScore:54, watched:false, spendMinor:'75000000', readiness:14, published:'2026-08-26', expectedAward:'2026-12-08', procurementMethod:'Open domestic bidding' },
  { id:'jms-medical-2026', reference:'JMS/MED/2026/031', title:'Essential medical supplies distribution', organization:'Joint Medical Store', description:'Supply and distribution of consumable medical products to partner health facilities.', category:'Medical supplies', location:'Uganda', source:'CSV Import', owner:'Irene Adoch', deadline:'2026-08-27T14:00:00+03:00', valueMinor:'211000000000', currency:'UGX', stage:'awaiting_result', priority:'High', progress:100, qualificationScore:83, watched:true, spendMinor:'970000000', readiness:100, published:'2026-07-01', expectedAward:'2026-09-18', procurementMethod:'Open international bidding' },
  { id:'muk-library-2026', reference:'MAK/SUPLS/25/192', title:'Library shelving and study furniture', organization:'Makerere University', description:'Supply and installation of shelving and collaborative study furniture.', category:'Furniture', location:'Kampala', source:'Manual', owner:'Irene Adoch', deadline:'2026-06-18T10:00:00+03:00', valueMinor:'43000000000', currency:'UGX', stage:'won', priority:'Medium', progress:100, qualificationScore:82, watched:false, spendMinor:'460000000', readiness:100, published:'2026-05-05', expectedAward:'2026-08-12', procurementMethod:'Open domestic bidding' },
  { id:'gulu-works-2026', reference:'GCC/WRKS/25-26/072', title:'Municipal market maintenance works', organization:'Gulu City Council', description:'Planned maintenance and safety upgrades at two municipal markets.', category:'Construction', location:'Gulu', source:'Manual', owner:'Irene Adoch', deadline:'2026-05-29T11:00:00+03:00', valueMinor:'57000000000', currency:'UGX', stage:'lost', priority:'Low', progress:100, qualificationScore:73, watched:false, spendMinor:'520000000', readiness:100, published:'2026-04-18', expectedAward:'2026-07-20', procurementMethod:'Open domestic bidding' },
  { id:'unra-ppe-2026', reference:'UNRA/SUPLS/25-26/318', title:'Protective equipment supply', organization:'Uganda National Roads Authority', description:'Supply of standards-compliant PPE for road maintenance teams.', category:'General supply', location:'Uganda', source:'Demo Provider', owner:'Irene Adoch', deadline:'2026-04-14T11:00:00+03:00', valueMinor:'31500000000', currency:'UGX', stage:'archived', priority:'Low', progress:42, qualificationScore:46, watched:false, spendMinor:'120000000', readiness:37, published:'2026-03-08', expectedAward:'2026-06-22', procurementMethod:'Request for quotations' },
];

export const requirements = [
  { name:'Certificate of incorporation', category:'Company documentation', owner:'Irene Adoch', due:'03 Sep', status:'Verified', mandatory:true },
  { name:'URA tax clearance certificate', category:'Tax', owner:'Finance', due:'03 Sep', status:'Verified', mandatory:true },
  { name:'NSSF clearance', category:'Legal', owner:'HR', due:'03 Sep', status:'Ready for Review', mandatory:true },
  { name:'Manufacturer authorisations', category:'Technical', owner:'Technical Lead', due:'04 Sep', status:'In Progress', mandatory:true },
  { name:'Past performance references', category:'Experience', owner:'Bid Lead', due:'04 Sep', status:'Verified', mandatory:true },
  { name:'Signed bid form', category:'Submission', owner:'Director', due:'05 Sep', status:'Not Started', mandatory:true },
];

export const pricingLines = [
  { description:'Automated chemistry analyser', unit:'unit', quantity:8, unitCost:142000000, markup:18, selling:167560000 },
  { description:'Haematology analyser', unit:'unit', quantity:12, unitCost:89000000, markup:16, selling:103240000 },
  { description:'Installation & commissioning', unit:'site', quantity:8, unitCost:18500000, markup:22, selling:22570000 },
  { description:'Operator training', unit:'session', quantity:16, unitCost:4200000, markup:20, selling:5040000 },
];

export const activities = [
  ['02 Sep · 09:42','Pricing updated','Peter Mugisha','Financial proposal v6 totals recalculated'],
  ['02 Sep · 08:18','Requirement verified','Irene Adoch','URA tax clearance linked and verified'],
  ['01 Sep · 16:30','Final review requested','Irene Adoch','Director and Finance notified'],
  ['31 Aug · 14:06','Addendum received','Irene Adoch','Addendum 02 extends delivery schedule'],
];

export function formatMoney(minor: string | number, currency = 'UGX') {
  return new Intl.NumberFormat('en-UG', { style:'currency', currency, maximumFractionDigits:0 }).format(Number(minor) / 100);
}

export function labelStage(stage: string) {
  return stage.split('_').map((word) => word[0]?.toUpperCase() + word.slice(1)).join(' ');
}
