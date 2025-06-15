import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TemplateHandler } from 'easy-template-x';
import { Workbook } from 'exceljs';

import { supabase } from '@/integrations/supabase/client';

import { useToast } from './use-toast';
import { useAuth } from './useAuth';

// Helper function to convert row and column numbers to Excel cell address
const getCellAddress = (row: number, col: number): string => {
  let columnName = '';
  let colNum = col;
  while (colNum > 0) {
    colNum--;
    columnName = String.fromCharCode(65 + (colNum % 26)) + columnName;
    colNum = Math.floor(colNum / 26);
  }
  return columnName + row;
};

interface RichTextElement {
  text?: string | number | boolean;
}

interface Tag {
  name: string;
}

const extractPlaceholders = async (file: File): Promise<string[]> => {
  console.warn('Starting placeholder extraction...');
  const placeholders = new Set<string>();

  try {
    if (
      file.name.endsWith('.xlsx') ||
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ) {
      console.warn('Processing Excel file with enhanced extraction...');

      try {
        const workbook = new Workbook();
        const arrayBuffer = await file.arrayBuffer();
        console.warn('ArrayBuffer size:', arrayBuffer.byteLength);

        await workbook.xlsx.load(arrayBuffer);
        console.warn('Excel workbook loaded successfully');

        workbook.worksheets.forEach((worksheet, wsIndex) => {
          console.warn(
            `Processing worksheet ${wsIndex + 1}:`,
            worksheet.name || `Sheet${wsIndex + 1}`
          );

          // Process all rows including empty ones to catch placeholders
          worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
            try {
              // Process each cell in the row
              row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                try {
                  let cellText = '';

                  // Handle different cell value types more comprehensively
                  if (cell.value === null || cell.value === undefined) {
                    return; // Skip empty cells
                  }

                  if (typeof cell.value === 'string') {
                    cellText = cell.value;
                  } else if (typeof cell.value === 'number') {
                    cellText = cell.value.toString();
                  } else if (typeof cell.value === 'boolean') {
                    cellText = cell.value.toString();
                  } else if (cell.value && typeof cell.value === 'object') {
                    // Handle Excel rich text and formula objects
                    if ('text' in cell.value && cell.value.text) {
                      cellText = String(cell.value.text);
                    } else if ('richText' in cell.value && Array.isArray(cell.value.richText)) {
                      cellText = cell.value.richText
                        .map((rt: RichTextElement) => (rt && rt.text ? String(rt.text) : ''))
                        .join('');
                    } else if ('result' in cell.value && cell.value.result != null) {
                      cellText = String(cell.value.result);
                    } else if ('formula' in cell.value && cell.value.formula) {
                      cellText = String(cell.value.formula);
                    } else if ('hyperlink' in cell.value && cell.value.hyperlink) {
                      cellText = String(cell.value.hyperlink);
                    } else {
                      // Fallback: try to convert to string
                      cellText = String(cell.value);
                    }
                  }

                  // Also check cell text property
                  if (!cellText && cell.text) {
                    cellText = cell.text;
                  }

                  // Extract placeholders using multiple regex patterns
                  if (cellText && cellText.length > 0) {
                    // Pattern 1: {{placeholder}}
                    const doubleBraceMatches = cellText.match(/\{\{([^}]+)\}\}/g);
                    if (doubleBraceMatches) {
                      doubleBraceMatches.forEach(match => {
                        const placeholder = match.replace(/[{}]/g, '').trim();
                        if (placeholder && placeholder.length > 0) {
                          placeholders.add(placeholder);
                          console.warn(
                            `Found Excel placeholder: "${placeholder}" at row ${rowNumber}, col ${colNumber} (${getCellAddress(rowNumber, colNumber)})`
                          );
                        }
                      });
                    }

                    // Pattern 2: {placeholder}
                    const singleBraceMatches = cellText.match(/\{([^{}]+)\}/g);
                    if (singleBraceMatches) {
                      singleBraceMatches.forEach(match => {
                        const placeholder = match.replace(/[{}]/g, '').trim();
                        // Only add if it doesn't look like a formula or function
                        if (
                          placeholder &&
                          placeholder.length > 0 &&
                          !placeholder.includes('=') &&
                          !placeholder.includes('(')
                        ) {
                          placeholders.add(placeholder);
                          console.warn(
                            `Found Excel placeholder (single brace): "${placeholder}" at row ${rowNumber}, col ${colNumber} (${getCellAddress(rowNumber, colNumber)})`
                          );
                        }
                      });
                    }

                    // Pattern 3: <<placeholder>>
                    const angleBraceMatches = cellText.match(/<<([^>]+)>>/g);
                    if (angleBraceMatches) {
                      angleBraceMatches.forEach(match => {
                        const placeholder = match.replace(/[<>]/g, '').trim();
                        if (placeholder && placeholder.length > 0) {
                          placeholders.add(placeholder);
                          console.warn(
                            `Found Excel placeholder (angle brackets): "${placeholder}" at row ${rowNumber}, col ${colNumber} (${getCellAddress(rowNumber, colNumber)})`
                          );
                        }
                      });
                    }

                    // Pattern 4: $placeholder$ (alternative style)
                    const dollarMatches = cellText.match(/\$([^$]+)\$/g);
                    if (dollarMatches) {
                      dollarMatches.forEach(match => {
                        const placeholder = match.replace(/\$/g, '').trim();
                        if (placeholder && placeholder.length > 0 && !placeholder.includes('=')) {
                          placeholders.add(placeholder);
                          console.warn(
                            `Found Excel placeholder (dollar style): "${placeholder}" at row ${rowNumber}, col ${colNumber} (${getCellAddress(rowNumber, colNumber)})`
                          );
                        }
                      });
                    }
                  }
                } catch (cellError) {
                  console.warn(
                    `Error processing cell at row ${rowNumber}, col ${colNumber}:`,
                    cellError
                  );
                }
              });
            } catch (rowError) {
              console.warn(`Error processing row ${rowNumber}:`, rowError);
            }
          });
        });

        console.warn(
          `Excel processing complete. Found ${placeholders.size} unique placeholders:`,
          Array.from(placeholders)
        );
      } catch (excelError) {
        console.warn('Error processing Excel file:', excelError);
        console.warn('Continuing with empty placeholders due to Excel processing error');
      }
    } else if (
      file.name.endsWith('.docx') ||
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      console.warn('Processing Word file using easy-template-x...');

      try {
        const arrayBuffer = await file.arrayBuffer();
        console.warn('Word file ArrayBuffer size:', arrayBuffer.byteLength);

        // Use easy-template-x to parse tags
        const handler = new TemplateHandler();
        const tags = await handler.parseTags(arrayBuffer);

        console.warn('Tags found by easy-template-x:', tags);

        // Extract placeholder names from tags
        if (tags && Array.isArray(tags)) {
          tags.forEach((tag: Tag) => {
            if (tag && tag.name && typeof tag.name === 'string') {
              const placeholder = tag.name.trim();
              if (placeholder && placeholder.length > 0) {
                placeholders.add(placeholder);
                console.warn(`Found DOCX placeholder: "${placeholder}"`);
              }
            }
          });
        }

        console.warn(
          `DOCX processing complete using easy-template-x. Found ${placeholders.size} unique placeholders.`
        );
      } catch (docxError) {
        console.warn('Error processing DOCX file with easy-template-x:', docxError);

        // Fallback to basic text extraction if easy-template-x fails
        console.warn('Falling back to basic text extraction...');
        try {
          const arrayBuffer = await file.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);

          // Enhanced text extraction for DOCX files
          let textContent = '';
          let consecutiveNulls = 0;

          for (let i = 0; i < uint8Array.length; i++) {
            const byte = uint8Array[i];

            if (byte === 0) {
              consecutiveNulls++;
              if (consecutiveNulls < 3) {
                textContent += ' '; // Replace single/double null bytes with spaces
              }
            } else {
              consecutiveNulls = 0;

              // Include printable ASCII characters and common Unicode ranges
              if ((byte >= 32 && byte <= 126) || byte === 10 || byte === 13 || byte === 9) {
                textContent += String.fromCharCode(byte);
              } else if (byte > 127) {
                // Handle UTF-8 encoded characters
                textContent += String.fromCharCode(byte);
              }
            }
          }

          console.warn('Fallback text extraction complete. Length:', textContent.length);

          // Extract placeholders using regex
          const matches = textContent.match(/\{\{([^}]+)\}\}/g);
          if (matches && matches.length > 0) {
            matches.forEach(match => {
              const placeholder = match.replace(/[{}]/g, '').trim();
              if (placeholder && placeholder.length > 0) {
                placeholders.add(placeholder);
                console.warn(`Found Word placeholder (fallback): "${placeholder}"`);
              }
            });
          }

          console.warn(
            `Fallback processing complete. Found ${placeholders.size} unique placeholders.`
          );
        } catch (fallbackError) {
          console.warn('Fallback text extraction also failed:', fallbackError);
        }
      }
    } else {
      console.warn('Unsupported file type:', file.type, file.name);
    }

    const result = Array.from(placeholders);
    console.warn('Final extracted placeholders:', result);
    return result;
  } catch (error) {
    console.warn('Critical error in placeholder extraction:', error);
    console.warn('Error stack:', (error as Error)?.stack);

    // Always return empty array instead of throwing to prevent upload failure
    console.warn('Returning empty placeholders array due to critical error');
    return [];
  }
};

