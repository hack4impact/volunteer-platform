import {
  CauseArea,
  ClaimStatus,
  LinkType,
  PrismaClient,
  Role,
  SourcedProjectStatus,
} from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

// All seed users share this password. Local development only.
const SEED_PASSWORD = "password";

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

const CHAPTERS = [
  { id: "seed-chapter-uiuc", name: "UIUC", region: "Midwest" },
  { id: "seed-chapter-berkeley", name: "UC Berkeley", region: "West" },
  { id: "seed-chapter-gt", name: "Georgia Tech", region: "Southeast" },
  { id: "seed-chapter-bu", name: "Boston University", region: "Northeast" },
] as const;

type ChapterId = (typeof CHAPTERS)[number]["id"];

const USERS: {
  id: string;
  name: string;
  email: string;
  role: Role;
  chapterId: ChapterId | null;
}[] = [
  {
    id: "seed-user-admin",
    name: "Admin",
    email: "admin@hack4impact.org",
    role: "ADMIN",
    chapterId: null,
  },
  {
    id: "seed-user-lead-uiuc",
    name: "UIUC Lead",
    email: "lead.uiuc@hack4impact.org",
    role: "CHAPTER_LEADER",
    chapterId: "seed-chapter-uiuc",
  },
  {
    id: "seed-user-lead-berkeley",
    name: "Berkeley Lead",
    email: "lead.berkeley@hack4impact.org",
    role: "CHAPTER_LEADER",
    chapterId: "seed-chapter-berkeley",
  },
  {
    id: "seed-user-lead-gt",
    name: "Georgia Tech Lead",
    email: "lead.gt@hack4impact.org",
    role: "CHAPTER_LEADER",
    chapterId: "seed-chapter-gt",
  },
  {
    id: "seed-user-lead-bu",
    name: "BU Lead",
    email: "lead.bu@hack4impact.org",
    role: "CHAPTER_LEADER",
    chapterId: "seed-chapter-bu",
  },
  {
    id: "seed-user-volunteer-uiuc",
    name: "UIUC Volunteer",
    email: "volunteer.uiuc@hack4impact.org",
    role: "VOLUNTEER",
    chapterId: "seed-chapter-uiuc",
  },
  {
    id: "seed-user-volunteer-berkeley",
    name: "Berkeley Volunteer",
    email: "volunteer.berkeley@hack4impact.org",
    role: "VOLUNTEER",
    chapterId: "seed-chapter-berkeley",
  },
];

const leadOf = (chapterId: ChapterId) =>
  USERS.find((u) => u.role === "CHAPTER_LEADER" && u.chapterId === chapterId)!
    .id;

type SeedListing = {
  id: string;
  title: string;
  description: string;
  scope: string;
  causeArea: CauseArea;
  techContext?: string;
  status: SourcedProjectStatus;
  handoffNotes: string;
  sourcingChapterId: ChapterId;
  postedDaysAgo: number;
  verifiedDaysAgo: number;
  withdrawnDaysAgo?: number;
  clientOrgName: string;
  clientContactName: string;
  clientContactEmail: string;
  clientContactPhone?: string;
  partnerNotes?: string;
};

