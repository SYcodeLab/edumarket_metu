const router = require('express').Router();
const { auth, role, optionalAuth } = require('../middleware/auth');
const c = require('../controllers/index');

// Auth
router.post('/auth/register',  c.register);
router.post('/auth/login',     c.login);
router.get ('/auth/me',        auth, c.me);
router.put ('/auth/profile',   auth, c.updateProfile);

// Projects
router.get   ('/projects',             optionalAuth, c.getProjects);
router.get   ('/projects/my',          auth, role('entrepreneur'), c.getMyProjects);
router.get   ('/projects/:id',         optionalAuth, c.getProject);
router.post  ('/projects',             auth, role('entrepreneur'), c.createProject);
router.put   ('/projects/:id',         auth, role('entrepreneur'), c.updateProject);
router.delete('/projects/:id',         auth, role('entrepreneur'), c.deleteProject);
router.get   ('/projects/:id/applications', auth, role('entrepreneur'), c.getProjectApplications);

// Internships
router.get ('/internships',    optionalAuth, c.getInternships);
router.post('/internships',    auth, role('entrepreneur'), c.createInternship);

// Applications
router.post('/applications',              auth, role('student'),                   c.apply);
router.get ('/applications/my',           auth, role('student'),                   c.getMyApplications);
router.put ('/applications/:id/status',   auth, role('entrepreneur','university'), c.updateAppStatus);

// Contracts
router.post('/contracts',            auth, role('entrepreneur'),              c.createContract);
router.get ('/contracts',            auth,                                    c.getContracts);
router.put ('/contracts/:id/sign',   auth, role('entrepreneur','university'), c.signContract);

// Reviews
router.post('/reviews',              auth, c.createReview);
router.get ('/reviews/user/:userId',      c.getReviews);

// Notifications
router.get('/notifications',      auth, c.getNotifications);
router.put('/notifications/read', auth, c.markAllRead);

// Messages
router.post('/messages',             auth, c.sendMessage);
router.get ('/messages',             auth, c.getChats);
router.get ('/messages/:userId',     auth, c.getMessages);

// Favorites
router.post('/favorites',            auth, c.toggleFavorite);
router.get ('/favorites',            auth, c.getFavorites);

// Users
router.get('/users/search',          auth, c.searchUsers);
router.get('/users/:id',             c.getUserProfile);

// Stats
router.get('/stats', c.getStats);

module.exports = router;
