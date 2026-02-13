import express, { Request, Response, Router } from 'express';
import { upload } from '../middleware/uploadMiddleware.js';
import { IAuthRequest } from '../types/index.js'; // Ensure this type exists or use any for req

const router: Router = express.Router();

/**
 * POST /api/upload
 * Upload a single file (image)
 */
router.post('/', upload.single('image'), (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Construct the public URL
        // Assuming the server serves 'public' folder statically
        // The path stored is relative to public folder
        const fileUrl = `/uploads/${req.file.filename}`;

        res.status(201).json({
            message: 'File uploaded successfully',
            url: fileUrl,
            filename: req.file.filename
        });
    } catch (error: any) {
        res.status(500).json({
            error: 'File upload failed',
            details: error.message
        });
    }
});

export default router;
