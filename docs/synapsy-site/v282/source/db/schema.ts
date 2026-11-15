import {sqliteTable,text,integer,uniqueIndex,index,check,primaryKey} from 'drizzle-orm/sqlite-core';
import {sql} from 'drizzle-orm';
export const crmRevisions=sqliteTable('seva_crm_revisions',{ownerId:text('owner_id').notNull(),revision:integer('revision').notNull(),contactsJson:text('contacts_json').notNull(),activitiesJson:text('activities_json').notNull(),updatedAt:text('updated_at').notNull(),operationId:text('operation_id').notNull(),payloadHash:text('payload_hash').notNull()},t=>({ownerRevision:uniqueIndex('seva_crm_revision_owner_revision').on(t.ownerId,t.revision)}));
export const needWorkspaces=sqliteTable('seva_need_workspaces',{ownerId:text('owner_id').primaryKey(),revision:integer('revision').notNull(),documentJson:text('document_json').notNull(),updatedAt:text('updated_at').notNull(),operationId:text('operation_id').notNull(),payloadHash:text('payload_hash').notNull()});
export const engagementCampaigns=sqliteTable('seva_engagement_campaigns',{id:text('id').primaryKey(),ownerId:text('owner_id').notNull(),creationId:text('creation_id').notNull(),revision:integer('revision').notNull(),dataJson:text('data_json').notNull(),createdAt:text('created_at').notNull(),updatedAt:text('updated_at').notNull()},t=>({operation:uniqueIndex('seva_engagement_campaign_operation').on(t.ownerId,t.creationId),owner:index('seva_engagement_campaign_owner').on(t.ownerId,t.updatedAt)}));
export const engagementMembers=sqliteTable('seva_engagement_members',{campaignId:text('campaign_id').notNull(),personId:text('person_id').notNull()},t=>({membership:uniqueIndex('seva_engagement_membership').on(t.campaignId,t.personId),person:index('seva_engagement_member_person').on(t.personId)}));
export const infrastructureSignals=sqliteTable('seva_infrastructure_signals',{kind:text('kind').primaryKey(),eventJson:text('event_json').notNull(),observedAt:integer('observed_at').notNull(),receivedAt:integer('received_at').notNull()});
export const runtimeChecks=sqliteTable('seva_runtime_checks',{id:text('id').primaryKey(),state:text('state').notNull(),createdAt:integer('created_at').notNull(),completedAt:integer('completed_at'),resultJson:text('result_json')},t=>({recent:index('seva_runtime_checks_recent').on(t.createdAt)}));
export const siteRefreshes=sqliteTable('seva_site_refreshes',{
 id:text('id').primaryKey(),build:text('build').notNull(),state:text('state').notNull(),startedAt:integer('started_at').notNull(),
 completedAt:integer('completed_at'),ok:integer('ok').notNull().default(0),reportJson:text('report_json')
},t=>({latest:index('seva_site_refresh_latest').on(t.startedAt),
 allowedState:check('seva_site_refresh_state',sql`${t.state} IN ('running','completed')`),
 allowedResult:check('seva_site_refresh_ok',sql`${t.ok} IN (0,1)`)
}));
export const siteRefreshSchedule=sqliteTable('seva_site_refresh_schedule',{
 id:integer('id').primaryKey(),scheduleId:text('schedule_id').notNull(),enabled:integer('enabled').notNull(),confirmedAt:integer('confirmed_at').notNull()
},t=>({singleton:check('seva_site_refresh_schedule_singleton',sql`${t.id}=1`),
 enabledValue:check('seva_site_refresh_schedule_enabled',sql`${t.enabled} IN (0,1)`)
}));
export const analyticsDaily=sqliteTable('seva_analytics_daily',{day:text('day').notNull(),path:text('path').notNull(),event:text('event').notNull(),count:integer('count').notNull().default(0)},t=>({bucket:uniqueIndex('seva_analytics_daily_bucket').on(t.day,t.path,t.event)}));
export const accountProfiles=sqliteTable('seva_account_profiles',{ownerId:text('owner_id').primaryKey(),id:text('id').notNull().unique(),profileJson:text('profile_json').notNull(),revision:integer('revision').notNull(),createdAt:text('created_at').notNull(),updatedAt:text('updated_at').notNull()});
export const identityProcedures=sqliteTable('seva_identity_procedures',{ownerId:text('owner_id').primaryKey(),procedureJson:text('procedure_json').notNull(),revision:integer('revision').notNull(),updatedAt:text('updated_at').notNull()});
export const studentProfiles=sqliteTable('seva_student_profiles',{ownerId:text('owner_id').primaryKey(),id:text('id').notNull().unique(),profileJson:text('profile_json').notNull(),version:integer('version').notNull(),createdAt:text('created_at').notNull(),updatedAt:text('updated_at').notNull()});

