'use strict';

/** @type {import('sequelize-cli').Migration} */

const { TwilioCall } = require('../models');

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;
}

module.exports = {
  async up (queryInterface, Sequelize) {
    await TwilioCall.bulkCreate([
      {
        ticketId: 1,
        called: '+1234567890',
        callSid: 'CA1234567890abcdef1234567890abcdef',
        to: '+1234567890',
        callStatus: 'completed',
        from: '+0987654321',
        callDuration: 300,
        accountSid: 'AC1234567890abcdef1234567890abcdef',
        applicationSid: 'AP1234567890abcdef1234567890abcdef',
        caller: '+0987654321'
      },
      {
        ticketId: 2,
        called: '+1987654321',
        callSid: 'CAabcdef1234567890abcdef1234567890',
        to: '+1987654321',
        callStatus: 'in-progress',
        from: '+1234509876',
        callDuration: 150,
        accountSid: 'ACabcdef1234567890abcdef1234567890',
        applicationSid: 'APabcdef1234567890abcdef1234567890',
        caller: '+1234509876'
      }
    ], options);
  },

  async down (queryInterface, Sequelize) {
    options.tableName = 'TwilioCalls';
    return queryInterface.bulkDelete(options, null, {});
  }
};
