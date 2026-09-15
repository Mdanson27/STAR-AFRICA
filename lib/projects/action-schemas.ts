import { z } from 'zod';

const requiredText = (label: string) => z.string().trim().min(1, `${label} is required.`);
const optionalText = z.string().trim().optional().default('');
const optionalDate = z.string().trim().optional().default('');
const amount = z.coerce.number().nonnegative();
const positive = z.coerce.number().positive();
const checkbox = z.preprocess((value) => value === true || value === 'true' || value === 'on', z.boolean());

export const progressSchema = z.object({
  currentProgress: z.coerce.number().min(0).max(100), newProgress: z.coerce.number().min(0).max(100),
  stage: requiredText('Stage'), progressDate: requiredText('Progress date'), workCompleted: requiredText('Work completed'),
  reason: requiredText('Reason for change'), comment: requiredText('Comment'), confirmRegression: checkbox.default(false),
});
export const milestoneSchema = z.object({
  name: requiredText('Milestone name'), description: requiredText('Description'), stage: requiredText('Project stage'),
  responsiblePerson: requiredText('Responsible person'), plannedStartDate: requiredText('Planned start date'), dueDate: requiredText('Due date'),
  weight: z.coerce.number().min(0).max(100), priority: z.enum(['low','normal','high','critical']), dependency: optionalText,
  deliverable: requiredText('Deliverable'), evidenceRequired: checkbox.default(false), approvalRequired: checkbox.default(false), notes: optionalText,
});
export const taskSchema = z.object({
  title: requiredText('Task name'), description: requiredText('Description'), assignedEmployee: requiredText('Assigned employee'),
  stage: requiredText('Project stage'), relatedMilestone: optionalText, startDate: requiredText('Start date'), dueDate: requiredText('Due date'),
  priority: z.enum(['low','normal','high','critical']), estimatedEffort: optionalText, dependencies: optionalText,
  checklist: optionalText, notes: optionalText,
});
export const siteUpdateSchema = z.object({
  reportDate: requiredText('Report date'), location: requiredText('Site/location'), reportedBy: requiredText('Reported by'),
  workCompleted: requiredText('Work completed today'), workInProgress: requiredText('Work currently in progress'),
  workersOnSite: z.coerce.number().int().nonnegative(), tradesPresent: optionalText, hoursWorked: z.coerce.number().nonnegative().default(0),
  materialsReceived: optionalText, materialsUsed: optionalText, materialShortages: optionalText, equipmentUsed: optionalText,
  equipmentUnavailable: optionalText, hadDelays: checkbox.default(false), delayReason: optionalText, delayImpact: optionalText,
  weather: optionalText, safetyObservations: optionalText, incidentOccurred: checkbox.default(false), incidentDetails: optionalText,
  clientRepresentative: optionalText, engineer: optionalText, consultant: optionalText, otherVisitors: optionalText,
  instructions: optionalText, notes: optionalText,
});
export const materialRequestSchema = z.object({
  material: requiredText('Material'), specification: requiredText('Description/specification'), unit: requiredText('Unit'),
  quantity: positive, availableQuantity: amount, requiredDate: requiredText('Required date'), activity: requiredText('Project activity'),
  deliveryLocation: requiredText('Delivery location'), priority: z.enum(['low','normal','high','critical']), preferredSupplier: optionalText,
  estimatedUnitCost: amount.default(0), purpose: requiredText('Reason/purpose'), notes: optionalText,
});
export const materialUsageSchema = z.object({
  material: requiredText('Material'), quantityIssued: amount, quantityUsed: amount, quantityReturned: amount,
  date: requiredText('Date'), activity: requiredText('Activity'), issuedBy: requiredText('Issued by'), receivedBy: requiredText('Received by'), notes: optionalText,
}).refine((value)=>value.quantityUsed <= value.quantityIssued,{message:'Quantity used cannot exceed quantity issued.',path:['quantityUsed']});
export const expenseSchema = z.object({
  date: requiredText('Expense date'), category: requiredText('Expense category'), payee: requiredText('Supplier/payee'),
  description: requiredText('Description'), amount, tax: amount.default(0), paymentMethod: requiredText('Payment method'),
  referenceNumber: requiredText('Reference number'), activity: requiredText('Related project activity'), relatedPurchase: optionalText,
  recordedBy: requiredText('Recorded by'), notes: optionalText,
});
export const budgetLineSchema = z.object({
  category: requiredText('Category'), subcategory: optionalText, description: requiredText('Description'), quantity: positive,
  unit: requiredText('Unit'), unitCost: amount, budgetAmount: amount, contingency: amount.default(0), notes: optionalText,
});
export const variationSchema = z.object({
  number: requiredText('Variation number'), title: requiredText('Title'), description: requiredText('Description'), reason: requiredText('Reason'),
  requestedBy: z.enum(['client','consultant','star_africa','other']), affectedScope: requiredText('Affected scope'), originalValue: amount,
  costImpact: z.coerce.number(), revisedValue: amount, timeImpact: requiredText('Time impact'), additionalDays: z.coerce.number().int(),
  dateRequested: requiredText('Date requested'), decisionDate: requiredText('Required decision date'), notes: optionalText,
});
export const riskSchema = z.object({
  title: requiredText('Risk title'), description: requiredText('Description'), category: z.enum(['financial','schedule','technical','procurement','safety','client','legal','weather','other']),
  likelihood: z.coerce.number().int().min(1).max(5), impact: z.coerce.number().int().min(1).max(5), owner: requiredText('Owner'),
  mitigation: requiredText('Mitigation plan'), contingency: requiredText('Contingency'), targetDate: requiredText('Target resolution date'),
});
export const issueSchema = z.object({
  title: requiredText('Issue title'), description: requiredText('Description'), category: requiredText('Category'), severity: z.enum(['low','medium','high','critical']),
  identifiedDate: requiredText('Date identified'), raisedBy: requiredText('Raised by'), assignedTo: requiredText('Assigned to'),
  affectedActivity: requiredText('Affected activity'), scheduleImpact: optionalText, costImpact: amount.default(0),
  immediateAction: requiredText('Immediate action'), targetDate: requiredText('Target resolution date'),
});
export const labourSchema = z.object({
  date: requiredText('Date'), workerTeam: requiredText('Worker/team'), workerType: z.enum(['employee','temporary','subcontractor']),
  tradeRole: requiredText('Trade/role'), activity: requiredText('Project activity'), regularHours: amount, overtimeHours: amount.default(0),
  workCompleted: requiredText('Quantity/work completed'), rate: amount.default(0), supervisor: requiredText('Supervisor'), notes: optionalText,
});
export const equipmentSchema = z.object({
  equipment: requiredText('Equipment'), equipmentId: requiredText('Equipment ID'), equipmentType: requiredText('Type'), source: requiredText('Owner/source'),
  assignedDate: requiredText('Date assigned'), expectedReturn: optionalDate, operator: requiredText('Operator'), activity: requiredText('Activity'),
  hoursUsed: amount.default(0), fuelNotes: optionalText, condition: requiredText('Condition'), maintenanceIssue: checkbox.default(false), notes: optionalText,
});
export const certificateSchema = z.object({
  certificateType: requiredText('Certificate type'), number: requiredText('Certificate number'), period: requiredText('Period'), relatedMilestone: optionalText,
  submittedDate: requiredText('Submitted date'), submittedValue: amount, certifiedValue: amount, approvedDate: optionalDate,
  approvedBy: optionalText, notes: optionalText,
});
export const invoiceSchema = z.object({
  number: requiredText('Invoice number'), certificateReference: optionalText, invoiceDate: requiredText('Invoice date'), dueDate: requiredText('Due date'),
  description: requiredText('Description'), subtotal: amount, vat: amount.default(0), retention: amount.default(0), total: amount,
  paymentInstructions: requiredText('Payment instructions'),
});
export const paymentSchema = z.object({
  paymentDate: requiredText('Payment date'), invoiceId: optionalText, paymentType: z.enum(['advance','interim','final','retention','other']),
  amount: positive, paymentMethod: requiredText('Payment method'), bankAccount: requiredText('Bank/account'),
  referenceNumber: requiredText('Transaction/reference number'), allocation: requiredText('Allocation'), notes: optionalText,
});
export const retentionSchema = z.object({
  applicable: checkbox.default(false), percentage: z.coerce.number().min(0).max(100), baseAmount: amount, amountRetained: amount,
  amountReleased: amount.default(0), defectsStart: optionalDate, defectsEnd: optionalDate, eligibleReleaseDate: optionalDate,
  requestDate: optionalDate, releaseDate: optionalDate, status: requiredText('Status'), notes: optionalText,
});
export const projectDocumentSchema = z.object({
  category: requiredText('Document category'), title: requiredText('Document title'), referenceNumber: optionalText, version: requiredText('Version/revision'),
  documentDate: requiredText('Document date'), expiryDate: optionalDate, stage: optionalText, relatedMilestone: optionalText, notes: optionalText,
});
export const teamMemberSchema = z.object({
  employee: requiredText('Employee'), projectRole: requiredText('Project role'), responsibilities: requiredText('Responsibilities'),
  startDate: requiredText('Start date'), endDate: optionalDate, allocation: z.coerce.number().min(1).max(100), accessLevel: optionalText,
});
export const workActivitySchema = z.object({
  title: requiredText('Activity name'), description: requiredText('Description'), stage: requiredText('Project stage'), responsiblePerson: requiredText('Responsible person'),
  startDate: requiredText('Start date'), endDate: requiredText('End date'), weight: z.coerce.number().min(0).max(100), progress: z.coerce.number().min(0).max(100), status: requiredText('Status'),
});
export const workflowSchema = z.object({
  entityType: z.enum(['milestone','task']), entityId: requiredText('Record'),
  status: z.enum(['in_progress','ready_for_review','approved','completed']), completionDate: optionalDate, completionPercent: z.coerce.number().min(0).max(100).default(100),
  completionNotes: optionalText, approvedBy: optionalText,
});

export const projectActionSchemas = {
  progress: progressSchema, milestone: milestoneSchema, task: taskSchema, site_update: siteUpdateSchema,
  material_request: materialRequestSchema, material_usage: materialUsageSchema, expense: expenseSchema,
  budget_line: budgetLineSchema, variation: variationSchema, risk: riskSchema, issue: issueSchema,
  labour: labourSchema, equipment: equipmentSchema, certificate: certificateSchema, invoice: invoiceSchema,
  payment: paymentSchema, retention: retentionSchema, document: projectDocumentSchema, team_member: teamMemberSchema,
  work_activity: workActivitySchema, workflow: workflowSchema,
} as const;

export type ProjectActionType = keyof typeof projectActionSchemas;
