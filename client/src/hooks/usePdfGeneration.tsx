import { useState } from 'react';

import { convertToPdfOnServer, checkServerHealth } from '@/utils/serverPdfGenerator';

import { useToast } from './use-toast';

type PlaceholderData = Record<string, string | boolean | number>;

export const usePdfGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generatePdf = async (file: File, placeholderData: PlaceholderData) => {
    setIsGenerating(true);

    try {
      // Check if server is available
      const serverHealthy = await checkServerHealth();
      if (!serverHealthy) {
        throw new Error('PDF conversion service is not available');
      }

      console.warn('Starting PDF generation for:', file.name);
      console.warn('Placeholder data:', placeholderData);

      // Convert to PDF using server-side LibreOffice
      const pdfBlob = await convertToPdfOnServer(file);

      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${file.name.replace(/\.[^/.]+$/, '')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Success',
        description: 'PDF generated and downloaded successfully!',
      });

      return pdfBlob;
    } catch (error) {
      console.error('PDF generation failed:', error);
      toast({
        title: 'PDF Generation Failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generatePdf,
    isGenerating,
  };
};
