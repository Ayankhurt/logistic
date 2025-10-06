import { Injectable, Logger } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as bwipjs from 'bwip-js';
import { StorageService } from '../integrations/storage/storage.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrintingService {
  private readonly logger = new Logger(PrintingService.name);

  constructor(
    private readonly storageService: StorageService,
    private readonly prisma: PrismaService,
  ) {}

  async generatePDF(recordId: string, recordData?: any): Promise<string> {
    this.logger.log(`Generating PDF for record ${recordId}`);

    // Fetch record data if not provided
    if (!recordData) {
      const record = await this.prisma.logisticRecord.findUnique({
        where: { id: recordId },
        include: { items: true },
      });
      if (!record) {
        throw new Error(`Record ${recordId} not found`);
      }
      recordData = record;
    }

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();

      // Generate HTML content for the PDF
      const htmlContent = await this.generateHTMLContent(recordData);

      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      // Generate PDF buffer
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px',
        },
      });

      // Upload PDF to storage
      const uploadResult = await this.storageService.uploadFile(
        Buffer.from(pdfBuffer),
        `guide-${recordId}.pdf`,
      );

      this.logger.log(`PDF generated and uploaded for record ${recordId}`);
      return uploadResult.url;
    } catch (error) {
      this.logger.error(`Error generating PDF: ${error.message}`);
      throw error;
    } finally {
      await browser.close();
    }
  }

  private async generateHTMLContent(recordData: any): Promise<string> {
    const {
      guideNumber,
      senderContactId,
      recipientContactId,
      items = [],
    } = recordData;

    // Generate Code 128 barcode HTML (simplified, in real implementation use a library)
    const barcodeHTML = await this.generateBarcodeHTML(guideNumber);

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Logistic Guide - ${guideNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
            .guide-number { font-size: 24px; font-weight: bold; }
            .barcode { text-align: center; margin: 20px 0; }
            .details { margin: 20px 0; }
            .items { margin: 20px 0; }
            .items table { width: 100%; border-collapse: collapse; }
            .items th, .items td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .items th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Logistic Guide</h1>
            <div class="guide-number">Guide Number: ${guideNumber}</div>
          </div>

          <div class="barcode">
            ${barcodeHTML}
          </div>

          <div class="details">
            <p><strong>Sender:</strong> ${senderContactId}</p>
            <p><strong>Recipient:</strong> ${recipientContactId}</p>
          </div>

          <div class="items">
            <h3>Items</h3>
            <table>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Name</th>
                  <th>Expected Qty</th>
                </tr>
              </thead>
              <tbody>
                ${items
                  .map(
                    (item: any) => `
                  <tr>
                    <td>${item.sku || ''}</td>
                    <td>${item.name || ''}</td>
                    <td>${item.qtyExpected || 0}</td>
                  </tr>
                `,
                  )
                  .join('')}
              </tbody>
            </table>
          </div>
        </body>
      </html>
    `;
  }

  private async generateBarcodeHTML(data: string): Promise<string> {
    try {
      // Generate Code 128 barcode using bwip-js
      const barcodeBuffer = await bwipjs.toBuffer({
        bcid: 'code128', // Barcode type
        text: data, // Text to encode
        scale: 2, // Scaling factor
        height: 40, // Bar height
        includetext: true, // Include text below barcode
        textxalign: 'center', // Text alignment
      });

      // Convert buffer to base64 data URL
      const base64Image = barcodeBuffer.toString('base64');
      return `<img src="data:image/png;base64,${base64Image}" alt="Barcode for ${data}" style="max-width: 100%; height: auto;" />`;
    } catch (error) {
      this.logger.error(`Error generating barcode: ${error.message}`);
      // Fallback to simple text representation
      return `
        <div style="font-family: 'Courier New', monospace; font-size: 16px; letter-spacing: -1px; text-align: center;">
          ${data}
        </div>
      `;
    }
  }

  async printSelectedFiles(
    fileIds: string[],
    tenantId?: string,
  ): Promise<string> {
    this.logger.log(`Generating PDF for selected files: ${fileIds.join(', ')}`);

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      timeout: 60000, // Increase timeout to 60 seconds
    });

    try {
      const page = await browser.newPage();

      // Generate HTML content for the PDF with selected files
      const htmlContent = await this.generateFilesHTMLContent(
        fileIds,
        tenantId,
      );

      await page.setContent(htmlContent, {
        waitUntil: 'networkidle0',
        timeout: 60000,
      });

      // Generate PDF buffer
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px',
        },
      });

      // Upload PDF to storage
      const uploadResult = await this.storageService.uploadFile(
        Buffer.from(pdfBuffer),
        `selected-files-${Date.now()}.pdf`,
      );

      this.logger.log(`PDF generated and uploaded for selected files`);
      return uploadResult.url;
    } catch (error) {
      this.logger.error(
        `Error generating PDF for selected files: ${error.message}`,
      );
      throw error;
    } finally {
      await browser.close();
    }
  }

  private async generateFilesHTMLContent(
    fileIds: string[],
    tenantId?: string,
  ): Promise<string> {
    const files: any[] = [];

    for (const fileId of fileIds) {
      let file: {
        id: string;
        name: string;
        url: string;
        size?: number;
        createdAt?: string;
      } | null = null;
      let attempts = 0;
      const maxAttempts = 3;
      while (attempts < maxAttempts) {
        try {
          file = await this.storageService.getFile(fileId, tenantId);
          break; // Success, exit retry loop
        } catch (error) {
          attempts++;
          this.logger.warn(
            `Attempt ${attempts} - Could not fetch file ${fileId}: ${error.message}`,
          );
          if (attempts >= maxAttempts) {
            this.logger.error(
              `Failed to fetch file ${fileId} after ${maxAttempts} attempts`,
            );
          } else {
            // Wait before retrying
            await new Promise((resolve) =>
              setTimeout(resolve, 1000 * attempts),
            );
          }
        }
      }
      if (file) {
        files.push(file);
      }
    }

    const filesHTML = files
      .map((file: any) => {
        const isImage = file.mimetype?.startsWith('image/');
        if (isImage) {
          return `
          <div class="file-item">
            <h4>${file.name || file.filename || 'Unnamed File'}</h4>
            <img src="${file.url}" alt="${file.name}" style="max-width: 100%; height: auto;" />
          </div>
        `;
        } else {
          return `
          <div class="file-item">
            <h4>${file.name || file.filename || 'Unnamed File'}</h4>
            <p><strong>Type:</strong> ${file.mimetype || 'Unknown'}</p>
            <p><strong>Size:</strong> ${file.size ? `${(file.size / 1024).toFixed(2)} KB` : 'Unknown'}</p>
            <p><a href="${file.url}" target="_blank">Download File</a></p>
          </div>
        `;
        }
      })
      .join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Selected Files Printout</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
            .file-item { margin: 20px 0; padding: 10px; border: 1px solid #ddd; }
            .file-item img { max-width: 100%; height: auto; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Selected Files Printout</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
          </div>

          <div class="files">
            ${filesHTML}
          </div>
        </body>
      </html>
    `;
  }
}
