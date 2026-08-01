
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('hero-canvas-container');
    if (!container) return;

    // --- Scene Setup ---
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0f172a, 0.02);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 20); // Closer camera for poster view

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // --- Lights ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(10, 10, 10);
    scene.add(dirLight);

    // --- Particle System (Cleanliness/Sparkles) ---
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 700;
    const posArray = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i++) {
        // Spread particles around smoothly
        posArray[i] = (Math.random() - 0.5) * 40;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    // Create a circular texture for particles effectively
    const particleMaterial = new THREE.PointsMaterial({
        size: 0.15,
        color: 0x4F46E5, // Primary brand color
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });

    const particlesMesh = new THREE.Points(particlesGeometry, particleMaterial);
    scene.add(particlesMesh);


    // --- Mouse Interaction ---
    let mouseX = 0;
    let mouseY = 0;
    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;

    document.addEventListener('mousemove', (event) => {
        mouseX = (event.clientX - windowHalfX) * 0.001;
        mouseY = (event.clientY - windowHalfY) * 0.001;
    });

    // --- Animation Loop ---
    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);
        const elapsedTime = clock.getElapsedTime();

        // Rotate particles
        particlesMesh.rotation.y = elapsedTime * 0.05;
        particlesMesh.rotation.x = mouseY * 0.2;

        // Wave particles slightly
        particlesMesh.position.y = Math.sin(elapsedTime * 0.2) * 0.5;

        renderer.render(scene, camera);
    }
    animate();

    // --- Resize Handling ---
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
});
