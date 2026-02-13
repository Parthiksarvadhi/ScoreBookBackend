/**
 * Player Model
 */

import { Model, Sequelize, DataTypes } from 'sequelize';

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
  class Player extends Model {
    public id!: string;
    public teamId!: string;
    public name!: string;
    public jerseyNumber!: number;
    public role!: 'batsman' | 'bowler' | 'all-rounder' | 'wicket-keeper';
    public createdAt!: Date;
    public updatedAt!: Date;
    public deletedAt?: Date | null;

    public userId?: string;

    static associate(models: any) {
      Player.belongsTo(models.Team, { foreignKey: 'teamId', as: 'team' });
      Player.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
      Player.hasMany(models.Ball, { foreignKey: 'batsmanId', as: 'ballsAsBatsman' });
      Player.hasMany(models.Ball, { foreignKey: 'bowlerId', as: 'ballsAsBowler' });
    }
  }

  Player.init(
    {
      id: {
        type: dataTypes.UUID,
        defaultValue: dataTypes.UUIDV4,
        primaryKey: true,
      },
      teamId: {
        type: dataTypes.UUID,
        allowNull: false,
        references: { model: 'teams', key: 'id' },
      },
      userId: {
        type: dataTypes.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
      },
      name: {
        type: dataTypes.STRING,
        allowNull: false,
      },
      jerseyNumber: {
        type: dataTypes.INTEGER,
        allowNull: false,
      },
      role: {
        type: dataTypes.ENUM('batsman', 'bowler', 'all-rounder', 'wicket-keeper'),
        allowNull: false,
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
      modelName: 'Player',
      tableName: 'players',
      timestamps: true,
      paranoid: true,
    }
  );

  return Player;
};