export const goalWorkspaces=sqliteTable('seva_goal_workspaces',{ownerId:text('owner_id').primaryKey(),revision:integer('revision').notNull(),goalsJson:text('goals_json').notNull(),updatedAt:text('updated_at').notNull(),operationId:text('operation_id').notNull(),payloadHash:text('payload_hash').notNull()});

export const goalRevisions=sqliteTable('seva_goal_revisions',{ownerId:text('owner_id').notNull(),revision:integer('revision').notNull(),goalsJson:text('goals_json').notNull(),updatedAt:text('updated_at').notNull(),operationId:text('operation_id').notNull(),payloadHash:text('payload_hash').notNull(),requestHash:text('request_hash').notNull(),restoredFrom:integer('restored_from')},t=>({ownerRevision:uniqueIndex('seva_goal_revision_owner_revision').on(t.ownerId,t.revision),ownerOperation:uniqueIndex('seva_goal_revision_owner_operation').on(t.ownerId,t.operationId)}));

export const serviceWorkspaces=sqliteTable('seva_service_workspaces',{ownerId:text('owner_id').primaryKey(),revision:integer('revision').notNull(),ticketsJson:text('tickets_json').notNull(),updatedAt:text('updated_at').notNull(),operationId:text('operation_id').notNull(),payloadHash:text('payload_hash').notNull()});

export const inquiries=sqliteTable('seva_inquiries',{id:text('id').primaryKey(),ownerId:text('owner_id').notNull(),category:text('category').notNull(),name:text('name').notNull(),message:text('message').notNull(),response:text('response').notNull(),status:text('status').notNull(),revision:integer('revision').notNull(),createdAt:text('created_at').notNull(),updatedAt:text('updated_at').notNull()});

export const billingIntents=sqliteTable('seva_billing_intents',{token:text('token').primaryKey(),ownerId:text('owner_id').notNull(),operationId:text('operation_id').notNull(),planId:text('plan_id').notNull(),mode:text('mode').notNull(),priceId:text('price_id').notNull(),linkId:text('link_id').notNull(),amount:integer('amount').notNull(),currency:text('currency').notNull(),createdAt:integer('created_at').notNull(),expiresAt:integer('expires_at').notNull(),sessionId:text('session_id'),subscriptionId:text('subscription_id')},t=>({operation:uniqueIndex('seva_billing_intent_operation').on(t.ownerId,t.operationId)}));
export const billingSubscriptions=sqliteTable('seva_billing_subscriptions',{id:text('id').primaryKey(),mode:text('mode').notNull(),ownerId:text('owner_id'),customerId:text('customer_id').notNull().default(''),priceId:text('price_id').notNull().default(''),status:text('status').notNull().default('pending'),eligible:integer('eligible').notNull().default(0),updatedAt:integer('updated_at').notNull().default(0),canceled:integer('canceled').notNull().default(0),cancelAtPeriodEnd:integer('cancel_at_period_end').notNull().default(0)},t=>({owner:index('seva_billing_sub_owner').on(t.ownerId,t.mode)}));
export const billingPeriods=sqliteTable('seva_billing_periods',{invoiceId:text('invoice_id').primaryKey(),mode:text('mode').notNull(),subscriptionId:text('subscription_id').notNull(),priceId:text('price_id').notNull(),periodStart:integer('period_start').notNull(),periodEnd:integer('period_end').notNull(),paymentIntentId:text('payment_intent_id').notNull().default(''),amount:integer('amount').notNull(),currency:text('currency').notNull()},t=>({subscription:index('seva_billing_period_sub').on(t.subscriptionId,t.mode)}));
export const billingReversals=sqliteTable('seva_billing_reversals',{id:text('id').primaryKey(),mode:text('mode').notNull(),invoiceId:text('invoice_id').notNull().default(''),paymentIntentId:text('payment_intent_id').notNull().default(''),kind:text('kind').notNull()});
export const billingEvents=sqliteTable('seva_billing_events',{id:text('id').primaryKey(),mode:text('mode').notNull(),type:text('type').notNull(),createdAt:integer('created_at').notNull()});

export const creatorProfiles=sqliteTable('seva_creator_profiles',{ownerId:text('owner_id').primaryKey(),id:text('id').notNull().unique(),ownerScope:text('owner_scope').notNull(),referralCode:text('referral_code').notNull().unique(),policyVersion:text('policy_version').notNull(),createdAt:integer('created_at').notNull(),stripeAccountId:text('stripe_account_id').unique()});

