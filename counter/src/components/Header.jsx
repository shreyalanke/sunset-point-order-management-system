import { 
  ChefHat, 
  Bell, 
  Settings,
  Printer, 
  Loader2, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { connectPrinter } from '../API/printer';

function Header() {
  const [time, setTime] = useState(new Date());
  const [printerStatus, setPrinterStatus] = useState('connecting');
  const [printerName, setPrinterName] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const result = await connectPrinter();
        if (result){
          setPrinterName(result.name || 'Unknown Printer');
          setPrinterStatus('connected');
        }
        // if (result && result.name) {
        //   setPrinterName(result.name);
        //   setPrinterStatus('connected');
        // } else {
        //   setPrinterStatus('disconnected');
        // }
      } catch (error) {
        setPrinterStatus('disconnected');
      }
    })();
  }, []);

  const formattedDate = time.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'short', 
    day: 'numeric' 
  });
  
  const formattedTime = time.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  // Helper to render printer UI based on status
  const renderPrinterStatus = () => {
    switch (printerStatus) {
      case 'connecting':
        return (
          <div className="flex items-center gap-2 bg-yellow-50 text-yellow-700 px-3 py-1.5 rounded-full border border-yellow-200 transition-all">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-xs font-semibold whitespace-nowrap">Connecting...</span>
          </div>
        );
      case 'connected':
        return (
          <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full border border-green-200 transition-all group cursor-default">
            <Printer size={16} />
            <div className="flex flex-col leading-none">
              <span className="text-[10px] text-green-600 font-medium uppercase tracking-wider">Online</span>
              <span className="text-xs font-bold truncate max-w-[80px] sm:max-w-none">
                {printerName}
              </span>
            </div>
            <CheckCircle2 size={14} className="ml-1" />
          </div>
        );
      case 'disconnected':
      default:
        return (
          <div className="flex items-center gap-2 bg-red-50 text-red-700 px-3 py-1.5 rounded-full border border-red-200 transition-all">
            <Printer size={16} />
            <span className="text-xs font-semibold whitespace-nowrap">No Printer</span>
            <AlertCircle size={14} />
          </div>
        );
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* --- LEFT: Brand Identity --- */}
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-xl shadow-lg shadow-blue-200 flex items-center justify-center shrink-0 transform transition-transform">
            <ChefHat size={24} className="text-white" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-black text-gray-900 leading-none tracking-tight">
              Sunset Point
            </h1>
          </div>
        </div>

        {/* --- RIGHT: Actions & Status --- */}
        <div className="flex items-center gap-2 sm:gap-6">
          
          {/* PRINTER STATUS WIDGET */}
          <div className="hidden md:block">
             {renderPrinterStatus()}
          </div>
          {/* Mobile Icon Only (Optional, if you want it on small screens) */}
          <div className="md:hidden">
            {printerStatus === 'connected' ? (
              <Printer size={20} className="text-green-600" />
            ) : printerStatus === 'connecting' ? (
              <Loader2 size={20} className="animate-spin text-yellow-600" />
            ) : (
              <AlertCircle size={20} className="text-red-500" />
            )}
          </div>

          <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>

          {/* Time Display */}
          <div className="hidden md:flex flex-col items-end">
            <span className="text-sm font-bold text-gray-800">{formattedTime}</span>
            <span className="text-xs text-gray-500 font-medium">{formattedDate}</span>
          </div>

          {/* Icon Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors relative cursor-pointer">
              <Bell size={20} />
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            
            {/* Added Settings just for visual balance */}
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
              <Settings size={20} />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}

export default Header;