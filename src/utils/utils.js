// utils.js
function computeMemberStats(membres) {
  const today = new Date().toDateString();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const stats = { total: membres.length, aujourdhui: 0, cetteSemaine: 0, parQuartier: {} };

  membres.forEach(m => {
    const mDate = new Date(m.created_at);
    if (mDate.toDateString() === today) stats.aujourdhui++;
    if (mDate >= weekAgo) stats.cetteSemaine++;
    const quartier = m.quartier || 'Non spécifié';
    stats.parQuartier[quartier] = (stats.parQuartier[quartier] || 0) + 1;
  });

  return stats;
}

module.exports = { computeMemberStats };
