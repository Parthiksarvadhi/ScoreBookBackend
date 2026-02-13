/**
 * Match Model
 */

import { Model, Sequelize, DataTypes } from 'sequelize';

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
  class Match extends Model {
    public id!: string;
    public teamAId!: string;
    public teamBId!: string;
    public createdBy!: string;
    public matchType!: 'T20' | 'ODI' | 'Test' | 'Custom';
    public status!: 'scheduled' | 'live' | 'completed' | 'abandoned';
    public overs!: number;
    public venue?: string;
    public startTime?: Date;
    public endTime?: Date;
    public winner?: 'teamA' | 'teamB' | 'tie' | 'no-result';
    public scorerId?: string | null;
    public lockedAt?: Date | null;
    public tossWinnerId?: string | null;
    public tossChoice?: 'bat' | 'field' | null;
    public teamACaptainId?: string | null;
    public teamBCaptainId?: string | null;
    public teamAPlaying11?: string[] | null;
    public teamBPlaying11?: string[] | null;
    public teamABattingOrder?: string[] | null;
    public teamBBattingOrder?: string[] | null;
    public currentInnings?: number | null;
    public firstInningsRuns?: number | null;
    public firstInningsWickets?: number | null;
    public firstInningsOvers?: string | null;
    public secondInningsRuns?: number | null;
    public secondInningsWickets?: number | null;
    public secondInningsOvers?: string | null;
    public target?: number | null;
    public result?: 'pending' | 'completed' | null;
    public resultType?: 'win-by-runs' | 'win-by-wickets' | 'tie' | 'no-result' | null;
    public winnerTeamId?: string | null;
    public margin?: number | null;
    public createdAt!: Date;
    public updatedAt!: Date;
    public deletedAt?: Date | null;

    static associate(models: any) {
      Match.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });
      Match.belongsTo(models.Team, { foreignKey: 'teamAId', as: 'teamA' });
      Match.belongsTo(models.Team, { foreignKey: 'teamBId', as: 'teamB' });
      Match.belongsTo(models.User, { foreignKey: 'scorerId', as: 'scorer' });
      Match.belongsTo(models.Team, { foreignKey: 'tossWinnerId', as: 'tossWinner' });
      Match.belongsTo(models.User, { foreignKey: 'teamACaptainId', as: 'teamACaptain' });
      Match.belongsTo(models.User, { foreignKey: 'teamBCaptainId', as: 'teamBCaptain' });
      Match.belongsTo(models.Team, { foreignKey: 'winnerTeamId', as: 'winnerTeam' });
      Match.hasMany(models.Ball, { foreignKey: 'matchId', as: 'balls' });
      Match.hasMany(models.AuditLog, { foreignKey: 'matchId', as: 'auditLogs' });
    }
  }

  Match.init(
    {
      id: {
        type: dataTypes.UUID,
        defaultValue: dataTypes.UUIDV4,
        primaryKey: true,
      },
      teamAId: {
        type: dataTypes.UUID,
        allowNull: false,
        references: { model: 'teams', key: 'id' },
      },
      teamBId: {
        type: dataTypes.UUID,
        allowNull: false,
        references: { model: 'teams', key: 'id' },
      },
      createdBy: {
        type: dataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
      },
      matchType: {
        type: dataTypes.ENUM('T20', 'ODI', 'Test', 'Custom'),
        defaultValue: 'T20',
      },
      status: {
        type: dataTypes.ENUM('scheduled', 'live', 'completed', 'abandoned'),
        defaultValue: 'scheduled',
      },
      overs: {
        type: dataTypes.INTEGER,
        defaultValue: 20,
      },
      venue: {
        type: dataTypes.STRING,
      },
      startTime: {
        type: dataTypes.DATE,
      },
      endTime: {
        type: dataTypes.DATE,
      },
      winner: {
        type: dataTypes.ENUM('teamA', 'teamB', 'tie', 'no-result'),
      },
      scorerId: {
        type: dataTypes.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
      },
      lockedAt: {
        type: dataTypes.DATE,
        allowNull: true,
      },
      tossWinnerId: {
        type: dataTypes.UUID,
        allowNull: true,
        references: { model: 'teams', key: 'id' },
      },
      tossChoice: {
        type: dataTypes.ENUM('bat', 'field'),
        allowNull: true,
      },
      teamACaptainId: {
        type: dataTypes.UUID,
        allowNull: true,
        references: { model: 'players', key: 'id' },
      },
      teamBCaptainId: {
        type: dataTypes.UUID,
        allowNull: true,
        references: { model: 'players', key: 'id' },
      },
      teamAPlaying11: {
        type: dataTypes.JSON,
        allowNull: true,
      },
      teamBPlaying11: {
        type: dataTypes.JSON,
        allowNull: true,
      },
      teamABattingOrder: {
        type: dataTypes.JSON,
        allowNull: true,
      },
      teamBBattingOrder: {
        type: dataTypes.JSON,
        allowNull: true,
      },
      currentInnings: {
        type: dataTypes.INTEGER,
        allowNull: true,
      },
      firstInningsRuns: {
        type: dataTypes.INTEGER,
        allowNull: true,
      },
      firstInningsWickets: {
        type: dataTypes.INTEGER,
        allowNull: true,
      },
      firstInningsOvers: {
        type: dataTypes.STRING,
        allowNull: true,
      },
      secondInningsRuns: {
        type: dataTypes.INTEGER,
        allowNull: true,
      },
      secondInningsWickets: {
        type: dataTypes.INTEGER,
        allowNull: true,
      },
      secondInningsOvers: {
        type: dataTypes.STRING,
        allowNull: true,
      },
      target: {
        type: dataTypes.INTEGER,
        allowNull: true,
      },
      result: {
        type: dataTypes.ENUM('pending', 'completed'),
        defaultValue: 'pending',
      },
      resultType: {
        type: dataTypes.ENUM('win-by-runs', 'win-by-wickets', 'tie', 'no-result'),
        allowNull: true,
      },
      winnerTeamId: {
        type: dataTypes.UUID,
        allowNull: true,
        references: { model: 'teams', key: 'id' },
      },
      margin: {
        type: dataTypes.INTEGER,
        allowNull: true,
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
      modelName: 'Match',
      tableName: 'matches',
      timestamps: true,
      paranoid: true,
    }
  );

  return Match;
};