export const stripeEventInbox=sqliteTable('seva_stripe_event_inbox',{eventId:text('event_id').primaryKey(),eventType:text('event_type').notNull(),objectId:text('object_id').notNull(),accountId:text('account_id').notNull(),eventCreated:integer('event_created').notNull(),receivedAt:integer('received_at').notNull(),payloadDigest:text('payload_digest').notNull(),state:text('state').notNull().default('pending_review')},t=>({pending:index('seva_stripe_event_inbox_pending').on(t.state,t.receivedAt)}));

export const crmWorkspaces=sqliteTable('seva_crm_workspaces',{ownerId:text('owner_id').primaryKey(),revision:integer('revision').notNull(),contactsJson:text('contacts_json').notNull(),activitiesJson:text('activities_json').notNull(),updatedAt:text('updated_at').notNull(),operationId:text('operation_id').notNull(),payloadHash:text('payload_hash').notNull()});

export const synapsyCRMFollowupOperations=sqliteTable('synapsy_crm_followup_operations',{
 ownerId:text('owner_id').notNull(),operationId:text('operation_id').notNull(),action:text('action').notNull(),requestHash:text('request_hash').notNull(),
 expectedRevision:integer('expected_revision').notNull(),resultRevision:integer('result_revision').notNull(),targetOperationId:text('target_operation_id'),
 receiptJson:text('receipt_json').notNull(),receiptHash:text('receipt_hash').notNull(),createdAt:text('created_at').notNull()
},t=>({primary:primaryKey({columns:[t.ownerId,t.operationId]}),
 undoOnce:uniqueIndex('synapsy_crm_followup_undo_once').on(t.ownerId,t.targetOperationId).where(sql`${t.action}='undo'`),
 recent:index('synapsy_crm_followup_recent').on(t.ownerId,t.createdAt),
 actionValid:check('synapsy_crm_followup_action',sql`${t.action} IN ('create','undo')`),
 hashValid:check('synapsy_crm_followup_hash',sql`length(${t.requestHash})=64 AND length(${t.receiptHash})=64`),
 revisionValid:check('synapsy_crm_followup_revision',sql`${t.expectedRevision}>=1 AND ${t.resultRevision}=${t.expectedRevision}+1`),
 receiptValid:check('synapsy_crm_followup_receipt',sql`json_valid(${t.receiptJson})`),
 targetValid:check('synapsy_crm_followup_target',sql`(${t.action}='create' AND ${t.targetOperationId} IS NULL) OR (${t.action}='undo' AND ${t.targetOperationId} IS NOT NULL AND ${t.targetOperationId}<>${t.operationId})`)
}));

export const synapsyKkuberaOperations=sqliteTable('synapsy_kkubera_operations',{
 ownerId:text('owner_id').notNull(),operationId:text('operation_id').notNull(),kind:text('kind').notNull(),requestHash:text('request_hash').notNull(),
 payloadHash:text('payload_hash').notNull(),appliedRevision:integer('applied_revision').notNull(),createdAt:text('created_at').notNull()
},t=>({primary:primaryKey({columns:[t.ownerId,t.operationId]}),recent:index('synapsy_kkubera_operations_recent').on(t.ownerId,t.createdAt),
 kindValid:check('synapsy_kkubera_operations_kind',sql`${t.kind} IN ('workspace','requirements')`),
 hashValid:check('synapsy_kkubera_operations_hash',sql`length(${t.requestHash})=64 AND length(${t.payloadHash})=64`),
 revisionValid:check('synapsy_kkubera_operations_revision',sql`${t.appliedRevision}>=1`)
}));
export const synapsyKkuberaRevisions=sqliteTable('synapsy_kkubera_revisions',{
 ownerId:text('owner_id').notNull(),kind:text('kind').notNull(),revision:integer('revision').notNull(),snapshotJson:text('snapshot_json').notNull(),
 payloadHash:text('payload_hash').notNull(),createdAt:text('created_at').notNull(),baseline:integer('baseline').notNull().default(0)
},t=>({primary:primaryKey({columns:[t.ownerId,t.kind,t.revision]}),recent:index('synapsy_kkubera_revisions_recent').on(t.ownerId,t.kind,t.revision),
 kindValid:check('synapsy_kkubera_revisions_kind',sql`${t.kind} IN ('workspace','requirements')`),
 recordValid:check('synapsy_kkubera_revisions_record',sql`${t.revision}>=0 AND ${t.baseline} IN (0,1) AND length(${t.payloadHash})=64 AND json_valid(${t.snapshotJson})`)
}));

