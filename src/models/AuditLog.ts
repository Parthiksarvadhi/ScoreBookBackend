/**
 * AuditLog Model
 */

import { Model, Sequelize, DataTypes } from 'sequelize';

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
  class AuditLog extends Model {
    public id!: string;
    public matchId!: string;
    public userId!: string;
    public scorerId?: string | null;
    public actionType!: string;
    public oldScorerId?: string | null;
    public reason?: string | null;
    public timestamp!: Date;
    public createdAt!: Date;
    public updatedAt!: Date;
    public deletedAt?: Date | null;

    static associate(models: any) {
      AuditLog.belongsTo(models.Match, { foreignKey: 'matchId', as: 'match' });
      AuditLog.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
      AuditLog.belongsTo(models.User, { foreignKey: 'scorerId', as: 'scorer' });
    }
  }

  AuditLog.init(
    {
      id: {
        type: dataTypes.UUID,
        defaultValue: dataTypes.UUIDV4,
        primaryKey: true,
      },
      matchId: {
        type: dataTypes.UUID,
        allowNull: false,
        references: { model: 'matches', key: 'id' },
      },
      userId: {
        type: dataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
      },
      scorerId: {
        type: dataTypes.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
      },
      actionType: {
        type: dataTypes.ENUM(
          'lock_acquired',
          'lock_released',
          'lock_timeout_released',
          'lock_force_released',
          'scorer_reassigned',
          'match_started',
          'match_ended',
          'match_abandoned'
        ),
        allowNull: false,
      },
      oldScorerId: {
        type: dataTypes.UUID,
        allowNull: true,
      },
      reason: {
        type: dataTypes.TEXT,
        allowNull: true,
      },
      timestamp: {
        type: dataTypes.DATE,
        defaultValue: dataTypes.NOW,
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
      modelName: 'AuditLog',
      tableName: 'audit_logs',
      timestamps: true,
      paranoid: true,
    }
  );

  return AuditLog;
};