// Fictional organizations and contacts.
const LISTINGS: SeedListing[] = [
  {
    id: "seed-listing-01",
    title: "Volunteer shift scheduler for a community food bank",
    description:
      "A regional food bank coordinates 300+ weekly volunteers through a shared spreadsheet and group texts. They want a self-serve scheduling tool where volunteers sign up for warehouse and distribution shifts.",
    scope:
      "Volunteer sign-up, shift capacity limits, reminder emails, and an admin view of coverage gaps. Roughly one semester for a team of 4-5.",
    causeArea: "FOOD_SECURITY",
    techContext: "Uses Google Workspace. No existing web app.",
    status: "AVAILABLE",
    handoffNotes:
      "Two scoping calls completed. Requirements doc drafted and approved by their operations manager. We did not have a team available this semester.",
    sourcingChapterId: "seed-chapter-uiuc",
    postedDaysAgo: 20,
    verifiedDaysAgo: 10,
    clientOrgName: "Prairie Harvest Food Bank",
    clientContactName: "Dana Whitfield",
    clientContactEmail: "dana.whitfield@example.org",
    clientContactPhone: "555-0101",
    partnerNotes: "Very responsive over email. Prefers Tuesday calls.",
  },
  {
    id: "seed-listing-02",
    title: "Tutor matching platform for after-school literacy program",
    description:
      "An after-school literacy nonprofit manually matches volunteer tutors with K-5 students based on availability and reading level.",
    scope:
      "Tutor and student profiles, a matching algorithm with manual override, and session logging. Medium-sized; one semester.",
    causeArea: "EDUCATION",
    status: "AVAILABLE",
    handoffNotes:
      "Discovery complete. They shared anonymized sample data. Next step was wireframes.",
    sourcingChapterId: "seed-chapter-berkeley",
    postedDaysAgo: 35,
    verifiedDaysAgo: 30,
    clientOrgName: "Bright Pages Literacy",
    clientContactName: "Marcus Lee",
    clientContactEmail: "marcus@example.org",
    partnerNotes:
      "Student data is sensitive. They will require an FERPA-style data agreement.",
  },
  {
    id: "seed-listing-03",
    title: "Housing waitlist tracker for a tenant advocacy group",
    description:
      "A tenant advocacy group tracks families waiting for affordable housing placements in disconnected spreadsheets across caseworkers.",
    scope:
      "Centralized case records, status pipeline, and caseworker assignment. One to two semesters.",
    causeArea: "HOUSING",
    techContext: "Currently on Airtable free tier; open to migrating.",
    status: "CLAIM_PENDING",
    handoffNotes:
      "Vetted and scoped. Partner signed our MOU template. Stalled because our only senior dev graduated.",
    sourcingChapterId: "seed-chapter-gt",
    postedDaysAgo: 14,
    verifiedDaysAgo: 7,
    clientOrgName: "Peachtree Tenant Alliance",
    clientContactName: "Rosa Alvarez",
    clientContactEmail: "rosa.alvarez@example.org",
    clientContactPhone: "555-0103",
  },
  {
    id: "seed-listing-04",
    title: "Clinic appointment reminder system",
    description:
      "A free health clinic loses a large share of appointments to no-shows and wants automated SMS reminders.",
    scope:
      "SMS reminders with confirm/cancel replies, integrated with their appointment export. Small; half a semester.",
    causeArea: "HEALTH",
    techContext:
      "Appointment data exports as CSV from their EHR. No API access.",
    status: "CLAIMED",
    handoffNotes:
      "Scoping complete. They obtained a Twilio nonprofit grant already.",
    sourcingChapterId: "seed-chapter-bu",
    postedDaysAgo: 60,
    verifiedDaysAgo: 40,
    clientOrgName: "Commonwealth Free Clinic",
    clientContactName: "Dr. Priya Nair",
    clientContactEmail: "pnair@example.org",
    partnerNotes: "Must not store any PHI outside their systems.",
  },
  {
    id: "seed-listing-05",
    title: "Tree planting impact map",
    description:
      "An urban forestry nonprofit wants a public map showing every tree they have planted, with species and planting date.",
    scope:
      "Public map, admin upload of planting records, and simple stats. Small to medium.",
    causeArea: "ENVIRONMENT",
    status: "AVAILABLE",
    handoffNotes:
      "One intro call. They sent a sample dataset of ~4,000 trees with coordinates.",
    sourcingChapterId: "seed-chapter-uiuc",
    postedDaysAgo: 8,
    verifiedDaysAgo: 8,
    clientOrgName: "Green Canopy Collective",
    clientContactName: "Eli Bauer",
    clientContactEmail: "eli@example.org",
  },
  {
    id: "seed-listing-06",
    title: "Job readiness course tracker",
    description:
      "A workforce development nonprofit runs job readiness courses and tracks attendance and placement outcomes on paper.",
    scope:
      "Course enrollment, attendance tracking, and outcome reporting for grant applications. One semester.",
    causeArea: "ECONOMIC_OPPORTUNITY",
    status: "AVAILABLE",
    handoffNotes:
      "Requirements gathered. Their grant reporting template is attached in the scoping doc.",
    sourcingChapterId: "seed-chapter-berkeley",
    postedDaysAgo: 90,
    verifiedDaysAgo: 85,
    clientOrgName: "Bay Pathways Workforce",
    clientContactName: "Tanya Brooks",
    clientContactEmail: "tbrooks@example.org",
    clientContactPhone: "555-0106",
    partnerNotes: "Interest not reconfirmed recently. Check before claiming.",
  },
  {
    id: "seed-listing-07",
    title: "Youth arts program registration site",
    description:
      "A youth arts nonprofit wants online registration and payment-free scholarship applications for summer programs.",
    scope:
      "Program catalog, registration forms, scholarship review workflow. One semester.",
    causeArea: "ARTS_AND_CULTURE",
    status: "AVAILABLE",
    handoffNotes:
      "Scoped with their program director. Design mockups were started but not finished.",
    sourcingChapterId: "seed-chapter-gt",
    postedDaysAgo: 25,
    verifiedDaysAgo: 12,
    clientOrgName: "Southside Youth Arts",
    clientContactName: "Jordan Kim",
    clientContactEmail: "jkim@example.org",
  },
  {
    id: "seed-listing-08",
    title: "Voter registration drive coordinator",
    description:
      "A nonpartisan civic group runs voter registration drives at campuses and community events and needs to coordinate volunteers and track registrations.",
    scope:
      "Event scheduling, volunteer check-in, and registration counts by event. Small to medium.",
    causeArea: "CIVIC_ENGAGEMENT",
    status: "CLAIM_PENDING",
    handoffNotes:
      "Vetted. Time-sensitive: they want it before the spring election cycle.",
    sourcingChapterId: "seed-chapter-bu",
    postedDaysAgo: 10,
    verifiedDaysAgo: 3,
    clientOrgName: "Civic Bridge Boston",
    clientContactName: "Sam Ortiz",
    clientContactEmail: "sortiz@example.org",
  },
  {
    id: "seed-listing-09",
    title: "Mobile pantry route planner",
    description:
      "A mobile food pantry wants help planning weekly delivery routes across rural stops.",
    scope:
      "Stop management and route optimization with printable driver sheets. Medium.",
    causeArea: "FOOD_SECURITY",
    techContext: "Drivers use Android phones. Spotty connectivity on routes.",
    status: "IN_PROGRESS",
    handoffNotes: "Handed off after scoping. Claiming chapter is now building.",
    sourcingChapterId: "seed-chapter-uiuc",
    postedDaysAgo: 120,
    verifiedDaysAgo: 100,
    clientOrgName: "Heartland Mobile Pantry",
    clientContactName: "Beth Harlow",
    clientContactEmail: "bharlow@example.org",
  },
  {
    id: "seed-listing-10",
    title: "Mental health resource directory",
    description:
      "A student mental health nonprofit wants a searchable directory of free and sliding-scale mental health resources by region.",
    scope:
      "Resource directory with search and filters, plus a submission form for new resources. One semester.",
    causeArea: "HEALTH",
    status: "AVAILABLE",
    handoffNotes:
      "Scoped and vetted. They have a content volunteer ready to populate data.",
    sourcingChapterId: "seed-chapter-berkeley",
    postedDaysAgo: 5,
    verifiedDaysAgo: 5,
    clientOrgName: "Open Minds Network",
    clientContactName: "Avery Chen",
    clientContactEmail: "avery@example.org",
  },
  {
    id: "seed-listing-11",
    title: "Adult ESL class attendance app",
    description:
      "An adult ESL program needs simple attendance and progress tracking across five community sites.",
    scope:
      "Attendance check-in, level placement tracking, multilingual UI. Small to medium.",
    causeArea: "EDUCATION",
    status: "AVAILABLE",
    handoffNotes:
      "A previous claim was abandoned mid-semester. Partner is still interested and the original scoping doc is current.",
    sourcingChapterId: "seed-chapter-gt",
    postedDaysAgo: 150,
    verifiedDaysAgo: 15,
    clientOrgName: "Atlanta Neighbors Learning Center",
    clientContactName: "Hoang Tran",
    clientContactEmail: "htran@example.org",
    clientContactPhone: "555-0111",
  },
  {
    id: "seed-listing-12",
    title: "Shelter bed availability dashboard",
    description:
      "A coalition of shelters wants a shared real-time view of bed availability for outreach workers.",
    scope:
      "Shelter check-in updates, outreach-facing availability view. Medium; needs careful privacy design.",
    causeArea: "HOUSING",
    status: "CLAIMED",
    handoffNotes: "Scoped with three member shelters. Claimed and handed off.",
    sourcingChapterId: "seed-chapter-bu",
    postedDaysAgo: 80,
    verifiedDaysAgo: 50,
    clientOrgName: "Greater Boston Shelter Coalition",
    clientContactName: "Nia Robinson",
    clientContactEmail: "nrobinson@example.org",
  },
  {
    id: "seed-listing-13",
    title: "Watershed water quality data portal",
    description:
      "A watershed council collects water quality samples from volunteer monitors and wants a portal to submit and visualize readings.",
    scope: "Sample submission, validation, and public charts. One semester.",
    causeArea: "ENVIRONMENT",
    techContext: "Existing data in a legacy Access database.",
    status: "AVAILABLE",
    handoffNotes:
      "Discovery call done. We exported a sample of the Access DB. A previous claim request was declined because of timeline mismatch.",
    sourcingChapterId: "seed-chapter-uiuc",
    postedDaysAgo: 45,
    verifiedDaysAgo: 20,
    clientOrgName: "Sangamon River Watershed Council",
    clientContactName: "Greg Polk",
    clientContactEmail: "gpolk@example.org",
  },
  {
    id: "seed-listing-14",
    title: "Microloan application portal",
    description:
      "A microlending nonprofit wants to move small business loan applications from paper to a secure online form.",
    scope: "Application form, document upload, and reviewer queue. Medium.",
    causeArea: "ECONOMIC_OPPORTUNITY",
    status: "ARCHIVED",
    handoffNotes:
      "Partner chose a commercial vendor. Withdrawn by sourcing chapter.",
    sourcingChapterId: "seed-chapter-berkeley",
    postedDaysAgo: 200,
    verifiedDaysAgo: 190,
    withdrawnDaysAgo: 150,
    clientOrgName: "Seedline Microfinance",
    clientContactName: "Omar Haddad",
    clientContactEmail: "ohaddad@example.org",
  },
  {
    id: "seed-listing-15",
    title: "Community garden plot reservation system",
    description:
      "A network of community gardens allocates plots each spring through a paper lottery and wants an online reservation and waitlist system.",
    scope:
      "Plot inventory, lottery and waitlist, and season renewals. Small to medium.",
    causeArea: "OTHER",
    status: "AVAILABLE",
    handoffNotes: "Scoped. They need it live before February lottery.",
    sourcingChapterId: "seed-chapter-gt",
    postedDaysAgo: 3,
    verifiedDaysAgo: 3,
    clientOrgName: "Grow Together Gardens",
    clientContactName: "Lena Okafor",
    clientContactEmail: "lokafor@example.org",
  },
];

