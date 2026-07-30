import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { parse, addHours, addMinutes, format } from 'date-fns';

export async function GET(
  request: Request,
  props: { params: Promise<{ pnr: string }> },
) {
  const params = await props.params;
  const pnr = params.pnr;

  try {
    const response = await fetch(`https://www.railyatri.in/pnr-status/${pnr}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      redirect: 'follow',
    });

    const html = await response.text();
    const $ = cheerio.load(html);

    let departureTime = '';
    let arrivalTime = '';
    let journeyHours = 0;
    let journeyMinutes = 0;
    let boardingDate = '';

    // Extract times and duration based on class structures
    $('p.pnr-normal-font').each((_, el) => {
      const text = $(el).text().trim().toUpperCase();
      if (text === 'FROM') {
        departureTime =
          $(el).nextAll('p').first().next('p').text().trim() ||
          $(el).parent().find('p').eq(2).text().trim();
      } else if (text === 'TO') {
        arrivalTime =
          $(el).nextAll('p').first().next('p').text().trim() ||
          $(el).parent().find('p').eq(2).text().trim();
      } else if (text === 'JOURNEY TIME') {
        const hText = $(el).nextAll('span').eq(0).text().trim();
        const mText = $(el).nextAll('span').eq(1).text().trim();
        journeyHours = parseInt(hText.replace(/\D/g, '')) || 0;
        journeyMinutes = parseInt(mText.replace(/\D/g, '')) || 0;
      }
    });

    // Extract boarding date globally
    const bodyText = $('body').text();
    const dateMatch = bodyText.match(/DAY OF BOARDING\s+(\d{2}-\d{2}-\d{4})/i);
    if (dateMatch) {
      boardingDate = dateMatch[1];
    }

    // Fallback regex search if exact DOM changed
    if (!departureTime) {
      const fromMatch = bodyText.match(/FROM[\s\S]*?(\d{2}:\d{2}\s*[AM|PM]+)/i);
      if (fromMatch) departureTime = fromMatch[1];
    }

    if (!boardingDate || !departureTime) {
      return NextResponse.json(
        { error: 'Missing necessary schedule info' },
        { status: 400 },
      );
    }

    // Calculate arrival datetime
    const startDateTime = parse(
      `${boardingDate} ${departureTime}`,
      'dd-MM-yyyy hh:mm a',
      new Date(),
    );
    const endDateTime = addMinutes(
      addHours(startDateTime, journeyHours),
      journeyMinutes,
    );

    return NextResponse.json({
      departureTime: format(startDateTime, 'HH:mm'),
      arrivalTime: format(endDateTime, 'HH:mm'),
      arrivalDate: format(endDateTime, 'dd-MMM-yyyy'),
    });
  } catch (error) {
    console.error('RailYatri fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch arrival info' },
      { status: 500 },
    );
  }
}
