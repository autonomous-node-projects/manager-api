const calculateTimeMultiplier = (timeType) => {
  let multiplier;
  switch (timeType) {
    case 'hours':
    case 'hour':
      multiplier = 3600;
      break;
    case 'minutes':
    case 'minute':
      multiplier = 60;
      break;
    case 'seconds':
    case 'second':
      multiplier = 1;
      break;
    default:
      break;
  }
  return multiplier;
};

module.exports = calculateTimeMultiplier;
