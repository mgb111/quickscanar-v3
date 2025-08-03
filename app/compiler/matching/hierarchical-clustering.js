// Simplified hierarchical clustering for marker features
import { hammingDistance } from './hamming-distance.js';
import { randomizer } from '../utils/randomizer.js';

const build = ({ points }) => {
  if (points.length === 0) return [];
  
  // Simplified clustering - group points by proximity
  const clusters = [];
  const used = new Set();
  
  for (let i = 0; i < points.length; i++) {
    if (used.has(i)) continue;
    
    const cluster = [points[i]];
    used.add(i);
    
    // Find nearby points
    for (let j = i + 1; j < points.length; j++) {
      if (used.has(j)) continue;
      
      const p1 = points[i];
      const p2 = points[j];
      
      // Simple distance check
      const dx = p1.x - p2.x;
      const dy = p1.y - p2.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 20) { // 20 pixel threshold
        cluster.push(points[j]);
        used.add(j);
      }
    }
    
    if (cluster.length > 0) {
      clusters.push(cluster);
    }
  }
  
  return clusters;
};

export { build }; 