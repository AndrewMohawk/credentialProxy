import express from 'express';
import { authMiddleware } from '../../middleware/auth';

const router = express.Router();

// Apply auth middleware to all policy routes
router.use(authMiddleware);

// Placeholder route for getting all policies
router.get('/', (req, res) => {
  res.status(200).json({ message: 'Get all policies endpoint' });
});

// Placeholder route for getting a specific policy
router.get('/:id', (req, res) => {
  res.status(200).json({ message: `Get policy with ID: ${req.params.id}` });
});

// Placeholder route for creating a new policy
router.post('/', (req, res) => {
  res.status(201).json({ message: 'Create policy endpoint' });
});

// Placeholder route for updating a policy
router.put('/:id', (req, res) => {
  res.status(200).json({ message: `Update policy with ID: ${req.params.id}` });
});

// Placeholder route for deleting a policy
router.delete('/:id', (req, res) => {
  res.status(200).json({ message: `Delete policy with ID: ${req.params.id}` });
});

export const policyRoutes = router; 