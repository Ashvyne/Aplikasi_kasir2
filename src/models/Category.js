const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Category = sequelize.define('Category', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: 'Nama kategori alat'
    },
    description: {
      type: DataTypes.TEXT,
      comment: 'Deskripsi kategori'
    },
    icon: {
      type: DataTypes.STRING(50),
      comment: 'Icon atau emoji untuk kategori'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'categories',
    timestamps: true
  });

  return Category;
};