export const serviceOrders=sqliteTable('seva_service_orders',{
 id:text('id').primaryKey(),ownerId:text('owner_id').notNull(),contactId:text('contact_id').notNull(),offerId:text('offer_id').notNull(),
 agreementRef:text('agreement_ref').notNull(),description:text('description').notNull(),amountCents:integer('amount_cents').notNull(),currency:text('currency').notNull(),
 paymentLinkId:text('payment_link_id').notNull(),checkoutToken:text('checkout_token').notNull(),creationOperationId:text('creation_operation_id').notNull(),creationHash:text('creation_hash').notNull(),
 revision:integer('revision').notNull().default(1),paymentStatus:text('payment_status').notNull().default('pending'),deliveryStatus:text('delivery_status').notNull().default('pending'),
 reviewReason:text('review_reason').notNull().default(''),eventCount:integer('event_count').notNull().default(0),paidAt:text('paid_at'),
 deliveryEvidence:text('delivery_evidence'),deliveryOperationId:text('delivery_operation_id'),deliveryHash:text('delivery_hash'),deliveredAt:text('delivered_at'),
 createdAt:text('created_at').notNull(),updatedAt:text('updated_at').notNull()
},t=>({
 operation:uniqueIndex('seva_service_order_creation').on(t.ownerId,t.creationOperationId),token:uniqueIndex('seva_service_order_token').on(t.checkoutToken),
 delivery:uniqueIndex('seva_service_order_delivery').on(t.ownerId,t.deliveryOperationId),owner:index('seva_service_order_owner').on(t.ownerId,t.createdAt),
 contact:index('seva_service_order_contact').on(t.ownerId,t.contactId),
 amount:check('seva_service_order_amount',sql`${t.amountCents} IN (500,5000,50000) AND ${t.currency}='eur'`),
 payment:check('seva_service_order_payment',sql`${t.paymentStatus} IN ('pending','paid','failed','refunded','disputed','review')`),
 fulfillment:check('seva_service_order_fulfillment',sql`${t.deliveryStatus} IN ('pending','delivered')`),
 revisionValid:check('seva_service_order_revision',sql`${t.revision}>=1 AND ${t.eventCount}>=0`)
}));
export const servicePaymentEvents=sqliteTable('seva_service_payment_events',{
 eventId:text('event_id').primaryKey(),kind:text('kind').notNull(),sessionId:text('session_id').notNull().default(''),paymentIntentId:text('payment_intent_id').notNull().default(''),
 orderId:text('order_id').notNull().default(''),reason:text('reason').notNull().default(''),eventCreated:integer('event_created').notNull(),receivedAt:text('received_at').notNull(),fingerprint:text('fingerprint').notNull()
},t=>({order:index('seva_service_event_order').on(t.orderId,t.kind),intent:index('seva_service_event_intent').on(t.paymentIntentId),session:index('seva_service_event_session').on(t.sessionId),
 kindValid:check('seva_service_event_kind',sql`${t.kind} IN ('pending','paid','failed','refunded','disputed','review')`),
 fingerprintValid:check('seva_service_event_fingerprint',sql`length(${t.fingerprint})=64`)
}));

export const byokCredentials=sqliteTable('seva_byok_credentials',{ownerId:text('owner_id').primaryKey(),ciphertext:text('ciphertext').notNull(),iv:text('iv').notNull(),revision:text('revision').notNull(),updatedAt:text('updated_at').notNull()});
export const byokAttempts=sqliteTable('seva_byok_attempts',{id:text('id').primaryKey(),ownerId:text('owner_id').notNull(),requestId:text('request_id').notNull(),startedAt:integer('started_at').notNull(),state:text('state').notNull(),responseId:text('response_id'),totalTokens:integer('total_tokens')},t=>({operation:uniqueIndex('seva_byok_request').on(t.ownerId,t.requestId),recent:index('seva_byok_recent').on(t.ownerId,t.startedAt)}));

export const executiveAccounts=sqliteTable('seva_executive_accounts',{ownerId:text('owner_id').primaryKey(),budgetMicroUSD:integer('budget_micro_usd').notNull(),revision:integer('revision').notNull(),enabled:integer('enabled').notNull(),expiresAt:integer('expires_at').notNull()});
export const executiveJobs=sqliteTable('seva_executive_jobs',{id:text('id').primaryKey(),ownerId:text('owner_id').notNull(),operationId:text('operation_id').notNull(),goalId:text('goal_id').notNull(),goalRevision:integer('goal_revision').notNull(),title:text('title').notNull(),prompt:text('prompt').notNull(),state:text('state').notNull(),reservedMicroUSD:integer('reserved_micro_usd').notNull(),answer:text('answer'),responseId:text('response_id'),error:text('error'),createdAt:integer('created_at').notNull(),updatedAt:integer('updated_at').notNull()},t=>({operationGoal:uniqueIndex('seva_executive_operation_goal').on(t.ownerId,t.operationId,t.goalId),ownerState:index('seva_executive_owner_state').on(t.ownerId,t.state),oneRunning:uniqueIndex('seva_executive_one_running').on(t.ownerId).where(sql`${t.state} = 'running'`)}));

