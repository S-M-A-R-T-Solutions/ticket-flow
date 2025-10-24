'use strict';

let options = {};

if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'phone', {
      type: Sequelize.STRING(15),
      allowNull: true,
    }, options);
  },

  async down(queryInterface, Sequelize) {
    options.tableName = 'Users';
    await queryInterface.removeColumn('users', 'phone', options);
  }
};
