'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class TwilioCall extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      TwilioCall.belongsTo(models.Ticket, {
        foreignKey: 'ticketId',
        onDelete: 'CASCADE'
      })
    }
  }
  TwilioCall.init({
    ticketId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Tickets',
        key: 'id'
      },
      onDelete: "CASCADE"
    },
    called: {
      type: DataTypes.STRING(32),
      allowNull: false
    },
    callSid: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    to: {
      type: DataTypes.STRING(32),
      allowNull: false
    },
    callStatus: {
      type: DataTypes.STRING(24),
      allowNull: false
    },
    from: {
      type: DataTypes.STRING(32),
      allowNull: false
    },
    callDuration: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    accountSid: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    applicationSid: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    caller: {
      type: DataTypes.STRING(32),
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'TwilioCall',
  });
  return TwilioCall;
};