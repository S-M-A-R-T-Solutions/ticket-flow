'use strict';

const {Location} = require('../models');

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await Location.bulkCreate([
      {
        name: 'House',
        clientId: 1,
        addressLine1: '123 Main St',
        addressLine2: 'Suite 100',
        city: 'Anytown',
        state: 'CA',
        zipcode: 12345
      },
      {
        name: 'Office',
        clientId: 1,
        addressLine1: '456 Elm St',
        addressLine2: null,
        city: 'Othertown',
        state: 'CA',
        zipcode: 67890
      },
      {
        name: 'Main Location',
        clientId: 2,
        addressLine1: '789 Oak St',
        addressLine2: null,
        city: 'Sometown',
        state: 'CA',
        zipcode: 13579
      },
      {
        name: 'Laboratory',
        clientId: 2,
        addressLine1: '101 Pine St',
        addressLine2: 'Apt 2B',
        city: 'Anycity',
        state: 'CA',
        zipcode: 24680
      },
      {
        name: 'Warehouse',
        clientId: 2,
        addressLine1: '202 Maple St',
        addressLine2: null,
        city: 'Othercity',
        state: 'CA',
        zipcode: 11223
      },
      {
        name: 'Location 6',
        clientId: 3,
        addressLine1: '303 Birch St',
        addressLine2: 'Floor 3',
        city: 'Somecity',
        state: 'CA',
        zipcode: 44556
      },
      {
        name: 'Location 7',
        clientId: 3,
        addressLine1: '404 Cedar St',
        addressLine2: null,
        city: 'Anyvillage',
        state: 'CA',
        zipcode: 77889
      }
    ], options)
  },

  async down (queryInterface, Sequelize) {
    options.tableName = 'Locations';
    await queryInterface.bulkDelete(options.tableName, null, {});
  }
};
