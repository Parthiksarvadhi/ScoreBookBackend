/**
 * Team Invitation Model
 */

import { Model, Sequelize, DataTypes } from 'sequelize';

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
    class TeamInvitation extends Model {
        public id!: string;
        public teamId!: string;
        public inviterId!: string;
        public mobileNumber!: string;
        public status!: 'pending' | 'accepted' | 'rejected';
        public token!: string;
        public expiresAt!: Date;
        public createdAt!: Date;
        public updatedAt!: Date;

        static associate(models: any) {
            TeamInvitation.belongsTo(models.Team, { foreignKey: 'teamId', as: 'team' });
            TeamInvitation.belongsTo(models.User, { foreignKey: 'inviterId', as: 'inviter' });
        }
    }

    TeamInvitation.init(
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
            inviterId: {
                type: dataTypes.UUID,
                allowNull: false,
                references: { model: 'users', key: 'id' },
            },
            mobileNumber: {
                type: dataTypes.STRING,
                allowNull: false,
            },
            status: {
                type: dataTypes.ENUM('pending', 'accepted', 'rejected'),
                defaultValue: 'pending',
            },
            token: {
                type: dataTypes.STRING,
                allowNull: false,
                unique: true,
            },
            expiresAt: {
                type: dataTypes.DATE,
                allowNull: false,
            },
        },
        {
            sequelize,
            modelName: 'TeamInvitation',
            tableName: 'team_invitations',
            timestamps: true,
        }
    );

    return TeamInvitation;
};
