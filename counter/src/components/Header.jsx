import { 
  ChefHat, 
  Bell, 
  Wifi, 
  Settings
} from 'lucide-react';
import { useState, useEffect } from 'react';

function Header() {
  const [time, setTime] = useState(new Date());

  // Live clock effect
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(timer);
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

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* --- LEFT: Brand Identity --- */}
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-xl shadow-lg shadow-blue-200 flex items-center justify-center shrink-0 transform transition-transform ">
            <ChefHat size={24} className="text-white" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-black text-gray-900 leading-none tracking-tight">
              Sunset Point
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-6">
          <div className="hidden md:flex flex-col items-end mr-2">
            <span className="text-sm font-bold text-gray-800">{formattedTime}</span>
            <span className="text-xs text-gray-500 font-medium">{formattedDate}</span>
          </div>

        

          {/* Icon Actions */}
          <div className="flex items-center gap-1 sm:gap-2" >
          
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors relative cursor-pointer"  >
              <Bell size={20} />
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            
            
          </div>

        </div>
      </div>
    </header>
  );
}

export default Header;