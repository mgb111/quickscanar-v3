// Simplified hamming distance for marker descriptors
const hammingDistance = (v1, v2) => {
  if (!v1 || !v2 || v1.length !== v2.length) {
    return Number.MAX_SAFE_INTEGER;
  }
  
  let distance = 0;
  for (let i = 0; i < v1.length; i++) {
    if (v1[i] !== v2[i]) {
      distance++;
    }
  }
  
  return distance;
};

export { hammingDistance }; 