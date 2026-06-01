const db = require('../config/db');

const { createNotification } = require('../utils/notificationHelper');

exports.getLostFoundItems = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `
      SELECT
        lf.*,
        u.name AS reported_by_name,
        u.email AS reported_by_email
      FROM lost_found lf
      LEFT JOIN users u
        ON lf.reported_by = u.id
      ORDER BY lf.created_at DESC
      `
    );

    res.json(rows);
  } catch (err) {
    console.error('Get lost found error:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.createLostFoundItem = async (req, res) => {
  try {
    const {
      item_type,
      title,
      description = '',
      location,
      contact_info = '',
      category = '',
      collection_point = 'Student Services Desk / Reception',
    } = req.body;

    if (!item_type || !title || !location) {
      return res.status(400).json({
        message: 'Item type, title, and location are required',
      });
    }

    if (!['lost', 'found'].includes(item_type)) {
      return res.status(400).json({
        message: 'Item type must be lost or found',
      });
    }

    const imagePath = req.file
      ? `/uploads/lost-found/${req.file.filename}`
      : null;

    const [result] = await db.execute(
      `
      INSERT INTO lost_found
      (
        item_type,
        title,
        description,
        location,
        reported_by,
        contact_info,
        date_reported,
        status,
        image_path,
        category,
        collection_point
      )
      VALUES (?, ?, ?, ?, ?, ?, CURDATE(), 'open', ?, ?, ?)
      `,
      [
        item_type,
        title,
        description,
        location,
        req.user.id,
        contact_info,
        imagePath,
        category,
        collection_point,
      ]
    );

    await createNotification({
      user_id: req.user.id,
      role: req.user.role,
      title: 'Lost & Found Report Submitted',
      message: `Your ${item_type} item report "${title}" has been submitted successfully.`,
      type: 'lost_found',
    });

    await createNotification({
      user_id: null,
      role: 'admin',
      title: 'New Lost & Found Report',
      message: `${req.user.name || 'A user'} reported a ${item_type} item: "${title}".`,
      type: 'lost_found',
    });

    if (item_type === 'found') {
      await createNotification({
        user_id: null,
        role: 'student',
        title: 'New Found Item Reported',
        message: `"${title}" was reported found at ${location}. Collection point: ${collection_point}.`,
        type: 'lost_found',
      });

      await createNotification({
        user_id: null,
        role: 'faculty',
        title: 'New Found Item Reported',
        message: `"${title}" was reported found at ${location}. Collection point: ${collection_point}.`,
        type: 'lost_found',
      });
    }

    res.status(201).json({
      message: 'Lost & Found item reported successfully',
      id: result.insertId,
    });
  } catch (err) {
    console.error('Create lost found error:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.updateLostFoundItem = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      item_type,
      title,
      description = '',
      location,
      contact_info = '',
      category = '',
      collection_point = 'Student Services Desk / Reception',
      status = 'open',
    } = req.body;

    if (!item_type || !title || !location) {
      return res.status(400).json({
        message: 'Item type, title, and location are required',
      });
    }

    if (!['lost', 'found'].includes(item_type)) {
      return res.status(400).json({
        message: 'Item type must be lost or found',
      });
    }

    if (!['open', 'resolved'].includes(status)) {
      return res.status(400).json({
        message: 'Invalid status',
      });
    }

    const [[oldItem]] = await db.execute(
      `
      SELECT *
      FROM lost_found
      WHERE id = ?
      `,
      [id]
    );

    if (!oldItem) {
      return res.status(404).json({
        message: 'Lost & Found item not found',
      });
    }

    const isAdmin = req.user.role === 'admin';
    const isOwner = Number(oldItem.reported_by) === Number(req.user.id);

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        message: 'You can only edit your own reported item',
      });
    }

    if (!isAdmin && oldItem.status === 'resolved') {
      return res.status(403).json({
        message: 'Returned items cannot be edited',
      });
    }

    if (!isAdmin && status === 'resolved') {
      return res.status(403).json({
        message: 'Only admin can mark items as returned',
      });
    }

    const imagePath = req.file
      ? `/uploads/lost-found/${req.file.filename}`
      : null;

    await db.execute(
      `
      UPDATE lost_found
      SET item_type = ?,
          title = ?,
          description = ?,
          location = ?,
          contact_info = ?,
          category = ?,
          collection_point = ?,
          status = ?,
          image_path = COALESCE(?, image_path)
      WHERE id = ?
      `,
      [
        item_type,
        title,
        description,
        location,
        contact_info,
        category,
        collection_point,
        isAdmin ? status : oldItem.status,
        imagePath,
        id,
      ]
    );

    await createNotification({
      user_id: null,
      role: 'admin',
      title: 'Lost & Found Updated',
      message: `"${title}" was updated in Lost & Found.`,
      type: 'lost_found',
    });

    if (isAdmin && oldItem.status !== 'resolved' && status === 'resolved') {
      const [[reporter]] = await db.execute(
        `
        SELECT role
        FROM users
        WHERE id = ?
        `,
        [oldItem.reported_by]
      );

      await createNotification({
        user_id: oldItem.reported_by,
        role: reporter?.role || 'student',
        title: 'Item Returned',
        message: `Your reported item "${title}" has been marked as returned/resolved.`,
        type: 'lost_found_returned',
      });
    }

    res.json({
      message: 'Lost & Found item updated successfully',
    });
  } catch (err) {
    console.error('Update lost found error:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.updateLostFoundStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Only admin can update lost and found status',
      });
    }

    if (!['open', 'resolved'].includes(status)) {
      return res.status(400).json({
        message: 'Invalid status',
      });
    }

    const [[item]] = await db.execute(
      `
      SELECT
        lf.*,
        u.role AS reporter_role
      FROM lost_found lf
      LEFT JOIN users u
        ON u.id = lf.reported_by
      WHERE lf.id = ?
      `,
      [id]
    );

    if (!item) {
      return res.status(404).json({
        message: 'Lost & Found item not found',
      });
    }

    await db.execute(
      `
      UPDATE lost_found
      SET status = ?
      WHERE id = ?
      `,
      [status, id]
    );

    await createNotification({
      user_id: null,
      role: 'admin',
      title: 'Lost & Found Status Updated',
      message: `"${item.title}" status changed to ${
        status === 'resolved' ? 'returned' : 'open'
      }.`,
      type: 'lost_found',
    });

    if (status === 'resolved') {
      await createNotification({
        user_id: item.reported_by,
        role: item.reporter_role || 'student',
        title: 'Item Returned',
        message: `Your reported item "${item.title}" has been marked as returned/resolved. Collection point: ${
          item.collection_point || 'Reception'
        }.`,
        type: 'lost_found_returned',
      });
    }

    res.json({
      message: 'Status updated successfully',
    });
  } catch (err) {
    console.error('Update lost found status error:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.requestLostFoundClaim = async (req, res) => {
  try {
    const { id } = req.params;

    const [[item]] = await db.execute(
      `
      SELECT
        lf.*,
        reporter.name AS reported_by_name,
        reporter.email AS reported_by_email
      FROM lost_found lf
      LEFT JOIN users reporter
        ON reporter.id = lf.reported_by
      WHERE lf.id = ?
      `,
      [id]
    );

    if (!item) {
      return res.status(404).json({
        message: 'Lost & Found item not found',
      });
    }

    if (item.status === 'resolved') {
      return res.status(400).json({
        message: 'This item has already been returned',
      });
    }

    if (item.item_type !== 'found') {
      return res.status(400).json({
        message: 'Claim request is only available for found items',
      });
    }

    if (Number(item.reported_by) === Number(req.user.id)) {
      return res.status(400).json({
        message: 'You cannot claim an item you reported yourself',
      });
    }

    await createNotification({
      user_id: null,
      role: 'admin',
      title: 'Lost Item Claim Request',
      message: `${req.user.name} (${req.user.email}) requested to claim "${item.title}". Verify ownership at ${
        item.collection_point || 'Student Services Desk / Reception'
      } before marking it returned.`,
      type: 'lost_found_claim',
    });

    await createNotification({
      user_id: req.user.id,
      role: req.user.role,
      title: 'Claim Request Sent',
      message: `Your claim request for "${item.title}" has been sent to admin. Please visit ${
        item.collection_point || 'Student Services Desk / Reception'
      } for verification.`,
      type: 'lost_found_claim',
    });

    if (item.reported_by) {
      const [[reporter]] = await db.execute(
        `
        SELECT role
        FROM users
        WHERE id = ?
        `,
        [item.reported_by]
      );

      await createNotification({
        user_id: item.reported_by,
        role: reporter?.role || 'student',
        title: 'Claim Requested for Your Found Item',
        message: `${req.user.name} requested to claim the found item "${item.title}". Admin will verify before returning it.`,
        type: 'lost_found_claim',
      });
    }

    res.json({
      message:
        'Claim request sent to admin. Please visit the collection point for verification.',
    });
  } catch (err) {
    console.error('Request lost found claim error:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.deleteLostFoundItem = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Only admin can delete lost and found items',
      });
    }

    const [[item]] = await db.execute(
      `
      SELECT title
      FROM lost_found
      WHERE id = ?
      `,
      [id]
    );

    await db.execute(
      `
      DELETE FROM lost_found
      WHERE id = ?
      `,
      [id]
    );

    await createNotification({
      user_id: null,
      role: 'admin',
      title: 'Lost & Found Deleted',
      message: `"${item?.title || 'An item'}" was removed from Lost & Found.`,
      type: 'lost_found',
    });

    res.json({
      message: 'Lost & Found item deleted successfully',
    });
  } catch (err) {
    console.error('Delete lost found error:', err);
    res.status(500).json({ message: err.message });
  }
};