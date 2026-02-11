# API Reference

Base URL: `http://localhost:3000`

## Auth
- `POST /auth/login` - Standard login

## Citizen Endpoints

#### Create Issue
`POST /api/issues`
(Multipart form)
- category, description, severity, latitude, longitude, photos
- Returns: Redirect to /track

#### Check Duplicates
`GET /api/issues/check-duplicate?lat=...&lng=...`
Returns `{ duplicateFound: true/false, count: n }`

#### List Issues
`GET /api/issues`
Returns JSON array of issues

## Admin / Worker
- `POST /admin/api/issues/:id/status` - Update status (Body: `{status: "Resolved"}`)
- `POST /api/worker/tasks/:id/complete` - Worker completion (Multipart with `after_photo`)
