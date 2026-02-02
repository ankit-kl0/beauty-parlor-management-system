const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticate, authorizeAdmin } = require('../middleware/auth');
const router = express.Router();

// Submit contact message (public)
router.post('/', [
  body('name').trim().notEmpty().withMessage('Name required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('message').trim().notEmpty().withMessage('Message required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { name, email, phone, message } = req.body;

    const [result] = await db.execute(
      'INSERT INTO contact_messages (name, email, phone, message) VALUES (?, ?, ?, ?)',
      [name, email, phone || null, message]
    );

    res.status(201).json({
      success: true,
      message: 'Message sent successfully'
    });
  } catch (error) {
    console.error('Contact message error:', error);
    res.status(500).json({ success: false, message: 'Error sending message' });
  }
});

// Get all contact messages (admin only)
router.get('/admin/all', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const [messages] = await db.execute(
      'SELECT * FROM contact_messages ORDER BY created_at DESC'
    );
    res.json({ success: true, data: messages });
  } catch (error) {
    console.error('Get contact messages error:', error);
    res.status(500).json({ success: false, message: 'Error fetching messages' });
  }
});

// Mark message as read (admin only)
router.put('/:id/read', authenticate, authorizeAdmin, async (req, res) => {
  try {
    await db.execute(
      'UPDATE contact_messages SET is_read = TRUE WHERE id = ?',
      [req.params.id]
    );
    res.json({ success: true, message: 'Message marked as read' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ success: false, message: 'Error updating message' });
  }
});

// Delete contact message (admin only)
router.delete('/:id', authenticate, authorizeAdmin, async (req, res) => {
  try {
    await db.execute(
      'DELETE FROM contact_messages WHERE id = ?',
      [req.params.id]
    );
    res.json({ success: true, message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ success: false, message: 'Error deleting message' });
  }
});

module.exports = router;