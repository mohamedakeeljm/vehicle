import express from 'express';
import path from 'path';
import fs from 'fs';
import prisma from '../prisma.js';
import { authenticateToken } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { calculateDaysRemaining, getDocumentStatusMeta } from '../utils/dateUtils.js';

const router = express.Router();

/**
 * GET /api/documents/types
 * List all available document types
 */
router.get('/types', authenticateToken, async (req, res) => {
  try {
    const types = await prisma.documentType.findMany({
      orderBy: { name: 'asc' },
    });
    return res.json({ success: true, data: types });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch document types.' });
  }
});

/**
 * GET /api/documents
 * List all documents belonging to user across all vehicles with filters (vehicleId, status, category)
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { vehicleId, status, category } = req.query;

    const where = {
      vehicle: {
        userId: req.user.id,
      },
    };

    if (vehicleId) {
      where.vehicleId = vehicleId;
    }

    if (category) {
      where.documentType = { category };
    }

    const documents = await prisma.vehicleDocument.findMany({
      where,
      include: {
        vehicle: true,
        documentType: true,
        renewalHistory: {
          orderBy: { renewedAt: 'desc' },
        },
      },
      orderBy: { expiryDate: 'asc' },
    });

    const enriched = documents
      .map((doc) => {
        const daysRemaining = calculateDaysRemaining(doc.expiryDate);
        const meta = getDocumentStatusMeta(daysRemaining);
        return {
          ...doc,
          daysRemaining,
          statusMeta: meta,
        };
      })
      .filter((doc) => {
        if (!status) return true;
        return doc.statusMeta.status === status.toUpperCase();
      });

    return res.json({
      success: true,
      data: enriched,
    });
  } catch (error) {
    console.error('List documents error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve documents.',
    });
  }
});

/**
 * POST /api/documents
 * Add a new document to a vehicle
 */
router.post('/', authenticateToken, upload.single('attachment'), async (req, res) => {
  try {
    const {
      vehicleId,
      documentTypeId,
      customTypeName,
      documentNumber,
      serviceProvider,
      policyOrType,
      issueDate,
      expiryDate,
      notes,
    } = req.body;

    if (!vehicleId || !documentTypeId || !expiryDate) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle ID, Document Type, and Expiry Date are required.',
      });
    }

    // Ownership check
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: vehicleId, userId: req.user.id },
    });

    if (!vehicle) {
      return res.status(403).json({
        success: false,
        message: 'Vehicle not found or not owned by the current user.',
      });
    }

    let fileAttachmentUrl = null;
    let originalFileName = null;
    if (req.file) {
      fileAttachmentUrl = `/uploads/${req.file.filename}`;
      originalFileName = req.file.originalname;
    }

    const parsedExpiry = new Date(expiryDate);
    const parsedIssue = issueDate ? new Date(issueDate) : null;

    const daysRemaining = calculateDaysRemaining(parsedExpiry);
    const renewalStatus = daysRemaining < 0 ? 'EXPIRED' : 'ACTIVE';

    const document = await prisma.vehicleDocument.create({
      data: {
        vehicleId,
        documentTypeId,
        customTypeName: customTypeName || null,
        documentNumber: documentNumber ? documentNumber.trim() : null,
        serviceProvider: serviceProvider ? serviceProvider.trim() : null,
        policyOrType: policyOrType ? policyOrType.trim() : null,
        issueDate: parsedIssue,
        expiryDate: parsedExpiry,
        fileAttachmentUrl,
        originalFileName,
        renewalStatus,
        notes: notes ? notes.trim() : null,
      },
      include: {
        vehicle: true,
        documentType: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Document added successfully.',
      data: {
        ...document,
        daysRemaining,
        statusMeta: getDocumentStatusMeta(daysRemaining),
      },
    });
  } catch (error) {
    console.error('Create document error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save document.',
      error: error.message,
    });
  }
});

/**
 * PUT /api/documents/:id/renew
 * Renew document with new expiry date while strictly preserving renewal history
 */
