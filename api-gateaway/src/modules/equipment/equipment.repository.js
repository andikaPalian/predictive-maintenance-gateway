import prisma from "../../config/database.js";

export const create = async (data) => {
  return await prisma.equipment.create({
    data: data,
  });
};

export const findAll = async (skip = 0, take = 100) => {
  return await prisma.equipment.findMany({
    skip: skip,
    take: take,
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const findById = async (id) => {
  return await prisma.equipment.findUnique({
    where: {
      id: id,
    },
    include: {
      maintenanceLogs: {
        orderBy: {
          date: "desc",
        },
        take: 5,
      },
      alerts: {
        where: {
          isAcknowledged: false,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });
};

export const findByName = async (name) => {
  return await prisma.equipment.findFirst({
    where: {
      name: name,
    },
  });
};

export const update = async (id, data) => {
  return await prisma.equipment.update({
    where: {
      id: id,
    },
    data: data,
  });
};

export const remove = async (id) => {
  return await prisma.equipment.delete({
    where: {
      id: id,
    },
  });
};

export const count = async () => {
  return await prisma.equipment.count();
};
