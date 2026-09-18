import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react';
import { Search, X } from 'lucide-react';
import { fetchSuggestions } from '@/lib/api';

type SearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
  onSearch: (query: string) => void;
  size?: 'lg' | 'sm';
  autoFocus?: boolean;
  actions?: ReactNode;
};

export default function SearchField({
  value,
  onChange,
  onSearch,
  size = 'sm',
  autoFocus = false,
  actions,
}: SearchFieldProps) {
  const [suggests, setSuggests] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!value.trim()) {
      abortRef.current?.abort();
      setSuggests([]);
      setOpen(false);
      return;
    }
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      fetchSuggestions(value.trim(), controller.signal)
        .then((items) => {
          setSuggests(items);
          setOpen(true);
          setActive(-1);
        })
        .catch(() => {
          setSuggests([]);
        });
    }, 170);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [value]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  function submit(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setOpen(false);
    setActive(-1);
    onSearch(trimmed);
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!open && suggests.length > 0) {
        setOpen(true);
        setActive(0);
      } else if (open) {
        setActive((i) => (i + 1) % suggests.length);
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (open) setActive((i) => (i <= 0 ? -1 : i - 1));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (open && active >= 0 && suggests[active]) {
        onChange(suggests[active]);
        submit(suggests[active]);
      } else {
        submit(value);
      }
    } else if (event.key === 'Escape') {
      setOpen(false);
      setActive(-1);
    }
  }

  return (
    <form
      className={size === 'lg' ? 'search-field field-lg' : 'search-field field-sm'}
      onSubmit={(event) => {
        event.preventDefault();
        submit(value);
      }}
    >
      <div className="field-row">
        <Search className="field-icon" size={size === 'lg' ? 21 : 17} strokeWidth={2.6} />
        <input
          ref={inputRef}
          value={value}
          autoFocus={autoFocus}
          onChange={(event) => {
            onChange(event.target.value);
            setActive(-1);
          }}
          onFocus={() => {
            if (suggests.length > 0) setOpen(true);
          }}
          onBlur={() => window.setTimeout(() => setOpen(false), 140)}
          onKeyDown={handleKeyDown}
          placeholder={size === 'lg' ? 'Search the web without being tracked' : 'Search the web'}
          aria-label="Search"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-controls="pipi-suggestions"
          aria-activedescendant={active >= 0 ? `sug-${active}` : undefined}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
        />
        {value && (
          <button
            type="button"
            className="field-clear"
            aria-label="Clear search"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              onChange('');
              setOpen(false);
              setActive(-1);
              inputRef.current?.focus();
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {actions && <div className="field-actions">{actions}</div>}

      {open && suggests.length > 0 && (
        <ul id="pipi-suggestions" className="suggestion-list" role="listbox" aria-label="Suggestions">
          {suggests.map((suggestion, index) => (
            <li
              key={`${suggestion}-${index}`}
              id={`sug-${index}`}
              role="option"
              aria-selected={active === index}
              className={active === index ? 'suggestion active' : 'suggestion'}
              onMouseDown={(event) => {
                event.preventDefault();
                onChange(suggestion);
                submit(suggestion);
              }}
            >
              <Search size={14} className="suggest-icon" />
              <span>{suggestion}</span>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}