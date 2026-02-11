// Admin Dashboard 3D Scene
const container = document.getElementById('admin-3d-container');

if (container) {
    // Basic Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf3f4f6); // Light gray to match admin theme

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 10, 20);
    camera.lookAt(0, 5, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 15, 10);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // Grid / Floor
    const gridHelper = new THREE.GridHelper(20, 20, 0xcbd5e1, 0xe2e8f0);
    scene.add(gridHelper);

    // 3D Bars Logic
    // We need to access the data. Since it's in a script tag in EJS, we can access 'categoryData' global if available, or parse it.
    // Let's assume categoryData is available on window or we pass it.

    // Check if categoryData is defined globally from the EJS script execution
    // If not, use mock data for visual proof
    const data = (typeof categoryData !== 'undefined') ? categoryData : { 'Road': 12, 'Water': 8, 'Electricity': 15, 'Sanitation': 5 };

    const keys = Object.keys(data);
    const values = Object.values(data);
    const maxVal = Math.max(...values, 1); // Avoid div by zero

    const barGroup = new THREE.Group();
    scene.add(barGroup);

    const colors = [0x3b82f6, 0xef4444, 0x10b981, 0xf59e0b, 0x8b5cf6];

    keys.forEach((key, i) => {
        const val = values[i];
        const normalizedHeight = (val / maxVal) * 10; // Max height 10

        const geometry = new THREE.BoxGeometry(2, normalizedHeight, 2);
        // Shift pivot to bottom
        geometry.translate(0, normalizedHeight / 2, 0);

        const material = new THREE.MeshStandardMaterial({
            color: colors[i % colors.length],
            roughness: 0.3,
            metalness: 0.1
        });

        const bar = new THREE.Mesh(geometry, material);
        bar.position.x = (i - keys.length / 2) * 3 + 1.5; // Spread out
        bar.castShadow = true;

        // Initial scale for animation
        bar.scale.y = 0;
        bar.userData = { targetScale: 1 };

        barGroup.add(bar);
    });

    // Animation
    function animate() {
        requestAnimationFrame(animate);

        // Bar Growth Animation
        barGroup.children.forEach(bar => {
            if (bar.scale.y < 1) {
                bar.scale.y += 0.05;
            }
        });

        // Slow rotation
        barGroup.rotation.y = Math.sin(Date.now() * 0.001) * 0.1;

        renderer.render(scene, camera);
    }
    animate();

    // Resize
    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
}