export const useTemplates = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templates', user?.id],
    queryFn: async () => {
      if (!user) return [];

      console.warn('Fetching templates for user:', user.id);

      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('user_id', user.id)
        .order('upload_date', { ascending: false });

      if (error) {
        console.warn('Error fetching templates:', error);
        throw error;
      }

      console.warn('Fetched templates:', data?.length || 0);
      return data || [];
    },
    enabled: !!user,
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!user) {
        console.warn('Upload attempted without user authentication');
        throw new Error('No user logged in');
      }

      console.warn('=== STARTING TEMPLATE UPLOAD ===');
      console.warn('File details:', {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified,
      });
      console.warn('User ID:', user.id);

      // Enhanced file type validation
      const isDocx =
        file.name.endsWith('.docx') ||
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      const isXlsx =
        file.name.endsWith('.xlsx') ||
        file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

      if (!isDocx && !isXlsx) {
        console.warn('Invalid file type detected:', file.type, file.name);
        throw new Error('Invalid file type. Please upload a .docx or .xlsx file.');
      }

      console.warn('File type validation passed:', isDocx ? 'DOCX' : 'XLSX');

      // Extract placeholders with comprehensive error handling
      let placeholders: string[] = [];
      console.warn('Starting placeholder extraction...');

      try {
        placeholders = await extractPlaceholders(file);
        console.warn('Placeholder extraction completed successfully:', placeholders);
      } catch (extractError) {
        console.warn('Placeholder extraction failed completely:', extractError);
        console.warn('Extract error details:', (extractError as Error)?.message);
        // Continue with empty placeholders instead of failing
        placeholders = [];
        console.warn('Proceeding with empty placeholders due to extraction failure');
      }

      // Upload file to Supabase storage
      console.warn('=== UPLOADING TO STORAGE ===');
      const fileName = `${user.id}/${Date.now()}-${file.name}`;
      console.warn('Storage file path:', fileName);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('templates')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.warn('Storage upload failed:', uploadError);
        console.warn('Upload error details:', {
          message: uploadError.message,
          name: uploadError.name,
        });
        throw new Error(`File upload failed: ${uploadError.message}`);
      }

      console.warn('File uploaded successfully to storage:', uploadData?.path);

      // Save template metadata to database
      console.warn('=== SAVING TO DATABASE ===');
      const templateData = {
        name: file.name,
        user_id: user.id,
        file_path: uploadData.path,
        file_size: file.size,
        placeholders: placeholders,
        use_count: 0,
      };

      console.warn('Template data to insert:', templateData);

      const { data: template, error: insertError } = await supabase
        .from('templates')
        .insert(templateData)
        .select()
        .single();

      if (insertError) {
        console.warn('Database insert failed:', insertError);
        console.warn('Insert error details:', {
          message: insertError.message,
          code: insertError.code,
          details: insertError.details,
          hint: insertError.hint,
        });

        // Clean up uploaded file on database failure
        console.warn('Cleaning up uploaded file due to database error...');
        try {
          await supabase.storage.from('templates').remove([uploadData.path]);
          console.warn('File cleanup completed');
        } catch (cleanupError) {
          console.warn('File cleanup failed:', cleanupError);
        }

        throw new Error(`Database error: ${insertError.message}`);
      }

      console.warn('=== UPLOAD COMPLETED SUCCESSFULLY ===');
      console.warn('Template saved:', template);
      return template;
    },
    onSuccess: template => {
      console.warn('Upload mutation succeeded:', template.name);
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast({
        title: 'Success',
        description: `Template "${template.name}" uploaded successfully!`,
      });
    },
    onError: error => {
      console.warn('Upload mutation failed:', error);
      console.warn('Error message:', error?.message);
      console.warn('Error stack:', error?.stack);

      toast({
        title: 'Upload Failed',
        description: error?.message || 'Failed to upload template. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (templateId: string) => {
      if (!user) throw new Error('No user logged in');

      // First get the template to find the file path
      const { data: template, error: fetchError } = await supabase
        .from('templates')
        .select('file_path')
        .eq('id', templateId)
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        console.warn('Error fetching template:', fetchError);
        throw fetchError;
      }

      // First, delete all generated PDFs that reference this template
      const { error: deletePdfsError } = await supabase
        .from('generated_pdfs')
        .delete()
        .eq('template_id', templateId)
        .eq('user_id', user.id);

      if (deletePdfsError) {
        console.warn('Error deleting related generated PDFs:', deletePdfsError);
        throw new Error(`Failed to delete related PDFs: ${deletePdfsError.message}`);
      }

      // Delete the file from storage
      const { error: storageError } = await supabase.storage
        .from('templates')
        .remove([template.file_path]);

      if (storageError) {
        console.warn('Error deleting file from storage:', storageError);
        // Continue with database deletion even if storage deletion fails
      }

      // Delete the template record from database
      const { error: deleteError } = await supabase
        .from('templates')
        .delete()
        .eq('id', templateId)
        .eq('user_id', user.id);

      if (deleteError) {
        console.warn('Error deleting template from database:', deleteError);
        throw deleteError;
      }

      return templateId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast({
        title: 'Success',
        description: 'Template deleted successfully!',
      });
    },
    onError: error => {
      console.warn('Delete failed:', error);
      toast({
        title: 'Delete Failed',
        description: error.message || 'Failed to delete template. Please try again.',
        variant: 'destructive',
      });
    },
  });

  return {
    templates,
    isLoading,
    uploadTemplate: uploadMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    deleteTemplate: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
};
