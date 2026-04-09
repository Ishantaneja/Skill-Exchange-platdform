export function formatReputation(reputation, totalRatings) {
  const count = Number(totalRatings) || 0;
  if (count === 0) return 'No ratings yet';

  const score = Number(reputation) || 0;
  return `⭐ ${score.toFixed(1)} (${count} ratings)`;
}
