const { mockDeep, mockReset } = require('jest-mock-extended');

jest.mock('../config/prisma');

// Mock Cloudinary service
jest.mock('../services/cloudinary.service', () => ({
  uploadImage: jest.fn(),
  deleteImage: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  
  const cloudinaryMock = require('../services/cloudinary.service');
  cloudinaryMock.uploadImage.mockReset();
  cloudinaryMock.deleteImage.mockReset();
});
