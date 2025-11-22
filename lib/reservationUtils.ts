import { DateTime } from 'luxon';

export interface Reservation {
  id?: string;
  date_time: string;
  service_duration: number;
  employee?: string;
  profession: string;
}

export interface Employee {
  id: string;
  email: string;
  category: string; // profession
  role: string;
}

/**
 * Check if two time ranges overlap
 */
export function timeRangesOverlap(
  start1: DateTime,
  end1: DateTime,
  start2: DateTime,
  end2: DateTime
): boolean {
  return start1 < end2 && start2 < end1;
}

/**
 * Check if a specific employee is available for a given time slot
 */
export function isEmployeeAvailable(
  employeeName: string,
  startTime: DateTime,
  duration: number,
  existingReservations: Reservation[]
): boolean {
  const endTime = startTime.plus({ minutes: duration });

  const employeeReservations = existingReservations.filter(r => r.employee === employeeName);

  if (employeeReservations.length > 0) {
    console.log(`      ${employeeName} has ${employeeReservations.length} reservations:`,
      employeeReservations.map(r => ({
        time: DateTime.fromISO(r.date_time).toFormat('MM/dd HH:mm'),
        duration: r.service_duration
      }))
    );
  }

  for (const reservation of employeeReservations) {
    const resStart = DateTime.fromISO(reservation.date_time);
    const resEnd = resStart.plus({ minutes: reservation.service_duration });

    if (timeRangesOverlap(startTime, endTime, resStart, resEnd)) {
      console.log(`      CONFLICT: Requested ${startTime.toFormat('HH:mm')}-${endTime.toFormat('HH:mm')} overlaps with ${resStart.toFormat('HH:mm')}-${resEnd.toFormat('HH:mm')}`);
      return false; // Overlap found
    }
  }

  return true;
}

/**
 * Check if ANY employee with the required profession is available
 */
export function isAnyEmployeeAvailable(
  profession: string,
  startTime: DateTime,
  duration: number,
  employees: Employee[],
  existingReservations: Reservation[]
): boolean {
  // Get all employees who can perform this service
  const qualifiedEmployees = employees.filter(
    (emp) => emp.category === profession
  );

  console.log(`  Checking ${profession} at ${startTime.toFormat('HH:mm')}:`, {
    qualifiedEmployees: qualifiedEmployees.map(e => e.email),
    totalReservations: existingReservations.length
  });

  if (qualifiedEmployees.length === 0) {
    // No employees with this profession - still allow booking
    // (service can be done by unspecified employee)
    console.log(`    No qualified employees, allowing`);
    return true;
  }

  // Check if at least one qualified employee is available
  for (const employee of qualifiedEmployees) {
    const available = isEmployeeAvailable(employee.email, startTime, duration, existingReservations);
    console.log(`    ${employee.email}: ${available ? 'AVAILABLE' : 'BUSY'}`);
    if (available) {
      return true;
    }
  }

  console.log(`    All ${profession} busy!`);
  return false; // All employees with this profession are busy
}

/**
 * Check if a sequence of services can be booked starting at a given time
 * This version tries to ensure the same employee can handle consecutive services
 * of the same profession when possible.
 */
export function canBookServicesAtTime(
  startTime: DateTime,
  services: Array<{ profession: string; duration: number }>,
  employees: Employee[],
  existingReservations: Reservation[]
): boolean {
  // Group consecutive services by profession
  const serviceGroups: Array<{ profession: string; startTime: DateTime; endTime: DateTime }> = [];
  let currentTime = startTime;

  for (let i = 0; i < services.length; i++) {
    const service = services[i];
    const serviceStart = currentTime;
    const serviceEnd = currentTime.plus({ minutes: service.duration });

    // Check if we can merge with the previous group (same profession, consecutive time)
    const lastGroup = serviceGroups[serviceGroups.length - 1];
    if (lastGroup && lastGroup.profession === service.profession && lastGroup.endTime.equals(serviceStart)) {
      // Extend the last group
      lastGroup.endTime = serviceEnd;
    } else {
      // Create a new group
      serviceGroups.push({
        profession: service.profession,
        startTime: serviceStart,
        endTime: serviceEnd
      });
    }

    currentTime = serviceEnd;
  }

  console.log(`Checking ${services.length} services in ${serviceGroups.length} groups at ${startTime.toFormat('HH:mm')}`);

  // Now check if each group can be serviced by at least one employee
  for (const group of serviceGroups) {
    const duration = group.endTime.diff(group.startTime, 'minutes').minutes;

    if (!isAnyEmployeeAvailable(
      group.profession,
      group.startTime,
      duration,
      employees,
      existingReservations
    )) {
      console.log(`Cannot book ${group.profession} from ${group.startTime.toFormat('HH:mm')} to ${group.endTime.toFormat('HH:mm')}`);
      return false;
    }
  }

  return true;
}

/**
 * Get the best available employee for a service at a given time
 */
export function getAvailableEmployee(
  profession: string,
  startTime: DateTime,
  duration: number,
  employees: Employee[],
  existingReservations: Reservation[]
): string | null {
  const qualifiedEmployees = employees.filter(
    (emp) => emp.category === profession
  );

  for (const employee of qualifiedEmployees) {
    if (isEmployeeAvailable(employee.email, startTime, duration, existingReservations)) {
      return employee.email;
    }
  }

  return null; // No available employee found
}
