import { ArrowDownIcon, CheckCircleIcon, XCircleIcon, ShieldIcon, GlobeIcon, PlugIcon, KeyIcon } from "lucide-react"
import { useState } from "react"
import { useTheme } from "next-themes"

export function PolicyFlowVisualization() {
  const [hoveredSection, setHoveredSection] = useState<string | null>(null)
  const { theme } = useTheme()
  const isDark = theme === "dark"
  
  // Define theme-aware colors
  const colors = {
    cardBg: {
      incoming: isDark ? "bg-violet-950/40" : "bg-gradient-to-b from-violet-50 to-violet-100",
      global: isDark ? "bg-blue-950/40" : "bg-gradient-to-b from-blue-50 to-blue-100",
      plugin: isDark ? "bg-amber-950/40" : "bg-gradient-to-b from-amber-50 to-amber-100",
      credential: isDark ? "bg-emerald-950/40" : "bg-gradient-to-b from-emerald-50 to-emerald-100",
      deny: isDark ? "bg-red-950/40" : "bg-gradient-to-b from-red-50 to-red-100",
      allow: isDark ? "bg-green-950/40" : "bg-gradient-to-b from-green-50 to-green-100"
    },
    cardBorder: {
      incoming: isDark ? "border-violet-800" : "border-violet-200",
      global: isDark ? "border-blue-800" : "border-blue-200",
      plugin: isDark ? "border-amber-800" : "border-amber-200",
      credential: isDark ? "border-emerald-800" : "border-emerald-200",
      deny: isDark ? "border-red-800" : "border-red-200",
      allow: isDark ? "border-green-800" : "border-green-200"
    },
    iconBg: {
      incoming: isDark ? "bg-violet-800" : "bg-violet-500",
      global: isDark ? "bg-blue-800" : "bg-blue-500",
      plugin: isDark ? "bg-amber-800" : "bg-amber-500",
      credential: isDark ? "bg-emerald-800" : "bg-emerald-500",
    },
    iconRingBg: {
      incoming: isDark ? "bg-violet-900/50" : "bg-violet-100",
      global: isDark ? "bg-blue-900/50" : "bg-blue-100",
      plugin: isDark ? "bg-amber-900/50" : "bg-amber-100",
      credential: isDark ? "bg-emerald-900/50" : "bg-emerald-100",
    },
    text: {
      heading: isDark ? "text-gray-200" : "text-gray-900",
      subheading: isDark ? "text-gray-400" : "text-gray-500",
      title: isDark ? "text-gray-100" : "text-gray-800",
      description: isDark ? "text-gray-400" : "text-gray-500"
    },
    line: isDark ? "bg-gray-700" : "bg-gray-200",
    activeLine: {
      incoming: isDark ? "bg-violet-600" : "bg-violet-400",
      global: isDark ? "bg-blue-600" : "bg-blue-400",
      plugin: isDark ? "bg-amber-600" : "bg-amber-400",
      credential: isDark ? "bg-emerald-600" : "bg-emerald-400"
    },
    deny: {
      text: isDark ? "text-red-400" : "text-red-500",
      line: isDark ? "border-red-700" : "border-red-300",
      icon: isDark ? "text-red-400" : "text-red-500"
    },
    allow: {
      text: isDark ? "text-green-400" : "text-green-500",
      icon: isDark ? "text-green-400" : "text-green-500"
    },
    fastPath: {
      textBg: isDark ? "bg-red-900/20" : "bg-red-50"
    }
  }
  
  return (
    <div className="w-full p-2 relative">
      {/* Title */}
      <div className="text-center mb-4">
        <h3 className={`text-base font-semibold ${colors.text.title}`}>Policy Evaluation Flow</h3>
        <p className={`text-sm ${colors.text.description}`}>How credential requests are processed</p>
      </div>

      {/* Incoming Request */}
      <div className="relative flex flex-col items-center z-10">
        <div 
          className={`${colors.cardBg.incoming} rounded-lg p-3 border ${colors.cardBorder.incoming} shadow-sm w-full transition-all duration-300 ${hoveredSection === 'incoming' ? 'shadow-md scale-[1.02]' : ''}`}
          onMouseEnter={() => setHoveredSection('incoming')}
          onMouseLeave={() => setHoveredSection(null)}
        >
          <div className="flex items-center">
            <div className={`flex-shrink-0 ${colors.iconRingBg.incoming} p-2 rounded-full`}>
              <div className={`${colors.iconBg.incoming} rounded-full p-1 transition-transform duration-500 ${hoveredSection === 'incoming' ? 'animate-pulse' : ''}`}>
                <ArrowDownIcon className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="ml-3">
              <h4 className={`text-sm font-medium ${colors.text.heading}`}>Incoming Request</h4>
              <p className={`text-xs ${colors.text.subheading}`}>Application requests credential access</p>
            </div>
          </div>
        </div>

        {/* Animated Connection Line */}
        <div className={`relative w-[2px] h-8 ${colors.line} my-1 z-10`}>
          <div className={`absolute top-0 left-0 w-full ${colors.activeLine.incoming} transition-all duration-700 ease-in-out ${hoveredSection === 'incoming' ? 'h-full' : 'h-0'}`}></div>
        </div>
        
        {/* Global Policies */}
        <div 
          className={`group relative w-full transition-all duration-300 ${hoveredSection === 'global' ? 'shadow-md scale-[1.02]' : ''} z-10`}
          onMouseEnter={() => setHoveredSection('global')}
          onMouseLeave={() => setHoveredSection(null)}
        >
          <div className={`${colors.cardBg.global} rounded-lg p-3 border ${colors.cardBorder.global} shadow-sm w-full`}>
            <div className="flex items-center">
              <div className={`flex-shrink-0 ${colors.iconRingBg.global} p-2 rounded-full`}>
                <div className={`${colors.iconBg.global} rounded-full p-1 transition-all duration-300 ${hoveredSection === 'global' ? 'animate-pulse' : ''}`}>
                  <GlobeIcon className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="ml-3">
                <h4 className={`text-sm font-medium ${colors.text.heading}`}>Global Policies</h4>
                <p className={`text-xs ${colors.text.subheading}`}>Apply to all requests regardless of target</p>
              </div>
            </div>
          </div>
          
          {/* Deny Path from Global - Always visible but highlighted on hover */}
          <div className={`absolute right-0 -bottom-5 transition-opacity duration-300 ${hoveredSection === 'global' ? 'opacity-100' : 'opacity-40'}`}>
            <div className="flex items-center">
              <p className={`text-xs ${colors.deny.text} italic`}>Deny</p>
              <div className={`w-8 h-px bg-transparent ml-1 mr-1 border-t border-dashed ${colors.deny.line}`}></div>
              <XCircleIcon className={`h-4 w-4 ${colors.deny.icon} ${hoveredSection === 'global' ? 'animate-pulse' : ''}`} />
            </div>
          </div>
        </div>

        {/* Animated Connection Line */}
        <div className={`relative w-[2px] h-8 ${colors.line} my-1 z-10`}>
          <div className={`absolute top-0 left-0 w-full ${colors.activeLine.global} transition-all duration-700 ease-in-out ${hoveredSection === 'global' ? 'h-full' : 'h-0'}`}></div>
        </div>
        
        {/* Plugin Policies */}
        <div 
          className={`group relative w-full transition-all duration-300 ${hoveredSection === 'plugin' ? 'shadow-md scale-[1.02]' : ''} z-10`}
          onMouseEnter={() => setHoveredSection('plugin')}
          onMouseLeave={() => setHoveredSection(null)}
        >
          <div className={`${colors.cardBg.plugin} rounded-lg p-3 border ${colors.cardBorder.plugin} shadow-sm w-full`}>
            <div className="flex items-center">
              <div className={`flex-shrink-0 ${colors.iconRingBg.plugin} p-2 rounded-full`}>
                <div className={`${colors.iconBg.plugin} rounded-full p-1 transition-all duration-300 ${hoveredSection === 'plugin' ? 'animate-pulse' : ''}`}>
                  <PlugIcon className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="ml-3">
                <h4 className={`text-sm font-medium ${colors.text.heading}`}>Plugin Policies</h4>
                <p className={`text-xs ${colors.text.subheading}`}>Apply to specific plugin requests</p>
              </div>
            </div>
          </div>
          
          {/* Deny Path from Plugin - Always visible but highlighted on hover */}
          <div className={`absolute right-0 -bottom-5 transition-opacity duration-300 ${hoveredSection === 'plugin' ? 'opacity-100' : 'opacity-40'}`}>
            <div className="flex items-center">
              <p className={`text-xs ${colors.deny.text} italic`}>Deny</p>
              <div className={`w-8 h-px bg-transparent ml-1 mr-1 border-t border-dashed ${colors.deny.line}`}></div>
              <XCircleIcon className={`h-4 w-4 ${colors.deny.icon} ${hoveredSection === 'plugin' ? 'animate-pulse' : ''}`} />
            </div>
          </div>
        </div>

        {/* Animated Connection Line */}
        <div className={`relative w-[2px] h-8 ${colors.line} my-1 z-10`}>
          <div className={`absolute top-0 left-0 w-full ${colors.activeLine.plugin} transition-all duration-700 ease-in-out ${hoveredSection === 'plugin' ? 'h-full' : 'h-0'}`}></div>
        </div>
        
        {/* Credential Policies */}
        <div 
          className={`group relative w-full transition-all duration-300 ${hoveredSection === 'credential' ? 'shadow-md scale-[1.02]' : ''} z-10`}
          onMouseEnter={() => setHoveredSection('credential')}
          onMouseLeave={() => setHoveredSection(null)}
        >
          <div className={`${colors.cardBg.credential} rounded-lg p-3 border ${colors.cardBorder.credential} shadow-sm w-full`}>
            <div className="flex items-center">
              <div className={`flex-shrink-0 ${colors.iconRingBg.credential} p-2 rounded-full`}>
                <div className={`${colors.iconBg.credential} rounded-full p-1 transition-all duration-300 ${hoveredSection === 'credential' ? 'animate-pulse' : ''}`}>
                  <KeyIcon className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="ml-3">
                <h4 className={`text-sm font-medium ${colors.text.heading}`}>Credential Policies</h4>
                <p className={`text-xs ${colors.text.subheading}`}>Apply to specific credential access</p>
              </div>
            </div>
          </div>
          
          {/* Deny Path from Credential - Always visible but highlighted on hover */}
          <div className={`absolute right-0 -bottom-5 transition-opacity duration-300 ${hoveredSection === 'credential' ? 'opacity-100' : 'opacity-40'}`}>
            <div className="flex items-center">
              <p className={`text-xs ${colors.deny.text} italic`}>Deny</p>
              <div className={`w-8 h-px bg-transparent ml-1 mr-1 border-t border-dashed ${colors.deny.line}`}></div>
              <XCircleIcon className={`h-4 w-4 ${colors.deny.icon} ${hoveredSection === 'credential' ? 'animate-pulse' : ''}`} />
            </div>
          </div>
        </div>

        {/* Animated Connection Line */}
        <div className={`relative w-[2px] h-8 ${colors.line} my-1 z-10`}>
          <div className={`absolute top-0 left-0 w-full ${colors.activeLine.credential} transition-all duration-700 ease-in-out ${hoveredSection === 'credential' ? 'h-full' : 'h-0'}`}></div>
        </div>
        
        {/* Final Decision */}
        <div className="grid grid-cols-2 gap-3 w-full">
          {/* Deny */}
          <div 
            className={`${colors.cardBg.deny} rounded-lg p-3 border ${colors.cardBorder.deny} shadow-sm w-full flex justify-center items-center transform transition-all duration-300 ${hoveredSection === 'deny' ? 'shadow-md scale-[1.05]' : ''} z-10`}
            onMouseEnter={() => setHoveredSection('deny')}
            onMouseLeave={() => setHoveredSection(null)}
          >
            <XCircleIcon className={`h-5 w-5 ${colors.deny.icon} mr-2 ${hoveredSection === 'deny' ? 'animate-pulse' : ''}`} />
            <p className={`text-sm font-medium ${colors.deny.text}`}>Deny Access</p>
          </div>
          
          {/* Allow */}
          <div 
            className={`${colors.cardBg.allow} rounded-lg p-3 border ${colors.cardBorder.allow} shadow-sm w-full flex justify-center items-center transform transition-all duration-300 ${hoveredSection === 'allow' ? 'shadow-md scale-[1.05]' : ''} z-10`}
            onMouseEnter={() => setHoveredSection('allow')}
            onMouseLeave={() => setHoveredSection(null)}
          >
            <CheckCircleIcon className={`h-5 w-5 ${colors.allow.icon} mr-2 ${hoveredSection === 'allow' ? 'animate-pulse' : ''}`} />
            <p className={`text-sm font-medium ${colors.allow.text}`}>Allow Access</p>
          </div>
        </div>
      </div>

      {/* Fast Path Message with animation */}
      <div 
        className={`mt-4 flex items-center text-xs ${colors.deny.text} px-2 py-1 rounded-md transition-all duration-500 ${
          hoveredSection === 'global' || hoveredSection === 'plugin' || hoveredSection === 'credential' 
            ? `opacity-100 ${colors.fastPath.textBg}` 
            : 'opacity-70'
        }`}
      >
        <ShieldIcon className={`h-3 w-3 mr-1 ${hoveredSection === 'global' || hoveredSection === 'plugin' || hoveredSection === 'credential' ? 'animate-pulse' : ''}`} />
        <p className="italic">Any policy denies → immediate rejection</p>
      </div>
    </div>
  )
} 