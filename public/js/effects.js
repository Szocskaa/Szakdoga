class Stage {
  constructor() {
    this.renderParam = {
      clearColor: 0x666666,
      width: window.innerWidth,
      height: window.innerHeight
    };

    this.cameraParam = {
      left: -1,
      right: 1,
      top: 1,
      bottom: 1,
      near: 0,
      far: -1
    };

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.geometry = null;
    this.material = null;
    this.mesh = null;

    this.isInitialized = false;
  }

  init() {
    this._setScene();
    this._setRender();
    this._setCamera();

    this.isInitialized = true;
  }

  _setScene() {
    this.scene = new THREE.Scene();
  }

  _setRender() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: document.getElementById("webgl-canvas")
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setClearColor(new THREE.Color(this.renderParam.clearColor));
    this.renderer.setSize(this.renderParam.width, this.renderParam.height);
  }

  _setCamera() {
    if (!this.isInitialized) {
      this.camera = new THREE.OrthographicCamera(
        this.cameraParam.left,
        this.cameraParam.right,
        this.cameraParam.top,
        this.cameraParam.bottom,
        this.cameraParam.near,
        this.cameraParam.far
      );
    }
    
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    this.camera.aspect = windowWidth / windowHeight;

    this.camera.updateProjectionMatrix();
    this.renderer.setSize(windowWidth, windowHeight);
  }

  _render() {
    this.renderer.render(this.scene, this.camera);
  }

  onResize() {
    this._setCamera();
    // Update renderParam dimensions to match current window size
    this.renderParam.width = window.innerWidth;
    this.renderParam.height = window.innerHeight;
  }

  onRaf() {
    this._render();
  }
}

class Mesh {
  constructor(stage) {
    this.canvas = document.getElementById("webgl-canvas");
    this.canvasWidth = this.canvas.width;
    this.canvasHeight = this.canvas.height;
    
    // Mouse position tracking
    this.mouseX = 0;
    this.mouseY = 0;
    
    // Theme state (default is dark)
    this.isLightTheme = false;

    this.uniforms = {
      resolution: { type: "v2", value: [ this.canvasWidth, this.canvasHeight ] },
      time: { type: "f", value: 0.0 },
      xScale: { type: "f", value: 1.0 },
      yScale: { type: "f", value: 0.5 },
      distortion: { type: "f", value: 0.050 },
      mouse: { type: "v2", value: [ 0.5, 0.5 ] },
      isLightTheme: { type: "bool", value: this.isLightTheme }
    };

    this.stage = stage;

    this.mesh = null;
    
    this.xScale = 1.0;
    this.yScale = 0.5;
    this.distortion = 0.050;
    
    // Set up mouse move listener
    this._setupMouseTracking();
  }

  init() {
    this._setMesh();
    // Update dimensions after initialization
    this._updateDimensions();
  }
  
  _setupMouseTracking() {
    window.addEventListener('mousemove', (e) => {
      // Get canvas bounding rectangle
      const rect = this.canvas.getBoundingClientRect();
      
      // Calculate mouse position relative to canvas
      this.mouseX = e.clientX - rect.left;
      this.mouseY = e.clientY - rect.top;
      
      // Update uniform with scaled values to match WebGL coordinates
      if (this.uniforms.mouse) {
        this.uniforms.mouse.value[0] = this.mouseX * (this.canvas.width / rect.width);
        this.uniforms.mouse.value[1] = (rect.height - this.mouseY) * (this.canvas.height / rect.height); // Invert Y for WebGL
      }
    });
    
    // Handle touch for mobile
    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        // Prevent scrolling
        e.preventDefault();
        
        // Get canvas bounding rectangle
        const rect = this.canvas.getBoundingClientRect();
        
        // Calculate touch position relative to canvas
        this.mouseX = e.touches[0].clientX - rect.left;
        this.mouseY = e.touches[0].clientY - rect.top;
        
        // Update uniform with scaled values to match WebGL coordinates
        if (this.uniforms.mouse) {
          this.uniforms.mouse.value[0] = this.mouseX * (this.canvas.width / rect.width);
          this.uniforms.mouse.value[1] = (rect.height - this.mouseY) * (this.canvas.height / rect.height); // Invert Y for WebGL
        }
      }
    }, { passive: false });
  }

  _setMesh() {
    const position = [
      -1.0, -1.0, 0.0,
       1.0, -1.0, 0.0,
      -1.0,  1.0, 0.0,
       1.0, -1.0, 0.0,
      -1.0,  1.0, 0.0,
       1.0,  1.0, 0.0
    ];

    const positions = new THREE.BufferAttribute(new Float32Array(position), 3);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", positions);

    const material = new THREE.RawShaderMaterial({
      vertexShader: document.getElementById("js-vertex-shader").textContent,
      fragmentShader: document.getElementById("js-fragment-shader").textContent,
      uniforms: this.uniforms,
      side: THREE.DoubleSide
    });

    this.mesh = new THREE.Mesh(geometry, material);

    this.stage.scene.add(this.mesh);
  }
  
  updateTheme(isLight) {
    this.isLightTheme = isLight;
    if (this.uniforms.isLightTheme) {
      this.uniforms.isLightTheme.value = isLight;
    }
  }
  
  onResize() {
    // Update dimensions when window is resized
    this._updateDimensions();
  }
  
  _updateDimensions() {
    if (this.canvas) {
      const rect = this.canvas.getBoundingClientRect();
      this.canvasWidth = this.canvas.width;
      this.canvasHeight = this.canvas.height;
      
      if (this.uniforms.resolution) {
        this.uniforms.resolution.value[0] = this.canvasWidth;
        this.uniforms.resolution.value[1] = this.canvasHeight;
      }
    }
  }
  
  _render() {
    // Slower speed for the waves (reduced from 0.01)
    this.uniforms.time.value += 0.004;
    
    // Update dimensions if window is resized
    this._updateDimensions();
  }

  onRaf() {
    this._render();
  }
}

// Initialize the effect when the page loads
document.addEventListener('DOMContentLoaded', function() {
  // Initialize THREE.js background
  const stage = new Stage();
  stage.init();
  const mesh = new Mesh(stage);
  mesh.init();
  
  // Apply saved theme to shader if it's light
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light') {
    mesh.updateTheme(true);
  }

  window.addEventListener("resize", () => {
    stage.onResize();
    mesh.onResize();
  });

  const _raf = () => {
    window.requestAnimationFrame(() => {
      stage.onRaf();
      mesh.onRaf();
      _raf();
    });
  };

  _raf();
  
  // Make mesh accessible to other scripts
  window.themeMesh = mesh;
}); 