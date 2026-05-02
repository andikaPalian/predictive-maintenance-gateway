import prisma from "../../config/database.js";

export const create = async (data) => {
  return await prisma.maintenanceLog.create({
    data: data,
  });
};

export const findAll = async (skip = 0, limit = 100, filters = {}) => {
  const where = {};
  if (filters.equipmentId) {
    where.equipmentId = filters.equipmentId;
  }

  return await prisma.maintenanceLog.findMany({
    where,
    skip: skip,
    take: limit,
    orderBy: {
      date: "desc",
    },
    include: {
      equipment: {
        select: {
          name: true,
          type: true,
          status: true,
        },
      },
    },
  });
};

export const count = async (filters = {}) => {
  const where = {};
  if (filters.equipmentId) {
    where.equipmentId = filters.equipmentId;
  }

  return await prisma.maintenanceLog.count({
    where,
  });
};

export const findById = async (id) => {
  return await prisma.maintenanceLog.findUnique({
    where: {
      id: id,
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

export const update = async (id, data) => {
  return await prisma.maintenanceLog.update({
    where: {
      id: id,
    },
    data: data,
  });
};

export const remove = async (id) => {
  return await prisma.maintenanceLog.delete({
    where: {
      id: id,
    },
  });
};
