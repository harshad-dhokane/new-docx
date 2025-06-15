import { ArrowLeft, FileText, Download, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';

import CompactFieldTypeSelector from '@/components/form/CompactFieldTypeSelector';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useTemplates } from '@/hooks/useTemplates';
import { generateEnhancedPDF } from '@/utils/enhancedPdfGenerator';

type _JsonValue = string | number | boolean | null | _JsonValue[] | { [key: string]: _JsonValue };

const TemplateGenerator = () => {
  const [_match, params] = useRoute('/templates/:templateId/generate');
  const [, setLocation] = useLocation();
  const templateId = params?.templateId;
  const { templates } = useTemplates();
  const { user } = useAuth();
  const { toast } = useToast();
  const [placeholderData, setPlaceholderData] = useState<Record<string, string>>({});
  const [pdfName, setPdfName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [downloadSuccess, setDownloadSuccess] = useState<Record<string, boolean>>({});
  const [generatingFormat, setGeneratingFormat] = useState<'pdf' | 'docx' | 'xlsx' | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const template = templates.find(t => t.id === templateId);

  useEffect(() => {
    if (templates.length > 0) {
      setIsLoading(false);
    }
  }, [templates]);

  useEffect(() => {
    if (template) {
      const initialData: Record<string, string> = {};
      const placeholders = Array.isArray(template.placeholders) ? template.placeholders : [];
      placeholders.forEach(placeholder => {
        if (typeof placeholder === 'string') {
          initialData[placeholder] = '';
        }
      });
      setPlaceholderData(initialData);
    }
  }, [template]);

  const handleGenerateDocument = async (format: 'pdf' | 'docx' | 'xlsx') => {
    if (!template || !user?.id || !templateId) return;
    setGeneratingFormat(format);
    setGenerationError(null);

    try {
      console.warn('Starting document generation...', {
        format,
        templateId,
        placeholderCount: Object.keys(placeholderData).length,
      });

      // Convert Json placeholders to string array
      const placeholders = Array.isArray(template.placeholders)
        ? template.placeholders.filter((p): p is string => typeof p === 'string')
        : [];

      await generateEnhancedPDF({
        templateId: templateId,
        templateName: template.name,
        placeholderData,
        placeholders,
        format,
        userId: user.id,
      });

      setDownloadSuccess({ [format]: true }); // Only set success for this specific format
      toast({
        title: 'Success',
        description: `Your ${format.toUpperCase()} document has been generated and downloaded successfully.`,
      });

      // Reset success state after 3 seconds
      setTimeout(() => {
        setDownloadSuccess({});
      }, 3000);
    } catch (error) {
      console.error('Generation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate document';
      setGenerationError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setGeneratingFormat(null);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setPlaceholderData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Check if all required fields are filled
  const templatePlaceholders = Array.isArray(template?.placeholders) ? template.placeholders : [];
  const hasRequiredData = templatePlaceholders.some(
    (placeholder): placeholder is string =>
      typeof placeholder === 'string' && Boolean(placeholderData[placeholder]?.trim())
  );

  const isGenerating = generatingFormat !== null;

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 max-w-7xl">
        <Button variant="ghost" onClick={() => setLocation('/templates')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Templates
        </Button>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : template ? (
          <div className="space-y-6">
            {/* Document Name and Download Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Generate Document: {template.name}
                </CardTitle>
                <CardDescription>
                  Enter document name and choose your preferred format
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Document Name Input */}
                <div className="space-y-2">
                  <Label htmlFor="pdfName" className="text-sm font-medium">
                    Document Name
                  </Label>
                  <Input
                    id="pdfName"
                    value={pdfName}
                    onChange={e => setPdfName(e.target.value)}
                    placeholder="Enter document name"
                    className="h-11"
                  />
                </div>

                {/* Error Display */}
                {generationError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{generationError}</AlertDescription>
                  </Alert>
                )}

                {/* Download Buttons */}
                <div className="flex flex-wrap gap-3">
                  {template.name.endsWith('.xlsx') ? (
                    <>
                      <Button
                        onClick={() => handleGenerateDocument('xlsx')}
                        disabled={isGenerating || !hasRequiredData}
                        size="lg"
                        className="min-w-[160px]"
                      >
                        {generatingFormat === 'xlsx' ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : downloadSuccess.xlsx ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Downloaded!
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Generate Excel
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => handleGenerateDocument('pdf')}
                        disabled={isGenerating || !hasRequiredData}
                        size="lg"
                        variant="secondary"
                        className="min-w-[160px]"
                      >
                        {generatingFormat === 'pdf' ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : downloadSuccess.pdf ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Downloaded!
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Generate PDF
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={() => handleGenerateDocument('docx')}
                        disabled={isGenerating || !hasRequiredData}
                        size="lg"
                        variant="default"
                        className="min-w-[160px]"
                      >
                        {generatingFormat === 'docx' ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : downloadSuccess.docx ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Downloaded!
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Generate DOCX
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => handleGenerateDocument('pdf')}
                        disabled={isGenerating || !hasRequiredData}
                        size="lg"
                        variant="secondary"
                        className="min-w-[160px]"
                      >
                        {generatingFormat === 'pdf' ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : downloadSuccess.pdf ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Downloaded!
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Generate PDF
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </div>

                {!hasRequiredData && (
                  <p className="text-sm text-muted-foreground">
                    Please fill in at least one field to generate the document.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Form Fields Section */}
            <Card>
              <CardHeader>
                <CardTitle>Document Fields</CardTitle>
                <CardDescription>
                  Fill in the fields below to populate your document ({templatePlaceholders.length}{' '}
                  fields)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {templatePlaceholders.map(placeholder => {
                    if (typeof placeholder === 'string') {
                      return (
                        <CompactFieldTypeSelector
                          key={placeholder}
                          placeholder={placeholder}
                          value={placeholderData[placeholder] || ''}
                          onChange={value => handleInputChange(placeholder, value)}
                        />
                      );
                    }
                    return null;
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Template not found.</AlertDescription>
          </Alert>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TemplateGenerator;
