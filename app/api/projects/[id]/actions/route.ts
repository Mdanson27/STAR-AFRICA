import { env } from "cloudflare:workers";
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import type { z } from "zod";
import { getDb } from "@/db";
import {
  auditLogs,
  documents,
  invoiceLines,
  invoices,
  paymentAllocations,
  payments,
  projectActivities,
  projectBudgetLines,
  projectCertificates,
  projectDocumentLinks,
  projectEquipmentRecords,
  projectExpenses,
  projectInvoiceDetails,
  projectIssues,
  projectLabourRecords,
  projectMaterialRequests,
  projectMaterialUsage,
  projectMilestones,
  projectPaymentDetails,
  projectProgressUpdates,
  projectRetentionDetails,
  projectRisks,
  projectSiteUpdates,
  projectStages,
  projectTasks,
  projectTeamMembers,
  projectVariations,
  projectWorkActivities,
  projects,
  retentions,
} from "@/db/schema";
import {
  projectActionSchemas,
  type ProjectActionType,
} from "@/lib/projects/action-schemas";
import { guardApi } from "@/lib/security/api-guard";
import { requestContext } from "@/lib/security/production-auth";
import { hasPermission } from "@/lib/security/permissions";

const actionPermission: Record<ProjectActionType, string> = {
  progress: "projects.progress.edit",
  milestone: "project_milestones.create",
  task: "project_tasks.create",
  site_update: "project_updates.create",
  material_request: "project_materials.create",
  material_usage: "project_materials.create",
  expense: "project_expenses.create",
  budget_line: "project_budget.edit",
  variation: "project_variations.create",
  risk: "project_risks.manage",
  issue: "project_issues.manage",
  labour: "project_labour.create",
  equipment: "project_equipment.create",
  certificate: "project_certificates.create",
  invoice: "project_invoices.create",
  payment: "project_payments.create",
  retention: "project_retention.manage",
  document: "projects.documents.upload",
  team_member: "projects.team.manage",
  work_activity: "project_tasks.create",
  workflow: "project_tasks.edit",
};
const minor = (value: unknown) =>
  BigInt(Math.round(Number(value || 0) * 100)).toString();
const thousandths = (value: unknown) =>
  BigInt(Math.round(Number(value || 0) * 1000)).toString();
const str = (value: unknown) => {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  return "";
};
const optional = (value: unknown) => str(value).trim() || null;
const date = (value: unknown) => (value ? new Date(str(value)) : null);
const json = (value: unknown) => JSON.stringify(value);

async function readPayload(request: Request) {
  if (request.headers.get("content-type")?.includes("multipart/form-data")) {
    const form = await request.formData();
    const data: Record<string, unknown> = {};
    let file: File | null = null;
    for (const [key, value] of form.entries()) {
      if (key === "type") continue;
      if (value instanceof File) {
        if (value.size) file = value;
      } else data[key] = value;
    }
    return { type: str(form.get("type")), data, file };
  }
  const body = (await request.json().catch(() => null)) as {
    type?: string;
    data?: Record<string, unknown>;
  } | null;
  return { type: body?.type ?? "", data: body?.data ?? {}, file: null };
}

