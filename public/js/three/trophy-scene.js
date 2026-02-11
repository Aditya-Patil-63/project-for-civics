// Leaderboard 3D Scene
const container = document.getElementById('leaderboard-canvas-container');

if (container) {
    // Scene
    const scene = new THREE.Scene();
    scene.background = null; // Transparent

    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 3, 8);
    camera.lookAt(0, 1, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const spotLight = new THREE.SpotLight(0xffd700, 1);
    spotLight.position.set(0, 10, 5);
    spotLight.castShadow = true;
    scene.add(spotLight);

    // Podium Group
    const podiumGroup = new THREE.Group();
    scene.add(podiumGroup);

    // Materials
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8, roughness: 0.2 });
    const silverMat = new THREE.MeshStandardMaterial({ color: 0xc0c0c0, metalness: 0.8, roughness: 0.2 });
    const bronzeMat = new THREE.MeshStandardMaterial({ color: 0xcd7f32, metalness: 0.8, roughness: 0.2 });

    // 1st Place
    const p1 = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 2, 32), goldMat);
    p1.position.set(0, 0, 0);
    podiumGroup.add(p1);

    // Avatar 1 (Floating Cube)
    const a1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), new THREE.MeshNormalMaterial());
    a1.position.set(0, 2, 0);
    podiumGroup.add(a1);

    // Crown
    const crown = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.05, 8, 16), goldMat);
    crown.position.set(0, 2.8, 0);
    crown.rotation.x = Math.PI / 2;
    podiumGroup.add(crown);

    // 2nd Place
    const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 1.5, 32), silverMat);
    p2.position.set(-2, -0.25, 0);
    podiumGroup.add(p2);

    const a2 = new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 32), new THREE.MeshNormalMaterial());
    a2.position.set(-2, 1.2, 0);
    podiumGroup.add(a2);

    // 3rd Place
    const p3 = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 1, 32), bronzeMat);
    p3.position.set(2, -0.5, 0);
    podiumGroup.add(p3);

    const a3 = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.8, 32), new THREE.MeshNormalMaterial());
    a3.position.set(2, 0.8, 0);
    podiumGroup.add(a3);

    // Animation
    function animate() {
        requestAnimationFrame(animate);
        const time = Date.now() * 0.001;

        // Floating Avatars
        a1.position.y = 2 + Math.sin(time * 2) * 0.1;
        a1.rotation.y += 0.02;

        crown.position.y = 2.8 + Math.sin(time * 2) * 0.1;
        crown.rotation.z += 0.02;

        a2.position.y = 1.2 + Math.sin(time * 2 + 1) * 0.1;
        a2.rotation.y -= 0.02;

        a3.position.y = 0.8 + Math.sin(time * 2 + 2) * 0.1;
        a3.rotation.y += 0.02;

        // Rotate entire podium slightly with mouse (mock)
        podiumGroup.rotation.y = Math.sin(time * 0.5) * 0.1;

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
}
