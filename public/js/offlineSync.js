const syncQueue = JSON.parse(localStorage.getItem('syncQueue')) || [];

// Function to add task to queue
function addToSyncQueue(taskData) {
    syncQueue.push(taskData);
    localStorage.setItem('syncQueue', JSON.stringify(syncQueue));
    console.log('Task added to offline queue:', taskData);
    alert('You are offline. Task update saved locally and will sync when online.');
}

// Function to sync data when online
async function syncOfflineData() {
    if (syncQueue.length === 0) return;

    console.log('Syncing offline data...');
    const queueCopy = [...syncQueue];

    for (const task of queueCopy) {
        try {
            // Assuming task contains url, method, and body
            const response = await fetch(task.url, {
                method: task.method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(task.body)
            });

            if (response.ok) {
                // Remove from queue if successful
                const index = syncQueue.indexOf(task);
                if (index > -1) {
                    syncQueue.splice(index, 1);
                }
            } else {
                console.error('Failed to sync task:', task);
            }
        } catch (error) {
            console.error('Error syncing task:', error);
        }
    }

    localStorage.setItem('syncQueue', JSON.stringify(syncQueue));
    if (syncQueue.length === 0) {
        console.log('All offline data synced successfully!');
        alert('Offline data synced successfully!');
    }
}

// Event Listeners for Online/Offline status
window.addEventListener('online', syncOfflineData);
window.addEventListener('offline', () => {
    console.log('You are now offline.');
});

// Initial check
if (navigator.onLine) {
    syncOfflineData();
}