// Claims must be consistent with listing status: CLAIM_PENDING has a PENDING
// claim, CLAIMED / IN_PROGRESS have an APPROVED claim. Historical rejected and
// abandoned claims sit alongside AVAILABLE listings.
const CLAIMS: {
  id: string;
  sourcedProjectId: string;
  claimingChapterId: ChapterId;
  status: ClaimStatus;
  message?: string;
  requestedDaysAgo: number;
  resolvedDaysAgo?: number;
}[] = [
  {
    id: "seed-claim-01",
    sourcedProjectId: "seed-listing-03",
    claimingChapterId: "seed-chapter-uiuc",
    status: "PENDING",
    message: "We have a team of 5 with Airtable migration experience.",
    requestedDaysAgo: 2,
  },
  {
    id: "seed-claim-02",
    sourcedProjectId: "seed-listing-08",
    claimingChapterId: "seed-chapter-berkeley",
    status: "PENDING",
    message: "Can start immediately.",
    requestedDaysAgo: 1,
  },
  {
    id: "seed-claim-03",
    sourcedProjectId: "seed-listing-04",
    claimingChapterId: "seed-chapter-gt",
    status: "APPROVED",
    requestedDaysAgo: 30,
    resolvedDaysAgo: 28,
  },
  {
    id: "seed-claim-04",
    sourcedProjectId: "seed-listing-09",
    claimingChapterId: "seed-chapter-bu",
    status: "APPROVED",
    requestedDaysAgo: 95,
    resolvedDaysAgo: 92,
  },
  {
    id: "seed-claim-05",
    sourcedProjectId: "seed-listing-12",
    claimingChapterId: "seed-chapter-uiuc",
    status: "APPROVED",
    requestedDaysAgo: 45,
    resolvedDaysAgo: 44,
  },
  {
    id: "seed-claim-06",
    sourcedProjectId: "seed-listing-11",
    claimingChapterId: "seed-chapter-bu",
    status: "ABANDONED",
    requestedDaysAgo: 120,
    resolvedDaysAgo: 40,
  },
  {
    id: "seed-claim-07",
    sourcedProjectId: "seed-listing-13",
    claimingChapterId: "seed-chapter-berkeley",
    status: "REJECTED",
    message: "We could take it on next semester.",
    requestedDaysAgo: 25,
    resolvedDaysAgo: 22,
  },
];

