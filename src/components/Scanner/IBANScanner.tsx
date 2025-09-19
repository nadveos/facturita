import React, { useState } from 'react';
import { BarcodeScanner } from './BarcodeScanner';
import { CreditCard, Scan } from 'lucide-react';

interface IBANScannerProps {
  onIBANDetected: (iban: string) => void;
}

export const IBANScanner: React.FC<IBANScannerProps> = ({ onIBANDetected }) => {
  const [isScanning, setIsScanning] = useState(false);

  const validateIBAN = (code: string): string | null => {
    // Remover espacios y convertir a mayúsculas
    const cleanCode = code.replace(/\s/g, '').toUpperCase();
    
    // Verificar formato básico de IBAN
    const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{4,30}$/;
    
    if (ibanRegex.test(cleanCode)) {
      return cleanCode;
    }
    
    return null;
  };

  const handleScan = (code: string) => {
    const validIBAN = validateIBAN(code);
    if (validIBAN) {
      onIBANDetected(validIBAN);
      setIsScanning(false);
    } else {
      alert('Código IBAN no válido. Inténtalo de nuevo.');
    }
  };

  return (
    <>
      <button
        onClick={() => setIsScanning(true)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Scan className="w-4 h-4" />
        Escanear IBAN
      </button>

      {isScanning && (
        <BarcodeScanner
          onScan={handleScan}
          onClose={() => setIsScanning(false)}
          title="Escanear Código IBAN"
        />
      )}
    </>
  );
};
