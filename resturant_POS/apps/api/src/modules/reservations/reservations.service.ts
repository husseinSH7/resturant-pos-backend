import { prisma } from "../../prisma.js";
import { ReservationStatus, WaitlistStatus, TableStatus } from "@prisma/client";

export async function getReservations(restaurantId: string, filters?: {
  date?: string;
  status?: string;
}) {
  const where: any = { restaurantId };
  
  if (filters?.date) {
    const startDate = new Date(filters.date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(filters.date);
    endDate.setHours(23, 59, 59, 999);
    where.date = {
      gte: startDate,
      lte: endDate,
    };
  }
  
  if (filters?.status) {
    where.status = filters.status;
  }

  const reservations = await prisma.reservation.findMany({
    where,
    include: {
      Customer: true,
      Table: true,
    },
    orderBy: { date: "asc" },
  });

  return reservations.map(res => ({
    id: res.id,
    customerName: res.customerName,
    customerPhone: res.customerPhone,
    customerEmail: res.customerEmail,
    guestCount: res.guestCount,
    date: res.date,
    time: res.time,
    status: res.status,
    notes: res.notes,
    specialRequests: res.specialRequests,
    customer: res.Customer ? {
      id: res.Customer.id,
      fullName: res.Customer.fullName,
      phone: res.Customer.phone,
      email: res.Customer.email,
    } : null,
    table: res.Table ? {
      id: res.Table.id,
      name: res.Table.name,
      seats: res.Table.seats,
    } : null,
    createdAt: res.createdAt,
  }));
}

export async function createReservation(restaurantId: string, data: {
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  customerId?: string;
  guestCount: number;
  date: string;
  time: string;
  tableId?: string;
  notes?: string;
  specialRequests?: string;
}) {
  // Check if the requested time slot is available
  const requestedDateTime = new Date(`${data.date}T${data.time}`);
  const endTime = new Date(requestedDateTime.getTime() + 2 * 60 * 60 * 1000); // 2 hours reservation

  const conflictingReservations = await prisma.reservation.findMany({
    where: {
      restaurantId,
      status: { in: ["CONFIRMED", "SEATED"] },
      date: {
        gte: requestedDateTime,
        lte: endTime,
      },
    },
  });

  if (conflictingReservations.length > 0) {
    throw new Error("Time slot is not available");
  }

  const reservation = await prisma.reservation.create({
    data: {
      id: crypto.randomUUID(),
      restaurantId,
      customerName: data.customerName,
      customerPhone: data.customerPhone || null,
      customerEmail: data.customerEmail || null,
      customerId: data.customerId || null,
      guestCount: data.guestCount,
      date: new Date(data.date),
      time: new Date(data.time),
      tableId: data.tableId || null,
      notes: data.notes || null,
      specialRequests: data.specialRequests || null,
      status: "CONFIRMED",
    },
    include: {
      Customer: true,
      Table: true,
    },
  });

  return {
    id: reservation.id,
    customerName: reservation.customerName,
    customerPhone: reservation.customerPhone,
    customerEmail: reservation.customerEmail,
    guestCount: reservation.guestCount,
    date: reservation.date,
    time: reservation.time,
    status: reservation.status,
    notes: reservation.notes,
    specialRequests: reservation.specialRequests,
    customer: reservation.Customer ? {
      id: reservation.Customer.id,
      fullName: reservation.Customer.fullName,
    } : null,
    table: reservation.Table ? {
      id: reservation.Table.id,
      name: reservation.Table.name,
    } : null,
    createdAt: reservation.createdAt,
  };
}

export async function updateReservationStatus(
  restaurantId: string,
  reservationId: string,
  status: string
) {
  const reservation = await prisma.reservation.findFirst({
    where: { id: reservationId, restaurantId },
    include: { Table: true },
  });

  if (!reservation) throw new Error("Reservation not found");

  const updated = await prisma.$transaction(async (tx) => {
    // Update reservation status
    const updatedReservation = await tx.reservation.update({
      where: { id: reservationId },
      data: { status },
    });

    // If seating, update table status
    if (status === "SEATED" && reservation.Table) {
      await tx.table.update({
        where: { id: reservation.Table.id },
        data: { status: TableStatus.OCCUPIED },
      });
    }

    // If no-show, mark as such
    if (status === "NO_SHOW") {
      // Could add customer penalty logic here
    }

    return updatedReservation;
  });

  return {
    id: updated.id,
    status: updated.status,
  };
}

export async function checkAvailability(
  restaurantId: string,
  date: string,
  guestCount: number
) {
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  const nextDay = new Date(targetDate);
  nextDay.setDate(nextDay.getDate() + 1);

  // Get all reservations for the day
  const reservations = await prisma.reservation.findMany({
    where: {
      restaurantId,
      date: {
        gte: targetDate,
        lt: nextDay,
      },
      status: { in: ["CONFIRMED", "SEATED"] },
    },
    include: { Table: true },
  });

  // Get all tables
  const tables = await prisma.table.findMany({
    where: { restaurantId, isActive: true },
  });

  // Calculate available time slots (every 30 minutes)
  const timeSlots = [];
  for (let hour = 11; hour <= 21; hour++) {
    for (let min = 0; min < 60; min += 30) {
      const time = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
      const slotTime = new Date(`${date}T${time}`);
      
      // Check if this slot is available
      const conflictingReservations = reservations.filter(res => {
        const resTime = new Date(res.date);
        const resEndTime = new Date(resTime.getTime() + 2 * 60 * 60 * 1000);
        return slotTime >= resTime && slotTime < resEndTime;
      });

      const availableTables = tables.filter(table => {
        return table.seats >= guestCount && 
               !conflictingReservations.some(res => res.tableId === table.id);
      });

      timeSlots.push({
        time,
        available: availableTables.length > 0,
        availableTables: availableTables.map(t => t.id),
      });
    }
  }

  return {
    date,
    guestCount,
    timeSlots,
  };
}

// Waitlist functions
export async function getWaitlist(restaurantId: string) {
  const waitlist = await prisma.waitlistEntry.findMany({
    where: { restaurantId },
    include: { Customer: true },
    orderBy: { createdAt: "asc" },
  });

  return waitlist.map(entry => ({
    id: entry.id,
    customerName: entry.customerName,
    customerPhone: entry.customerPhone,
    guestCount: entry.guestCount,
    status: entry.status,
    estimatedWait: entry.estimatedWait,
    notes: entry.notes,
    createdAt: entry.createdAt,
    seatedAt: entry.seatedAt,
    customer: entry.Customer ? {
      id: entry.Customer.id,
      fullName: entry.Customer.fullName,
    } : null,
  }));
}

export async function addToWaitlist(restaurantId: string, data: {
  customerName: string;
  customerPhone?: string;
  customerId?: string;
  guestCount: number;
  notes?: string;
}) {
  const waitlistEntry = await prisma.waitlistEntry.create({
    data: {
      id: crypto.randomUUID(),
      restaurantId,
      customerName: data.customerName,
      customerPhone: data.customerPhone || null,
      customerId: data.customerId || null,
      guestCount: data.guestCount,
      notes: data.notes || null,
      status: "WAITING",
      estimatedWait: 30, // Default 30 minutes
    },
    include: { Customer: true },
  });

  return {
    id: waitlistEntry.id,
    customerName: waitlistEntry.customerName,
    customerPhone: waitlistEntry.customerPhone,
    guestCount: waitlistEntry.guestCount,
    status: waitlistEntry.status,
    estimatedWait: waitlistEntry.estimatedWait,
    notes: waitlistEntry.notes,
    createdAt: waitlistEntry.createdAt,
    customer: waitlistEntry.Customer ? {
      id: waitlistEntry.Customer.id,
      fullName: waitlistEntry.Customer.fullName,
    } : null,
  };
}

export async function updateWaitlistStatus(
  restaurantId: string,
  entryId: string,
  status: string
) {
  const entry = await prisma.waitlistEntry.findFirst({
    where: { id: entryId, restaurantId },
  });

  if (!entry) throw new Error("Waitlist entry not found");

  const updateData: any = { status };
  
  if (status === "SEATED") {
    updateData.seatedAt = new Date();
  }

  const updated = await prisma.waitlistEntry.update({
    where: { id: entryId },
    data: updateData,
  });

  return {
    id: updated.id,
    status: updated.status,
    seatedAt: updated.seatedAt,
  };
}

export async function getNoShowStats(restaurantId: string) {
  const totalReservations = await prisma.reservation.count({
    where: { restaurantId },
  });

  const noShows = await prisma.reservation.count({
    where: { restaurantId, status: "NO_SHOW" },
  });

  const noShowRate = totalReservations > 0 ? (noShows / totalReservations) * 100 : 0;

  return {
    totalReservations,
    noShows,
    noShowRate: Math.round(noShowRate * 100) / 100,
  };
}