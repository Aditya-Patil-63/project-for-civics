const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) {
        return next();
    }
    // Check for API requests otherwise redirect home
    if (req.originalUrl.startsWith('/api')) {
        return res.status(401).json({ message: 'Unauthorized: Please log in' });
    }
    return res.redirect('/');
};

const hasRole = (roles) => {
    return (req, res, next) => {
        if (!req.session || !req.session.user) {
            if (req.originalUrl.startsWith('/api')) {
                return res.status(401).json({ message: 'Unauthorized' });
            }
            return res.redirect('/');
        }

        if (roles.includes(req.session.user.role)) {
            return next();
        }

        if (req.originalUrl.startsWith('/api')) {
            return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
        }
        return res.status(403).render('errors/403', { message: 'You do not have permission to view this page' });
    };
};

module.exports = { isAuthenticated, hasRole };
