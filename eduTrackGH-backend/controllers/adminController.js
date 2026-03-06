/**
 * Admin controller barrel
 */

const users = require('./admin.users.controller');
const schools = require('./admin.schools.controller');
const settings = require('./admin.settings.controller');
const audit = require('./admin.audit.controller');

module.exports = {
  ...users,
  ...schools,
  ...settings,
  ...audit,
};
