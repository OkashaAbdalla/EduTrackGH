/**
 * Simple right-click context menu (fixed position).
 */

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const MENU_MIN_W = 140;
const ITEM_H = 36;
const PAD = 8;

/**
 * @param {object} props
 * @param {number} props.x
 * @param {number} props.y
 * @param {Array<{ id: string, label: string, onClick: () => void, danger?: boolean }>} props.items
 * @param {() => void} props.onClose
 */
const ContextMenu = ({ x, y, items, onClose }) => {
  const ref = useRef(null);

  useEffect(() => {
    const onMouseDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    const onScroll = () => onClose();

    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [onClose]);

  const menuH = items.length * ITEM_H + PAD;
  const maxX = typeof window !== 'undefined' ? window.innerWidth - MENU_MIN_W - PAD : x;
  const maxY = typeof window !== 'undefined' ? window.innerHeight - menuH - PAD : y;
  const safeX = Math.max(PAD, Math.min(x, maxX));
  const safeY = Math.max(PAD, Math.min(y, maxY));

  const menu = (
    <div
      ref={ref}
      className="fixed z-[9999] min-w-[140px] rounded-lg border border-[color:var(--glass-border)] bg-[color:var(--bg-elevated)] py-1 shadow-xl"
      style={{ left: safeX, top: safeY }}
      role="menu"
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="menuitem"
          onClick={() => {
            onClose();
            item.onClick();
          }}
          className={`block w-full px-4 py-2 text-left text-sm transition hover:bg-[color:var(--glass)] ${
            item.danger
              ? 'text-red-600 dark:text-red-400'
              : 'text-[color:var(--text-primary)]'
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );

  return createPortal(menu, document.body);
};

export default ContextMenu;
