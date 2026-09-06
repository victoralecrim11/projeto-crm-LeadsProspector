import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  tag?: string;
  tagColor?: string;
}

interface ResponsiveSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  dropdownClassName?: string;
  disabled?: boolean;
}

export const ResponsiveSelect: React.FC<ResponsiveSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Selecione...',
  className = '',
  buttonClassName = '',
  dropdownClassName = '',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const updatePosition = () => {
      if (isOpen && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        // Check if there is enough space below, otherwise render above
        const spaceBelow = window.innerHeight - rect.bottom;
        const dropdownHeight = 240; // Max height approximately 60 * 4
        
        let top: number | string = rect.bottom + 4;
        let bottom: number | string = 'auto';
        
        if (spaceBelow < dropdownHeight && rect.top > spaceBelow) {
          // Render above
          top = 'auto';
          bottom = window.innerHeight - rect.top + 4;
        }

        const calculatedLeft = Math.max(8, Math.min(rect.left, window.innerWidth - rect.width - 8));
        const calculatedWidth = Math.min(window.innerWidth - 16, Math.max(rect.width, 180));

        setDropdownStyle({
          position: 'fixed',
          top,
          bottom,
          left: calculatedLeft,
          width: calculatedWidth,
          zIndex: 999999, // Ensure it's above everything
        });
      }
    };

    if (isOpen) {
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
    }

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Allow clicking inside the portal
      const target = event.target as Node;
      if (
        containerRef.current && 
        !containerRef.current.contains(target) &&
        !(target as HTMLElement).closest('[data-select-dropdown]')
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className={`relative min-w-0 ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs bg-slate-900/80 border border-white/15 rounded-xl text-white transition-all text-left focus:outline-none ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-sky-400/50 cursor-pointer'
        } ${isOpen ? 'border-sky-400 ring-1 ring-sky-400/20' : ''} ${buttonClassName}`}
      >
        <div className="flex items-center gap-2 min-w-0 truncate">
          {selectedOption ? (
            <>
              <span className="truncate font-medium">{selectedOption.label}</span>
              {selectedOption.tag && (
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded-md border font-semibold shrink-0 ${
                    selectedOption.tagColor || 'text-sky-400 bg-sky-500/15 border-sky-500/30'
                  }`}
                >
                  {selectedOption.tag}
                </span>
              )}
            </>
          ) : (
            <span className="text-slate-400 truncate">{placeholder}</span>
          )}
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-sky-400' : ''
          }`}
        />
      </button>

      {isOpen &&
        createPortal(
          <>
            {/* Mobile backdrop for quick dismiss without interfering with taps */}
            <div
              className="fixed inset-0 z-[99998] sm:hidden"
              onClick={() => setIsOpen(false)}
            />
            <div
              data-select-dropdown="true"
              style={dropdownStyle}
              className={`max-h-52 sm:max-h-60 overflow-y-auto bg-slate-900/98 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl p-1.5 space-y-0.5 scrollbar-thin scrollbar-thumb-white/20 ${dropdownClassName}`}
            >
              {options.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs text-slate-400">
                  Nenhuma opção disponível
                </div>
              ) : (
                options.map((option) => {
                  const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition-all text-left ${
                      isSelected
                        ? 'bg-sky-500/20 text-sky-300 font-semibold border border-sky-500/30'
                        : 'text-slate-200 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <span className="truncate">{option.label}</span>
                      {option.tag && (
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded border font-medium shrink-0 ${
                            option.tagColor || 'text-sky-400 bg-sky-500/15 border-sky-500/30'
                          }`}
                        >
                          {option.tag}
                        </span>
                      )}
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-sky-400 shrink-0 ml-1" />}
                  </button>
                );
              }))}
            </div>
          </>,
          document.body
        )}
    </div>
  );
};
