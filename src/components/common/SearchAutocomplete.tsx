import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, Building2, MapPin, Tag, Compass, ArrowRight, Clock } from 'lucide-react';

export interface AutocompleteSuggestion {
  id: string;
  title: string;
  subtitle?: string;
  category: 'empresa' | 'bairro' | 'nicho' | 'endereco' | 'recente' | 'acao';
  badge?: string;
  payload?: any;
}

interface SearchAutocompleteProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onSelect?: (suggestion: AutocompleteSuggestion) => void;
  suggestions?: AutocompleteSuggestion[];
  getSuggestions?: (query: string) => AutocompleteSuggestion[];
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  autoFocus?: boolean;
  onClear?: () => void;
  onKeyDownEnter?: (value: string) => void;
  disabled?: boolean;
  minCharsToShow?: number;
  showCategoryHeaders?: boolean;
}

const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  empresa: {
    label: 'Empresas & Negócios',
    icon: <Building2 className="w-3.5 h-3.5 text-sky-400" />,
    color: 'bg-sky-500/10 text-sky-300 border-sky-400/20',
  },
  bairro: {
    label: 'Bairros & Regiões',
    icon: <MapPin className="w-3.5 h-3.5 text-indigo-400" />,
    color: 'bg-indigo-500/10 text-indigo-300 border-indigo-400/20',
  },
  nicho: {
    label: 'Nichos & Categorias',
    icon: <Tag className="w-3.5 h-3.5 text-emerald-400" />,
    color: 'bg-emerald-500/10 text-emerald-300 border-emerald-400/20',
  },
  endereco: {
    label: 'Endereços & Ruas',
    icon: <Compass className="w-3.5 h-3.5 text-amber-400" />,
    color: 'bg-amber-500/10 text-amber-300 border-amber-400/20',
  },
  recente: {
    label: 'Buscas Populares',
    icon: <Clock className="w-3.5 h-3.5 text-purple-400" />,
    color: 'bg-purple-500/10 text-purple-300 border-purple-400/20',
  },
  acao: {
    label: 'Ações Rápidas',
    icon: <ArrowRight className="w-3.5 h-3.5 text-pink-400" />,
    color: 'bg-pink-500/10 text-pink-300 border-pink-400/20',
  },
};

export const SearchAutocomplete: React.FC<SearchAutocompleteProps> = ({
  id,
  value,
  onChange,
  onSelect,
  suggestions = [],
  getSuggestions,
  placeholder = 'Buscar...',
  className = '',
  inputClassName = '',
  autoFocus = false,
  onClear,
  onKeyDownEnter,
  disabled = false,
  minCharsToShow = 1,
  showCategoryHeaders = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Compute active suggestions
  const activeSuggestions = useMemo(() => {
    if (getSuggestions) {
      return getSuggestions(value);
    }
    if (!value.trim()) {
      return suggestions.slice(0, 6);
    }
    const query = value.toLowerCase().trim();
    return suggestions
      .filter(s => 
        s.title.toLowerCase().includes(query) || 
        (s.subtitle && s.subtitle.toLowerCase().includes(query)) ||
        (s.badge && s.badge.toLowerCase().includes(query))
      )
      .slice(0, 8);
  }, [value, suggestions, getSuggestions]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset highlight on query change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [value]);

  const handleSelect = (item: AutocompleteSuggestion) => {
    onChange(item.title);
    if (onSelect) {
      onSelect(item);
    }
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(0);
      } else {
        setHighlightedIndex(prev => (prev < activeSuggestions.length - 1 ? prev + 1 : 0));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(activeSuggestions.length - 1);
      } else {
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : activeSuggestions.length - 1));
      }
    } else if (e.key === 'Enter') {
      if (isOpen && highlightedIndex >= 0 && activeSuggestions[highlightedIndex]) {
        e.preventDefault();
        handleSelect(activeSuggestions[highlightedIndex]);
      } else if (onKeyDownEnter) {
        e.preventDefault();
        onKeyDownEnter(value);
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      if (isOpen) {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange('');
    if (onClear) {
      onClear();
    }
    inputRef.current?.focus();
  };

  // Helper to highlight matched query in string
  const renderHighlightedText = (text: string, query: string) => {
    if (!query.trim()) return <span>{text}</span>;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className="bg-sky-500/30 text-sky-200 font-bold px-0.5 rounded">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  const shouldShowDropdown = isOpen && (value.trim().length >= minCharsToShow || activeSuggestions.length > 0);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative flex items-center">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none shrink-0" />
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (activeSuggestions.length > 0) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          disabled={disabled}
          autoComplete="off"
          spellCheck={false}
          className={`w-full glass-input text-xs text-white pl-8 pr-8 py-2.5 rounded-xl border border-white/15 focus:outline-none focus:border-sky-400 placeholder:text-slate-500 transition-colors ${inputClassName}`}
        />

        {value && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Limpar campo"
            className="absolute right-2 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 hover:text-white bg-white/10 hover:bg-white/20 rounded transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {shouldShowDropdown && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150 max-h-72 overflow-y-auto divide-y divide-white/5">
          {activeSuggestions.length > 0 ? (
            <div className="p-1.5 space-y-0.5">
              {activeSuggestions.map((item, idx) => {
                const isHighlighted = idx === highlightedIndex;
                const catInfo = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.empresa;

                return (
                  <button
                    key={item.id || `${item.category}-${idx}`}
                    type="button"
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between gap-2.5 transition-all ${
                      isHighlighted 
                        ? 'bg-sky-500/20 text-white border border-sky-400/30' 
                        : 'text-slate-200 hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1 rounded-lg bg-white/5 shrink-0">
                        {catInfo.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-100 truncate">
                          {renderHighlightedText(item.title, value)}
                        </div>
                        {item.subtitle && (
                          <div className="text-[10px] text-slate-400 truncate mt-0.5">
                            {item.subtitle}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${catInfo.color}`}>
                        {item.badge || catInfo.label.split(' ')[0]}
                      </span>
                      <ArrowRight className={`w-3 h-3 text-slate-500 transition-transform ${isHighlighted ? 'translate-x-0.5 text-sky-400' : ''}`} />
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-4 text-center text-xs text-slate-400">
              <span>Nenhuma sugestão para "<strong>{value}</strong>"</span>
              <p className="text-[10px] text-slate-500 mt-0.5">Pressione Enter para buscar no radar de leads</p>
            </div>
          )}

          {/* Helper footer */}
          <div className="px-3 py-1.5 bg-slate-950/60 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span>↑↓ navegar</span>
            <span>↵ selecionar</span>
            <span>ESC fechar</span>
          </div>
        </div>
      )}
    </div>
  );
};
