function toLocalDate(dateInput) {
  if (!dateInput) return null;
  if (dateInput instanceof Date) {
    return Number.isNaN(dateInput.getTime()) ? null : new Date(dateInput.getTime());
  }
  if (typeof dateInput === "string") {
    const isoMatch = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      const year = Number(isoMatch[1]);
      const month = Number(isoMatch[2]) - 1;
      const day = Number(isoMatch[3]);
      return new Date(year, month, day, 12, 0, 0, 0);
    }
  }
  const d = new Date(dateInput);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isWeekend(dateInput) {
  const d = toLocalDate(dateInput);
  if (!d) return false;
  const day = d.getDay();
  return day === 0 || day === 6;
}

module.exports = {
  toLocalDate,
  isWeekend,
};
