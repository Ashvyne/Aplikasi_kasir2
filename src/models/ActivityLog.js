const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ActivityLog = sequelize.define('ActivityLog', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    action: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Jenis aksi: CREATE, READ, UPDATE, DELETE, LOGIN, LOGOUT, APPROVE, REJECT'
    },
    entity_type: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Tipe entity: Equipment, Borrower, Loan, User, Category'
    },
    entity_id: {
      type: DataTypes.INTEGER,
      comment: 'ID dari entity yang diakses'
    },
    description: {
      type: DataTypes.TEXT,
      comment: 'Detail deskripsi aktivitas'
    },
    ip_address: {
      type: DataTypes.STRING(45),
      comment: 'IP address pengguna'
    },
    status: {
      type: DataTypes.ENUM('SUCCESS', 'FAILED'),
      defaultValue: 'SUCCESS'
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    timestamps: false,
    tableName: 'activity_logs',
    indexes: [
      { fields: ['user_id'] },
      { fields: ['entity_type', 'entity_id'] },
      { fields: ['action'] },
      { fields: ['createdAt'] }
    ]
  });

  // Association
  ActivityLog.associate = (models) => {
    ActivityLog.belongsTo(models.User, { 
      foreignKey: 'user_id',
      as: 'user'
    });
  };

  return ActivityLog;
};
