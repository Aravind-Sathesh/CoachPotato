import { addDays, addHours, format, isValid, parse } from 'date-fns';

import type { Ticket } from './parseTicket';

const DATE_FORMATS = [
  'dd-MMM-yyyy',
  'dd-MMM-yy',
  'dd-MM-yyyy',
  'dd-MM-yy',
  'dd/MM/yyyy',
  'dd/MM/yy',
  'yyyy-MM-dd',
  'yyyy/M/d',
  'yyyy/MM/dd',
];

function parseDateOnly(dateStr: string): Date | null {
  const normalizedDate = dateStr.trim();

  for (const dateFormat of DATE_FORMATS) {
    const parsedDate = parse(normalizedDate, dateFormat, new Date());
    if (isValid(parsedDate)) {
      return parsedDate;
    }
  }

  const fallbackDate = new Date(normalizedDate);
  return isValid(fallbackDate) ? fallbackDate : null;
}

function parseDepartureTime(
  timeStr: string,
): { hours: number; minutes: number } | null {
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    return null;
  }

  const hours = Number.parseInt(match[1], 10);
  const minutes = Number.parseInt(match[2], 10);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours > 23 ||
    minutes > 59
  ) {
    return null;
  }

  return { hours, minutes };
}

export function parseTicketDate(dateStr: string): Date | null {
  return parseDateOnly(dateStr);
}

export function buildGoogleCalendarUrl(ticket: Ticket): string | null {
  const journeyDate = parseDateOnly(ticket.dateOfJourney);
  if (!journeyDate) {
    return null;
  }

  const eventTitle = `#${ticket.trainNumber} - ${ticket.from} \u2192 ${ticket.to}`;
  const eventDetails = `PNR: ${ticket.pnr}\n\n${ticket.seatBerth || ''}`.trim();
  const eventLocation = ticket.from;

  const calendarUrl = new URL('https://calendar.google.com/calendar/render');
  calendarUrl.searchParams.set('action', 'TEMPLATE');
  calendarUrl.searchParams.set('text', eventTitle);
  calendarUrl.searchParams.set('details', eventDetails);
  calendarUrl.searchParams.set('location', eventLocation);

  const departureTime = ticket.departureTime
    ? parseDepartureTime(ticket.departureTime)
    : null;

  if (departureTime) {
    const startDateTime = new Date(journeyDate);
    startDateTime.setHours(departureTime.hours, departureTime.minutes, 0, 0);

    let endDateTime: Date;

    if (ticket.arrivalDate && ticket.arrivalTime) {
      const parsedArrivalDate = parseDateOnly(ticket.arrivalDate);
      const parsedArrivalTime = parseDepartureTime(ticket.arrivalTime);

      if (parsedArrivalDate && parsedArrivalTime) {
        endDateTime = new Date(parsedArrivalDate);
        endDateTime.setHours(
          parsedArrivalTime.hours,
          parsedArrivalTime.minutes,
          0,
          0,
        );
      } else {
        endDateTime = addHours(startDateTime, 1);
      }
    } else {
      endDateTime = addHours(startDateTime, 1);
    }

    calendarUrl.searchParams.set(
      'dates',
      `${format(startDateTime, "yyyyMMdd'T'HHmmss")}/${format(
        endDateTime,
        "yyyyMMdd'T'HHmmss",
      )}`,
    );
  } else {
    calendarUrl.searchParams.set(
      'dates',
      `${format(journeyDate, 'yyyyMMdd')}/${format(addDays(journeyDate, 1), 'yyyyMMdd')}`,
    );
  }

  return calendarUrl.toString();
}
