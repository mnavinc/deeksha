import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import QRCode from 'qrcode';

interface QrCodeSvgProps {
  value: string;
  size?: number;
  fgColor?: string;
  bgColor?: string;
}

export const QrCodeSvg = React.memo(function QrCodeSvg({
  value,
  size = 176,
  fgColor = '#0D1117',
  bgColor = '#FFFFFF',
}: QrCodeSvgProps) {
  const { modules, count } = useMemo(() => {
    const qr = QRCode.create(value || 'https://deeksha-sigma.vercel.app', {
      errorCorrectionLevel: 'M',
    });
    const moduleCount = qr.modules.size;
    const cells: Array<{ x: number; y: number }> = [];
    for (let r = 0; r < moduleCount; r++) {
      for (let c = 0; c < moduleCount; c++) {
        if (qr.modules.get(r, c)) {
          cells.push({ x: c, y: r });
        }
      }
    }
    return { modules: cells, count: moduleCount };
  }, [value]);

  const quietZone = 2;
  const viewBoxSize = count + quietZone * 2;

  return (
    <View style={[styles.wrap, { width: size, height: size, backgroundColor: bgColor }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}>
        <Rect x={0} y={0} width={viewBoxSize} height={viewBoxSize} fill={bgColor} />
        {modules.map((cell, idx) => (
          <Rect
            key={idx}
            x={cell.x + quietZone}
            y={cell.y + quietZone}
            width={1.02}
            height={1.02}
            fill={fgColor}
          />
        ))}
      </Svg>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 14,
    overflow: 'hidden',
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

