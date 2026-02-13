/**
 * Team Model
 */

import { Model, Sequelize, DataTypes } from 'sequelize';

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
  class Team extends Model {
    public id!: string;
    public name!: string;
    public shortName!: string;
    public logo?: string;
    public primaryColor?: string;
    public createdBy!: string;
    public createdAt!: Date;
    public updatedAt!: Date;
    public deletedAt?: Date | null;

    static associate(models: any) {
      Team.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });
      Team.hasMany(models.Player, { foreignKey: 'teamId', as: 'players' });
      Team.hasMany(models.Match, { foreignKey: 'teamAId', as: 'matchesAsTeamA' });
      Team.hasMany(models.Match, { foreignKey: 'teamBId', as: 'matchesAsTeamB' });
    }
  }

  Team.init(
    {
      id: {
        type: dataTypes.UUID,
        defaultValue: dataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: dataTypes.STRING,
        allowNull: false,
      },
      shortName: {
        type: dataTypes.STRING(10),
        allowNull: false,
      },
      logo: {
        type: dataTypes.STRING,
        allowNull: true,
      },
      primaryColor: {
        type: dataTypes.STRING,
        allowNull: true,
      },
      createdBy: {
        type: dataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
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
      modelName: 'Team',
      tableName: 'teams',
      timestamps: true,
      paranoid: true,
    }
  );

  return Team;
};
