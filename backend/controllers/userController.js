const db = require('../config/db');
const bcrypt = require('bcryptjs');

// GET all users
exports.getAllUsers = async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT id, name, email, role, created_at FROM users ORDER BY id DESC'
    );

    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch users',
      error: error.message,
    });
  }
};

// CREATE user
exports.createUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const validRoles = ['admin', 'faculty', 'student'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const [existingUsers] = await db.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const [result] = await db.execute(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, role]
    );

    const [newUserRows] = await db.execute(
      'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      message: 'User created successfully',
      user: newUserRows[0],
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to create user',
      error: error.message,
    });
  }
};

// UPDATE user
exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, email, role, password } = req.body;

  try {
    const [existing] = await db.execute('SELECT * FROM users WHERE id = ?', [id]);

    if (existing.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const currentUser = existing[0];

    const updatedName = name || currentUser.name;
    const updatedEmail = email || currentUser.email;
    const updatedRole = role || currentUser.role;

    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      await db.execute(
        'UPDATE users SET name = ?, email = ?, role = ?, password = ? WHERE id = ?',
        [updatedName, updatedEmail, updatedRole, hashedPassword, id]
      );
    } else {
      await db.execute(
        'UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?',
        [updatedName, updatedEmail, updatedRole, id]
      );
    }

    const [updatedUserRows] = await db.execute(
      'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
      [id]
    );

    res.status(200).json({
      message: 'User updated successfully',
      user: updatedUserRows[0],
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to update user',
      error: error.message,
    });
  }
};

// DELETE user
exports.deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const [existing] = await db.execute('SELECT id FROM users WHERE id = ?', [id]);

    if (existing.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    await db.execute('DELETE FROM users WHERE id = ?', [id]);

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to delete user',
      error: error.message,
    });
  }
};