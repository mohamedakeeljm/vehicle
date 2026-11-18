import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Seed Default Document Types
  const documentTypes = [
    {
      code: 'REVENUE_LICENSE',
      name: 'Revenue License',
      category: 'REVENUE_LICENSE',
      description: 'Annual Sri Lanka motor vehicle revenue license from Provincial Department of Motor Traffic.',
      isDefault: true,
    },
    {
      code: 'INSURANCE',
      name: 'Vehicle Insurance Certificate',
      category: 'INSURANCE',
      description: 'Comprehensive or third-party vehicle insurance policy certificate.',
      isDefault: true,
    },
    {
      code: 'EMISSION_TEST',
      name: 'Vehicle Emission Test Certificate (VET)',
      category: 'EMISSION_TEST',
      description: 'Mandatory vehicle emission test report (DriveGreen / Laughs Eco Sri Lanka).',
      isDefault: true,
    },
    {
      code: 'FITNESS_CERTIFICATE',
      name: 'Vehicle Fitness Certificate',
      category: 'FITNESS_CERTIFICATE',
      description: 'Commercial vehicle fitness certification from authorized motor traffic examiners.',
      isDefault: true,
    },
    {
      code: 'PASSENGER_SERVICE_PERMIT',
      name: 'Passenger Service Permit',
      category: 'PASSENGER_SERVICE_PERMIT',
      description: 'Provincial or National Transport Commission route permit for buses and vans.',
      isDefault: true,
    },
    {
      code: 'CUSTOM',
      name: 'Other Vehicle Document',
      category: 'CUSTOM',
      description: 'Custom documents such as fuel quota cards, speed governor certificates, or lease agreements.',
      isDefault: true,
    },
  ];

  for (const dt of documentTypes) {
    await prisma.documentType.upsert({
      where: { code: dt.code },
      update: dt,
      create: dt,
    });
  }
  console.log('✓ Document types seeded');

  // 2. Seed Default Admin User
  const adminPasswordHash = await bcrypt.hash('Admin@12345', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@vehicleguard.lk' },
    update: {},
    create: {
      fullName: 'VehicleGuard Administrator',
      email: 'admin@vehicleguard.lk',
      phoneNumber: '+94771234567',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    },
  });

  await prisma.notificationPreference.upsert({
    where: { userId: admin.id },
    update: {},
    create: {
      userId: admin.id,
      emailEnabled: true,
      inAppEnabled: true,
      smsEnabled: false,
      whatsappEnabled: false,
      reminderDays: '15,7,3,1,0',
    },
  });

  // 3. Seed Demo Sri Lankan Vehicle Owner
  const demoPasswordHash = await bcrypt.hash('Password@123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'kasun.perera@example.lk' },
    update: {},
    create: {
      fullName: 'Kasun Perera',
      email: 'kasun.perera@example.lk',
      phoneNumber: '+94718901234',
      passwordHash: demoPasswordHash,
      role: 'USER',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    },
  });

  await prisma.notificationPreference.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      emailEnabled: true,
      inAppEnabled: true,
      smsEnabled: true,
      whatsappEnabled: true,
      reminderDays: '15,7,3,1,0',
    },
  });
  console.log('✓ Demo users seeded (admin@vehicleguard.lk / Admin@12345, kasun.perera@example.lk / Password@123)');

  // 4. Seed Sri Lankan Vehicles for Kasun Perera
  const v1 = await prisma.vehicle.upsert({
    where: {
      userId_registrationNumber: {
        userId: user.id,
        registrationNumber: 'WP CAQ-4521',
      },
    },
    update: {},
    create: {
      userId: user.id,
      registrationNumber: 'WP CAQ-4521',
      vehicleType: 'Car',
      brand: 'Toyota',
      model: 'Prius 4th Gen',
      manufacturingYear: 2018,
      registeredProvince: 'Western',
      ownerName: 'Kasun Perera',
      imageUrl: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=600',
    },
  });

  const v2 = await prisma.vehicle.upsert({
    where: {
      userId_registrationNumber: {
        userId: user.id,
        registrationNumber: 'SP BAX-7890',
      },
    },
    update: {},
    create: {
      userId: user.id,
      registrationNumber: 'SP BAX-7890',
      vehicleType: 'Motorcycle',
      brand: 'Honda',
      model: 'CB Hornet 160R',
      manufacturingYear: 2021,
      registeredProvince: 'Southern',
      ownerName: 'Kasun Perera',
      imageUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600',
    },
  });

  const v3 = await prisma.vehicle.upsert({
    where: {
      userId_registrationNumber: {
        userId: user.id,
        registrationNumber: 'CP ND-3344',
      },
    },
    update: {},
    create: {
      userId: user.id,
      registrationNumber: 'CP ND-3344',
      vehicleType: 'Three-Wheeler',
      brand: 'Bajaj',
      model: 'RE 205 Compact',
      manufacturingYear: 2017,
      registeredProvince: 'Central',
      ownerName: 'Kasun Perera',
      imageUrl: 'https://images.unsplash.com/photo-1520699049698-acd2fccb8cc8?w=600',
    },
  });

  console.log('✓ Vehicles seeded for Kasun Perera');

  // Helper date calculations relative to current day
  const today = new Date();
  const addDays = (days) => {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return d;
  };

  const revenueType = await prisma.documentType.findUnique({ where: { code: 'REVENUE_LICENSE' } });
  const insuranceType = await prisma.documentType.findUnique({ where: { code: 'INSURANCE' } });
  const emissionType = await prisma.documentType.findUnique({ where: { code: 'EMISSION_TEST' } });

  // Clear existing documents for clean seeding
  await prisma.vehicleDocument.deleteMany({
    where: { vehicleId: { in: [v1.id, v2.id, v3.id] } },
  });

  // Vehicle 1 Documents
  // Revenue License expiring in exactly 15 days (triggers 15-day reminder!)
  const d1 = await prisma.vehicleDocument.create({
    data: {
      vehicleId: v1.id,
      documentTypeId: revenueType.id,
      documentNumber: 'RL-WP-2025-99881',
      serviceProvider: 'Department of Motor Traffic - Western Province',
      policyOrType: 'Annual Revenue License',
      issueDate: addDays(-350),
      expiryDate: addDays(15),
      renewalStatus: 'ACTIVE',
      notes: 'Renew via e-Revenue License portal (gov.lk) before expiry.',
    },
  });

  // Insurance expiring in 7 days
  const d2 = await prisma.vehicleDocument.create({
    data: {
      vehicleId: v1.id,
      documentTypeId: insuranceType.id,
      documentNumber: 'SLIC-COMP-882910',
      serviceProvider: 'Sri Lanka Insurance Corporation (SLIC)',
      policyOrType: 'Comprehensive Motor Plus',
      issueDate: addDays(-358),
      expiryDate: addDays(7),
      renewalStatus: 'ACTIVE',
      notes: 'Contact Colombo 03 branch agent Mr. Bandara.',
    },
  });

  // Emission test valid for 6 months
  const d3 = await prisma.vehicleDocument.create({
    data: {
      vehicleId: v1.id,
      documentTypeId: emissionType.id,
      documentNumber: 'DG-VET-2026-44321',
      serviceProvider: 'CleanCo DriveGreen Sri Lanka',
      policyOrType: 'Petrol Emission Compliance Test',
      issueDate: addDays(-60),
      expiryDate: addDays(120),
      renewalStatus: 'ACTIVE',
      notes: 'Tested at DriveGreen Nugegoda Drive-through Center.',
    },
  });

  // Vehicle 2 Documents (SP BAX-7890)
  // Expired document (overdue by 5 days)
  const d4 = await prisma.vehicleDocument.create({
    data: {
      vehicleId: v2.id,
      documentTypeId: revenueType.id,
      documentNumber: 'RL-SP-2025-11223',
      serviceProvider: 'Southern Province Revenue Department',
      issueDate: addDays(-370),
      expiryDate: addDays(-5),
      renewalStatus: 'EXPIRED',
      notes: 'Urgent renewal required. Late penalty may apply.',
    },
  });

  // Insurance expiring in 1 day
  const d5 = await prisma.vehicleDocument.create({
    data: {
      vehicleId: v2.id,
      documentTypeId: insuranceType.id,
      documentNumber: 'CEY-VIP-994411',
      serviceProvider: 'Ceylinco VIP On The Spot',
      policyOrType: 'Third Party Plus',
      issueDate: addDays(-364),
      expiryDate: addDays(1),
      renewalStatus: 'ACTIVE',
    },
  });

  // Seed sample renewal history
  await prisma.documentRenewalHistory.create({
    data: {
      documentId: d1.id,
      previousExpiryDate: addDays(-350),
      newExpiryDate: addDays(15),
      renewedAt: addDays(-350),
      renewalCost: 3850.0,
      referenceNumber: 'TXN-ONLINE-98214',
      remarks: 'Previous year renewal completed online at gov.lk',
    },
  });

  // Seed sample in-app notification
  await prisma.notification.createMany({
    data: [
      {
        userId: user.id,
        documentId: d1.id,
        title: 'Vehicle Document Expiry Reminder',
        message: 'Your Revenue License for Toyota Prius (WP CAQ-4521) expires in 15 days.',
        daysRemaining: 15,
        channel: 'IN_APP',
        isRead: false,
      },
      {
        userId: user.id,
        documentId: d4.id,
        title: 'Overdue Document Alert',
        message: 'Your Revenue License for Honda CB Hornet (SP BAX-7890) is expired! Please renew immediately.',
        daysRemaining: -5,
        channel: 'IN_APP',
        isRead: false,
      },
    ],
  });

  console.log('✓ Vehicle documents, renewal history, and notifications seeded');
  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
