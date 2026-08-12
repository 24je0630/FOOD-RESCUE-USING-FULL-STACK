const { getPaginationParams, formatPaginatedResponse } = require('../utils/pagination');

describe('Pagination Utility', () => {
  describe('getPaginationParams', () => {
    it('should return default values when no query provided', () => {
      const params = getPaginationParams({});
      expect(params).toEqual({
        page: 1,
        limit: 20,
        skip: 0,
        take: 20,
      });
    });

    it('should parse valid page and limit values', () => {
      const params = getPaginationParams({ page: '2', limit: '10' });
      expect(params).toEqual({
        page: 2,
        limit: 10,
        skip: 10,
        take: 10,
      });
    });

    it('should enforce maxLimit of 100', () => {
      const params = getPaginationParams({ limit: '500' });
      expect(params.limit).toBe(100);
      expect(params.take).toBe(100);
    });

    it('should handle invalid string input gracefully', () => {
      const params = getPaginationParams({ page: 'abc', limit: 'def' });
      expect(params.page).toBe(1);
      expect(params.limit).toBe(20);
    });

    it('should handle negative values by defaulting to 1 and 20', () => {
      const params = getPaginationParams({ page: '-5', limit: '-10' });
      expect(params.page).toBe(1);
      expect(params.limit).toBe(20);
    });
  });

  describe('formatPaginatedResponse', () => {
    it('should format valid data and meta correctly', () => {
      const response = formatPaginatedResponse({ users: ['a', 'b'] }, 45, 2, 20);
      expect(response).toEqual({
        data: { users: ['a', 'b'] },
        meta: {
          page: 2,
          limit: 20,
          total: 45,
          totalPages: 3
        }
      });
    });

    it('should return totalPages 1 if total is 0', () => {
      const response = formatPaginatedResponse({ items: [] }, 0, 1, 20);
      expect(response.meta.totalPages).toBe(1);
      expect(response.meta.total).toBe(0);
    });
  });
});
