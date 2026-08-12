const { mockDeep } = require('jest-mock-extended');

const prismaMock = mockDeep();

prismaMock.$transaction = jest.fn(async (callback) => {
  return callback(prismaMock);
});

module.exports = prismaMock;