router.put('/:id/renew', authenticateToken, upload.single('attachment'), async (req, res) => {
  try {
    const { newExpiryDate, renewalCost, referenceNumber, remarks, newDocumentNumber } = req.body;

    if (!newExpiryDate) {
      return res.status(400).json({
        success: false,
        message: 'New expiry date is required for renewal.',
      });
    }

    // Check ownership
    const document = await prisma.vehicleDocument.findFirst({
      where: {
        id: req.params.id,
        vehicle: { userId: req.user.id },
      },
      include: {
        vehicle: true,
        documentType: true,
      },
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found or unauthorized.',
      });
    }

    const previousExpiryDate = new Date(document.expiryDate);
    const parsedNewExpiry = new Date(newExpiryDate);

    let fileAttachmentUrl = document.fileAttachmentUrl;
    let originalFileName = document.originalFileName;
    if (req.file) {
      fileAttachmentUrl = `/uploads/${req.file.filename}`;
      originalFileName = req.file.originalname;
    }

    const parsedCost = renewalCost ? parseFloat(renewalCost) : null;

    // Use transaction: Record renewal history, update document, and clear obsolete pending delivery logs
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create renewal history record
      await tx.documentRenewalHistory.create({
        data: {
          documentId: document.id,
          previousExpiryDate,
          newExpiryDate: parsedNewExpiry,
          renewalCost: parsedCost,
          referenceNumber: referenceNumber || null,
          remarks: remarks || 'Document renewed by vehicle owner',
        },
      });

      // 2. Update document
      const updatedDoc = await tx.vehicleDocument.update({
        where: { id: document.id },
        data: {
          expiryDate: parsedNewExpiry,
          renewalStatus: 'ACTIVE',
          ...(newDocumentNumber ? { documentNumber: newDocumentNumber.trim() } : {}),
          fileAttachmentUrl,
          originalFileName,
        },
        include: {
          vehicle: true,
          documentType: true,
          renewalHistory: { orderBy: { renewedAt: 'desc' } },
        },
      });

      return updatedDoc;
    });

    const daysRemaining = calculateDaysRemaining(result.expiryDate);

    return res.json({
      success: true,
      message: `Document renewed successfully! New expiry: ${new Date(result.expiryDate).toLocaleDateString('en-GB')}`,
      data: {
        ...result,
        daysRemaining,
        statusMeta: getDocumentStatusMeta(daysRemaining),
      },
    });
  } catch (error) {
    console.error('Renew document error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to renew document.',
      error: error.message,
    });
  }
});

/**
 * PUT /api/documents/:id
 * Edit existing document details
 */
router.put('/:id', authenticateToken, upload.single('attachment'), async (req, res) => {
  try {
    const document = await prisma.vehicleDocument.findFirst({
      where: {
        id: req.params.id,
        vehicle: { userId: req.user.id },
      },
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found or unauthorized.',
      });
    }

    const {
      documentTypeId,
      customTypeName,
      documentNumber,
      serviceProvider,
      policyOrType,
      issueDate,
      expiryDate,
      renewalStatus,
      notes,
    } = req.body;

    let fileAttachmentUrl = document.fileAttachmentUrl;
    let originalFileName = document.originalFileName;
    if (req.file) {
      fileAttachmentUrl = `/uploads/${req.file.filename}`;
      originalFileName = req.file.originalname;
    }

    const parsedExpiry = expiryDate ? new Date(expiryDate) : document.expiryDate;
    const parsedIssue = issueDate !== undefined ? (issueDate ? new Date(issueDate) : null) : document.issueDate;

    const updated = await prisma.vehicleDocument.update({
      where: { id: document.id },
      data: {
        ...(documentTypeId ? { documentTypeId } : {}),
        customTypeName: customTypeName !== undefined ? customTypeName : document.customTypeName,
        documentNumber: documentNumber !== undefined ? documentNumber : document.documentNumber,
        serviceProvider: serviceProvider !== undefined ? serviceProvider : document.serviceProvider,
        policyOrType: policyOrType !== undefined ? policyOrType : document.policyOrType,
        issueDate: parsedIssue,
        expiryDate: parsedExpiry,
        renewalStatus: renewalStatus || document.renewalStatus,
        fileAttachmentUrl,
        originalFileName,
        notes: notes !== undefined ? notes : document.notes,
      },
      include: {
        vehicle: true,
        documentType: true,
        renewalHistory: { orderBy: { renewedAt: 'desc' } },
      },
    });

    const daysRemaining = calculateDaysRemaining(updated.expiryDate);

    return res.json({
      success: true,
      message: 'Document updated successfully.',
      data: {
        ...updated,
        daysRemaining,
        statusMeta: getDocumentStatusMeta(daysRemaining),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update document.',
      error: error.message,
    });
  }
});

/**
 * DELETE /api/documents/:id
 * Delete a document
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const document = await prisma.vehicleDocument.findFirst({
      where: {
        id: req.params.id,
        vehicle: { userId: req.user.id },
      },
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found or unauthorized.',
      });
    }

    await prisma.vehicleDocument.delete({
      where: { id: document.id },
    });

    return res.json({
      success: true,
      message: 'Document deleted successfully.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete document.',
    });
  }
});

/**
 * GET /api/documents/:id/download
 * Secure download endpoint - enforces authentication & ownership check
 */
router.get('/:id/download', authenticateToken, async (req, res) => {
  try {
    const document = await prisma.vehicleDocument.findFirst({
      where: {
        id: req.params.id,
        vehicle: { userId: req.user.id },
      },
    });

    if (!document || !document.fileAttachmentUrl) {
      return res.status(404).json({
        success: false,
        message: 'Document attachment not found or access denied.',
      });
    }

    const filePath = path.resolve(document.fileAttachmentUrl.replace(/^\//, ''));
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File does not exist on storage.',
      });
    }

    return res.download(filePath, document.originalFileName || path.basename(filePath));
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to download document.',
    });
  }
});

export default router;
