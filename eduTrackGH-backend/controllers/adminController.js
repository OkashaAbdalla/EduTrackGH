/**
 * Admin controller barrel
 */

const users = require('./admin.users.controller');
const schools = require('./admin.schools.controller');
const settings = require('./admin.settings.controller');
const audit = require('./admin.audit.controller');
const control = require('./admin.control.controller');

module.exports = {
  ...users,
  ...schools,
  ...settings,
  ...audit,
  ...control,
};
