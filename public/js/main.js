console.log('Civic Connect Client Loaded');
const socket = io();

socket.on('connect', () => {
    console.log('Connected to server via Socket.io');
    if (window.Toast) Toast.show('success', 'Connected', 'Real-time updates active');
});

socket.on('status_update', (issue) => {
    if (window.Toast) {
        Toast.show('info', 'Status Update', `Issue in ${issue.category} is now ${issue.status}`);
    }
});

socket.on('new_issue', (issue) => {
    if (window.Toast) {
        // Only show to admins or maybe everyone for "aliveness"
        Toast.show('info', 'New Report', `New ${issue.category} issue reported nearby`);
    }
});