export const whatsappReceipts=sqliteTable('seva_whatsapp_receipts',{
 receiptDigest:text('receipt_digest').primaryKey(),
 contextDigest:text('context_digest').notNull(),
 messageDigest:text('message_digest').notNull(),
 status:text('status').notNull(),
 providerTimestamp:integer('provider_timestamp').notNull(),
 receivedAt:integer('received_at').notNull()
},t=>({
 contextMessage:index('seva_whatsapp_receipts_context_message').on(t.contextDigest,t.messageDigest,t.status,t.providerTimestamp),
 receiptLength:check('seva_whatsapp_receipt_digest_length',sql`length(${t.receiptDigest})=64`),
 contextLength:check('seva_whatsapp_context_digest_length',sql`length(${t.contextDigest})=64`),
 messageLength:check('seva_whatsapp_message_digest_length',sql`length(${t.messageDigest})=64`),
 allowedStatus:check('seva_whatsapp_status_allowed',sql`${t.status} IN ('sent','delivered','read','failed')`),
 providerTime:check('seva_whatsapp_provider_time_positive',sql`${t.providerTimestamp}>0`),
 receivedTime:check('seva_whatsapp_received_time_positive',sql`${t.receivedAt}>0`)
}));

export const billingTrialIntents=sqliteTable('seva_billing_trial_intents',{token:text('token').primaryKey(),trialEnd:integer('trial_end').notNull()});
export const billingTrials=sqliteTable('seva_billing_trials',{subscriptionId:text('subscription_id').primaryKey(),mode:text('mode').notNull(),priceId:text('price_id').notNull(),trialStart:integer('trial_start').notNull(),trialEnd:integer('trial_end').notNull()});

export const propertyWorkspaces=sqliteTable('seva_property_workspaces',{ownerId:text('owner_id').primaryKey(),revision:integer('revision').notNull(),propertiesJson:text('properties_json').notNull(),visitsJson:text('visits_json').notNull(),operationId:text('operation_id').notNull(),payloadHash:text('payload_hash').notNull(),updatedAt:text('updated_at').notNull()});

export const propertyRequirements=sqliteTable('seva_property_requirements',{ownerId:text('owner_id').primaryKey(),revision:integer('revision').notNull(),requirementsJson:text('requirements_json').notNull(),operationId:text('operation_id').notNull(),payloadHash:text('payload_hash').notNull(),updatedAt:text('updated_at').notNull()});

export const propertyAvailability=sqliteTable('synapsy_property_availability',{
 ownerId:text('owner_id').primaryKey(),revision:integer('revision').notNull(),unitsJson:text('units_json').notNull(),
 operationId:text('operation_id').notNull(),payloadHash:text('payload_hash').notNull(),updatedAt:text('updated_at').notNull()
},t=>({revisionValid:check('synapsy_property_availability_revision',sql`${t.revision}>=1`),
 unitsValid:check('synapsy_property_availability_units',sql`json_valid(${t.unitsJson}) AND json_type(${t.unitsJson})='array' AND json_array_length(${t.unitsJson})<=100`),
 hashValid:check('synapsy_property_availability_hash',sql`length(${t.payloadHash})=64`)
}));
export const propertyAvailabilityOperations=sqliteTable('synapsy_property_availability_operations',{
 ownerId:text('owner_id').notNull(),operationId:text('operation_id').notNull(),action:text('action').notNull(),requestHash:text('request_hash').notNull(),
 appliedRevision:integer('applied_revision').notNull(),receiptJson:text('receipt_json').notNull(),receiptHash:text('receipt_hash').notNull(),
 auditJson:text('audit_json').notNull(),auditHash:text('audit_hash').notNull(),createdAt:text('created_at').notNull()
},t=>({primary:primaryKey({columns:[t.ownerId,t.operationId]}),
 ownerRevision:uniqueIndex('synapsy_property_availability_operation_revision').on(t.ownerId,t.appliedRevision),
 actionValid:check('synapsy_property_availability_operation_action',sql`${t.action} IN ('upsert','archive','restore')`),
 revisionValid:check('synapsy_property_availability_operation_revision',sql`${t.appliedRevision}>=1`),
 hashesValid:check('synapsy_property_availability_operation_hashes',sql`length(${t.requestHash})=64 AND length(${t.receiptHash})=64 AND length(${t.auditHash})=64`),
 receiptValid:check('synapsy_property_availability_operation_receipt',sql`json_valid(${t.receiptJson}) AND json_type(${t.receiptJson})='object'`),
 auditValid:check('synapsy_property_availability_operation_audit',sql`json_valid(${t.auditJson}) AND json_type(${t.auditJson})='array'`)
}));

