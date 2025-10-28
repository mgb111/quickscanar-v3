/**
 * Portal Effect Component for A-Frame
 * Creates a portal-like visual effect with glowing edges and optional frame
 */

// Register portal shader
AFRAME.registerShader('portal', {
  schema: {
    color: { type: 'color', default: '#00ffff', is: 'uniform' },
    intensity: { type: 'number', default: 0.8, is: 'uniform' },
    time: { type: 'time', is: 'uniform' },
    opacity: { type: 'number', default: 0.7, is: 'uniform' }
  },

  vertexShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform vec3 color;
    uniform float intensity;
    uniform float time;
    uniform float opacity;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    
    void main() {
      // Calculate distance from center
      vec2 center = vec2(0.5, 0.5);
      float dist = distance(vUv, center);
      
      // Create edge glow effect
      float edgeGlow = 1.0 - smoothstep(0.0, 0.5, dist);
      edgeGlow = pow(edgeGlow, 2.0);
      
      // Create rim lighting effect
      vec3 viewDirection = normalize(cameraPosition - vPosition);
      float rimIntensity = 1.0 - max(0.0, dot(viewDirection, vNormal));
      rimIntensity = pow(rimIntensity, 3.0);
      
      // Animated shimmer effect
      float shimmer = sin(time * 2.0 + dist * 10.0) * 0.5 + 0.5;
      shimmer = shimmer * 0.3 + 0.7; // Subtle shimmer
      
      // Combine effects
      vec3 finalColor = color * (edgeGlow + rimIntensity) * intensity * shimmer;
      float finalAlpha = (edgeGlow * 0.5 + rimIntensity * 0.5) * opacity;
      
      gl_FragColor = vec4(finalColor, finalAlpha);
    }
  `
});

// Register portal effect component
AFRAME.registerComponent('portal-effect', {
  schema: {
    enabled: { type: 'boolean', default: true },
    color: { type: 'color', default: '#00ffff' },
    intensity: { type: 'number', default: 0.8 },
    frameEnabled: { type: 'boolean', default: true },
    frameThickness: { type: 'number', default: 0.05 },
    animation: { type: 'string', default: 'pulse', oneOf: ['none', 'pulse', 'rotate', 'shimmer'] }
  },

  init: function () {
    this.portalPlane = null;
    this.portalFrame = null;
    this.time = 0;
    
    if (this.data.enabled) {
      this.createPortalEffect();
    }
  },

  createPortalEffect: function () {
    const el = this.el;
    
    // Create portal plane behind the model
    this.portalPlane = document.createElement('a-plane');
    this.portalPlane.setAttribute('width', '2');
    this.portalPlane.setAttribute('height', '2.5');
    this.portalPlane.setAttribute('position', '0 0 -0.1');
    this.portalPlane.setAttribute('material', {
      shader: 'portal',
      color: this.data.color,
      intensity: this.data.intensity,
      opacity: 0.7,
      transparent: true,
      side: 'double'
    });
    
    el.appendChild(this.portalPlane);
    
    // Create portal frame if enabled
    if (this.data.frameEnabled) {
      this.createPortalFrame();
    }
    
    // Apply animation
    this.applyAnimation();
  },

  createPortalFrame: function () {
    const thickness = this.data.frameThickness;
    const color = this.data.color;
    
    // Create frame group
    this.portalFrame = document.createElement('a-entity');
    this.portalFrame.setAttribute('position', '0 0 -0.05');
    
    // Top bar
    const top = document.createElement('a-box');
    top.setAttribute('width', '2.1');
    top.setAttribute('height', thickness);
    top.setAttribute('depth', thickness);
    top.setAttribute('position', `0 ${1.25 + thickness/2} 0`);
    top.setAttribute('material', {
      color: color,
      emissive: color,
      emissiveIntensity: this.data.intensity,
      metalness: 0.8,
      roughness: 0.2
    });
    this.portalFrame.appendChild(top);
    
    // Bottom bar
    const bottom = document.createElement('a-box');
    bottom.setAttribute('width', '2.1');
    bottom.setAttribute('height', thickness);
    bottom.setAttribute('depth', thickness);
    bottom.setAttribute('position', `0 ${-1.25 - thickness/2} 0`);
    bottom.setAttribute('material', {
      color: color,
      emissive: color,
      emissiveIntensity: this.data.intensity,
      metalness: 0.8,
      roughness: 0.2
    });
    this.portalFrame.appendChild(bottom);
    
    // Left bar
    const left = document.createElement('a-box');
    left.setAttribute('width', thickness);
    left.setAttribute('height', '2.5');
    left.setAttribute('depth', thickness);
    left.setAttribute('position', `${-1.0 - thickness/2} 0 0`);
    left.setAttribute('material', {
      color: color,
      emissive: color,
      emissiveIntensity: this.data.intensity,
      metalness: 0.8,
      roughness: 0.2
    });
    this.portalFrame.appendChild(left);
    
    // Right bar
    const right = document.createElement('a-box');
    right.setAttribute('width', thickness);
    right.setAttribute('height', '2.5');
    right.setAttribute('depth', thickness);
    right.setAttribute('position', `${1.0 + thickness/2} 0 0`);
    right.setAttribute('material', {
      color: color,
      emissive: color,
      emissiveIntensity: this.data.intensity,
      metalness: 0.8,
      roughness: 0.2
    });
    this.portalFrame.appendChild(right);
    
    this.el.appendChild(this.portalFrame);
  },

  applyAnimation: function () {
    const el = this.el;
    
    switch (this.data.animation) {
      case 'pulse':
        // Pulsing scale animation
        if (this.portalPlane) {
          this.portalPlane.setAttribute('animation', {
            property: 'scale',
            from: '1 1 1',
            to: '1.05 1.05 1.05',
            dur: 2000,
            easing: 'easeInOutSine',
            loop: true,
            dir: 'alternate'
          });
        }
        if (this.portalFrame) {
          this.portalFrame.setAttribute('animation', {
            property: 'scale',
            from: '1 1 1',
            to: '1.02 1.02 1.02',
            dur: 2000,
            easing: 'easeInOutSine',
            loop: true,
            dir: 'alternate'
          });
        }
        break;
        
      case 'rotate':
        // Slow rotation animation
        if (this.portalPlane) {
          this.portalPlane.setAttribute('animation', {
            property: 'rotation',
            from: '0 0 0',
            to: '0 0 360',
            dur: 20000,
            easing: 'linear',
            loop: true
          });
        }
        break;
        
      case 'shimmer':
        // Opacity shimmer animation
        if (this.portalPlane) {
          this.portalPlane.setAttribute('animation', {
            property: 'material.opacity',
            from: '0.5',
            to: '0.9',
            dur: 1500,
            easing: 'easeInOutSine',
            loop: true,
            dir: 'alternate'
          });
        }
        break;
        
      case 'none':
      default:
        // No animation
        break;
    }
  },

  tick: function (time, timeDelta) {
    // Update time uniform for shader animation
    if (this.portalPlane && this.portalPlane.components.material) {
      this.time = time / 1000; // Convert to seconds
      const material = this.portalPlane.components.material.material;
      if (material && material.uniforms && material.uniforms.time) {
        material.uniforms.time.value = this.time;
      }
    }
  },

  update: function (oldData) {
    if (!this.data.enabled && this.portalPlane) {
      // Remove portal effect
      if (this.portalPlane.parentNode) {
        this.portalPlane.parentNode.removeChild(this.portalPlane);
      }
      if (this.portalFrame && this.portalFrame.parentNode) {
        this.portalFrame.parentNode.removeChild(this.portalFrame);
      }
      this.portalPlane = null;
      this.portalFrame = null;
    } else if (this.data.enabled && !this.portalPlane) {
      // Create portal effect
      this.createPortalEffect();
    } else if (this.portalPlane) {
      // Update existing portal
      this.portalPlane.setAttribute('material', {
        color: this.data.color,
        intensity: this.data.intensity
      });
      
      // Update frame if it exists
      if (this.portalFrame && this.data.frameEnabled) {
        const frames = this.portalFrame.querySelectorAll('a-box');
        frames.forEach(frame => {
          frame.setAttribute('material', {
            color: this.data.color,
            emissive: this.data.color,
            emissiveIntensity: this.data.intensity
          });
        });
      }
    }
  },

  remove: function () {
    if (this.portalPlane && this.portalPlane.parentNode) {
      this.portalPlane.parentNode.removeChild(this.portalPlane);
    }
    if (this.portalFrame && this.portalFrame.parentNode) {
      this.portalFrame.parentNode.removeChild(this.portalFrame);
    }
  }
});

console.log('Portal effect component registered');
