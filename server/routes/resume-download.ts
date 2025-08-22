import { RequestHandler } from "express";
import https from 'https';
import http from 'http';

interface ResumeDownloadRequest {
  url: string;
  filename: string;
  format: 'pdf' | 'docx' | 'original';
  applicantName?: string;
}

export const handleResumeDownload: RequestHandler = async (req, res) => {
  try {
    const { url, filename, format, applicantName } = req.body as ResumeDownloadRequest;

    if (!url || !filename) {
      return res.status(400).json({ 
        error: 'Missing required parameters: url and filename' 
      });
    }

    // Handle placeholder URLs
    if (url.startsWith('placeholder://')) {
      return res.status(404).json({ 
        error: 'Resume file not available - storage not configured' 
      });
    }

    // Fetch the original file
    const response = await fetch(url);
    
    if (!response.ok) {
      return res.status(404).json({ 
        error: 'Resume file not found' 
      });
    }

    const buffer = await response.buffer();
    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    // Determine the original file extension
    const originalExtension = getFileExtension(url, contentType);
    
    // Set the appropriate filename and content type based on requested format
    let finalFilename = filename;
    let finalContentType = contentType;

    if (format === 'pdf' && originalExtension !== 'pdf') {
      // In a production environment, you would implement actual format conversion here
      // For now, we'll just return the original file with a note
      finalFilename = filename.replace(/\.[^/.]+$/, '') + '.pdf';
      finalContentType = 'application/pdf';
      
      // Note: Real implementation would use libraries like:
      // - pdf-lib for PDF generation
      // - mammoth for DOCX to HTML conversion
      // - puppeteer for HTML to PDF conversion
      
      res.setHeader('X-Conversion-Note', 'Format conversion not implemented - returning original file');
    } else if (format === 'docx' && originalExtension !== 'docx') {
      finalFilename = filename.replace(/\.[^/.]+$/, '') + '.docx';
      finalContentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      
      res.setHeader('X-Conversion-Note', 'Format conversion not implemented - returning original file');
    } else {
      // Return original file
      finalFilename = filename.includes('.') ? filename : `${filename}.${originalExtension}`;
    }

    // Set response headers for file download
    res.setHeader('Content-Type', finalContentType);
    res.setHeader('Content-Disposition', `attachment; filename="${finalFilename}"`);
    res.setHeader('Content-Length', buffer.length);
    
    // Add metadata headers
    if (applicantName) {
      res.setHeader('X-Applicant-Name', applicantName);
    }
    res.setHeader('X-Original-Format', originalExtension);
    res.setHeader('X-Requested-Format', format);

    // Send the file
    res.send(buffer);

  } catch (error) {
    console.error('Resume download error:', error);
    res.status(500).json({ 
      error: 'Failed to download resume file',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Batch download multiple resumes as ZIP
export const handleBatchResumeDownload: RequestHandler = async (req, res) => {
  try {
    const { resumes } = req.body as { resumes: ResumeDownloadRequest[] };

    if (!resumes || !Array.isArray(resumes) || resumes.length === 0) {
      return res.status(400).json({ 
        error: 'Missing or invalid resumes array' 
      });
    }

    // In a production environment, you would:
    // 1. Use JSZip to create a ZIP file
    // 2. Download each resume file
    // 3. Add them to the ZIP with proper names
    // 4. Return the ZIP file

    // For now, return a JSON response with download info
    const downloadInfo = await Promise.all(
      resumes.map(async (resume) => {
        try {
          if (resume.url.startsWith('placeholder://')) {
            return {
              filename: resume.filename,
              status: 'unavailable',
              error: 'Storage not configured'
            };
          }

          const response = await fetch(resume.url, { method: 'HEAD' });
          
          return {
            filename: resume.filename,
            status: response.ok ? 'available' : 'not_found',
            size: response.headers.get('content-length'),
            contentType: response.headers.get('content-type')
          };
        } catch (error) {
          return {
            filename: resume.filename,
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );

    res.json({
      message: 'Batch download info retrieved',
      resumes: downloadInfo,
      note: 'ZIP download not implemented - use individual downloads'
    });

  } catch (error) {
    console.error('Batch resume download error:', error);
    res.status(500).json({ 
      error: 'Failed to process batch resume download',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Helper function to determine file extension
function getFileExtension(url: string, contentType: string): string {
  // Try to get extension from URL
  const urlExtension = url.split('.').pop()?.toLowerCase();
  
  if (urlExtension && ['pdf', 'doc', 'docx'].includes(urlExtension)) {
    return urlExtension;
  }

  // Fallback to content type
  switch (contentType) {
    case 'application/pdf':
      return 'pdf';
    case 'application/msword':
      return 'doc';
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return 'docx';
    default:
      return 'pdf'; // Default assumption
  }
}

// Get resume metadata
export const handleResumeMetadata: RequestHandler = async (req, res) => {
  try {
    const { url } = req.query as { url: string };

    if (!url) {
      return res.status(400).json({ 
        error: 'Missing url parameter' 
      });
    }

    if (url.startsWith('placeholder://')) {
      return res.json({
        available: false,
        error: 'Storage not configured',
        placeholder: true
      });
    }

    const response = await fetch(url, { method: 'HEAD' });
    
    if (!response.ok) {
      return res.json({
        available: false,
        error: 'File not found',
        status: response.status
      });
    }

    const contentType = response.headers.get('content-type');
    const contentLength = response.headers.get('content-length');
    const lastModified = response.headers.get('last-modified');

    res.json({
      available: true,
      contentType,
      size: contentLength ? parseInt(contentLength) : null,
      lastModified,
      extension: getFileExtension(url, contentType || ''),
      supportsConversion: {
        pdf: true,
        docx: true // Note: Actual conversion not implemented
      }
    });

  } catch (error) {
    console.error('Resume metadata error:', error);
    res.status(500).json({ 
      error: 'Failed to get resume metadata',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
