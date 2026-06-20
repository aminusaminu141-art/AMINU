import request from 'supertest';
import app from '../src/server/app'; // Adjust the path as necessary

describe('Server API Tests', () => {
  it('should respond with a 200 status for the root endpoint', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
  });

  // Add more tests for specific routes and functionalities
  describe('Authentication Routes', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          password: 'testpassword',
          role: 'student'
        });
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'User registered successfully');
    });

    it('should login an existing user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'testpassword'
        });
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
    });
  });

  // Add tests for principal, student, class master, and exam officer routes
});