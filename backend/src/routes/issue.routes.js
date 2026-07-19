import express from 'express'
import { reportIssue, getUserIssues } from '../controllers/issue.controller.js'
import { protect } from '../middleware/auth.middleware.js'
import { upload } from '../middleware/upload.middleware.js' // ✅ .js আছে কিনা দেখ

const router = express.Router()

router.post('/report', protect, upload.single('proof'), reportIssue)
router.get('/my-issues', protect, getUserIssues)

export default router