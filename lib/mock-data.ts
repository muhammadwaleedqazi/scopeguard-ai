import type {
  ActionItem,
  Project,
  ProjectAnalysis,
  ScopeCheck,
  ScopeFinding,
} from "@/types/project";

export const DEMO_MESSAGE =
  "Please also add product reviews, discount codes, live chat and complete everything by Friday.";

const id = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;

function mergeActionStatuses(
  actions: ActionItem[],
  existing?: ProjectAnalysis,
): ActionItem[] {
  if (!existing) return actions;
  return actions.map((action) => ({
    ...action,
    status:
      existing.actionItems.find((item) => item.task === action.task)?.status ??
      action.status,
  }));
}

export function createDemoAnalysis(
  analysedAt = new Date().toISOString(),
  existing?: ProjectAnalysis,
): ProjectAnalysis {
  const actions: ActionItem[] = [
    {
      id: "demo-action-products",
      task: "Supply final product catalogue, prices, and photography",
      owner: "ABC Clothing",
      deadline: "End of week one",
      status: "pending",
      evidence: "Product catalogue content is needed before implementation can be completed.",
    },
    {
      id: "demo-action-build",
      task: "Build and test the approved responsive storefront",
      owner: "Freelancer",
      deadline: "Within three weeks",
      status: "pending",
      evidence: "Delivery was agreed within three weeks.",
    },
  ];

  return {
    summary:
      "Design and build a responsive e-commerce website for ABC Clothing, focused on product discovery and cart functionality. Online payment is explicitly deferred to a later phase.",
    requirements: [
      {
        id: "demo-req-responsive",
        text: "Responsive online shop for mobile and desktop",
        status: "confirmed",
        evidence: "“Build a responsive online shop”",
      },
      {
        id: "demo-req-catalogue",
        text: "Browsable product catalogue",
        status: "confirmed",
        evidence: "“with a product catalogue”",
      },
      {
        id: "demo-req-cart",
        text: "Shopping cart",
        status: "confirmed",
        evidence: "“shopping cart”",
      },
      {
        id: "demo-req-contact",
        text: "Customer contact form",
        status: "confirmed",
        evidence: "“and contact form”",
      },
      {
        id: "demo-req-payment",
        text: "Payment gateway implementation",
        status: "proposed",
        evidence: "“Payment gateway work was postponed to phase two.”",
      },
      {
        id: "demo-req-content",
        text: "Final product content and photography",
        status: "unclear",
        evidence: "The brief does not identify who will supply catalogue content.",
      },
    ],
    decisions: [
      {
        id: "demo-decision-homepage",
        text: "Homepage layout approved by the client",
        evidence: "“The client approved the homepage layout.”",
      },
      {
        id: "demo-decision-payment",
        text: "Payment gateway moved to phase two",
        evidence: "“Payment gateway work was postponed to phase two.”",
      },
    ],
    deadlines: [
      {
        id: "demo-deadline-delivery",
        task: "Complete the agreed website scope",
        date: "Within three weeks",
        evidence: "“Delivery is required within three weeks.”",
      },
    ],
    actionItems: mergeActionStatuses(actions, existing),
    openQuestions: [
      "Who will supply final product descriptions, prices, and photography?",
      "What browser and device support is expected for launch?",
    ],
    clientPreferences: [
      "Use the approved homepage layout",
      "Keep online payment outside the first delivery phase",
    ],
    people: ["ABC Clothing project contact", "Freelance delivery partner"],
    analysedAt,
    source: "demo",
  };
}

export function createMockAnalysis(project: Project): ProjectAnalysis {
  const analysedAt = new Date().toISOString();
  const excerpt =
    project.originalContext.length > 180
      ? `${project.originalContext.slice(0, 177)}…`
      : project.originalContext;

  return {
    summary: `${project.name} is a client engagement for ${project.clientName}. The current record establishes the core delivery, while several operational details should be confirmed before work progresses.`,
    requirements: [
      {
        id: id("requirement"),
        text: `Deliver the core outcome described for ${project.name}`,
        status: "confirmed",
        evidence: excerpt,
      },
      {
        id: id("requirement"),
        text: "Confirm the final review and approval process",
        status: "unclear",
        evidence: "No explicit approval process was found in the saved context.",
      },
      {
        id: id("requirement"),
        text: "Document any additional deliverables requested after kickoff",
        status: "proposed",
        evidence: "Additional deliverables should be confirmed separately before work begins.",
      },
    ],
    decisions: [
      {
        id: id("decision"),
        text: "The saved client context is the current source of truth",
        evidence: excerpt,
      },
    ],
    deadlines: [
      {
        id: id("deadline"),
        task: "Confirm the delivery milestone",
        date: "Date not yet confirmed",
        evidence: "No unambiguous delivery date was found in the saved context.",
      },
    ],
    actionItems: [
      {
        id: id("action"),
        task: "Confirm deliverables, timing, and approval responsibilities with the client",
        owner: "Freelancer",
        status: "pending",
      },
    ],
    openQuestions: [
      "What is the final delivery date?",
      "Who has authority to approve completed work?",
    ],
    clientPreferences: ["Use the saved brief as the baseline for future scope discussions"],
    people: [project.clientName],
    analysedAt,
    source: "mock",
  };
}