async function storeFile(file: File, projectId: string) {
  const allowedTypes = new Set([
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ]);
  if (file.size > 15 * 1024 * 1024) {
    throw new Error("Attachment exceeds the 15 MB project-document limit.");
  }
  if (!allowedTypes.has(file.type)) {
    throw new Error("This file type is not permitted for project documents.");
  }
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const documentId = `document-${crypto.randomUUID()}`;
  const storageKey = `projects/${projectId}/${documentId}-${safeName}`;
  const bytes = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const sha256 = [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  await env.FILES.put(storageKey, bytes, {
    httpMetadata: { contentType: file.type || "application/octet-stream" },
  });
  return {
    documentId,
    storageKey,
    filename: file.name,
    mimeType: file.type || "application/octet-stream",
    sizeBytes: file.size,
    sha256,
  };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await guardApi(request, {
    permission: "projects.view",
    action: "projects.action",
    maxRequests: 120,
    windowMs: 60_000,
  });
  if ("response" in guard) return guard.response;
  const { session } = guard;
  const security = requestContext(request);
  const incoming = await readPayload(request);
  if (!(incoming.type in projectActionSchemas))
    return NextResponse.json(
      { error: "Invalid project action." },
      { status: 400 },
    );
  const type = incoming.type as ProjectActionType;
  const permission = actionPermission[type];
  if (!hasPermission(session.permissions, permission))
    return NextResponse.json(
      { error: "Your registered position cannot perform this action." },
      { status: 403 },
    );
  const schema = projectActionSchemas[type] as z.ZodType<
    Record<string, unknown>
  >;
  const parsed = schema.safeParse(incoming.data);
  if (!parsed.success)
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "Invalid project data.",
        issues: parsed.error.issues,
      },
      { status: 400 },
    );
  const data = parsed.data;
  const { id } = await params;
  const db = getDb();
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, id))
    .limit(1);
  if (!project)
    return NextResponse.json(
      { error: "This project does not exist or is no longer available." },
      { status: 404 },
    );
  const now = new Date();
  const entityId = `${type}-${crypto.randomUUID()}`;
  const statements = [];
  let summary = "Project updated.";
  let documentId: string | null = null;
  if (incoming.file) {
    try {
      const stored = await storeFile(incoming.file, id);
      documentId = stored.documentId;
      statements.push(
        db
          .insert(documents)
          .values({
            id: stored.documentId,
            companyId: project.companyId,
            internalNumber: `DOC-${now.getUTCFullYear()}-${stored.documentId.slice(0, 8).toUpperCase()}`,
            storageKey: stored.storageKey,
            filename: stored.filename,
            originalFilename: stored.filename,
            mimeType: stored.mimeType,
            sizeBytes: stored.sizeBytes,
            sha256: stored.sha256,
            title: stored.filename,
            category: "Project Document",
            uploadedBy: session.userId,
            ocrStatus: "uploaded",
            verificationStatus: "pending",
            createdAt: now,
            updatedAt: now,
          }),
      );
    } catch {
      return NextResponse.json(
        { error: "The attachment could not be stored." },
        { status: 503 },
      );
    }
  }

  if (type === "progress") {
    const next = Number(data.newProgress);
    const current = project.completionBasisPoints / 100;
    if (next < current && !data.confirmRegression)
      return NextResponse.json(
        {
          error:
            "Confirm the reduction and provide a reason before lowering progress.",
        },
        { status: 400 },
      );
    const [stage] = await db
      .select({ id: projectStages.id })
      .from(projectStages)
      .where(
        and(
          eq(projectStages.companyId, project.companyId),
          eq(projectStages.name, String(data.stage)),
        ),
      )
      .limit(1);
    statements.push(
      db
        .insert(projectProgressUpdates)
        .values({
          id: entityId,
          projectId: id,
          previousBasisPoints: project.completionBasisPoints,
          newBasisPoints: next * 100,
          stage: String(data.stage),
          workCompleted: String(data.workCompleted),
          reason: String(data.reason),
          comment: String(data.comment),
          evidenceDocumentId: documentId,
          updatedBy: session.userId,
          occurredAt: date(data.progressDate) ?? now,
        }),
      db
        .update(projects)
        .set({
          completionBasisPoints: next * 100,
          stageId: stage?.id ?? project.stageId,
          updatedAt: now,
        })
        .where(eq(projects.id, id)),
    );
    summary = `Progress updated from ${current}% to ${next}%.`;
  } else if (type === "milestone") {
    statements.push(
      db
        .insert(projectMilestones)
        .values({
          id: entityId,
          projectId: id,
          name: String(data.name),
          description: String(data.description),
          stage: String(data.stage),
          ownerId: session.userId,
          plannedStartAt: date(data.plannedStartDate),
          weightBasisPoints: Number(data.weight) * 100,
          dueAt: date(data.dueDate),
          priority: String(data.priority),
          deliverable: String(data.deliverable),
          evidenceRequired: Boolean(data.evidenceRequired),
          approvalRequired: Boolean(data.approvalRequired),
          detailsJson: json({
            responsiblePerson: data.responsiblePerson,
            dependency: data.dependency,
            notes: data.notes,
          }),
          status: "not_started",
          createdAt: now,
          updatedAt: now,
        }),
    );
    summary = `Milestone created: ${str(data.name)}.`;
  } else if (type === "task") {
    statements.push(
      db
        .insert(projectTasks)
        .values({
          id: entityId,
          projectId: id,
          title: String(data.title),
          description: String(data.description),
          assigneeId: session.userId,
          startsAt: date(data.startDate),
          dueAt: date(data.dueDate),
          priority: String(data.priority),
          status: "not_started",
          stage: String(data.stage),
          detailsJson: json({
            assignedEmployee: data.assignedEmployee,
            relatedMilestone: data.relatedMilestone,
            estimatedEffort: data.estimatedEffort,
            dependencies: data.dependencies,
            checklist: data.checklist,
            notes: data.notes,
          }),
          createdAt: now,
          updatedAt: now,
        }),
    );
    summary = `Task created: ${str(data.title)}.`;
  } else if (type === "site_update") {
    const details = {
      reportedBy: data.reportedBy,
      tradesPresent: data.tradesPresent,
      hoursWorked: data.hoursWorked,
      materialShortages: data.materialShortages,
      equipmentUnavailable: data.equipmentUnavailable,
      hadDelays: data.hadDelays,
      delayImpact: data.delayImpact,
      incidentOccurred: data.incidentOccurred,
      incidentDetails: data.incidentDetails,
      clientRepresentative: data.clientRepresentative,
      engineer: data.engineer,
      consultant: data.consultant,
      otherVisitors: data.otherVisitors,
    };
    statements.push(
      db
        .insert(projectSiteUpdates)
        .values({
          id: entityId,
          projectId: id,
          reportDate: date(data.reportDate) ?? now,
          location: String(data.location),
          weather: optional(data.weather),
          workCompleted: String(data.workCompleted),
          workInProgress: String(data.workInProgress),
          workersOnSite: Number(data.workersOnSite),
          materialsReceived: optional(data.materialsReceived),
          materialsUsed: optional(data.materialsUsed),
          equipmentUsed: optional(data.equipmentUsed),
          delays: optional(data.delayReason),
          issues: optional(data.incidentDetails),
          instructions: optional(data.instructions),
          safetyObservations: optional(data.safetyObservations),
          visitors:
            [
              data.clientRepresentative,
              data.engineer,
              data.consultant,
              data.otherVisitors,
            ]
              .filter(Boolean)
              .join(", ") || null,
          detailsJson: json(details),
          photoDocumentId: documentId,
          notes: optional(data.notes),
          createdBy: session.userId,
          createdAt: now,
          updatedAt: now,
        }),
    );
    summary = `Daily site update recorded for ${str(data.reportDate)}.`;
  } else if (type === "material_request") {
    const reference = `MR-${project.code}-${Date.now().toString().slice(-6)}`;
    const total = Number(data.quantity) * Number(data.estimatedUnitCost);
    statements.push(
      db
        .insert(projectMaterialRequests)
        .values({
          id: entityId,
          projectId: id,
          reference,
          material: String(data.material),
          quantityMinor: thousandths(data.quantity),
          unit: String(data.unit),
          requiredAt: date(data.requiredDate),
          purpose: String(data.purpose),
          priority: String(data.priority),
          estimatedTotalMinor: minor(total),
          detailsJson: json({
            specification: data.specification,
            availableQuantity: data.availableQuantity,
            activity: data.activity,
            deliveryLocation: data.deliveryLocation,
            preferredSupplier: data.preferredSupplier,
            estimatedUnitCost: data.estimatedUnitCost,
          }),
          supportingDocumentId: documentId,
          notes: optional(data.notes),
          status: "submitted",
          requestedBy: session.userId,
          createdAt: now,
          updatedAt: now,
        }),
    );
    summary = `Material request ${reference} submitted.`;
  } else if (type === "material_usage") {
    statements.push(
      db
        .insert(projectMaterialUsage)
        .values({
          id: entityId,
          projectId: id,
          material: String(data.material),
          quantityIssuedMinor: thousandths(data.quantityIssued),
          quantityUsedMinor: thousandths(data.quantityUsed),
          quantityReturnedMinor: thousandths(data.quantityReturned),
          occurredAt: date(data.date) ?? now,
          activity: String(data.activity),
          issuedBy: String(data.issuedBy),
          receivedBy: String(data.receivedBy),
          notes: optional(data.notes),
          createdBy: session.userId,
          createdAt: now,
          updatedAt: now,
        }),
    );
    summary = `Material usage recorded: ${str(data.material)}.`;
  } else if (type === "expense") {
    const expenseNumber = `EXP-${project.code}-${Date.now().toString().slice(-6)}`;
    const total = Number(data.amount) + Number(data.tax);
    statements.push(
      db
        .insert(projectExpenses)
        .values({
          id: entityId,
          projectId: id,
          expenseNumber,
          payee: String(data.payee),
          category: String(data.category),
          description: String(data.description),
          currency: project.contractCurrency,
          amountMinor: minor(data.amount),
          taxMinor: minor(data.tax),
          totalMinor: minor(total),
          paymentMethod: String(data.paymentMethod),
          referenceNumber: String(data.referenceNumber),
          activity: String(data.activity),
          detailsJson: json({
            relatedPurchase: data.relatedPurchase,
            recordedBy: data.recordedBy,
            notes: data.notes,
          }),
          receiptDocumentId: documentId,
          status: "submitted",
          occurredAt: date(data.date) ?? now,
          recordedBy: session.userId,
          createdAt: now,
          updatedAt: now,
        }),
    );
    summary = `Expense ${expenseNumber} recorded and submitted.`;
  } else if (type === "budget_line") {
    const value = Number(data.budgetAmount) + Number(data.contingency);
    statements.push(
      db
        .insert(projectBudgetLines)
        .values({
          id: entityId,
          projectId: id,
          category: String(data.category),
          subcategory: optional(data.subcategory),
          description: String(data.description),
          quantityMinor: thousandths(data.quantity),
          unit: String(data.unit),
          unitCostMinor: minor(data.unitCost),
          originalMinor: minor(data.budgetAmount),
          contingencyMinor: minor(data.contingency),
          notes: optional(data.notes),
          createdAt: now,
          updatedAt: now,
        }),
      db
        .update(projects)
        .set({
          budgetMinor: String(
            BigInt(project.budgetMinor) + BigInt(minor(value)),
          ),
          updatedAt: now,
        })
        .where(eq(projects.id, id)),
    );
    summary = `Budget line added: ${str(data.description)}.`;
  } else if (type === "variation") {
    statements.push(
      db
        .insert(projectVariations)
        .values({
          id: entityId,
          projectId: id,
          number: String(data.number),
          title: String(data.title),
          description: String(data.description),
          reason: String(data.reason),
          requestedByParty: String(data.requestedBy),
          affectedScope: String(data.affectedScope),
          originalValueMinor: minor(data.originalValue),
          costImpactMinor: minor(data.costImpact),
          revisedValueMinor: minor(data.revisedValue),
          timeImpactDays: Number(data.additionalDays),
          submittedAt: date(data.dateRequested),
          decisionRequiredAt: date(data.decisionDate),
          status: "submitted",
          detailsJson: json({ timeImpact: data.timeImpact, notes: data.notes }),
          supportingDocumentId: documentId,
          createdBy: session.userId,
          createdAt: now,
          updatedAt: now,
        }),
    );
    summary = `Variation ${str(data.number)} submitted for review.`;
  } else if (type === "risk") {
    const score = Number(data.likelihood) * Number(data.impact);
    statements.push(
      db
        .insert(projectRisks)
        .values({
          id: entityId,
          projectId: id,
          title: String(data.title),
          description: String(data.description),
          category: String(data.category),
          likelihood: Number(data.likelihood),
          impact: Number(data.impact),
          score,
          ownerId: session.userId,
          mitigation: String(data.mitigation),
          contingency: String(data.contingency),
          targetAt: date(data.targetDate),
          status: "open",
          detailsJson: json({ owner: data.owner }),
          createdAt: now,
          updatedAt: now,
        }),
    );
    if (score >= 15)
      statements.push(
        db
          .update(projects)
          .set({ health: "at_risk", updatedAt: now })
          .where(eq(projects.id, id)),
      );
    summary = `Risk added with score ${score}: ${str(data.title)}.`;
  } else if (type === "issue") {
    statements.push(
      db
        .insert(projectIssues)
        .values({
          id: entityId,
          projectId: id,
          title: String(data.title),
          description: String(data.description),
          category: String(data.category),
          priority: String(data.severity),
          ownerId: session.userId,
          raisedBy: session.userId,
          raisedAt: date(data.identifiedDate) ?? now,
          targetResolutionAt: date(data.targetDate),
          scheduleImpact: optional(data.scheduleImpact),
          costImpactMinor: minor(data.costImpact),
          immediateAction: String(data.immediateAction),
          detailsJson: json({
            raisedBy: data.raisedBy,
            assignedTo: data.assignedTo,
            affectedActivity: data.affectedActivity,
            documentId,
          }),
          status: "open",
          createdAt: now,
          updatedAt: now,
        }),
    );
    if (data.severity === "critical")
      statements.push(
        db
          .update(projects)
          .set({ health: "at_risk", updatedAt: now })
          .where(eq(projects.id, id)),
      );
    summary = `Issue reported: ${str(data.title)}.`;
  } else if (type === "labour") {
    statements.push(
      db
        .insert(projectLabourRecords)
        .values({
          id: entityId,
          projectId: id,
          occurredAt: date(data.date) ?? now,
          workerTeam: String(data.workerTeam),
          workerType: String(data.workerType),
          tradeRole: String(data.tradeRole),
          activity: String(data.activity),
          regularHoursMinor: thousandths(data.regularHours),
          overtimeHoursMinor: thousandths(data.overtimeHours),
          workCompleted: String(data.workCompleted),
          rateMinor: hasPermission(session.permissions, "projects.costs.view")
            ? minor(data.rate)
            : "0",
          supervisor: String(data.supervisor),
          notes: optional(data.notes),
          createdBy: session.userId,
          createdAt: now,
          updatedAt: now,
        }),
    );
    summary = `Labour record saved for ${str(data.workerTeam)}.`;
  } else if (type === "equipment") {
    statements.push(
      db
        .insert(projectEquipmentRecords)
        .values({
          id: entityId,
          projectId: id,
          equipment: String(data.equipment),
          equipmentCode: String(data.equipmentId),
          type: String(data.equipmentType),
          source: String(data.source),
          assignedAt: date(data.assignedDate) ?? now,
          expectedReturnAt: date(data.expectedReturn),
          operator: String(data.operator),
          activity: String(data.activity),
          hoursUsedMinor: thousandths(data.hoursUsed),
          fuelNotes: optional(data.fuelNotes),
          condition: String(data.condition),
          maintenanceIssue: data.maintenanceIssue === true,
          status: data.maintenanceIssue === true ? "maintenance" : "assigned",
          notes: optional(data.notes),
          createdBy: session.userId,
          createdAt: now,
          updatedAt: now,
        }),
    );
    summary = `Equipment assigned: ${str(data.equipment)}.`;
  } else if (type === "certificate") {
    statements.push(
      db
        .insert(projectCertificates)
        .values({
          id: entityId,
          projectId: id,
          certificateType: String(data.certificateType),
          number: String(data.number),
          period: String(data.period),
          relatedMilestone: optional(data.relatedMilestone),
          submittedAt: date(data.submittedDate) ?? now,
          submittedValueMinor: minor(data.submittedValue),
          certifiedValueMinor: minor(data.certifiedValue),
          approvedAt: date(data.approvedDate),
          approvedBy: optional(data.approvedBy),
          documentId,
          notes: optional(data.notes),
          status: data.approvedDate ? "approved" : "submitted",
          createdAt: now,
          updatedAt: now,
        }),
    );
    summary = `Certificate ${str(data.number)} saved.`;
  } else if (type === "invoice") {
    const invoiceId = `invoice-${crypto.randomUUID()}`;
    statements.push(
      db
        .insert(invoices)
        .values({
          id: invoiceId,
          companyId: project.companyId,
          number: String(data.number),
          customerId: project.customerId,
          projectId: id,
          issueDate: date(data.invoiceDate) ?? now,
          dueDate: date(data.dueDate) ?? now,
          currency: project.contractCurrency,
          subtotalMinor: minor(data.subtotal),
          taxMinor: minor(data.vat),
          retentionMinor: minor(data.retention),
          totalMinor: minor(data.total),
          status: "draft",
          createdAt: now,
          updatedAt: now,
        }),
      db
        .insert(invoiceLines)
        .values({
          id: `invoice-line-${crypto.randomUUID()}`,
          invoiceId,
          description: String(data.description),
          quantityMinor: "1000",
          unitPriceMinor: minor(data.subtotal),
          taxBasisPoints: Number(data.subtotal)
            ? Math.round((Number(data.vat) / Number(data.subtotal)) * 10000)
            : 0,
          lineTotalMinor: minor(data.total),
          sequence: 1,
        }),
      db
        .insert(projectInvoiceDetails)
        .values({
          id: entityId,
          projectId: id,
          invoiceId,
          certificateReference: optional(data.certificateReference),
          description: String(data.description),
          paymentInstructions: String(data.paymentInstructions),
          supportingDocumentId: documentId,
          createdAt: now,
        }),
    );
    summary = `Invoice ${str(data.number)} created in the core invoice register.`;
  } else if (type === "payment") {
    const paymentId = `payment-${crypto.randomUUID()}`;
    const invoiceId = optional(data.invoiceId);
    statements.push(
      db
        .insert(payments)
        .values({
          id: paymentId,
          companyId: project.companyId,
          reference: String(data.referenceNumber),
          customerId: project.customerId,
          projectId: id,
          currency: project.contractCurrency,
          amountMinor: minor(data.amount),
          receivedOrPaidAt: date(data.paymentDate) ?? now,
          method: String(data.paymentMethod),
          bankReference: String(data.referenceNumber),
          status: "received",
          createdAt: now,
          updatedAt: now,
        }),
      db
        .insert(projectPaymentDetails)
        .values({
          id: entityId,
          projectId: id,
          paymentId,
          invoiceId,
          paymentType: String(data.paymentType),
          bankAccount: String(data.bankAccount),
          allocation: String(data.allocation),
          notes: optional(data.notes),
          receiptDocumentId: documentId,
          createdAt: now,
        }),
    );
    if (invoiceId)
      statements.push(
        db
          .insert(paymentAllocations)
          .values({
            id: `allocation-${crypto.randomUUID()}`,
            paymentId,
            invoiceId,
            amountMinor: minor(data.amount),
            createdAt: now,
          }),
      );
    summary = `Payment ${str(data.referenceNumber)} recorded.`;
  } else if (type === "retention") {
    const retentionId = `retention-${crypto.randomUUID()}`;
    const balance = Number(data.amountRetained) - Number(data.amountReleased);
    statements.push(
      db
        .insert(retentions)
        .values({
          id: retentionId,
          projectId: id,
          basisPoints: Number(data.percentage) * 100,
          baseMinor: minor(data.baseAmount),
          amountMinor: minor(data.amountRetained),
          expectedReleaseAt: date(data.eligibleReleaseDate),
          actualReleaseAt: date(data.releaseDate),
          receivedMinor: minor(data.amountReleased),
          status: String(data.status),
          createdAt: now,
          updatedAt: now,
        }),
      db
        .insert(projectRetentionDetails)
        .values({
          id: entityId,
          projectId: id,
          retentionId,
          applicable: Boolean(data.applicable),
          defectsStartAt: date(data.defectsStart),
          defectsEndAt: date(data.defectsEnd),
          requestAt: date(data.requestDate),
          notes: optional(data.notes) || `Balance ${balance}`,
          createdAt: now,
          updatedAt: now,
        }),
    );
    summary = "Retention record saved.";
  } else if (type === "document") {
    if (!documentId)
      return NextResponse.json(
        { error: "Choose a file to upload." },
        { status: 400 },
      );
    statements.push(
      db
        .insert(projectDocumentLinks)
        .values({
          id: entityId,
          projectId: id,
          documentId,
          category: String(data.category),
          title: String(data.title),
          referenceNumber: optional(data.referenceNumber),
          version: String(data.version),
          documentAt: date(data.documentDate) ?? now,
          expiresAt: date(data.expiryDate),
          stage: optional(data.stage),
          relatedMilestone: optional(data.relatedMilestone),
          notes: optional(data.notes),
          createdAt: now,
          updatedAt: now,
        }),
    );
    summary = `Project document uploaded: ${str(data.title)}.`;
  } else if (type === "team_member") {
    statements.push(
      db
        .insert(projectTeamMembers)
        .values({
          id: entityId,
          projectId: id,
          userId: session.userId,
          projectRole: String(data.projectRole),
          responsibility: String(data.responsibilities),
          startsAt: date(data.startDate),
          endsAt: date(data.endDate),
          allocationBasisPoints: Number(data.allocation) * 100,
          accessLevel: optional(data.accessLevel),
          detailsJson: json({ employee: data.employee }),
          status: "active",
          createdAt: now,
          updatedAt: now,
        }),
    );
    summary = `Team member added: ${str(data.employee)}.`;
  } else if (type === "work_activity") {
    statements.push(
      db
        .insert(projectWorkActivities)
        .values({
          id: entityId,
          projectId: id,
          stage: String(data.stage),
          title: String(data.title),
          description: String(data.description),
          startsAt: date(data.startDate),
          endsAt: date(data.endDate),
          responsibleId: session.userId,
          weightBasisPoints: Number(data.weight) * 100,
          progressBasisPoints: Number(data.progress) * 100,
          status: String(data.status),
          detailsJson: json({ responsiblePerson: data.responsiblePerson }),
          createdAt: now,
          updatedAt: now,
        }),
    );
    summary = `Work plan activity added: ${str(data.title)}.`;
  } else if (type === "workflow") {
    const requestedStatus = str(data.status);
    const completedAt =
      data.status === "completed" ? (date(data.completionDate) ?? now) : null;
    if (data.entityType === "milestone") {
      const [record] = await db
        .select({ status: projectMilestones.status })
        .from(projectMilestones)
        .where(
          and(
            eq(projectMilestones.id, str(data.entityId)),
            eq(projectMilestones.projectId, id),
          ),
        )
        .limit(1);
      if (!record)
        return NextResponse.json({ error: "Milestone not found." }, { status: 404 });
      const transitions: Record<string, string[]> = {
        not_started: ["in_progress"],
        in_progress: ["ready_for_review"],
        ready_for_review: ["approved", "completed"],
        approved: ["completed"],
      };
      if (!(transitions[record.status] ?? []).includes(requestedStatus))
        return NextResponse.json(
          { error: `Milestone cannot move from ${record.status.replaceAll("_", " ")} to ${requestedStatus.replaceAll("_", " ")}.` },
          { status: 409 },
        );
      if (
        requestedStatus === "approved" &&
        !hasPermission(session.permissions, "project_milestones.approve")
      )
        return NextResponse.json(
          { error: "You do not have permission to approve milestones." },
          { status: 403 },
        );
      statements.push(
        db
          .update(projectMilestones)
          .set({
            status: String(data.status),
            completedAt,
            approvedBy: data.status === "approved" ? session.userId : null,
            approvedAt: data.status === "approved" ? now : null,
            detailsJson: json({
              completionPercent: data.completionPercent,
              completionNotes: data.completionNotes,
              approvedBy: data.approvedBy,
            }),
            updatedAt: now,
          })
          .where(
            and(
              eq(projectMilestones.id, str(data.entityId)),
              eq(projectMilestones.projectId, id),
            ),
          ),
      );
    } else {
      const [record] = await db
        .select({ status: projectTasks.status })
        .from(projectTasks)
        .where(
          and(
            eq(projectTasks.id, str(data.entityId)),
            eq(projectTasks.projectId, id),
          ),
        )
        .limit(1);
      if (!record)
        return NextResponse.json({ error: "Task not found." }, { status: 404 });
      const transitions: Record<string, string[]> = {
        not_started: ["in_progress"],
        in_progress: ["completed"],
      };
      if (!(transitions[record.status] ?? []).includes(requestedStatus))
        return NextResponse.json(
          { error: `Task cannot move from ${record.status.replaceAll("_", " ")} to ${requestedStatus.replaceAll("_", " ")}.` },
          { status: 409 },
        );
      statements.push(
        db
          .update(projectTasks)
          .set({
            status: String(data.status),
            completedAt,
            detailsJson: json({ completionNotes: data.completionNotes }),
            updatedAt: now,
          })
          .where(
            and(
              eq(projectTasks.id, str(data.entityId)),
              eq(projectTasks.projectId, id),
            ),
          ),
      );
    }
    summary = `${str(data.entityType)} moved to ${requestedStatus.replaceAll("_", " ")}.`;
  }
  statements.push(
    db
      .insert(projectActivities)
      .values({
        id: `activity-${crypto.randomUUID()}`,
        projectId: id,
        actorId: session.userId,
        action: `project.${type}`,
        summary,
        entityType: type,
        entityId,
        occurredAt: now,
      }),
    db
      .insert(auditLogs)
      .values({
        id: `audit-${crypto.randomUUID()}`,
        companyId: project.companyId,
        userId: session.userId,
        action: `project.${type}`,
        entityType: "project",
        entityId: id,
        newValueJson: json(data),
        requestId: security.requestId,
        ipHash: security.ipHash,
        occurredAt: now,
      }),
  );
  try {
    await db.batch(
      statements as [
        (typeof statements)[number],
        ...(typeof statements)[number][],
      ],
    );
    return NextResponse.json({ message: summary, id: entityId });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to save the project change.",
      },
      { status: 503 },
    );
  }
}
