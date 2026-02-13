/**
 * User Model
 */

import { Model, Sequelize, DataTypes } from 'sequelize';

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
  class User extends Model {
    public id!: string;
    public email!: string;
    public password!: string;
    public firstName!: string;
    public lastName!: string;
    public role!: 'admin' | 'scorer' | 'viewer';
    public createdAt!: Date;
    public updatedAt!: Date;
    public deletedAt?: Date | null;

    static associate(models: any) {
      User.hasMany(models.Match, { foreignKey: 'createdBy', as: 'createdMatches' });
      User.hasMany(models.Team, { foreignKey: 'createdBy', as: 'createdTeams' });
    }
  }

  User.init(
    {
      id: {
        type: dataTypes.UUID,
        defaultValue: dataTypes.UUIDV4,
        primaryKey: true,
      },
      email: {
        type: dataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
      },
      phoneNumber: {
        type: dataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      fcmToken: {
        type: dataTypes.STRING,
        allowNull: true,
      },
      password: {
        type: dataTypes.STRING,
        allowNull: false,
      },
      firstName: {
        type: dataTypes.STRING,
        allowNull: false,
      },
      lastName: {
        type: dataTypes.STRING,
        allowNull: false,
      },
      role: {
        type: dataTypes.ENUM('admin', 'scorer', 'viewer'),
        defaultValue: 'scorer',
      },
      createdAt: {
        type: dataTypes.DATE,
        defaultValue: dataTypes.NOW,
      },
      updatedAt: {
        type: dataTypes.DATE,
        defaultValue: dataTypes.NOW,
      },
      deletedAt: {
        type: dataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      timestamps: true,
      paranoid: true,
    }
  );

  return User;
};
