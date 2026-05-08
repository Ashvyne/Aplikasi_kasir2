const User = require('../models/User');

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'name', 'role', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, users });
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data pengguna' });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, role, email } = req.body;

  try {
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }

    // Don't allow changing current user's role if it's the last admin (optional safety)
    
    user.name = name || user.name;
    user.role = role || user.role;
    user.email = email || user.email;
    
    await user.save();

    res.json({ 
      success: true, 
      message: 'User berhasil diperbarui',
      user: { id: user.id, username: user.username, role: user.role }
    });
  } catch (error) {
    console.error('❌ Error updating user:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui user' });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    // Prevent deleting self
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ success: false, message: 'Anda tidak bisa menghapus akun Anda sendiri' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }

    await user.destroy();
    res.json({ success: true, message: 'User berhasil dihapus' });
  } catch (error) {
    console.error('❌ Error deleting user:', error);
    res.status(500).json({ success: false, message: 'Gagal menghapus user' });
  }
};
