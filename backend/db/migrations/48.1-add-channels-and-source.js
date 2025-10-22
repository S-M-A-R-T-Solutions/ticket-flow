'use strict';
/** @type {import('sequelize-cli').Migration} */

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction(t => {
      return Promise.all([
        queryInterface.addColumn(
          'TwilioRecordings',
          'recordingChannels',
          {
            type: Sequelize.STRING(64),
          },
          { transaction: t },
        ),
        queryInterface.addColumn(
          'TwilioRecordings',
          'recordingSource',
          {
            type: Sequelize.STRING(64),
          },
          { transaction: t },
        ),
      ]);
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(t => {
      return Promise.all([
        queryInterface.removeColumn('TwilioRecordings', 'recordingChannels', { transaction: t }),
        queryInterface.removeColumn('TwilioRecordings', 'recordingSource', { transaction: t, }),
      ]);
    });
  },
};