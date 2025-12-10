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
 * Try to find a valid assignment of employees to service groups
 * Uses backtracking to ensure all services can be covered without conflicts
 */
function findValidAssignment(
  groups: Array<{ profession: string; startTime: DateTime; endTime: DateTime; index: number }>,
  employees: Employee[],
  existingReservations: Reservation[],
  currentIndex: number,
  assignment: Map<number, string>
): boolean {
  // Base case: all groups have been assigned
  if (currentIndex >= groups.length) {
    return true;
  }

  const group = groups[currentIndex];
  const duration = group.endTime.diff(group.startTime, 'minutes').minutes;

  // Get all employees who can perform this service
  const qualifiedEmployees = employees.filter(
    (emp) => emp.category === group.profession
  );

  // If no qualified employees exist, still allow booking (unspecified employee)
  if (qualifiedEmployees.length === 0) {
    return findValidAssignment(groups, employees, existingReservations, currentIndex + 1, assignment);
  }

  // Try each qualified employee
  for (const employee of qualifiedEmployees) {
    // Check if this employee is available for this time slot
    // considering both existing reservations AND our current assignment
    const tempReservations = [...existingReservations];

    // Add all previously assigned services to the reservation list
    for (const [groupIdx, employeeEmail] of Array.from(assignment.entries())) {
      if (employeeEmail === employee.email) {
        const assignedGroup = groups[groupIdx];
        tempReservations.push({
          date_time: assignedGroup.startTime.toISO()!,
          service_duration: assignedGroup.endTime.diff(assignedGroup.startTime, 'minutes').minutes,
          employee: employeeEmail,
          profession: assignedGroup.profession
        });
      }
    }

    if (isEmployeeAvailable(employee.email, group.startTime, duration, tempReservations)) {
      // This employee can handle this service, assign it and continue
      assignment.set(currentIndex, employee.email);

      if (findValidAssignment(groups, employees, existingReservations, currentIndex + 1, assignment)) {
        return true; // Found a valid complete assignment
      }

      // Backtrack
      assignment.delete(currentIndex);
    }
  }

  return false; // No valid assignment found
}

/**
 * Check if a sequence of services can be booked starting at a given time
 * This version uses backtracking to find a valid assignment of employees to services
 */
export function canBookServicesAtTime(
  startTime: DateTime,
  services: Array<{ profession: string; duration: number }>,
  employees: Employee[],
  existingReservations: Reservation[]
): boolean {
  if (services.length === 0) return true;

  // Create individual service time slots (not grouped)
  const serviceSlots: Array<{
    profession: string;
    startTime: DateTime;
    endTime: DateTime;
    index: number;
  }> = [];

  let currentTime = startTime;
  for (let i = 0; i < services.length; i++) {
    const service = services[i];
    const serviceStart = currentTime;
    const serviceEnd = currentTime.plus({ minutes: service.duration });

    serviceSlots.push({
      profession: service.profession,
      startTime: serviceStart,
      endTime: serviceEnd,
      index: i
    });

    currentTime = serviceEnd;
  }

  // Group consecutive services by profession for optimization
  const serviceGroups: Array<{
    profession: string;
    startTime: DateTime;
    endTime: DateTime;
    index: number;
  }> = [];

  for (const slot of serviceSlots) {
    const lastGroup = serviceGroups[serviceGroups.length - 1];

    // Merge consecutive services of the same profession
    if (lastGroup &&
        lastGroup.profession === slot.profession &&
        lastGroup.endTime.equals(slot.startTime)) {
      lastGroup.endTime = slot.endTime;
    } else {
      serviceGroups.push({ ...slot });
    }
  }

  console.log(`Checking ${services.length} services in ${serviceGroups.length} groups at ${startTime.toFormat('HH:mm')}`);

  // Use backtracking to find a valid assignment
  const assignment = new Map<number, string>();
  const canBook = findValidAssignment(serviceGroups, employees, existingReservations, 0, assignment);

  if (canBook && assignment.size > 0) {
    console.log(`✓ Found valid assignment:`,
      Array.from(assignment.entries()).map(([idx, emp]) => ({
        group: serviceGroups[idx].profession,
        time: `${serviceGroups[idx].startTime.toFormat('HH:mm')}-${serviceGroups[idx].endTime.toFormat('HH:mm')}`,
        employee: emp
      }))
    );
  } else if (!canBook) {
    console.log(`✗ No valid assignment found for ${startTime.toFormat('HH:mm')}`);
  }

  return canBook;
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
