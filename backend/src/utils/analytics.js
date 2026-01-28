function getDateRange(range) {
  const now = new Date();
  let start, end;

  end = new Date(now); // default end = now

  switch (range) {
    case 'Today':
      start = new Date(now);
      start.setHours(0, 0, 0, 0);
      break;

    case 'Yesterday':
      start = new Date(now);
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);

      end = new Date(start);
      break;

    case 'Last 7 Days':
      start = new Date(now);
      start.setDate(start.getDate() - 7);
      break;

    case 'Last 30 Days':
      start = new Date(now);
      start.setDate(start.getDate() - 30);
      break;

    default:
      throw new Error('Invalid range');
  }

  return { start, end };
}
export { getDateRange };