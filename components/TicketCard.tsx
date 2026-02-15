'use client';

import { Trash2, Calendar, Copy, ExternalLink, Train } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import type { Ticket } from '@/utils/parseTicket';

interface TicketCardProps {
  ticket: Ticket;
  onDelete: (id: string) => void;
}

function getBerthFullName(code: string): string {
  const map: Record<string, string> = {
    LB: 'Lower',
    MB: 'Middle',
    UB: 'Upper',
    SL: 'Side Lower',
    SU: 'Side Upper',
    SUB: 'Side Upper',
  };
  return map[code] || code;
}

export function TicketCard({ ticket, onDelete }: TicketCardProps) {
  // Extract just the seat number and berth if possible for cleaner display
  let seat = ticket.seatBerth || '-';
  let berth = '';

  const seatMatch = ticket.seatBerth?.match(/^(\d+)\s*\(([A-Z]+)\)$/);
  if (seatMatch) {
    seat = seatMatch[1];
    berth = seatMatch[2];
  }

  // Format class nicely - typically "THIRD_AC (3A)" -> "3A"
  const classDisplay = ticket.class.includes('(')
    ? ticket.class.match(/\((.*?)\)/)?.[1] || ticket.class
    : ticket.class;

  const handleTrainClick = () => {
    const query = encodeURIComponent(
      `Train number ${ticket.trainNumber} live tracking`,
    );
    window.open(`https://www.google.com/search?q=${query}`, '_blank');
  };

  const handlePnrCopy = () => {
    navigator.clipboard.writeText(ticket.pnr);
    toast.success('PNR copied to clipboard');
  };

  return (
    <Card className='group relative overflow-hidden border-0 bg-zinc-900 ring-1 ring-white/10 transition-all hover:ring-white/20 rounded-2xl'>
      {/* Train Info Header */}
      <div className='p-5 pb-4 border-b border-white/5'>
        <div className='flex justify-between items-start'>
          <div className='flex-1 pr-4'>
            <div className='flex items-center flex-wrap gap-2 mb-2'>
              <h2 className='text-lg font-bold text-white tracking-tight'>
                {ticket.trainName}
              </h2>
              <button
                onClick={handleTrainClick}
                className='flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-blue-400 px-2 py-0.5 rounded-full text-xs font-mono font-bold transition-colors cursor-pointer border border-zinc-700/50'
                title='Track Live Status'
              >
                #{ticket.trainNumber}
                <ExternalLink className='w-2.5 h-2.5 opacity-50' />
              </button>
            </div>

            <div className='flex items-center gap-1.5 text-zinc-400'>
              <Calendar className='w-3.5 h-3.5' />
              <span className='text-sm font-semibold text-zinc-300'>
                {ticket.dateOfJourney}
              </span>
              <span className='text-xs text-zinc-600 px-1'>•</span>
              <span className='text-sm font-medium'>
                {ticket.departureTime}
              </span>
            </div>
          </div>
          <button
            onClick={() => onDelete(ticket.id)}
            className='text-zinc-600 hover:text-red-400 transition-colors p-2 -mr-2 -mt-2 rounded-full hover:bg-red-500/10'
          >
            <Trash2 className='w-4 h-4' />
          </button>
        </div>
      </div>

      {/* Route Visualization */}
      <div className='px-5 py-4'>
        <div className='relative'>
          {/* Dotted Line */}
          <div className='absolute left-[3px] top-3 bottom-3 border-l-2 border-dashed border-zinc-800 pointer-events-none'></div>

          {/* From Station */}
          <div className='flex items-center gap-4 mb-4 relative'>
            <div className='w-2 h-2 rounded-full bg-blue-500 z-10 shrink-0'></div>
            <p className='text-base font-semibold text-zinc-100 leading-tight'>
              {ticket.from}
            </p>
          </div>

          {/* To Station */}
          <div className='flex items-center gap-4 relative'>
            <div className='w-2 h-2 rounded-full bg-zinc-700 z-10 shrink-0'></div>
            <p className='text-base font-semibold text-zinc-100 leading-tight'>
              {ticket.to}
            </p>
          </div>
        </div>
      </div>

      {/* Passenger & Details */}
      <div className='px-5 pb-5 pt-0'>
        <div className='bg-zinc-950/50 rounded-xl p-4 border border-white/5'>
          <p className='text-[10px] font-bold text-zinc-600 mb-2 uppercase tracking-widest'>
            Passenger
          </p>
          <p className='text-sm font-semibold text-white mb-3'>
            {ticket.passengerName}
          </p>

          <div className='flex flex-wrap gap-2'>
            {/* Coach & Class Pill - Improved Style */}
            <div className='flex items-center bg-zinc-900 border border-zinc-800 rounded-full pl-3 pr-1 py-1 shadow-sm'>
              <div className='text-xs font-bold text-zinc-400 mr-2 flex items-center gap-1'>
                <Train className='w-3 h-3' />
                Coach {ticket.coach || '-'}
              </div>
              <div className='bg-zinc-800 text-zinc-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-zinc-700'>
                {classDisplay}
              </div>
            </div>

            {/* Seat Pill - Improved Style */}
            <div className='flex items-center bg-blue-950/30 border border-blue-900/50 rounded-full px-3 py-1 shadow-sm'>
              <span className='text-blue-400/80 text-[10px] font-bold uppercase mr-2'>
                Seat
              </span>
              <span className='text-blue-100 text-xs font-bold'>{seat}</span>
              {berth && (
                <span className='text-blue-300/80 text-[10px] ml-1.5 font-medium border-l border-blue-800/50 pl-1.5'>
                  {getBerthFullName(berth)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer PNR - Interactive */}
      <button
        onClick={handlePnrCopy}
        className='w-full px-5 py-2.5 bg-zinc-950/80 border-t border-white/5 flex items-center justify-center gap-2 hover:bg-zinc-900 transition-colors group/pnr'
        title='Click to copy PNR'
      >
        <p className='text-[10px] font-mono text-zinc-600 tracking-widest group-hover/pnr:text-zinc-400 transition-colors'>
          PNR: {ticket.pnr}
        </p>
        <Copy className='w-3 h-3 text-zinc-700 group-hover/pnr:text-zinc-500' />
      </button>

      {/* Decorative gradient aligned top */}
      <div className='absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-50'></div>
    </Card>
  );
}