export const synapsyOperationReceipts=sqliteTable('synapsy_operation_receipts',{
 ownerId:text('owner_id').notNull(),operationId:text('operation_id').notNull(),requestHash:text('request_hash').notNull(),status:text('status').notNull(),revision:integer('revision').notNull().default(1),receiptJson:text('receipt_json').notNull(),receiptHash:text('receipt_hash').notNull(),startedAt:text('started_at').notNull(),finishedAt:text('finished_at')
},t=>({
 primary:primaryKey({columns:[t.ownerId,t.operationId]}),
 ownerStarted:index('synapsy_operation_owner_started').on(t.ownerId,t.startedAt),
 statusAllowed:check('synapsy_operation_status',sql`${t.status} IN ('running','completed','interrupted')`),
 revisionAllowed:check('synapsy_operation_revision',sql`${t.revision} IN (1,2)`)
}));

export const powerBIRefreshes=sqliteTable('seva_powerbi_refreshes',{operationId:text('operation_id').primaryKey(),target:text('target').notNull(),state:text('state').notNull(),requestId:text('request_id'),active:integer('active').notNull().default(1),createdAt:text('created_at').notNull(),updatedAt:text('updated_at').notNull()},t=>({singleActive:uniqueIndex('seva_powerbi_single_active').on(t.target).where(sql`active = 1`)}));

export const aiSpendingLimits=sqliteTable('seva_ai_spending_limits',{ownerId:text('owner_id').primaryKey(),period:text('period').notNull(),monthlyMicroUSD:integer('monthly_micro_usd').notNull(),requestMicroUSD:integer('request_micro_usd').notNull(),paused:integer('paused').notNull(),revision:integer('revision').notNull()});
export const aiSpendingReservations=sqliteTable('seva_ai_spending_reservations',{id:text('id').primaryKey(),ownerId:text('owner_id').notNull(),requestId:text('request_id').notNull(),period:text('period').notNull(),kind:text('kind').notNull(),reservedMicroUSD:integer('reserved_micro_usd').notNull(),createdAt:integer('created_at').notNull()},t=>({operation:uniqueIndex('seva_ai_spending_operation').on(t.ownerId,t.requestId),monthly:index('seva_ai_spending_monthly').on(t.ownerId,t.period)}));

