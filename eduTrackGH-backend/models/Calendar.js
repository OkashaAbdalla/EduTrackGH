/**
 * GES academic calendar (one document per term per academic year).
 */

const mongoose = require('mongoose');

const holidaySchema = new mongoose.Schema(
  {
    name: { type: String, default: '' },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
  },
  { _id: false }
);

const calendarSchema = new mongoose.Schema(
  {
    academicYear: { type: String, required: true, trim: true },
    termKey: {
      type: String,
      required: true,
      enum: ['TERM_1', 'TERM_2', 'TERM_3'],
    },
    termLabel: { type: String, default: '' },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    numberOfWeeks: { type: Number, required: true, min: 1, max: 40 },
    vacationStart: { type: Date },
    vacationEnd: { type: Date },
    holidays: [holidaySchema],
    /** JHS BECE window (usually set on TERM_3). */
    beceStart: { type: Date },
    beceEnd: { type: Date },
    /** Global holidays for this academic year (stored on TERM_1 row; merged when building payload). */
    yearWideHolidays: [holidaySchema],
    isActive: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

calendarSchema.index(
  { academicYear: 1, termKey: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

calendarSchema.index({ isActive: 1, isDeleted: 1 });

module.exports = mongoose.model('Calendar', calendarSchema);