const LINKS: {
  id: string;
  sourcedProjectId: string;
  label: string;
  url: string;
  linkType: LinkType;
}[] = [
  {
    id: "seed-link-01",
    sourcedProjectId: "seed-listing-01",
    label: "Requirements doc",
    url: "https://example.org/docs/food-bank-requirements",
    linkType: "SCOPING_DOC",
  },
  {
    id: "seed-link-02",
    sourcedProjectId: "seed-listing-07",
    label: "Unfinished Figma mockups",
    url: "https://example.org/figma/youth-arts",
    linkType: "DESIGN_FILE",
  },
  {
    id: "seed-link-03",
    sourcedProjectId: "seed-listing-09",
    label: "Route planner repo",
    url: "https://example.org/git/mobile-pantry",
    linkType: "REPO",
  },
  {
    id: "seed-link-04",
    sourcedProjectId: "seed-listing-11",
    label: "Scoping doc",
    url: "https://example.org/docs/esl-scoping",
    linkType: "SCOPING_DOC",
  },
  {
    id: "seed-link-05",
    sourcedProjectId: "seed-listing-11",
    label: "Abandoned prototype",
    url: "https://example.org/git/esl-attendance",
    linkType: "REPO",
  },
  {
    id: "seed-link-06",
    sourcedProjectId: "seed-listing-13",
    label: "Sample data export",
    url: "https://example.org/files/watershed-sample",
    linkType: "OTHER",
  },
];

