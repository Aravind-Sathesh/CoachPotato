'use client'

import type { Ticket } from '@/utils/parseTicket'
import { TicketCard } from './TicketCard'
import { Button } from '@/components/ui/button'
import { Inbox } from 'lucide-react'

interface TicketListProps {
  tickets: Ticket[]
  onDelete: (id: string) => void
}

function parseDate(dateStr: string): Date {
  // Try multiple date formats
  const formats = [
    /(\d{2})[-/](\d{2})[-/](\d{4})/,
    /(\d{4})[-/](\d{2})[-/](\d{2})/,
  ]

  for (const format of formats) {
    const match = dateStr.match(format)
    if (match) {
      if (match[3].length === 4) {
        // Format: DD-MM-YYYY or MM-DD-YYYY
        return new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]))
      } else {
        // Format: YYYY-MM-DD
        return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]))
      }
    }
  }

  return new Date()
}

export function TicketList({ tickets, onDelete }: TicketListProps) {
  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-16">
        <div className="rounded-lg bg-blue-500/10 p-6 border border-blue-500/30">
          <Inbox className="w-10 h-10 text-blue-400 mx-auto" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-white mb-1">No tickets yet</h3>
          <p className="text-zinc-400 text-sm">Use the upload button to add your first ticket</p>
        </div>
      </div>
    )
  }

  // Sort tickets by date (upcoming first)
  const sortedTickets = [...tickets].sort((a, b) => {
    const dateA = parseDate(a.dateOfJourney)
    const dateB = parseDate(b.dateOfJourney)
    return dateA.getTime() - dateB.getTime()
  })

  return (
    <div className="space-y-4">
      {sortedTickets.map((ticket) => (
        <TicketCard key={ticket.id} ticket={ticket} onDelete={onDelete} />
      ))}
    </div>
  )
}
