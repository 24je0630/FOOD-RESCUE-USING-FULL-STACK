/**
 * Helper to parse and calculate pagination parameters safely.
 * @param {Object} query - The req.query object
 * @param {number} defaultLimit - The default limit if none provided (default 20)
 * @param {number} maxLimit - The absolute maximum limit allowed (default 100)
 * @returns {Object} { page, limit, skip, take }
 */
const getPaginationParams = (query, defaultLimit = 20, maxLimit = 100) => {
  let page = parseInt(query.page, 10);
  let limit = parseInt(query.limit, 10);

  // Normalize invalid or negative values
  if (isNaN(page) || page <= 0) page = 1;
  if (isNaN(limit) || limit <= 0) limit = defaultLimit;

  // Enforce max limit to prevent abuse
  if (limit > maxLimit) limit = maxLimit;

  const skip = (page - 1) * limit;
  const take = limit;

  return { page, limit, skip, take };
};

/**
 * Format the paginated response to a standard structure.
 * @param {Object} data - The payload data (e.g. { users: [...] })
 * @param {number} total - Total number of records
 * @param {number} page - Current page
 * @param {number} limit - Current limit
 * @returns {Object} { data, meta }
 */
const formatPaginatedResponse = (data, total, page, limit) => {
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: totalPages === 0 ? 1 : totalPages,
    }
  };
};

module.exports = {
  getPaginationParams,
  formatPaginatedResponse,
};
