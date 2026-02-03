/**
 * Vault health monitoring and cleanup utilities
 */

/**
 * Analyze vault health and return recommendations
 */
export const analyzeVaultHealth = async (vault, sessions, references) => {
  const recommendations = [];
  
  // Check for session accumulation
  if (sessions.length > 20) {
    recommendations.push({
      type: 'session_cleanup',
      severity: 'medium',
      title: 'Many Sessions Accumulated',
      description: `You have ${sessions.length} sessions in this vault. Consider archiving or deleting old ones.`,
      action: 'cleanup_sessions',
      details: { session_count: sessions.length }
    });
  }
  
  // Check for old completed sessions (>30 days)
  const oldSessions = sessions.filter(s => {
    if (!s.ended_at) return false;
    const age = Date.now() - new Date(s.ended_at).getTime();
    return age > 30 * 24 * 60 * 60 * 1000; // 30 days
  });
  
  if (oldSessions.length > 5) {
    recommendations.push({
      type: 'archive_old_sessions',
      severity: 'low',
      title: 'Old Sessions Detected',
      description: `${oldSessions.length} sessions are over 30 days old. Consider archiving them.`,
      action: 'archive_sessions',
      details: { old_session_count: oldSessions.length }
    });
  }
  
  // Check for redundant references
  const duplicateNames = findDuplicateReferences(references);
  if (duplicateNames.length > 0) {
    recommendations.push({
      type: 'duplicate_references',
      severity: 'low',
      title: 'Duplicate Reference Names',
      description: `Found ${duplicateNames.length} reference files with similar names.`,
      action: 'review_references',
      details: { duplicates: duplicateNames }
    });
  }
  
  // Check for unused references
  const unusedRefs = references.filter(ref => {
    return !sessions.some(session => 
      session.attached_reference_ids?.includes(ref.id)
    );
  });
  
  if (unusedRefs.length > 5) {
    recommendations.push({
      type: 'unused_references',
      severity: 'low',
      title: 'Unused References',
      description: `${unusedRefs.length} references have never been attached to a session.`,
      action: 'review_references',
      details: { unused_count: unusedRefs.length }
    });
  }
  
  // Check vault size
  const summarySize = vault.living_summary?.length || 0;
  const totalReferenceSize = references.reduce((sum, ref) => 
    sum + (ref.full_content?.length || 0), 0
  );
  
  if (summarySize > 10000) {
    recommendations.push({
      type: 'large_summary',
      severity: 'medium',
      title: 'Living Summary is Large',
      description: 'Your Living Summary has grown to over 10,000 characters. Consider condensing.',
      action: 'condense_summary',
      details: { size: summarySize }
    });
  }
  
  if (totalReferenceSize > 500000) {
    recommendations.push({
      type: 'large_references',
      severity: 'medium',
      title: 'Large Reference Collection',
      description: 'Your references total over 500KB. Consider archiving or removing old files.',
      action: 'cleanup_references',
      details: { total_size: totalReferenceSize }
    });
  }
  
  return recommendations;
};

/**
 * Find duplicate reference names
 */
const findDuplicateReferences = (references) => {
  const nameMap = {};
  const duplicates = [];
  
  references.forEach(ref => {
    const baseName = ref.filename.toLowerCase().replace(/\.[^.]+$/, '');
    if (nameMap[baseName]) {
      if (!duplicates.includes(baseName)) {
        duplicates.push(baseName);
      }
    } else {
      nameMap[baseName] = true;
    }
  });
  
  return duplicates;
};

/**
 * Get vault health score (0-100)
 */
export const getVaultHealthScore = (recommendations) => {
  if (recommendations.length === 0) return 100;
  
  const severityWeights = {
    high: 20,
    medium: 10,
    low: 5
  };
  
  const totalDeductions = recommendations.reduce((sum, rec) => 
    sum + (severityWeights[rec.severity] || 5), 0
  );
  
  return Math.max(0, 100 - totalDeductions);
};

/**
 * Format health report for user
 */
export const formatHealthReport = (vault, recommendations, healthScore) => {
  let report = `# Vault Health Report: ${vault.name}\n\n`;
  report += `**Health Score:** ${healthScore}/100 ${getScoreEmoji(healthScore)}\n\n`;
  
  if (recommendations.length === 0) {
    report += '✅ Your vault is in great shape! No issues detected.\n';
    return report;
  }
  
  report += `**Issues Found:** ${recommendations.length}\n\n`;
  
  const byType = {
    high: recommendations.filter(r => r.severity === 'high'),
    medium: recommendations.filter(r => r.severity === 'medium'),
    low: recommendations.filter(r => r.severity === 'low')
  };
  
  if (byType.high.length > 0) {
    report += '## 🔴 High Priority\n';
    byType.high.forEach(rec => {
      report += `- **${rec.title}:** ${rec.description}\n`;
    });
    report += '\n';
  }
  
  if (byType.medium.length > 0) {
    report += '## 🟡 Medium Priority\n';
    byType.medium.forEach(rec => {
      report += `- **${rec.title}:** ${rec.description}\n`;
    });
    report += '\n';
  }
  
  if (byType.low.length > 0) {
    report += '## 🟢 Low Priority\n';
    byType.low.forEach(rec => {
      report += `- **${rec.title}:** ${rec.description}\n`;
    });
  }
  
  return report;
};

const getScoreEmoji = (score) => {
  if (score >= 90) return '🟢';
  if (score >= 70) return '🟡';
  if (score >= 50) return '🟠';
  return '🔴';
};