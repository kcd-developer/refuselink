import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function hash(pw: string) {
  return bcrypt.hash(pw, 12);
}

async function main() {
  // ===== PLATFORM USERS =====
  const platformAdmin = await prisma.platformUser.upsert({
    where: { email: "admin@refuselink.com" },
    update: {},
    create: {
      email: "admin@refuselink.com",
      password: await hash("Platform@demo1"),
      name: "RefuseLink Admin",
      role: "platform_owner",
    },
  });

  await prisma.platformUser.upsert({
    where: { email: "support@refuselink.com" },
    update: {},
    create: {
      email: "support@refuselink.com",
      password: await hash("Support@demo1"),
      name: "Support Agent",
      role: "platform_support",
    },
  });

  // Test account
  await prisma.platformUser.upsert({
    where: { email: "john@doe.com" },
    update: {},
    create: {
      email: "john@doe.com",
      password: await hash("johndoe123"),
      name: "John Doe",
      role: "platform_owner",
    },
  });

  // ===== PLANS =====
  const starter = await prisma.plan.upsert({
    where: { slug: "starter" },
    update: {},
    create: {
      name: "Starter",
      slug: "starter",
      monthlyPriceCents: 49900,
      annualPriceCents: 479000,
      maxCommunities: 15,
      maxCustomers: 5000,
      maxStaffUsers: 10,
      features: {},
      displayOrder: 1,
    },
  });

  const professional = await prisma.plan.upsert({
    where: { slug: "professional" },
    update: {},
    create: {
      name: "Professional",
      slug: "professional",
      monthlyPriceCents: 149900,
      annualPriceCents: 1439000,
      maxCommunities: 75,
      maxCustomers: 25000,
      maxStaffUsers: 50,
      features: {
        analytics: true,
        customBranding: true,
        apiAccess: true,
        smsReady: true,
      },
      displayOrder: 2,
    },
  });

  const enterprise = await prisma.plan.upsert({
    where: { slug: "enterprise" },
    update: {},
    create: {
      name: "Enterprise",
      slug: "enterprise",
      monthlyPriceCents: 399900,
      annualPriceCents: 3839000,
      maxCommunities: null,
      maxCustomers: null,
      maxStaffUsers: null,
      features: {
        whiteLabel: true,
        customDomain: true,
        prioritySupport: true,
        customIntegrations: true,
      },
      displayOrder: 3,
    },
  });

  // ===== COMPANY 1: KC Disposal =====
  const kc = await prisma.company.upsert({
    where: { slug: "kc-disposal" },
    update: {},
    create: {
      name: "KC Disposal",
      slug: "kc-disposal",
      code: "KCD001",
      status: "active",
    },
  });

  await prisma.companyBranding.upsert({
    where: { companyId: kc.id },
    update: {},
    create: {
      companyId: kc.id,
      primaryColor: "#1D4ED8",
      secondaryColor: "#93C5FD",
      supportPhone: "(816) 555-0100",
      supportEmail: "support@kcdisposal.example.com",
    },
  });

  await prisma.subscription.upsert({
    where: { companyId: kc.id },
    update: {},
    create: {
      companyId: kc.id,
      planId: professional.id,
      billingCycle: "monthly",
      status: "active",
      startDate: new Date("2024-01-01"),
    },
  });

  // KC Cities
  const kcCity = await prisma.city.upsert({
    where: { companyId_name_state: { companyId: kc.id, name: "Kansas City", state: "MO" } },
    update: {},
    create: { companyId: kc.id, name: "Kansas City", state: "MO" },
  });

  const lsCity = await prisma.city.upsert({
    where: { companyId_name_state: { companyId: kc.id, name: "Lee's Summit", state: "MO" } },
    update: {},
    create: { companyId: kc.id, name: "Lee's Summit", state: "MO" },
  });

  // KC Communities
  let brookside = await prisma.community.findFirst({
    where: { companyId: kc.id, name: "Brookside HOA" },
  });
  if (!brookside) {
    brookside = await prisma.community.create({
      data: { companyId: kc.id, cityId: kcCity.id, name: "Brookside HOA" },
    });
  }

  let summitRidge = await prisma.community.findFirst({
    where: { companyId: kc.id, name: "Summit Ridge HOA" },
  });
  if (!summitRidge) {
    summitRidge = await prisma.community.create({
      data: { companyId: kc.id, cityId: lsCity.id, name: "Summit Ridge HOA" },
    });
  }

  // KC Employees
  const sarah = await prisma.companyUser.upsert({
    where: { companyId_email: { companyId: kc.id, email: "sarah@kc-disposal.example.com" } },
    update: {},
    create: {
      companyId: kc.id,
      email: "sarah@kc-disposal.example.com",
      password: await hash("Employee@demo1"),
      name: "Sarah Mitchell",
      role: "company_owner",
    },
  });

  const james = await prisma.companyUser.upsert({
    where: { companyId_email: { companyId: kc.id, email: "james@kc-disposal.example.com" } },
    update: {},
    create: {
      companyId: kc.id,
      email: "james@kc-disposal.example.com",
      password: await hash("Employee@demo2"),
      name: "James Rodriguez",
      role: "company_admin",
    },
  });

  const emily = await prisma.companyUser.upsert({
    where: { companyId_email: { companyId: kc.id, email: "emily@kc-disposal.example.com" } },
    update: {},
    create: {
      companyId: kc.id,
      email: "emily@kc-disposal.example.com",
      password: await hash("CSR@demo1"),
      name: "Emily Chen",
      role: "csr",
    },
  });

  const marcus = await prisma.companyUser.upsert({
    where: { companyId_email: { companyId: kc.id, email: "marcus@kc-disposal.example.com" } },
    update: {},
    create: {
      companyId: kc.id,
      email: "marcus@kc-disposal.example.com",
      password: await hash("Dispatch@demo1"),
      name: "Marcus Johnson",
      role: "dispatcher",
    },
  });

  // KC Customers
  let thompson = await prisma.customer.findFirst({
    where: { companyId: kc.id, accountNumber: "KCD-R-001" },
  });
  if (!thompson) {
    thompson = await prisma.customer.create({
      data: {
        companyId: kc.id,
        type: "residential",
        accountNumber: "KCD-R-001",
        name: "David & Linda Thompson",
        email: "thompson@example.com",
        address: "123 Oak Street",
        cityId: kcCity.id,
        communityId: brookside.id,
        city: "Kansas City",
        state: "MO",
        zipCode: "64113",
      },
    });
  }

  let patricia = await prisma.customer.findFirst({
    where: { companyId: kc.id, accountNumber: "KCD-R-002" },
  });
  if (!patricia) {
    patricia = await prisma.customer.create({
      data: {
        companyId: kc.id,
        type: "residential",
        accountNumber: "KCD-R-002",
        name: "Patricia Williams",
        email: "patricia@example.com",
        address: "456 Elm Avenue",
        cityId: kcCity.id,
        city: "Kansas City",
        state: "MO",
        zipCode: "64114",
      },
    });
  }

  let riverside = await prisma.customer.findFirst({
    where: { companyId: kc.id, accountNumber: "KCD-C-001" },
  });
  if (!riverside) {
    riverside = await prisma.customer.create({
      data: {
        companyId: kc.id,
        type: "commercial",
        accountNumber: "KCD-C-001",
        name: "Riverside Office Park",
        contactName: "Bob Martinez",
        email: "bob@riverside.example.com",
        address: "789 River Road",
        city: "Kansas City",
        state: "MO",
        zipCode: "64116",
      },
    });
  }

  let metro = await prisma.customer.findFirst({
    where: { companyId: kc.id, accountNumber: "KCD-RO-001" },
  });
  if (!metro) {
    metro = await prisma.customer.create({
      data: {
        companyId: kc.id,
        type: "roll_off",
        accountNumber: "KCD-RO-001",
        name: "Metro Construction LLC",
        contactName: "Tony Nguyen",
        email: "tony@metroconstruction.example.com",
        address: "101 Industrial Blvd",
        city: "Kansas City",
        state: "MO",
        zipCode: "64120",
      },
    });
  }

  // KC Customer Users
  const davidUser = await prisma.customerUser.upsert({
    where: { email: "david@example.com" },
    update: {},
    create: {
      email: "david@example.com",
      password: await hash("Customer@demo1"),
      name: "David Thompson",
    },
  });

  // Link David to Thompson account
  await prisma.customerUserAccess.upsert({
    where: {
      customerUserId_customerId: {
        customerUserId: davidUser.id,
        customerId: thompson.id,
      },
    },
    update: {},
    create: {
      customerUserId: davidUser.id,
      customerId: thompson.id,
      isPrimary: true,
    },
  });

  const bobUser = await prisma.customerUser.upsert({
    where: { email: "bob@riverside.example.com" },
    update: {},
    create: {
      email: "bob@riverside.example.com",
      password: await hash("Customer@demo2"),
      name: "Bob Martinez",
    },
  });

  await prisma.customerUserAccess.upsert({
    where: {
      customerUserId_customerId: {
        customerUserId: bobUser.id,
        customerId: riverside.id,
      },
    },
    update: {},
    create: {
      customerUserId: bobUser.id,
      customerId: riverside.id,
      isPrimary: true,
    },
  });

  // KC Announcements
  const kcAnnouncements = [
    {
      title: "Holiday Schedule Changes - Thanksgiving Week",
      content: "Please note that trash and recycling pickup will be delayed by one day during Thanksgiving week (November 25-29). Monday routes will be collected Tuesday, Tuesday routes on Wednesday, and so on. Thursday and Friday routes will be collected on Friday and Saturday respectively. Please have your bins out by 6 AM on your adjusted collection day.",
      priority: "high" as const,
      startDate: new Date("2024-11-18"),
      endDate: new Date("2024-11-30"),
      isPublished: true,
      targetAll: true,
      targetTypes: [],
      targetCityIds: [],
      targetCommunityIds: [],
    },
    {
      title: "New Recycling Guidelines Effective January 1",
      content: "Starting January 1, 2025, we are updating our recycling program. Accepted materials now include cardboard, paper, plastic #1-#5, aluminum cans, and glass bottles. Please ensure all items are clean and dry. Plastic bags and styrofoam are NOT accepted in curbside recycling. Visit our website for the complete guide.",
      priority: "normal" as const,
      startDate: new Date("2024-12-15"),
      isPublished: true,
      targetAll: true,
      targetTypes: [],
      targetCityIds: [],
      targetCommunityIds: [],
    },
    {
      title: "Brookside HOA Special Pickup - December 28",
      content: "A special bulk item pickup has been arranged for Brookside HOA residents on December 28. Please place large items (furniture, appliances, etc.) curbside by 7 AM. Maximum of 3 bulk items per household. Contact us to schedule if you have more items.",
      priority: "normal" as const,
      startDate: new Date("2024-12-20"),
      endDate: new Date("2024-12-28"),
      isPublished: true,
      targetAll: false,
      targetTypes: [],
      targetCityIds: [],
      targetCommunityIds: [brookside.id],
    },
  ];

  for (const ann of kcAnnouncements) {
    const existing = await prisma.announcement.findFirst({
      where: { companyId: kc.id, title: ann.title },
    });
    if (!existing) {
      await prisma.announcement.create({
        data: { ...ann, companyId: kc.id, createdById: sarah.id },
      });
    }
  }

  // KC Documents (placeholder)
  const kcDocs = [
    {
      title: "2024 Holiday Schedule",
      description: "Complete holiday collection schedule for 2024",
      fileName: "holiday-schedule-2024.pdf",
      fileUrl: "placeholder://holiday-schedule-2024.pdf",
      fileSize: 245000,
      mimeType: "application/pdf",
      targetAll: true,
      targetTypes: [],
      targetCityIds: [],
      targetCommunityIds: [],
    },
    {
      title: "Recycling Accepted Items Guide",
      description: "Guide to accepted recycling materials",
      fileName: "recycling-guide.pdf",
      fileUrl: "placeholder://recycling-guide.pdf",
      fileSize: 512000,
      mimeType: "application/pdf",
      targetAll: true,
      targetTypes: [],
      targetCityIds: [],
      targetCommunityIds: [],
    },
    {
      title: "Commercial Service Agreement",
      description: "Standard service agreement for commercial customers",
      fileName: "commercial-agreement.pdf",
      fileUrl: "placeholder://commercial-agreement.pdf",
      fileSize: 380000,
      mimeType: "application/pdf",
      targetAll: false,
      targetTypes: ["commercial" as const],
      targetCityIds: [],
      targetCommunityIds: [],
    },
  ];

  for (const doc of kcDocs) {
    const existing = await prisma.document.findFirst({
      where: { companyId: kc.id, title: doc.title },
    });
    if (!existing) {
      await prisma.document.create({
        data: { ...doc, companyId: kc.id, createdById: sarah.id },
      });
    }
  }

  // KC Service Schedules
  let kcResSchedule = await prisma.serviceSchedule.findFirst({
    where: { companyId: kc.id, name: "Kansas City Residential - Monday/Thursday" },
  });
  if (!kcResSchedule) {
    kcResSchedule = await prisma.serviceSchedule.create({
      data: {
        companyId: kc.id,
        name: "Kansas City Residential - Monday/Thursday",
        description: "Regular residential trash and recycling pickup for Kansas City",
        type: "residential",
        frequency: "weekly",
        daysOfWeek: [1, 4],
        cityId: kcCity.id,
      },
    });
  }

  let kcCommSchedule = await prisma.serviceSchedule.findFirst({
    where: { companyId: kc.id, name: "Commercial Weekly" },
  });
  if (!kcCommSchedule) {
    kcCommSchedule = await prisma.serviceSchedule.create({
      data: {
        companyId: kc.id,
        name: "Commercial Weekly",
        description: "Weekly commercial waste collection",
        type: "commercial",
        frequency: "weekly",
        daysOfWeek: [2],
      },
    });
  }

  // KC Tickets
  let ticket1 = await prisma.ticket.findFirst({
    where: { companyId: kc.id, ticketNumber: "TKT-00001" },
  });
  if (!ticket1) {
    ticket1 = await prisma.ticket.create({
      data: {
        companyId: kc.id,
        customerId: thompson.id,
        ticketNumber: "TKT-00001",
        subject: "Missed pickup on Oak Street",
        status: "in_progress",
        priority: "high",
        assignedToId: emily.id,
        createdById: davidUser.id,
        createdByType: "customer",
      },
    });
    await prisma.ticketMessage.create({
      data: {
        ticketId: ticket1.id,
        content: "Our trash was not picked up today on Oak Street. The bin was out by 6 AM as required. This is the second time this month.",
        authorId: davidUser.id,
        authorType: "customer",
        authorName: "David Thompson",
      },
    });
    await prisma.ticketMessage.create({
      data: {
        ticketId: ticket1.id,
        content: "I apologize for the inconvenience, Mr. Thompson. I've dispatched a truck to your address for a same-day pickup. Our driver had a route issue this morning.",
        authorId: emily.id,
        authorType: "employee",
        authorName: "Emily Chen",
      },
    });
  }

  let ticket2 = await prisma.ticket.findFirst({
    where: { companyId: kc.id, ticketNumber: "TKT-00002" },
  });
  if (!ticket2) {
    ticket2 = await prisma.ticket.create({
      data: {
        companyId: kc.id,
        customerId: riverside.id,
        ticketNumber: "TKT-00002",
        subject: "Requesting additional dumpster",
        status: "open",
        priority: "normal",
        createdById: bobUser.id,
        createdByType: "customer",
      },
    });
    await prisma.ticketMessage.create({
      data: {
        ticketId: ticket2.id,
        content: "We need an additional 4-yard dumpster for our east parking lot. Our current single dumpster is overflowing by Thursday each week.",
        authorId: bobUser.id,
        authorType: "customer",
        authorName: "Bob Martinez",
      },
    });
  }

  // ===== COMPANY 2: Mountain High Disposal =====
  const mhd = await prisma.company.upsert({
    where: { slug: "mountain-high-disposal" },
    update: {},
    create: {
      name: "Mountain High Disposal",
      slug: "mountain-high-disposal",
      code: "MHD001",
      status: "active",
    },
  });

  await prisma.companyBranding.upsert({
    where: { companyId: mhd.id },
    update: {},
    create: {
      companyId: mhd.id,
      primaryColor: "#047857",
      secondaryColor: "#6EE7B7",
      supportPhone: "(303) 555-0200",
      supportEmail: "support@mountainhigh.example.com",
    },
  });

  await prisma.subscription.upsert({
    where: { companyId: mhd.id },
    update: {},
    create: {
      companyId: mhd.id,
      planId: starter.id,
      billingCycle: "monthly",
      status: "active",
      startDate: new Date("2024-03-01"),
    },
  });

  // MHD Cities
  const denver = await prisma.city.upsert({
    where: { companyId_name_state: { companyId: mhd.id, name: "Denver", state: "CO" } },
    update: {},
    create: { companyId: mhd.id, name: "Denver", state: "CO" },
  });

  const boulder = await prisma.city.upsert({
    where: { companyId_name_state: { companyId: mhd.id, name: "Boulder", state: "CO" } },
    update: {},
    create: { companyId: mhd.id, name: "Boulder", state: "CO" },
  });

  let highlandsRanch = await prisma.community.findFirst({
    where: { companyId: mhd.id, name: "Highlands Ranch HOA" },
  });
  if (!highlandsRanch) {
    highlandsRanch = await prisma.community.create({
      data: { companyId: mhd.id, cityId: denver.id, name: "Highlands Ranch HOA" },
    });
  }

  // MHD Employees
  const alex = await prisma.companyUser.upsert({
    where: { companyId_email: { companyId: mhd.id, email: "alex@mountainhigh.example.com" } },
    update: {},
    create: {
      companyId: mhd.id,
      email: "alex@mountainhigh.example.com",
      password: await hash("Owner@demo1"),
      name: "Alex Rivera",
      role: "company_owner",
    },
  });

  const jen = await prisma.companyUser.upsert({
    where: { companyId_email: { companyId: mhd.id, email: "jen@mountainhigh.example.com" } },
    update: {},
    create: {
      companyId: mhd.id,
      email: "jen@mountainhigh.example.com",
      password: await hash("Manager@demo1"),
      name: "Jen Walsh",
      role: "company_manager",
    },
  });

  // MHD Customers
  let frank = await prisma.customer.findFirst({
    where: { companyId: mhd.id, accountNumber: "MHD-R-001" },
  });
  if (!frank) {
    frank = await prisma.customer.create({
      data: {
        companyId: mhd.id,
        type: "residential",
        accountNumber: "MHD-R-001",
        name: "Frank & Carol Davis",
        email: "frank@example.com",
        address: "550 Mountain View Dr",
        cityId: denver.id,
        communityId: highlandsRanch.id,
        city: "Denver",
        state: "CO",
        zipCode: "80129",
      },
    });
  }

  let pearlStreet = await prisma.customer.findFirst({
    where: { companyId: mhd.id, accountNumber: "MHD-C-001" },
  });
  if (!pearlStreet) {
    pearlStreet = await prisma.customer.create({
      data: {
        companyId: mhd.id,
        type: "commercial",
        accountNumber: "MHD-C-001",
        name: "Pearl Street Bistro",
        contactName: "Maria Santos",
        email: "maria@pearlstreet.example.com",
        address: "1200 Pearl Street",
        city: "Boulder",
        state: "CO",
        zipCode: "80302",
      },
    });
  }

  // MHD Customer Users
  const frankUser = await prisma.customerUser.upsert({
    where: { email: "frank@example.com" },
    update: {},
    create: {
      email: "frank@example.com",
      password: await hash("Customer@demo3"),
      name: "Frank Davis",
    },
  });

  await prisma.customerUserAccess.upsert({
    where: {
      customerUserId_customerId: {
        customerUserId: frankUser.id,
        customerId: frank.id,
      },
    },
    update: {},
    create: {
      customerUserId: frankUser.id,
      customerId: frank.id,
      isPrimary: true,
    },
  });

  // MHD Service Schedule
  let denverRes = await prisma.serviceSchedule.findFirst({
    where: { companyId: mhd.id, name: "Denver Residential - Tuesday/Friday" },
  });
  if (!denverRes) {
    denverRes = await prisma.serviceSchedule.create({
      data: {
        companyId: mhd.id,
        name: "Denver Residential - Tuesday/Friday",
        description: "Regular residential collection for Denver area",
        type: "residential",
        frequency: "weekly",
        daysOfWeek: [2, 5],
        cityId: denver.id,
      },
    });
  }

  // MHD Announcement
  const mhdAnnExist = await prisma.announcement.findFirst({
    where: { companyId: mhd.id, title: "Welcome to Mountain High Disposal Customer Portal!" },
  });
  if (!mhdAnnExist) {
    await prisma.announcement.create({
      data: {
        companyId: mhd.id,
        title: "Welcome to Mountain High Disposal Customer Portal!",
        content: "Welcome to our new online customer service center! Here you can view your service schedule, check announcements, access important documents, and submit service requests. If you have any questions, please don't hesitate to create a support ticket or call us at (303) 555-0200.",
        priority: "normal",
        startDate: new Date("2024-03-01"),
        isPublished: true,
        targetAll: true,
        targetTypes: [],
        targetCityIds: [],
        targetCommunityIds: [],
        createdById: alex.id,
      },
    });
  }

  console.log("Seed completed successfully!");
}

main()
  .catch((e: any) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
