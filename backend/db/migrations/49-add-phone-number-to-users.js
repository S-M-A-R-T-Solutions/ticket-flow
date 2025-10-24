'use strict';

let options = {};

if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'phone', {
      type: Sequelize.STRING(15),
      allowNull: true,
    }, { schema: options.schema });
  },

  async down(queryInterface, Sequelize) {
    options.tableName = 'Users';
    await queryInterface.removeColumn('Users', 'phone', options);
  }
};
