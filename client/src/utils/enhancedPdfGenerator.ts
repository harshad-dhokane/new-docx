import { Buffer } from 'buffer';
import { Workbook } from 'exceljs';
import { TemplateHandler, MimeType, TemplateData } from 'easy-template-x';
import { supabase } from '@/integrations/supabase/client';

// We define the handleExcel function as a placeholder since it's imported in development
// TODO: Create and implement excelGenerator.ts
const handleExcel = async (templateBuffer: ArrayBuffer, data: Record<string, unknown>): Promise<Blob> => {
  console.warn('Starting Excel processing...');
  console.warn('Placeholder data received:', data);
  
  try {
    // Load the template workbook
    const workbook = new Workbook();
    await workbook.xlsx.load(templateBuffer);
    
    // Get the first worksheet
    const worksheet = workbook.worksheets[0];
    
    // Replace placeholders in the worksheet
    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        // Handle different cell value types
        let cellValue = '';
        if (typeof cell.value === 'object' && cell.value !== null) {
          if ('richText' in cell.value) {
            // Handle rich text
            cellValue = (cell.value.richText || [])
              .map((item: any) => item.text)
              .join('');
          } else if ('text' in cell.value && typeof cell.value.text === 'string') {
            // Handle shared strings
            cellValue = cell.value.text;
          } else if ('formula' in cell.value && typeof cell.value.formula === 'string') {
            // Handle formulas
            cellValue = cell.value.formula;
          }
        } else {
          cellValue = String(cell.value || '');
        }
        
        console.warn(`Processing cell value: "${cellValue}"`);
        
        // Check if the cell contains a placeholder (format: {{placeholder}})
        if (cellValue.includes('{{')) {
          // Replace all placeholders in the cell
          let newValue = cellValue;
          const placeholders = cellValue.match(/\{\{([^}]+)\}\}/g);
          
          if (placeholders) {
            console.warn(`Found placeholders in cell: ${placeholders.join(', ')}`);
            placeholders.forEach(placeholder => {
              const key = placeholder.slice(2, -2); // Remove {{ and }}
              const replacement = data[key];
              
              if (replacement !== undefined) {
                console.warn(`Replacing ${placeholder} with:`, replacement);
                newValue = newValue.replace(placeholder, String(replacement));
              } else {
                console.warn(`No value found for placeholder: ${key}`);
              }
            });
            
            // Update the cell value
            cell.value = newValue;
          }
        }
      });
    });
    
    // Convert the workbook to a blob
    const excelBuffer = await workbook.xlsx.writeBuffer();
    return new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  } catch (error) {
    console.error('Error processing Excel template:', error);
    throw new Error(`Excel processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

interface ImageData {
  _type: 'image';
  source: Buffer;
  format: MimeType;
  width: number;
  height: number;
  altText?: string;
  transparencyPercent?: number;
}

type PlaceholderValue = string | ImageData;

interface GenerationOptions {
  templateId: string;
  templateName: string;
  placeholderData: Record<string, PlaceholderValue>;
  placeholders: string[];
  format: 'pdf' | 'docx' | 'xlsx';
  userId: string;
}

type _ProcessedImageData = {
  [key: string]: unknown;
  _type: 'image';
  source: Buffer;
  format: MimeType;
  width: number;
  height: number;
  altText?: string;
};

type _ProcessedValueData = {
  [key: string]: unknown;
  value: string | number | boolean | null;
};

type _ProcessedData = _ProcessedImageData | _ProcessedValueData;

type ErrorWithMessage = {
  message: string;
  stack?: string;
  code?: string;
  details?: string;
};

function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

// Type guard for template errors
// Helper function to convert base64 image to ImageData with proper format
const convertBase64ToImageData = async (
  base64String: string,
  altText: string = ''
): Promise<ImageData> => {
  console.warn('Converting base64 to ImageData for:', altText);

  try {
    // Validate base64 string
    if (!base64String || typeof base64String !== 'string') {
      throw new Error('Invalid base64 string provided');
    }

    // Extract and validate data URL components
    const dataUrlMatch = base64String.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
    if (!dataUrlMatch) {
      throw new Error('Invalid data URL format. Expected format: data:image/[type];base64,[data]');
    }

    const [, imageType, base64Data] = dataUrlMatch;

    // Validate base64 data
    if (!base64Data || base64Data.length === 0) {
      throw new Error('Empty base64 data provided');
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, 'base64');

    // Basic image dimensions (can be adjusted based on needs)
    const width = 400;
    const height = 300;

    return {
      _type: 'image',
      source: buffer,
      format: `image/${imageType}` as MimeType,
      width,
      height,
      altText,
    };
  } catch (error) {
    console.error(
      'Error converting base64 to ImageData:',
      isErrorWithMessage(error) ? error.message : 'Unknown error'
    );
    throw error;
  }
};

const handleWord = async (
  templateBuffer: ArrayBuffer,
  data: Record<string, PlaceholderValue>
): Promise<Blob> => {
  console.warn('Starting Word document processing...');
  const handler = new TemplateHandler();

  // Process the data with exact format required by easy-template-x
  const processedData: Record<string, _ProcessedData> = {};

  for (const [key, value] of Object.entries(data)) {
    console.warn(`Processing placeholder: ${key}`);

    if (typeof value === 'string') {
      // Check if it's a base64 image with more robust detection
      if (value.startsWith('data:image/') && value.includes('base64,')) {
        try {
          console.warn(`Converting image for placeholder: ${key}`);
          const imageData = await convertBase64ToImageData(value, key);
          processedData[key] = imageData as _ProcessedImageData;
        } catch (error) {
          const errorMsg = isErrorWithMessage(error) ? error.message : 'Unknown error';
          console.error(`Error processing image for ${key}:`, errorMsg);
          throw new Error(`Image processing failed for ${key}: ${errorMsg}`);
        }
      } else {
        processedData[key] = { value };
      }
    } else if (value && typeof value === 'object' && '_type' in value) {
      processedData[key] = value as _ProcessedImageData;
    } else {
      console.warn(`Skipping invalid value for ${key}`);
    }
  }

  console.warn('Processing document with data...');
  const logData = JSON.stringify(
    processedData,
    (key, val) => {
      if (val instanceof Buffer) return `[Buffer: ${val.length} bytes]`;
      if (typeof val === 'object' && val && '_type' in val && val._type === 'image') {
        return `[ImageData: ${val.format}, ${val.width}x${val.height}]`;
      }
      return val;
    },
    2
  );
  console.warn('Processed data structure:', logData);

  try {
    console.warn('Calling template handler process...');
    const doc = await handler.process(templateBuffer, processedData as TemplateData);
    console.warn('Document processed successfully.');

    if (doc.byteLength === 0) {
      throw new Error('Generated document is empty');
    }

    return new Blob([doc], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
  } catch (error) {
    let errorMessage = 'Document processing failed';

    if (isErrorWithMessage(error)) {
      if (error.message.includes('image')) {
        errorMessage = `Image processing error: ${error.message}`;
      } else if (error.message.includes('template')) {
        errorMessage = `Template error: ${error.message}`;
      } else {
        errorMessage = error.message;
      }
      console.error('Error processing Word template:', errorMessage);
      if (error.stack) {
        console.error('Stack trace:', error.stack);
      }
    } else {
      console.error('Unknown error processing Word template');
    }

    throw new Error(errorMessage);
  }
};

const convertToPdfUsingLibreOffice = async (
  blob: Blob,
  originalFileName: string
): Promise<Blob> => {
  console.warn('Converting to PDF using LibreOffice:', originalFileName);

  try {
    const formData = new FormData();
    formData.append('file', blob, originalFileName);

    const response = await fetch('/api/convert-to-pdf', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`PDF conversion failed: ${errorData.error || response.statusText}`);
    }

    const pdfBlob = await response.blob();
    console.warn('LibreOffice PDF conversion successful, size:', pdfBlob.size);

    if (pdfBlob.size === 0) {
      throw new Error('PDF conversion resulted in an empty file');
    }

    return pdfBlob;
  } catch (error) {
    const errorMessage = isErrorWithMessage(error) ? error.message : 'Unknown error';
    console.error('LibreOffice conversion failed:', errorMessage);
    throw new Error(`PDF conversion failed: ${errorMessage}`);
  }
};

export const generateEnhancedPDF = async ({
  templateId,
  templateName,
  placeholderData,
  format,
  userId,
}: GenerationOptions): Promise<void> => {
  try {
    console.warn('=== Starting Enhanced Document Generation ===');
    console.warn('Template ID:', templateId);
    console.warn('Format:', format);
    console.warn('User ID:', userId);
    console.warn('Placeholder data keys:', Object.keys(placeholderData));

    // Get template info from database
    console.warn('Fetching template from database...');
    const { data: template, error: templateError } = await supabase
      .from('templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (templateError) {
      console.error('Template fetch error:', templateError);
      throw new Error(`Template fetch error: ${templateError.message}`);
    }
    if (!template) {
      console.error('Template not found');
      throw new Error('Template not found');
    }

    console.warn('Template found:', template.name, 'File path:', template.file_path);

    // Download template file from Supabase storage
    console.warn('Downloading template file from storage...');
    const { data: fileData, error: fileError } = await supabase.storage
      .from('templates')
      .download(template.file_path);

    if (fileError) {
      console.error('Template download error:', fileError);
      throw new Error(`Template download error: ${fileError.message}`);
    }
    if (!fileData) {
      console.error('Template file is empty');
      throw new Error('Template file is empty');
    }

    console.warn('Template file downloaded successfully, size:', fileData.size);

    const templateBuffer = await fileData.arrayBuffer();
    console.warn('Template buffer created, size:', templateBuffer.byteLength);

    let resultBlob: Blob;
    let finalFormat = format;

    // Process based on format
    switch (format) {
      case 'xlsx':
        console.warn('Processing Excel document...');
        resultBlob = await handleExcel(templateBuffer, placeholderData);
        break;
      case 'docx':
        console.warn('Processing Word document...');
        resultBlob = await handleWord(templateBuffer, placeholderData);
        break;
      case 'pdf':
        console.warn('Processing document for PDF conversion...');
        if (template.name.endsWith('.xlsx')) {
          // For Excel templates, first generate xlsx then convert to PDF
          console.warn('Processing Excel template for PDF...');
          const excelBlob = await handleExcel(templateBuffer, placeholderData);
          resultBlob = await convertToPdfUsingLibreOffice(excelBlob, template.name);
          finalFormat = 'pdf';
        } else {
          // For Word templates, first generate docx then convert to PDF
          console.warn('Processing Word template for PDF...');
          const wordBlob = await handleWord(templateBuffer, placeholderData);
          resultBlob = await convertToPdfUsingLibreOffice(wordBlob, template.name);
          finalFormat = 'pdf';
        }
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    console.warn('Document processed successfully, blob size:', resultBlob.size);

    // Generate filename
    const baseFileName = templateName.replace(/\.[^/.]+$/, '');
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `${baseFileName}_${timestamp}`;
    const fullFileName = `${fileName}.${finalFormat}`;

    console.warn('Generated filename:', fullFileName);

    // Upload to Supabase storage
    const storagePath = `${userId}/${Date.now()}-${fullFileName}`;
    console.warn('Uploading to storage path:', storagePath);

    const { error: uploadError } = await supabase.storage
      .from('generated_pdfs')
      .upload(storagePath, resultBlob);

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error(`Storage upload error: ${uploadError.message}`);
    }

    console.warn('File uploaded to storage successfully');

    // Convert placeholderData to JSON-compatible format for database storage
    type JsonPlaceholderValue = string;
    const jsonPlaceholderData: Record<string, JsonPlaceholderValue> = {};
    Object.entries(placeholderData).forEach(([key, value]) => {
      if (
        typeof value === 'string' &&
        value.startsWith('data:image/') &&
        value.includes('base64,')
      ) {
        // Extract image type and size info for better tracking
        const typeMatch = value.match(/data:image\/([^;]+)/);
        const imageType = typeMatch ? typeMatch[1].toUpperCase() : 'UNKNOWN';
        const sizeKB = Math.round((value.length * 0.75) / 1024); // Approximate size in KB
        jsonPlaceholderData[key] = `[${imageType} Image - ~${sizeKB}KB]`;
      } else if (
        typeof value === 'object' &&
        value &&
        '_type' in value &&
        value._type === 'image'
      ) {
        const imageValue = value as ImageData;
        const format = imageValue.format
          ? imageValue.format.split('/').pop()?.toUpperCase()
          : 'IMAGE';
        const sizeKB = imageValue.source ? Math.round(imageValue.source.length / 1024) : 0;
        jsonPlaceholderData[key] = `[${format} Image - ${sizeKB}KB]`;
      } else {
        jsonPlaceholderData[key] = typeof value === 'string' ? value : String(value || '');
      }
    });

    // Save metadata to database
    console.warn('Saving metadata to database...');
    const { data: generatedFile, error: insertError } = await supabase
      .from('generated_pdfs')
      .insert({
        name: fullFileName,
        user_id: userId,
        template_id: templateId,
        file_path: storagePath,
        file_size: resultBlob.size,
        placeholder_data: jsonPlaceholderData,
        generated_date: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw new Error(`Database insert error: ${insertError.message}`);
    }

    console.warn('Metadata saved to database successfully');

    // Update template use count
    console.warn('Updating template use count...');
    await supabase
      .from('templates')
      .update({
        use_count: (template.use_count || 0) + 1,
      })
      .eq('id', templateId);

    // Log activity
    console.warn('Logging activity...');
    await supabase.from('activity_logs').insert({
      user_id: userId,
      action: `${finalFormat.toUpperCase()} Generated`,
      resource_type: 'generated_file',
      resource_id: generatedFile.id,
      metadata: {
        template_name: template.name,
        generated_name: fullFileName,
        placeholders_filled: Object.keys(placeholderData).length,
      },
    });

    // Trigger download
    console.warn('Triggering download...');
    const url = window.URL.createObjectURL(resultBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fullFileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    console.warn('=== Document Generation Complete ===');
    console.warn('Document generated, saved to Supabase, and download triggered successfully');
  } catch (error) {
    console.error('=== Document Generation Failed ===');
    if (isErrorWithMessage(error)) {
      console.error('Error generating document:', error.message);
      if (error.stack) {
        console.error('Error stack:', error.stack);
      }
      throw error;
    }
    throw new Error('An unknown error occurred while generating the document');
  }
};
