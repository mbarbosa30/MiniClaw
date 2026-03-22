import { motion } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';
import { useTheme } from '@/lib/theme';

export function MarketplaceView() {
  const t = useTheme();

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: t.bg,
        transition: 'background 0.3s ease',
        minHeight: 0,
      }}
    >
      <div
        className="flex-1 overflow-y-auto no-scrollbar"
        style={{ padding: '40px 32px 40px' }}
      >
        <p
          style={{
            fontSize: 22,
            fontWeight: 200,
            letterSpacing: '-0.03em',
            color: t.text,
            lineHeight: 1,
            marginBottom: 48,
          }}
        >
          Marketplace
        </p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            paddingTop: 32,
            gap: 20,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: t.surface,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ShoppingBag size={24} strokeWidth={1.25} color={t.faint} />
          </div>

          <div>
            <p
              style={{
                fontSize: 16,
                fontWeight: 300,
                color: t.text,
                letterSpacing: '-0.015em',
                lineHeight: 1.3,
                marginBottom: 10,
              }}
            >
              Opening soon
            </p>
            <p
              style={{
                fontSize: 12,
                fontWeight: 300,
                color: t.faint,
                lineHeight: 1.65,
                maxWidth: 240,
              }}
            >
              Browse and hire specialised agent services, place orders, and manage your agent ecosystem — all in one place.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
