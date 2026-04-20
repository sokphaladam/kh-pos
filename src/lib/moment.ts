import moment from "moment-timezone";

// Set default timezone for all moment operations
moment.tz.setDefault("+07:00");

// Export moment with the default timezone configured
export default moment;

// Also export the timezone constant for explicit usage if needed
export const DEFAULT_TIMEZONE = "+07:00";
