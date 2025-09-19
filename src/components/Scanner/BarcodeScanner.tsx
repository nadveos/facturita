import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, X } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
  title?: string;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onScan,
  onClose,
  title = 'Escanear Código de Barras'
}) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      {
        fps: 10,
        qrbox: { width: 300, height: 200 },
        supportedScanTypes: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.QR_CODE,
        ],
      },
      false
    );

    scannerRef.current = scanner;

    const handleScanSuccess = (decodedText: string) => {
      onScan(decodedText);
      scanner.clear();
      setIsScanning(false);
    };

    const handleScanError = (error: string) => {
      // Silenciar errores de escaneo continuo
      console.log('Error de escaneo:', error);
    };

    scanner.render(handleScanSuccess, handleScanError);
    setIsScanning(true);

    return () => {
      scanner.clear().catch(console.error);
    };
  }, [onScan]);

  const handleClose = () => {
    if (scannerRef.current && isScanning) {
      scannerRef.current.clear().catch(console.error);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Camera className="w-5 h-5" />
            {title}
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div id="qr-reader" className="w-full"></div>
        
        <div className="mt-4 text-sm text-gray-600 text-center">
          <p>Posiciona el código de barras dentro del marco</p>
          <p>El escaneo se realizará automáticamente</p>
        </div>
      </div>
    </div>
  );
};
