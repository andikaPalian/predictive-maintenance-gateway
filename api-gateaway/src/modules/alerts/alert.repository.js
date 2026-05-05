import prisma from "../../config/database.js";

// Helper function to build the WHERE clause based on the provided filters
const buildWhereClause = (filters) => {
  const where = {};

  if (filters.equipmentId) {
    where.equipmentId = filters.equipmentId;
  }

  if (filters.severity) {
    where.severity = filters.severity;
  }

  if (filters.isAcknowledged !== undefined) {
    where.isAcknowledged = filters.isAcknowledged;
  }

  return where;
};

export const create = async (data) => {
  return await prisma.alert.create({
    data: data,
  });
};

export const findAll = async (skip = 0, limit = 100, filters = {}) => {
  return await prisma.alert.findMany({
    where: buildWhereClause(filters),
    skip: skip,
    take: limit,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      equipment: {
        select: {
          name: true,
          type: true,
          status: true,
          location: true,
        },
      },
    },
  });
};

export const count = async (filters = {}) => {
  return await prisma.alert.count({
    where: buildWhereClause(filters),
  });
};

export const findById = async (id) => {
  return await prisma.alert.findUnique({
    where: {
      id: id,
    },
    include: {
      equipment: {
        select: {
          name: true,
          type: true,
          location: true,
        },
      },
    },
  });
};

export const update = async (id, data) => {
  return await prisma.alert.update({
    where: {
      id: id,
    },
    data: data,
  });
};

export const remove = async (id) => {
  return await prisma.alert.delete({
    where: {
      id: id,
    },
  });
};