function finding(text: string, reason: string): ScopeFinding {
  return { id: id("finding"), text, reason };
}

export function createMockScopeCheck(
  project: Project,
  newMessage: string,
): ScopeCheck {
  const normalized = newMessage.toLowerCase();
  const featureMatches = [
    {
      terms: ["product review", "reviews"],
      text: "Product reviews",
      reason: "Reviews do not appear in the confirmed catalogue, cart, or contact-form scope.",
    },
    {
      terms: ["discount code", "coupon"],
      text: "Discount codes",
      reason: "Promotional pricing and discount-code logic were not included in the original requirements.",
    },
    {
      terms: ["live chat", "chat widget"],
      text: "Live chat",
      reason: "No real-time support or chat capability was included in the confirmed scope.",
    },
  ].filter((feature) =>
    feature.terms.some((term) => normalized.includes(term)),
  );
  const deadlineChanged =
    normalized.includes("friday") ||
    normalized.includes("tomorrow") ||
    normalized.includes("urgent") ||
    normalized.includes("asap");
  const asksForAddition =
    featureMatches.length > 0 ||
    /\b(add|also|include|extra|another|new)\b/i.test(newMessage);

  const newRequests =
    featureMatches.length > 0
      ? featureMatches.map((feature) => finding(feature.text, feature.reason))
      : asksForAddition
        ? [
            finding(
              "Additional deliverable described in the new message",
              "The request adds work that is not clearly present in the confirmed project record.",
            ),
          ]
        : [];

  const changedRequirements = deadlineChanged
    ? [
        finding(
          "Accelerated delivery deadline",
          "The new message requests completion sooner than the recorded delivery expectation.",
        ),
      ]
    : [];

  const conflicts = deadlineChanged
    ? [
        finding(
          "Requested deadline conflicts with the agreed timeline",
          project.isDemo
            ? "Completion by Friday conflicts with the original three-week delivery window."
            : "The accelerated timing should be reconciled with the delivery milestone in the project record.",
        ),
      ]
    : [];

  const riskLevel =
    featureMatches.length >= 2 && deadlineChanged
      ? "high"
      : newRequests.length > 0 && deadlineChanged
        ? "medium"
        : newRequests.length > 0
          ? "low"
          : "none";

  const isScopeChange = riskLevel !== "none";
  const possibleImpact = isScopeChange
    ? [
        "Additional delivery time may be required to design, build, and test the requested work.",
        "The project price may need to be revised before the additional work begins.",
        ...(deadlineChanged
          ? ["Compressing the schedule could reduce testing time or require reprioritising agreed work."]
          : []),
      ]
    : ["No material impact is apparent from the message as written."];

  return {
    id: id("scope-check"),
    newMessage,
    isScopeChange,
    riskLevel,
    newRequests,
    changedRequirements,
    conflicts,
    explanation: isScopeChange
      ? "The message introduces work or timing that is not part of the confirmed project baseline. It should be clarified and agreed before implementation."
      : "The message does not appear to materially change the confirmed deliverables or timeline.",
    possibleImpact,
    suggestedReply:
      riskLevel === "high"
        ? `Hi, thanks for sending these additions. Product reviews, discount codes, and live chat are not included in our currently agreed scope, and completing them by Friday would also change the original three-week delivery plan. I’m happy to add them, but I’ll need to assess the extra design, development, and testing effort first. I can send you a revised timeline and cost, or we can prioritise the original agreed deliverables for the current deadline and schedule these additions as a follow-up phase. Please let me know which option you prefer.`
        : isScopeChange
          ? `Hi, thanks for the update. This appears to add to or change the scope we originally agreed. I’m happy to review it and confirm the impact on timing and cost before I begin the additional work. Once we agree the revised scope, I’ll update the project plan accordingly.`
          : `Hi, thanks for the update. This looks consistent with our agreed project scope. I’ll keep it with the project record and continue against the confirmed plan.`,
    checkedAt: new Date().toISOString(),
    source: project.isDemo ? "demo" : "mock",
  };
}
