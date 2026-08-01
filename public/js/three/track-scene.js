// Track Page 3D Scene
const container = document.getElementById('track-canvas-container');

if (container) {
    // Scene Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    scene.fog = new THREE.FogExp2(0x0f172a, 0.02);

    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 10, 10);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x4F46E5, 0.8);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);

    // Stylized Map Plane (3D Grid)
    const gridHelper = new THREE.GridHelper(50, 50, 0x4F46E5, 0x1e293b);
    scene.add(gridHelper);

    const planeGeo = new THREE.PlaneGeometry(50, 50);
    const planeMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        roughness: 0.8,
        metalness: 0.2
    });
    const plane = new THREE.Mesh(planeGeo, planeMat);
    plane.rotation.x = -Math.PI / 2;
    scene.add(plane);

    // Issue Markers (Generated from Data)
    const markerGroup = new THREE.Group();
    scene.add(markerGroup);

    // Expose function to add markers
    window.update3DMarkers = (issues) => {
        // Clear existing
        while (markerGroup.children.length > 0) {
            markerGroup.remove(markerGroup.children[0]);
        }

        issues.forEach((issue, i) => {
            // Randomize position based on "coordinates" simulation for 3D demo
            // In real app, map lat/long to x/z
            const x = (Math.random() - 0.5) * 30;
            const z = (Math.random() - 0.5) * 30;

            // Marker Shape based on Category
            let geometry;
            let color;

            switch (issue.category) {
                case 'Road': geometry = new THREE.ConeGeometry(0.5, 2, 32); color = 0xf59e0b; break;
                case 'Water': geometry = new THREE.SphereGeometry(0.7, 32, 32); color = 0x3b82f6; break;
                default: geometry = new THREE.BoxGeometry(1, 1, 1); color = 0xec4899; break;
            }

            const material = new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 0.6 });
            const marker = new THREE.Mesh(geometry, material);

            marker.position.set(x, 1, z);

            // Animation data
            marker.userData = {
                speed: Math.random() * 0.02 + 0.01,
                yBase: 1
            };

            markerGroup.add(marker);
        });
    };

    // Animation Loop
    function animate() {
        requestAnimationFrame(animate);

        // Grid Movement Effect
        gridHelper.position.z = (Date.now() * 0.002) % 1;

        // Animate Markers
        markerGroup.children.forEach(marker => {
            marker.rotation.y += 0.02;
            marker.position.y = marker.userData.yBase + Math.sin(Date.now() * 0.003 + marker.position.x) * 0.2;
        });

        // Rotate camera slowly around center
        const time = Date.now() * 0.0001;
        camera.position.x = Math.sin(time) * 15;
        camera.position.z = Math.cos(time) * 15;
        camera.lookAt(0, 0, 0);

        renderer.render(scene, camera);
    }
    animate();

    // Resize
    window.addEventListener('resize', () => {
        if (container) {
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        }
    });

    // Initial Load
    if (typeof allIssues !== 'undefined' && allIssues.length > 0) {
        window.update3DMarkers(allIssues);
    }
}
