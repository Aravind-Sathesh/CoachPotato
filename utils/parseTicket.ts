import * as pdfjsLib from 'pdfjs-dist';

// Use the bundled worker from pdfjs-dist
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

export interface Ticket {
  id: string;
  pnr: string;
  trainNumber: string;
  trainName: string;
  from: string;
  to: string;
  dateOfJourney: string;
  departureTime: string;
  class: string;
  coach: string;
  seatBerth: string;
  passengerName: string;
  uploadedAt: string;
}

async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let text = '';

  console.log('PDF loaded, numPages:', pdf.numPages);

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    console.log(`Page ${i} items length:`, textContent.items.length);
    if (textContent.items.length > 0) {
      console.log(
        `Page ${i} first item:`,
        JSON.stringify(textContent.items[0]),
      );
    }
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    console.log(`Page ${i} extracted text length:`, pageText.length);
    text += pageText;
  }

  return text;
}

function normalizeText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function extractField(text: string, patterns: string[]): string {
  for (const pattern of patterns) {
    const regex = new RegExp(pattern, 'i');
    const match = text.match(regex);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return '';
}

export async function parseTicket(file: File): Promise<Ticket | null> {
  try {
    console.log('Starting PDF parsing for file:', file.name);

    const text = await extractTextFromPDF(file);
    console.log('Extracted raw text length:', text.length);
    console.log('First 500 chars:', text.substring(0, 500));

    const normalizedText = normalizeText(text);
    console.log('Normalized text length:', normalizedText.length);

    // Extract PNR
    const pnr = extractField(normalizedText, [
      'PNR\\s*[:-]?\\s*([A-Z0-9]{10})',
      'Confirmation[\\w\\s]*[:-]?\\s*([A-Z0-9]{10})',
    ]);
    console.log('Extracted PNR:', pnr);

    // Extract Train Number
    const trainNumber = extractField(normalizedText, [
      'Train\\s*No[\\w\\s]*[:-]?\\s*(\\d{5})',
      'Train\\s*Number[\\w\\s]*[:-]?\\s*(\\d{5})',
    ]);
    console.log('Extracted Train Number:', trainNumber);

    // Extract Train Name
    const trainName = extractField(normalizedText, [
      'Train\\s*Name[\\w\\s]*[:-]?\\s*([\\w\\s]+?)(?:Depart|From|Class)',
      'Train[\\s/]*Name[\\w\\s]*[:-]?\\s*([\\w\\s]+?)(?=\\d{2}[-/])',
    ]);
    console.log('Extracted Train Name:', trainName);

    // Extract From Station
    const from = extractField(normalizedText, [
      'From[\\w\\s]*[:-]?\\s*([A-Z\\s]+?)(?:To|Dept)',
      'Boarding[\\w\\s]*[:-]?\\s*([A-Z\\s]+?)(?=To|Date)',
    ]);
    console.log('Extracted From:', from);

    // Extract To Station
    const to = extractField(normalizedText, [
      'To[\\w\\s]*[:-]?\\s*([A-Z\\s]+?)(?:Date|Dept|Class)',
      'Destination[\\w\\s]*[:-]?\\s*([A-Z\\s]+?)(?=Date)',
    ]);
    console.log('Extracted To:', to);

    // Extract Date
    const dateOfJourney = extractField(normalizedText, [
      'Date[\\w\\s]*[:-]?\\s*(\\d{2}[-/]\\d{2}[-/]\\d{2,4})',
      'Journey[\\w\\s]*[:-]?\\s*(\\d{2}[-/]\\d{2}[-/]\\d{2,4})',
    ]);
    console.log('Extracted Date:', dateOfJourney);

    // Extract Departure Time
    const departureTime = extractField(normalizedText, [
      'Depart[\\w\\s]*[:-]?\\s*(\\d{2}:\\d{2})',
      'Departure[\\w\\s]*[:-]?\\s*(\\d{2}:\\d{2})',
    ]);
    console.log('Extracted Departure Time:', departureTime);

    // Extract Class - safely using character class instead of lookahead
    let classValue = '';
    try {
      const classRegex = /Class\s*[:=]?\s*([A-Z0-9]+)/i;
      const classMatch = normalizedText.match(classRegex);
      if (classMatch && classMatch[1]) {
        classValue = classMatch[1].trim();
      }
    } catch (e) {
      console.log('Error extracting class:', e);
    }
    console.log('Extracted Class:', classValue);

    // Extract Coach
    const coach = extractField(normalizedText, [
      'Coach[\\w\\s]*[:-]?\\s*([A-Z0-9]+)',
    ]);
    console.log('Extracted Coach:', coach);

    // Extract Seat/Berth
    const seatBerth = extractField(normalizedText, [
      '(?:Seat|Berth)[\\w\\s]*[:-]?\\s*([A-Z0-9]+)',
    ]);
    console.log('Extracted Seat/Berth:', seatBerth);

    // Extract Passenger Name
    const passengerName = extractField(normalizedText, [
      'Passenger[\\w\\s]*[:-]?\\s*([A-Za-z\\s]+?)(?:Age|Sex|Class|Coach|$)',
      'Name[\\w\\s]*[:-]?\\s*([A-Za-z\\s]+?)(?:Age|Sex|Berth|Class|$)',
    ]);
    console.log('Extracted Passenger Name:', passengerName);

    // Validate minimum fields
    console.log(
      'Validation check - PNR:',
      !!pnr,
      'Train:',
      !!trainNumber,
      'From:',
      !!from,
      'To:',
      !!to,
    );
    if (!pnr || !trainNumber || !from || !to) {
      console.log('Validation failed - missing required fields');
      return null;
    }

    console.log('Ticket parsed successfully');
    return {
      id: crypto.randomUUID(),
      pnr,
      trainNumber,
      trainName: trainName || 'Unknown',
      from,
      to,
      dateOfJourney,
      departureTime,
      class: classValue || 'Unknown',
      coach,
      seatBerth,
      passengerName,
      uploadedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error parsing PDF:', error);
    return null;
  }
}
