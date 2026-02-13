/**
 * Ball Model
 */

import { Model, Sequelize, DataTypes } from 'sequelize';

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
  class Ball extends Model {
    public id!: string;
    public matchId!: string;
    public inningsNumber!: number;
    public over!: number;
    public ballNumber!: number;
    public legalBallNumber!: number;
    public batsmanId!: string;
    public nonStrikerId!: string;
    public bowlerId!: string;
    public runs!: number;
    public isWicket!: boolean;
    public wicketType?: string;
    public extras!: 'none' | 'wide' | 'no-ball' | 'bye' | 'leg-bye';
    public extraRuns!: number;
    public isLegal!: boolean;
    public isValid!: boolean;
    public createdAt!: Date;
    public updatedAt!: Date;
    public deletedAt?: Date | null;

    static associate(models: any) {
      Ball.belongsTo(models.Match, { foreignKey: 'matchId', as: 'match' });
      Ball.belongsTo(models.Player, { foreignKey: 'batsmanId', as: 'batsman' });
      Ball.belongsTo(models.Player, { foreignKey: 'nonStrikerId', as: 'nonStriker' });
      Ball.belongsTo(models.Player, { foreignKey: 'bowlerId', as: 'bowler' });
    }
  }

  Ball.init(
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
      inningsNumber: {
        type: dataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: 'Which innings this ball belongs to (1 or 2)',
      },
      over: {
        type: dataTypes.INTEGER,
        allowNull: false,
      },
      ballNumber: {
        type: dataTypes.INTEGER,
        allowNull: false,
        comment: 'Sequential ball number in the over (including wides/no-balls)',
      },
      legalBallNumber: {
        type: dataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Legal ball count (1-6, excludes wides/no-balls)',
      },
      batsmanId: {
        type: dataTypes.UUID,
        allowNull: false,
        references: { model: 'players', key: 'id' },
      },
      nonStrikerId: {
        type: dataTypes.UUID,
        allowNull: false,
        references: { model: 'players', key: 'id' },
        comment: 'Non-striker at the other end when this ball was bowled',
      },
      bowlerId: {
        type: dataTypes.UUID,
        allowNull: false,
        references: { model: 'players', key: 'id' },
      },
      runs: {
        type: dataTypes.INTEGER,
        defaultValue: 0,
      },
      isWicket: {
        type: dataTypes.BOOLEAN,
        defaultValue: false,
      },
      wicketType: {
        type: dataTypes.ENUM(
          'bowled',
          'lbw',
          'caught',
          'stumped',
          'run-out',
          'hit-wicket',
          'handled-ball',
          'obstructing-field'
        ),
      },
      extras: {
        type: dataTypes.ENUM('none', 'wide', 'no-ball', 'bye', 'leg-bye'),
        defaultValue: 'none',
      },
      extraRuns: {
        type: dataTypes.INTEGER,
        defaultValue: 0,
      },
      isLegal: {
        type: dataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'True if legal ball (counts toward 6), False if wide/no-ball',
      },
      isValid: {
        type: dataTypes.BOOLEAN,
        defaultValue: true,
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
      modelName: 'Ball',
      tableName: 'balls',
      timestamps: true,
      paranoid: true,
    }
  );

  return Ball;
};