export const synapsyStudioAssets=sqliteTable('synapsy_studio_assets',{
 ownerId:text('owner_id').notNull(),id:text('id').notNull(),revision:integer('revision').notNull(),recordJson:text('record_json').notNull(),archived:integer('archived').notNull().default(0),lastOperationId:text('last_operation_id').notNull(),createdAt:text('created_at').notNull(),updatedAt:text('updated_at').notNull()
},t=>({primary:primaryKey({columns:[t.ownerId,t.id]}),ownerUpdated:index('synapsy_studio_assets_owner_updated').on(t.ownerId,t.updatedAt),revisionValid:check('synapsy_studio_assets_revision',sql`${t.revision}>=1`)}));
export const synapsyStudioOperations=sqliteTable('synapsy_studio_operations',{
 ownerId:text('owner_id').notNull(),operationId:text('operation_id').notNull(),requestHash:text('request_hash').notNull(),responseJson:text('response_json').notNull(),createdAt:text('created_at').notNull()
},t=>({primary:primaryKey({columns:[t.ownerId,t.operationId]})}));
export const synapsyStudioFiles=sqliteTable('synapsy_studio_files',{
 ownerId:text('owner_id').notNull(),id:text('id').notNull(),assetId:text('asset_id').notNull(),operationId:text('operation_id').notNull(),requestHash:text('request_hash').notNull(),objectKey:text('object_key').notNull(),name:text('name').notNull(),mime:text('mime').notNull(),size:integer('size').notNull(),sha256:text('sha256').notNull(),state:text('state').notNull(),createdAt:text('created_at').notNull()
},t=>({primary:primaryKey({columns:[t.ownerId,t.id]}),operation:uniqueIndex('synapsy_studio_files_operation').on(t.ownerId,t.operationId),asset:index('synapsy_studio_files_asset').on(t.ownerId,t.assetId),stateValid:check('synapsy_studio_files_state',sql`${t.state} IN ('pending','ready')`),sizeValid:check('synapsy_studio_files_size',sql`${t.size}>0 AND ${t.size}<=10485760`)}));
export const synapsyStudioPublications=sqliteTable('synapsy_studio_publications',{
 ownerId:text('owner_id').notNull(),id:text('id').primaryKey(),assetId:text('asset_id').notNull(),sourceRevision:integer('source_revision').notNull(),snapshotJson:text('snapshot_json').notNull(),approvalHash:text('approval_hash').notNull(),state:text('state').notNull(),publishAt:text('publish_at').notNull(),preflightAt:text('preflight_at').notNull(),publishedAt:text('published_at'),reason:text('reason').notNull().default(''),lastOperationId:text('last_operation_id').notNull(),updatedAt:text('updated_at').notNull()
},t=>({due:index('synapsy_studio_publication_due').on(t.ownerId,t.state,t.publishAt),stateValid:check('synapsy_studio_publication_state',sql`${t.state} IN ('scheduled','published','cancelled','blocked')`)}));
export const synapsyStudioRuns=sqliteTable('synapsy_studio_runs',{
 ownerId:text('owner_id').notNull(),id:text('id').notNull(),receiptJson:text('receipt_json').notNull(),createdAt:text('created_at').notNull()
},t=>({primary:primaryKey({columns:[t.ownerId,t.id]}),recent:index('synapsy_studio_runs_recent').on(t.ownerId,t.createdAt)}));
export const synapsyDeals=sqliteTable('synapsy_deals',{
 id:text('id').primaryKey(),creatorId:text('creator_id').notNull(),peerId:text('peer_id'),title:text('title').notNull(),category:text('category').notNull(),description:text('description').notNull(),assetId:text('asset_id').notNull().default(''),proposalJson:text('proposal_json').notNull(),proposalVersion:integer('proposal_version').notNull(),proposalHash:text('proposal_hash').notNull(),creatorConfirmedVersion:integer('creator_confirmed_version'),peerConfirmedVersion:integer('peer_confirmed_version'),status:text('status').notNull(),revision:integer('revision').notNull(),inviteHash:text('invite_hash'),inviteExpiresAt:text('invite_expires_at'),lastOperationId:text('last_operation_id').notNull(),lastActorId:text('last_actor_id').notNull(),createdAt:text('created_at').notNull(),updatedAt:text('updated_at').notNull()
},t=>({invite:uniqueIndex('synapsy_deals_invite').on(t.inviteHash),creatorUpdated:index('synapsy_deals_creator_updated').on(t.creatorId,t.updatedAt,t.id),peerUpdated:index('synapsy_deals_peer_updated').on(t.peerId,t.updatedAt,t.id)}));
export const synapsyDealOperations=sqliteTable('synapsy_deal_operations',{
 actorId:text('actor_id').notNull(),operationId:text('operation_id').notNull(),dealId:text('deal_id').notNull(),requestHash:text('request_hash').notNull(),action:text('action').notNull(),actorRole:text('actor_role').notNull(),appliedRevision:integer('applied_revision').notNull(),proposalVersion:integer('proposal_version').notNull(),createdAt:text('created_at').notNull()
},t=>({primary:primaryKey({columns:[t.actorId,t.operationId]}),dealRevision:index('synapsy_deal_operations_deal_revision').on(t.dealId,t.appliedRevision)}));
export const synapsyDealVersions=sqliteTable('synapsy_deal_versions',{
 dealId:text('deal_id').notNull(),version:integer('version').notNull(),proposalJson:text('proposal_json').notNull(),proposalHash:text('proposal_hash').notNull(),actorRole:text('actor_role').notNull(),createdAt:text('created_at').notNull()
},t=>({primary:primaryKey({columns:[t.dealId,t.version]})}));

