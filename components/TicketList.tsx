'use client';

import type { Ticket } from '@/utils/parseTicket';
import { TicketCard } from './TicketCard';
import { Button } from '@/components/ui/button';
import { Inbox } from 'lucide-react';
import { parseTicketDate } from '@/utils/ticketDate';

interface TicketListProps {
  tickets: Ticket[];
  onDelete: (id: string) => void;
}

export function TicketList({ tickets, onDelete }: TicketListProps) {
  if (tickets.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center gap-6 py-16'>
        <div className='rounded-lg bg-blue-500/10 p-6 border border-blue-500/30'>
          <Inbox className='w-10 h-10 text-blue-400 mx-auto' />
        </div>
        <div className='text-center'>
          <h3 className='text-lg font-semibold text-white mb-1'>
            No tickets yet
          </h3>
          <p className='text-zinc-400 text-sm'>
            Use the upload button to add your first ticket
          </p>
        </div>
      </div>
    );
  }

  // Sort tickets by date (upcoming first)
  const sortedTickets = [...tickets].sort((a, b) => {
    const dateA =
      parseTicketDate(a.dateOfJourney)?.getTime() ?? Number.POSITIVE_INFINITY;
    const dateB =
      parseTicketDate(b.dateOfJourney)?.getTime() ?? Number.POSITIVE_INFINITY;
    return dateA - dateB;
  });

  return (
    <div className='space-y-4'>
      {sortedTickets.map((ticket) => (
        <TicketCard key={ticket.id} ticket={ticket} onDelete={onDelete} />
      ))}
    </div>
  );
}
