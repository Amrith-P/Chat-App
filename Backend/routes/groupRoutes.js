import express from 'express';
import {
  createGroup,
  getUserGroups,
  getGroupDetails,
  getGroupMembers,
  addGroupMembers,
  removeGroupMember,
  updateMemberRole,
  updateGroupSettings,
  leaveGroup,
  deleteGroup
} from '../controllers/groupController.js';
import {
  getGroupMessages,
  sendGroupMessage
} from '../controllers/groupMessageController.js';
import { protect } from '../middleware/auth.js';
import { requireGroupMember, requireGroupAdmin } from '../middleware/groupMiddleware.js';

const router = express.Router();

// Group CRUD & List
router.post('/', protect, createGroup);
router.get('/', protect, getUserGroups);
router.get('/:groupId', protect, requireGroupMember, getGroupDetails);
router.patch('/:groupId', protect, requireGroupAdmin, updateGroupSettings);
router.delete('/:groupId', protect, requireGroupAdmin, deleteGroup);

// Member Management
router.get('/:groupId/members', protect, requireGroupMember, getGroupMembers);
router.post('/:groupId/members', protect, requireGroupAdmin, addGroupMembers);
router.delete('/:groupId/members/:userId', protect, requireGroupAdmin, removeGroupMember);
router.patch('/:groupId/members/:userId/role', protect, requireGroupAdmin, updateMemberRole);
router.post('/:groupId/leave', protect, requireGroupMember, leaveGroup);

// Group Messages
router.get('/:groupId/messages', protect, requireGroupMember, getGroupMessages);
router.post('/:groupId/messages', protect, requireGroupMember, sendGroupMessage);

export default router;
