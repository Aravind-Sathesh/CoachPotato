import { Ticket } from './parseTicket';

export function parseQRData(text: string): Ticket[] {
  const normalize = (str: string) => str.replace(/[\n\r\t]/g, ' ').trim();
  const cleanText = normalize(text);

  // Extract common fields
  const pnrMatch = cleanText.match(/PNR No\. ?: ?(\d+)/i);
  const trainNoMatch = cleanText.match(/Train No\. ?: ?(\d+)/i);
  const trainNameMatch = cleanText.match(/Train Name ?: ?([^,]+)/i);
  const fromMatch = cleanText.match(/From ?: ?([^,]+)/i);
  const toMatch = cleanText.match(/To ?: ?([^,]+)/i);
  const dateMatch = cleanText.match(/Date Of Journey ?: ?([^,]+)/i);
  const departureTimeMatch = cleanText.match(
    /Scheduled Departure ?: ?[^ ]+ (\d{2}:\d{2})/i,
  ); // Extract time from timestamp
  const classMatch = cleanText.match(/Class ?: ?([^,]+)/i);

  const pnr = pnrMatch ? pnrMatch[1].trim() : '';
  const trainNumber = trainNoMatch ? trainNoMatch[1].trim() : '';
  const trainName = trainNameMatch ? trainNameMatch[1].trim() : 'Unknown';
  const from = fromMatch ? fromMatch[1].trim() : '';
  const to = toMatch ? toMatch[1].trim() : '';
  const dateOfJourney = dateMatch ? dateMatch[1].trim() : '';
  // If departure time is missing in global text, we might try to infer or leave blank.
  // Sample has "Scheduled Departure:25-Mar-2026 19:05"
  const departureTime = departureTimeMatch ? departureTimeMatch[1].trim() : '';
  const classValue = classMatch ? classMatch[1].trim() : 'Unknown';

  // Extract passengers
  // Pattern: Passenger Name:..., Gender:..., Age:..., Status:...
  // We can split by "Passenger Name:" to separate chunks if possible, or use global regex
  const tickets: Ticket[] = [];

  // Regex to match each passenger block
  // We'll proceed by finding all matches
  const passengerRegex =
    /Passenger Name:([^,]+),\s*Gender:[^,]+,\s*Age:\d+,\s*Status:([^,]+?)(?:,\s*)?(?=Passenger Name|Quota|Train|Ticket|$)/gi;

  let match;
  // We need to use the original text or a semi-normalized one that preserves structure enough
  // The normalized one `cleanText` puts everything on one line which is good for this regex

  // However, cleaning it might merge separators.
  // Let's use `cleanText` but be careful.

  // Current `cleanText` replaces newlines with spaces.
  // Sample: "Passenger Name:X, Gender:M, Age:20, Status:Y Passenger Name:Z..."

  while ((match = passengerRegex.exec(cleanText)) !== null) {
    const name = match[1].trim();
    const status = match[2].trim(); // e.g., CNFB1/50MB

    // Parse Status for Coach, Seat, Berth
    // Format: CNF<Coach>/<Seat><Berth>
    // Example: CNFB1/50MB -> Coach: B1, Seat: 50, Berth: MB
    // Example: CNFB1/51UB -> Coach: B1, Seat: 51, Berth: UB

    let coach = '';
    let seatBerth = '';

    // Match patterns like CNFB8/52, CNFB8/52MB, CNF/B8/52
    const cnfMatch = status.match(/^CNF\/?([A-Z0-9]+)\/(\d+)([A-Z]*)$/i);

    if (cnfMatch) {
      coach = cnfMatch[1];
      seatBerth = cnfMatch[3]
        ? `${cnfMatch[2]} (${cnfMatch[3].toUpperCase()})`
        : cnfMatch[2];
    } else if (status.toUpperCase().startsWith('CNF')) {
      // Fallback for irregular CNF formats
      const cleanStatus = status.substring(3).replace(/^\/+/, '');
      const parts = cleanStatus.split('/');

      if (parts.length >= 2) {
        coach = parts[0];
        seatBerth = parts.slice(1).join(' ');
      } else {
        seatBerth = cleanStatus || status;
      }
    } else {
      // Fallback for WL, RAC, or unhandled statuses
      seatBerth = status;
    }

    tickets.push({
      id: crypto.randomUUID(),
      pnr,
      trainNumber,
      trainName,
      from,
      to,
      dateOfJourney,
      departureTime,
      class: classValue,
      coach,
      seatBerth,
      passengerName: name,
      uploadedAt: new Date().toISOString(),
      arrivalDate: undefined,
      arrivalTime: undefined,
    });
  }

  return tickets;
}
