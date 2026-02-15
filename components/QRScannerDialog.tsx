'use client';

import { useState } from 'react';
import {
  QrCode,
  ClipboardPaste,
  Camera,
  Type,
  Check,
  User,
} from 'lucide-react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { parseQRData } from '@/utils/parseQR';
import { type Ticket } from '@/utils/parseTicket';
import { toast } from 'sonner';

interface QRScannerDialogProps {
  onTicketsParsed: (tickets: Ticket[]) => void;
}

type Step = 'scan' | 'select';

export function QRScannerDialog({ onTicketsParsed }: QRScannerDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [mode, setMode] = useState<'scan' | 'paste'>('scan');
  const [step, setStep] = useState<Step>('scan');
  const [scannedTickets, setScannedTickets] = useState<Ticket[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleScan = (result: any) => {
    if (result && result.length > 0) {
      const rawValue = result[0].rawValue;
      processData(rawValue);
    }
  };

  const handleManualSubmit = () => {
    if (!manualInput.trim()) return;
    processData(manualInput);
  };

  const processData = (data: string) => {
    try {
      const tickets = parseQRData(data);
      if (tickets.length === 0) {
        toast.error('No valid ticket data found in QR code');
        return;
      }

      setScannedTickets(tickets);
      // Select all by default
      setSelectedIds(new Set(tickets.map((t) => t.id)));
      setStep('select');
      toast.success(`Found ${tickets.length} passengers`);
    } catch (error) {
      console.error('Error parsing QR data:', error);
      toast.error('Failed to parse QR data');
    }
  };

  const confirmSelection = () => {
    const finalTickets = scannedTickets.filter((t) => selectedIds.has(t.id));
    if (finalTickets.length === 0) {
      toast.error('Please select at least one passenger');
      return;
    }
    onTicketsParsed(finalTickets);
    setIsOpen(false);
    resetState();
    toast.success(`Added ${finalTickets.length} ticket(s)`);
  };

  const resetState = () => {
    setManualInput('');
    setScannedTickets([]);
    setStep('scan');
    setSelectedIds(new Set());
  };

  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) setTimeout(resetState, 300);
      }}
    >
      <DialogTrigger asChild>
        <Button className='gap-2 bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-900/20'>
          <QrCode className='w-4 h-4' />
          Scan QR
        </Button>
      </DialogTrigger>

      <DialogContent className='sm:max-w-md bg-zinc-950 border-zinc-800 p-0 overflow-hidden shadow-2xl shadow-black'>
        <DialogHeader className='p-4 pb-2 bg-zinc-950/80 absolute top-0 left-0 right-0 z-10 backdrop-blur-sm border-b border-white/5'>
          <DialogTitle className='text-zinc-100 flex items-center justify-between'>
            <span>{step === 'scan' ? 'Add Ticket' : 'Select Passengers'}</span>

            {step === 'scan' && (
              <div className='flex bg-zinc-900 rounded-full p-1 border border-zinc-800'>
                <button
                  onClick={() => setMode('scan')}
                  className={`p-1.5 rounded-full transition-colors ${mode === 'scan' ? 'bg-zinc-800 text-yellow-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  <Camera className='w-4 h-4' />
                </button>
                <button
                  onClick={() => setMode('paste')}
                  className={`p-1.5 rounded-full transition-colors ${mode === 'paste' ? 'bg-zinc-800 text-blue-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  <Type className='w-4 h-4' />
                </button>
              </div>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className='relative pt-14 flex flex-col min-h-[400px]'>
          {step === 'scan' ? (
            mode === 'scan' ? (
              <div className='flex-1 relative bg-black flex flex-col items-center justify-center'>
                {isOpen && (
                  <div className='absolute inset-0 w-full h-full'>
                    <Scanner
                      onScan={handleScan}
                      onError={(error) => console.error(error)}
                      components={{
                        onOff: true,
                        torch: true,
                        zoom: true,
                        finder: false,
                      }}
                      styles={{
                        container: { width: '100%', height: '100%' },
                        video: { objectFit: 'cover' },
                      }}
                    />
                  </div>
                )}

                {/* Custom Viewfinder Overlay */}
                <div className='absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-20'>
                  <div className='absolute inset-0 bg-black/50'></div>

                  <div
                    className='relative w-64 h-64 border-2 border-dashed border-red-500/50 rounded-3xl z-30'
                    style={{
                      boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
                    }}
                  >
                    {/* Corners */}
                    <div className='absolute top-[-2px] left-[-2px] w-8 h-8 border-t-4 border-l-4 border-red-500 rounded-tl-xl'></div>
                    <div className='absolute top-[-2px] right-[-2px] w-8 h-8 border-t-4 border-r-4 border-red-500 rounded-tr-xl'></div>
                    <div className='absolute bottom-[-2px] left-[-2px] w-8 h-8 border-b-4 border-l-4 border-red-500 rounded-bl-xl'></div>
                    <div className='absolute bottom-[-2px] right-[-2px] w-8 h-8 border-b-4 border-r-4 border-red-500 rounded-br-xl'></div>

                    {/* Camera Icon Marker */}
                    <div className='absolute -right-16 top-1/2 -translate-y-1/2'>
                      <div className='bg-yellow-500/20 p-3 rounded-full border border-yellow-500 animate-pulse'>
                        <Camera className='w-5 h-5 text-yellow-500' />
                      </div>
                    </div>
                  </div>

                  <p className='mt-12 text-zinc-300 text-sm font-medium relative z-30 shadow-black drop-shadow-md'>
                    Point your camera at the QR code
                  </p>
                </div>
              </div>
            ) : (
              <div className='flex-1 bg-zinc-950 p-6 flex flex-col gap-4'>
                <p className='text-zinc-400 text-sm'>
                  If your camera is not working, you can paste the text content
                  from the QR code here.
                </p>
                <Textarea
                  placeholder='Paste QR code content here...'
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  className='flex-1 font-mono text-xs bg-zinc-900 border-zinc-800 focus:border-blue-500/50 resize-none text-zinc-300 p-4'
                />
                <Button
                  onClick={handleManualSubmit}
                  className='w-full gap-2 bg-zinc-100 text-zinc-900 hover:bg-white'
                >
                  <ClipboardPaste className='w-4 h-4' />
                  Process Text
                </Button>
              </div>
            )
          ) : (
            <div className='flex-1 bg-zinc-950 p-6 flex flex-col'>
              <p className='text-xs text-zinc-400 mb-4'>
                Found {scannedTickets.length} passengers in this ticket. Select
                the ones you want to add.
              </p>

              <div className='flex-1 space-y-2 overflow-y-auto pr-2 max-h-[300px]'>
                {scannedTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    onClick={() => toggleSelection(ticket.id)}
                    className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedIds.has(ticket.id)
                        ? 'bg-blue-500/10 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                        : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 transition-colors ${
                        selectedIds.has(ticket.id)
                          ? 'bg-blue-500 border-blue-500'
                          : 'border-zinc-600 bg-transparent'
                      }`}
                    >
                      {selectedIds.has(ticket.id) && (
                        <Check className='w-3 h-3 text-white' />
                      )}
                    </div>

                    <div className='flex-1 min-w-0'>
                      <p
                        className={`text-sm font-bold truncate ${selectedIds.has(ticket.id) ? 'text-white' : 'text-zinc-400'}`}
                      >
                        {ticket.passengerName}
                      </p>
                      <div className='flex items-center gap-2 mt-1'>
                        <span className='text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded'>
                          {ticket.coach}
                        </span>
                        <span className='text-[10px] text-zinc-500'>
                          Seat {ticket.seatBerth?.split('(')[0].trim() || '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className='pt-4 mt-auto border-t border-white/5'>
                <Button
                  onClick={confirmSelection}
                  className='w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold h-11'
                  disabled={selectedIds.size === 0}
                >
                  Add {selectedIds.size} Passenger
                  {selectedIds.size !== 1 ? 's' : ''}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
