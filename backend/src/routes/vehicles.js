import express from 'express';
import prisma from '../prisma.js';
import { authenticateToken } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { calculateDaysRemaining, getDocumentStatusMeta } from '../utils/dateUtils.js';

const router = express.Router();

/**
 * Valid Sri Lankan Provinces:
 * Western, Central, Southern, Northern, Eastern, North Western, North Central, Uva, Sabaragamuwa
 */
export const SRI_LANKAN_PROVINCES = [
  'Western',
  'Central',
  'Southern',
  'Northern',
  'Eastern',
  'North Western',
  'North Central',
  'Uva',
  'Sabaragamuwa',
];

export const VEHICLE_TYPES = [
  'Car',
  'Motorcycle',
  'Van',
  'Three-Wheeler',
  'Bus',
  'Lorry',
  'SUV / Crossover',
  'Pickup Truck',
  'Tractor',
  'Other',
];

/**
 * GET /api/vehicles
 * List all vehicles belonging to the authenticated user with documents summary
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      where: { userId: req.user.id },
      include: {
        documents: {
          include: {
            documentType: true,
          },
          orderBy: { expiryDate: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const enrichedVehicles = vehicles.map((v) => {
      let expiredCount = 0;
      let expiringCount = 0;
      let validCount = 0;

      const enrichedDocs = v.documents.map((doc) => {
        const daysRemaining = calculateDaysRemaining(doc.expiryDate);
        const meta = getDocumentStatusMeta(daysRemaining);

        if (meta.status === 'EXPIRED') expiredCount++;
        else if (meta.status === 'EXPIRING') expiringCount++;
        else validCount++;

        return {
          ...doc,
          daysRemaining,
          statusMeta: meta,
        };
      });

      return {
        ...v,
        documents: enrichedDocs,
        documentStats: {
          total: v.documents.length,
          expired: expiredCount,
          expiring: expiringCount,
          valid: validCount,
        },
      };
    });

    return res.json({
      success: true,
      data: enrichedVehicles,
    });
  } catch (error) {
    console.error('List vehicles error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve vehicles.',
    });
  }
});

/**
 * GET /api/vehicles/:id
 * Retrieve a single vehicle by ID with all documents and renewal history
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
      include: {
        documents: {
          include: {
            documentType: true,
            renewalHistory: {
              orderBy: { renewedAt: 'desc' },
            },
          },
          orderBy: { expiryDate: 'asc' },
        },
      },
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found or you do not have permission to view it.',
      });
    }

    const enrichedDocuments = vehicle.documents.map((doc) => {
      const daysRemaining = calculateDaysRemaining(doc.expiryDate);
      return {
        ...doc,
        daysRemaining,
        statusMeta: getDocumentStatusMeta(daysRemaining),
      };
    });

    return res.json({
      success: true,
      data: {
        ...vehicle,
        documents: enrichedDocuments,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve vehicle details.',
    });
  }
});

/**
 * POST /api/vehicles
 * Register a new vehicle
 */
router.post('/', authenticateToken, upload.single('vehicleImage'), async (req, res) => {
  try {
    const {
      registrationNumber,
      vehicleType,
      brand,
      model,
      manufacturingYear,
      registeredProvince,
      ownerName,
    } = req.body;

    if (!registrationNumber || !vehicleType || !brand || !model || !manufacturingYear || !registeredProvince || !ownerName) {
      return res.status(400).json({
        success: false,
        message: 'All vehicle fields are required.',
      });
    }

    const cleanRegNo = registrationNumber.trim().toUpperCase();

    // Prevent duplicate vehicle records within the same user account
    const existing = await prisma.vehicle.findUnique({
      where: {
        userId_registrationNumber: {
          userId: req.user.id,
          registrationNumber: cleanRegNo,
        },
      },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Vehicle with registration number '${cleanRegNo}' already exists in your garage.`,
      });
    }

    let imageUrl = req.body.imageUrl || null;
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        userId: req.user.id,
        registrationNumber: cleanRegNo,
        vehicleType,
        brand: brand.trim(),
        model: model.trim(),
        manufacturingYear: parseInt(manufacturingYear, 10),
        registeredProvince,
        ownerName: ownerName.trim(),
        imageUrl,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Vehicle registered successfully.',
      data: vehicle,
    });
  } catch (error) {
    console.error('Create vehicle error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to register vehicle.',
      error: error.message,
    });
  }
});

/**
 * PUT /api/vehicles/:id
 * Update an existing vehicle
 */
router.put('/:id', authenticateToken, upload.single('vehicleImage'), async (req, res) => {
  try {
    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found or unauthorized.',
      });
    }

    const {
      registrationNumber,
      vehicleType,
      brand,
      model,
      manufacturingYear,
      registeredProvince,
      ownerName,
    } = req.body;

    const cleanRegNo = registrationNumber ? registrationNumber.trim().toUpperCase() : vehicle.registrationNumber;

    if (cleanRegNo !== vehicle.registrationNumber) {
      const duplicate = await prisma.vehicle.findUnique({
        where: {
          userId_registrationNumber: {
            userId: req.user.id,
            registrationNumber: cleanRegNo,
          },
        },
      });
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: `Vehicle with registration number '${cleanRegNo}' already exists in your garage.`,
        });
      }
    }

    let imageUrl = vehicle.imageUrl;
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    } else if (req.body.imageUrl !== undefined) {
      imageUrl = req.body.imageUrl;
    }

    const updated = await prisma.vehicle.update({
      where: { id: vehicle.id },
      data: {
        registrationNumber: cleanRegNo,
        ...(vehicleType ? { vehicleType } : {}),
        ...(brand ? { brand: brand.trim() } : {}),
        ...(model ? { model: model.trim() } : {}),
        ...(manufacturingYear ? { manufacturingYear: parseInt(manufacturingYear, 10) } : {}),
        ...(registeredProvince ? { registeredProvince } : {}),
        ...(ownerName ? { ownerName: ownerName.trim() } : {}),
        imageUrl,
      },
    });

    return res.json({
      success: true,
      message: 'Vehicle updated successfully.',
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update vehicle.',
      error: error.message,
    });
  }
});

/**
 * DELETE /api/vehicles/:id
 * Delete a vehicle and its associated documents
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found or unauthorized.',
      });
    }

    await prisma.vehicle.delete({
      where: { id: vehicle.id },
    });

    return res.json({
      success: true,
      message: `Vehicle ${vehicle.registrationNumber} deleted successfully.`,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete vehicle.',
    });
  }
});

export default router;