export const synapsyMessengerInbox=sqliteTable('synapsy_messenger_inbox',{
 receiptId:text('receipt_id').primaryKey().notNull(),contextDigest:text('context_digest').notNull(),senderId:text('sender_id').notNull(),messageText:text('message_text').notNull(),providerTimestamp:integer('provider_timestamp').notNull(),receivedAt:integer('received_at').notNull()
},t=>({contextTime:index('synapsy_messenger_inbox_context_time').on(t.contextDigest,t.providerTimestamp,t.receiptId),receiptValid:check('synapsy_messenger_receipt_valid',sql`length(${t.receiptId})=64`),contextValid:check('synapsy_messenger_context_valid',sql`length(${t.contextDigest})=64`),senderValid:check('synapsy_messenger_sender_valid',sql`length(${t.senderId}) BETWEEN 1 AND 32`),textValid:check('synapsy_messenger_text_valid',sql`length(${t.messageText}) BETWEEN 1 AND 2000`),providerTimeValid:check('synapsy_messenger_provider_time',sql`${t.providerTimestamp}>0`),receivedTimeValid:check('synapsy_messenger_received_time',sql`${t.receivedAt}>0`)}));
export const synapsyTelecomOperations=sqliteTable('synapsy_telecom_operations',{
 ownerId:text('owner_id').notNull(),operationId:text('operation_id').notNull(),requestHash:text('request_hash').notNull(),channel:text('channel').notNull(),contextDigest:text('context_digest').notNull(),contactId:text('contact_id').notNull(),consentDigest:text('consent_digest').notNull(),destinationDigest:text('destination_digest').notNull(),crmRevision:integer('crm_revision').notNull(),status:text('status').notNull(),providerReference:text('provider_reference'),createdAt:text('created_at').notNull(),updatedAt:text('updated_at').notNull()
},t=>({primary:primaryKey({columns:[t.ownerId,t.operationId]}),ownerTime:index('synapsy_telecom_operations_owner_time').on(t.ownerId,t.createdAt),hashValid:check('synapsy_telecom_request_hash',sql`length(${t.requestHash})=64`),channelValid:check('synapsy_telecom_channel',sql`${t.channel} IN ('messenger','sms','whatsapp')`),contextValid:check('synapsy_telecom_context',sql`length(${t.contextDigest})=64`),consentValid:check('synapsy_telecom_consent',sql`length(${t.consentDigest})=64`),destinationValid:check('synapsy_telecom_destination',sql`length(${t.destinationDigest})=64`),revisionValid:check('synapsy_telecom_revision',sql`${t.crmRevision}>0`),stateValid:check('synapsy_telecom_state',sql`${t.status} IN ('reserved','accepted','rejected','unknown')`)}));

export const synapsyPremiumCandidates=sqliteTable('synapsy_premium_candidates',{
 id:text('id').primaryKey().notNull(),ownerId:text('owner_id').notNull(),revision:integer('revision').notNull(),dataJson:text('data_json').notNull(),listed:integer('listed').notNull(),expiresAt:text('expires_at').notNull(),lastOperationId:text('last_operation_id').notNull(),createdAt:text('created_at').notNull(),updatedAt:text('updated_at').notNull()
},t=>({owner:uniqueIndex('synapsy_premium_candidate_owner').on(t.ownerId),catalog:index('synapsy_premium_candidate_catalog').on(t.listed,t.expiresAt,t.updatedAt),revisionValid:check('synapsy_premium_candidate_revision',sql`${t.revision}>0`),listedValid:check('synapsy_premium_candidate_listed',sql`${t.listed} IN (0,1)`),dataValid:check('synapsy_premium_candidate_json',sql`json_valid(${t.dataJson}) AND json_type(${t.dataJson})='object'`)}));
export const synapsyPremiumRequests=sqliteTable('synapsy_premium_requests',{
 id:text('id').primaryKey().notNull(),candidateId:text('candidate_id').notNull(),professionalId:text('professional_id').notNull(),professionalName:text('professional_name').notNull(),company:text('company').notNull(),purpose:text('purpose').notNull(),status:text('status').notNull(),revision:integer('revision').notNull(),candidateRevision:integer('candidate_revision').notNull(),expiresAt:text('expires_at').notNull(),approvedAt:text('approved_at'),policy:text('policy'),lastOperationId:text('last_operation_id').notNull(),createdAt:text('created_at').notNull(),updatedAt:text('updated_at').notNull()
},t=>({pair:uniqueIndex('synapsy_premium_request_pair').on(t.candidateId,t.professionalId),incoming:index('synapsy_premium_request_candidate').on(t.candidateId,t.createdAt),outgoing:index('synapsy_premium_request_professional').on(t.professionalId,t.createdAt),statusValid:check('synapsy_premium_request_status',sql`${t.status} IN ('requested','approved','declined','revoked')`),revisionValid:check('synapsy_premium_request_revision',sql`${t.revision}>0 AND ${t.candidateRevision}>0`),purposeValid:check('synapsy_premium_request_purpose',sql`${t.purpose} IN ('property','bnb')`)}));
export const synapsyPremiumOperations=sqliteTable('synapsy_premium_operations',{
 actorId:text('actor_id').notNull(),operationId:text('operation_id').notNull(),requestHash:text('request_hash').notNull(),targetId:text('target_id').notNull(),action:text('action').notNull(),createdAt:text('created_at').notNull()
},t=>({primary:primaryKey({columns:[t.actorId,t.operationId]}),recent:index('synapsy_premium_operations_actor_time').on(t.actorId,t.createdAt),hashValid:check('synapsy_premium_operation_hash',sql`length(${t.requestHash})=64`)}));
