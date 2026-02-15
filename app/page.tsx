'use client';

import { useEffect, useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { parseTicket, type Ticket } from '@/utils/parseTicket';
import { TicketList } from '@/components/TicketList';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import { Button } from '@/components/ui/button';
import { QRScannerDialog } from '@/components/QRScannerDialog';

const STORAGE_KEY = 'tickets';

export default function Page() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load tickets from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setTickets(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to load tickets:', e);
      }
    }
    setIsHydrated(true);
  }, []);

  // Save tickets to localStorage whenever they change
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
    }
  }, [tickets, isHydrated]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log('File selected:', file.name);
      const ticket = await parseTicket(file);

      if (!ticket) {
        setError('Failed to parse ticket. Check browser console for details.');
        setIsLoading(false);
        return;
      }

      setTickets((prev) => [ticket, ...prev]);
      setError(null);
    } catch (err) {
      setError('An error occurred while parsing the PDF. Please try again.');
      console.error('Error parsing PDF:', err);
    } finally {
      setIsLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = (id: string) => {
    setTickets((prev) => prev.filter((ticket) => ticket.id !== id));
  };

  if (!isHydrated) {
    return (
      <main className='min-h-screen bg-black'>
        <div className='px-4 py-6 sm:px-6 lg:px-8'>
          <div className='mb-6'>
            <h1 className='text-2xl font-bold text-white'>Tickets</h1>
          </div>
          <SkeletonLoader />
        </div>
      </main>
    );
  }

  return (
    <main className='min-h-screen bg-black'>
      <div className='px-4 py-6 sm:px-6 lg:px-8'>
        {/* Header with Upload Button */}
        <div className='flex items-center justify-between mb-8'>
          <div>
            <h1 className='text-2xl font-bold text-white'>Tickets</h1>
            <p className='text-xs text-zinc-500 mt-1'>{tickets.length} saved</p>
          </div>
          <div className='flex gap-3'>
            <input
              ref={fileInputRef}
              type='file'
              accept='.pdf'
              onChange={handleFileChange}
              disabled={isLoading}
              className='hidden'
            />
            <QRScannerDialog
              onTicketsParsed={(tickets) =>
                setTickets((prev) => [...tickets, ...prev])
              }
            />
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className='mb-6 p-3 bg-red-950/20 border border-red-900/20 rounded-lg text-red-400 text-xs'>
            {error}
            <button
              onClick={() => setError(null)}
              className='ml-2 text-red-300 hover:text-red-200 underline'
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Ticket List */}
        {isLoading ? (
          <SkeletonLoader />
        ) : (
          <TicketList
            tickets={[...tickets].sort((a, b) => {
              // Helper to parse "DD-MMM-YYYY" (e.g. 25-Mar-2026) or ISO
              const parseDate = (d: string) => {
                if (!d) return 0;
                const parts = d.match(
                  /^(\d{1,2})[-/]([A-Za-z]{3})[-/](\d{4})$/,
                );
                if (parts) {
                  const months: Record<string, number> = {
                    Jan: 0,
                    Feb: 1,
                    Mar: 2,
                    Apr: 3,
                    May: 4,
                    Jun: 5,
                    Jul: 6,
                    Aug: 7,
                    Sep: 8,
                    Oct: 9,
                    Nov: 10,
                    Dec: 11,
                  };
                  const m =
                    months[
                      parts[2].charAt(0).toUpperCase() +
                        parts[2].slice(1).toLowerCase()
                    ];
                  if (m !== undefined)
                    return new Date(
                      parseInt(parts[3]),
                      m,
                      parseInt(parts[1]),
                    ).getTime();
                }
                return new Date(d).getTime();
              };

              const tA = parseDate(a.dateOfJourney);
              const tB = parseDate(b.dateOfJourney);
              if (isNaN(tA)) return 1;
              if (isNaN(tB)) return -1;
              return tA - tB;
            })}
            onDelete={handleDelete}
          />
        )}
      </div>
    </main>
  );
}
