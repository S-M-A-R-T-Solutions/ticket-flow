'use strict';

let options = {};

if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'phone', {
      type: Sequelize.STRING(15),
      allowNull: true,
    }, options);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Users', 'phone', options);
  }
};
