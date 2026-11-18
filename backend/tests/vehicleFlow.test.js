import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import prisma from '../src/prisma.js';

test('Vehicle & Document CRUD, Ownership Validation, and Renewal Flow', async (t) => {
  // Test User
  const user = await prisma.user.upsert({
    where: { email: 'test.driver@example.lk' },
    update: {},
    create: {
      fullName: 'Sunil Silva',
      email: 'test.driver@example.lk',
      phoneNumber: '+94779998877',
      passwordHash: await bcrypt.hash('TestPass123!', 10),
      role: 'USER',
    },
  });

  const revenueType = await prisma.documentType.findUnique({
    where: { code: 'REVENUE_LICENSE' },
  });

  let createdVehicle = null;
  let createdDoc = null;

  await t.test('prevents duplicate vehicle registration for same user', async () => {
    // 1. Create vehicle
    createdVehicle = await prisma.vehicle.create({
      data: {
        userId: user.id,
        registrationNumber: 'WP CAB-9988',
        vehicleType: 'Car',
        brand: 'Suzuki',
        model: 'Wagon R Stingray',
        manufacturingYear: 2019,
        registeredProvince: 'Western',
        ownerName: 'Sunil Silva',
      },
    });
    assert.ok(createdVehicle.id);

    // 2. Attempt duplicate creation - should trigger constraint violation
    await assert.rejects(async () => {
      await prisma.vehicle.create({
        data: {
          userId: user.id,
          registrationNumber: 'WP CAB-9988',
          vehicleType: 'Car',
          brand: 'Suzuki',
          model: 'Wagon R',
          manufacturingYear: 2019,
          registeredProvince: 'Western',
          ownerName: 'Sunil Silva',
        },
      });
    });
  });

  await t.test('creates document and attaches to vehicle', async () => {
    const today = new Date();
    const expiry = new Date(today);
    expiry.setDate(today.getDate() + 15); // Exactly 15 days

    createdDoc = await prisma.vehicleDocument.create({
      data: {
        vehicleId: createdVehicle.id,
        documentTypeId: revenueType.id,
        documentNumber: 'REV-9988-TEST',
        expiryDate: expiry,
        renewalStatus: 'ACTIVE',
      },
    });

    assert.ok(createdDoc.id);
    assert.equal(createdDoc.renewalStatus, 'ACTIVE');
  });

  await t.test('renews document, updates expiry date, and preserves renewal history', async () => {
    const oldExpiry = createdDoc.expiryDate;
    const newExpiry = new Date(oldExpiry);
    newExpiry.setFullYear(newExpiry.getFullYear() + 1); // 1 year renewal

    // Record history
    const history = await prisma.documentRenewalHistory.create({
      data: {
        documentId: createdDoc.id,
        previousExpiryDate: oldExpiry,
        newExpiryDate: newExpiry,
        renewalCost: 4500.0,
        referenceNumber: 'REF-REV-2027-001',
        remarks: 'Online e-Revenue payment completed',
      },
    });

    // Update document
    const updated = await prisma.vehicleDocument.update({
      where: { id: createdDoc.id },
      data: {
        expiryDate: newExpiry,
        renewalStatus: 'ACTIVE',
      },
      include: {
        renewalHistory: true,
      },
    });

    assert.ok(history.id);
    assert.equal(updated.renewalHistory.length, 1);
    assert.equal(updated.renewalHistory[0].renewalCost, 4500.0);
    assert.equal(new Date(updated.expiryDate).getFullYear(), new Date(newExpiry).getFullYear());
  });

  // Cleanup test user
  await prisma.user.delete({ where: { id: user.id } });
});
