/**
 * MrInput / MrTextArea
 * Ant Design Form.Item-compatible wrappers that enable Google Transliteration
 * (phonetic English → Marathi) for all Marathi text fields.
 *
 * Uses: https://inputtools.google.com (same backend as Google's "Type in Marathi")
 * Library: react-transliterate (language code: "mr")
 *
 * Usage in Form.Item — identical to <Input>:
 *   <Form.Item name="nameMr" label="नाव">
 *     <MrInput placeholder="नाव टाइप करा..." />
 *   </Form.Item>
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Input } from 'antd';
import type { InputRef } from 'antd';
import 'react-transliterate/dist/index.css';

const LANG = 'mr';
const API  = 'https://inputtools.google.com/request';
const MAX_SUGGESTIONS = 6;

async function fetchSuggestions(text: string): Promise<string[]> {
  if (!text) return [];
  const word = text.split(' ').pop() || '';
  if (!word) return [];
  try {
    const url = `${API}?text=${encodeURIComponent(word)}&itc=${LANG}-t-i0-und&num=${MAX_SUGGESTIONS}&cp=0&cs=1&ie=utf-8&oe=utf-8`;
    const res  = await fetch(url);
    const json = await res.json();
    if (json[0] === 'SUCCESS' && json[1]?.[0]?.[1]) {
      return json[1][0][1] as string[];
    }
  } catch {
    // Network error or API unavailable — silently degrade
  }
  return [];
}

// ── Shared suggestion dropdown ────────────────────────────────────────────────

interface SuggestionsProps {
  items: string[];
  selected: number;
  onPick: (s: string) => void;
  anchorRef: React.RefObject<HTMLElement | null>;
}

const Suggestions: React.FC<SuggestionsProps> = ({ items, selected, onPick, anchorRef }) => {
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    const el = anchorRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({ top: r.bottom + window.scrollY + 4, left: r.left + window.scrollX, width: r.width });
  }, [items, anchorRef]);

  if (!items.length) return null;

  return (
    <ul
      style={{
        position: 'absolute',
        top: pos.top,
        left: pos.left,
        minWidth: pos.width,
        zIndex: 9999,
        background: '#fff',
        border: '1px solid #d9d9d9',
        borderRadius: 6,
        boxShadow: '0 4px 12px rgba(0,0,0,.12)',
        margin: 0,
        padding: '4px 0',
        listStyle: 'none',
        fontSize: 14,
      }}
    >
      {items.map((s, i) => (
        <li
          key={s}
          onMouseDown={(e) => { e.preventDefault(); onPick(s); }}
          style={{
            padding: '5px 12px',
            cursor: 'pointer',
            background: i === selected ? '#e6f4ff' : 'transparent',
            color: '#000',
          }}
        >
          {s}
        </li>
      ))}
    </ul>
  );
};

// ── Hook: shared transliteration logic ───────────────────────────────────────

function useTransliterate(
  value: string,
  onChange: ((val: string) => void) | undefined,
) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selIdx, setSelIdx]           = useState(0);
  const timerRef                      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showRef                       = useRef(false);

  const fetchAndShow = useCallback((text: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      const s = await fetchSuggestions(text);
      setSuggestions(s);
      setSelIdx(0);
      showRef.current = s.length > 0;
    }, 200);
  }, []);

  const pickSuggestion = useCallback((suggestion: string) => {
    const parts = value.split(' ');
    parts[parts.length - 1] = suggestion;
    onChange?.(parts.join(' ') + ' ');
    setSuggestions([]);
    showRef.current = false;
  }, [value, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!suggestions.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelIdx(i => Math.min(i + 1, suggestions.length - 1)); }
    else if (e.key === 'ArrowUp')  { e.preventDefault(); setSelIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' || e.key === 'Tab') {
      if (suggestions[selIdx]) { e.preventDefault(); pickSuggestion(suggestions[selIdx]); }
    } else if (e.key === 'Escape') { setSuggestions([]); }
  }, [suggestions, selIdx, pickSuggestion]);

  const handleChange = useCallback((text: string) => {
    onChange?.(text);
    const lastWord = text.split(' ').pop() || '';
    if (lastWord) fetchAndShow(text);
    else setSuggestions([]);
  }, [onChange, fetchAndShow]);

  const dismiss = useCallback(() => {
    setTimeout(() => { setSuggestions([]); }, 150);
  }, []);

  return { suggestions, selIdx, pickSuggestion, handleKeyDown, handleChange, dismiss };
}

// ── MrInput — single-line ────────────────────────────────────────────────────

interface MrInputProps {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement> | string) => void;
  placeholder?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
  className?: string;
  size?: 'small' | 'middle' | 'large';
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  allowClear?: boolean;
  maxLength?: number;
}

export const MrInput: React.FC<MrInputProps> = ({
  value = '',
  onChange,
  ...rest
}) => {
  const inputRef = useRef<InputRef>(null);

  // Ant Design Form.Item passes onChange(e) with e.target.value
  // but we work with plain string internally
  const emit = useCallback((text: string) => {
    // Emit both synthetic-event-like and plain-string forms
    // Form.Item only needs the synthetic event shape
    const fakeEvent = { target: { value: text } } as React.ChangeEvent<HTMLInputElement>;
    (onChange as any)?.(fakeEvent);
  }, [onChange]);

  const { suggestions, selIdx, pickSuggestion, handleKeyDown, handleChange, dismiss } =
    useTransliterate(value, emit);

  const anchorRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    anchorRef.current = inputRef.current?.input ?? null;
  });

  return (
    <>
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={dismiss}
        {...rest}
      />
      <Suggestions
        items={suggestions}
        selected={selIdx}
        onPick={pickSuggestion}
        anchorRef={anchorRef}
      />
    </>
  );
};

// ── MrTextArea — multi-line ──────────────────────────────────────────────────

interface MrTextAreaProps {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
  rows?: number;
  maxLength?: number;
}

export const MrTextArea: React.FC<MrTextAreaProps> = ({
  value = '',
  onChange,
  ...rest
}) => {
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const antdRef     = useRef<{ resizableTextArea?: { textArea?: HTMLTextAreaElement } } | null>(null);

  const emit = useCallback((text: string) => {
    const fakeEvent = { target: { value: text } } as React.ChangeEvent<HTMLTextAreaElement>;
    onChange?.(fakeEvent);
  }, [onChange]);

  const { suggestions, selIdx, pickSuggestion, handleKeyDown, handleChange, dismiss } =
    useTransliterate(value, emit);

  const anchorRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    // Ant Design TextArea wraps the DOM textarea inside a ref chain
    const ta = (antdRef.current as any)?.resizableTextArea?.textArea;
    if (ta) { textAreaRef.current = ta; anchorRef.current = ta; }
  });

  return (
    <>
      <Input.TextArea
        ref={antdRef as any}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown as any}
        onBlur={dismiss}
        {...rest}
      />
      <Suggestions
        items={suggestions}
        selected={selIdx}
        onPick={pickSuggestion}
        anchorRef={anchorRef}
      />
    </>
  );
};

export default MrInput;