async function main() {
  for (const chapter of CHAPTERS) {
    await db.chapter.upsert({
      where: { id: chapter.id },
      update: chapter,
      create: chapter,
    });
  }

  const password = await bcrypt.hash(SEED_PASSWORD, 10);
  for (const { id, ...user } of USERS) {
    await db.user.upsert({
      where: { email: user.email },
      update: user,
      create: { id, ...user, password },
    });
  }

  for (const listing of LISTINGS) {
    const { id, postedDaysAgo, verifiedDaysAgo, withdrawnDaysAgo, ...fields } =
      listing;
    const data = {
      ...fields,
      sourcedById: leadOf(listing.sourcingChapterId),
      postedAt: daysAgo(postedDaysAgo),
      lastVerifiedAt: daysAgo(verifiedDaysAgo),
      withdrawnAt: withdrawnDaysAgo ? daysAgo(withdrawnDaysAgo) : null,
    };
    await db.sourcedProject.upsert({
      where: { id },
      update: data,
      create: { id, ...data },
    });
  }

  for (const claim of CLAIMS) {
    const { id, requestedDaysAgo, resolvedDaysAgo, ...fields } = claim;
    const listing = LISTINGS.find((l) => l.id === claim.sourcedProjectId)!;
    const data = {
      ...fields,
      requestedById: leadOf(claim.claimingChapterId),
      requestedAt: daysAgo(requestedDaysAgo),
      resolvedAt: resolvedDaysAgo ? daysAgo(resolvedDaysAgo) : null,
      resolvedById: resolvedDaysAgo ? leadOf(listing.sourcingChapterId) : null,
    };
    await db.projectClaim.upsert({
      where: { id },
      update: data,
      create: { id, ...data },
    });
  }

  for (const { id, ...link } of LINKS) {
    const listing = LISTINGS.find((l) => l.id === link.sourcedProjectId)!;
    const data = { ...link, addedById: leadOf(listing.sourcingChapterId) };
    await db.sourcedProjectLink.upsert({
      where: { id },
      update: data,
      create: { id, ...data },
    });
  }

  console.log(
    `Seed complete: ${CHAPTERS.length} chapters, ${USERS.length} users, ` +
      `${LISTINGS.length} listings, ${CLAIMS.length} claims, ${LINKS.length} links`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
