import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'
import { put } from '@vercel/blob'
import { v4 as uuidv4 } from 'uuid'

export class VercelMindARService {
    constructor() {
        this.activeJobs = new Map()
    }

    /**
     * Main compilation method optimized for Vercel
     */
    async compileImageToMind(imageBuffer, originalName, jobId = null) {
        jobId = jobId || uuidv4();
        
        try {
            this.updateJobStatus(jobId, 'initializing', 0);
            
            // Launch browser with Vercel-optimized settings
            const browser = await puppeteer.launch({
                args: [
                    ...chromium.args,
                    '--hide-scrollbars',
                    '--disable-web-security',
                    '--no-sandbox',
                    '--disable-setuid-sandbox'
                ],
                defaultViewport: chromium.defaultViewport,
                executablePath: await chromium.executablePath(),
                headless: chromium.headless
            })
            const page = await browser.newPage();

            // Set reasonable timeout for Vercel's 5-minute limit
            page.setDefaultTimeout(30000);
            
            this.updateJobStatus(jobId, 'loading_compiler', 10);
            
            // Navigate to MindAR compiler
            await page.goto('https://hiukim.github.io/mind-ar-js-doc/tools/compile', {
                waitUntil: 'networkidle2',
                timeout: 30000
            });

            // Upload image
            await this.uploadImageToPage(page, imageBuffer, originalName);
            this.updateJobStatus(jobId, 'uploading_complete', 30);

            // Start compilation
            await this.startCompilation(page);
            this.updateJobStatus(jobId, 'compiling', 40);

            // Wait for completion with progress tracking
            const mindBuffer = await this.waitForCompilation(page, jobId);
            
            await browser.close();

            // Store in Vercel Blob storage
            const blobResult = await put(`${jobId}.mind`, mindBuffer, {
                access: 'public',
                addRandomSuffix: false
            });

            // Record completion and download URL
            this.activeJobs.set(jobId, {
                status: 'completed',
                progress: 100,
                downloadUrl: blobResult.url,
                timestamp: new Date().toISOString()
            })

            return {
                success: true,
                jobId,
                downloadUrl: blobResult.url,
                originalName,
                compiledName: `${originalName.split('.')[0]}.mind`,
                buffer: mindBuffer
            };

        } catch (error) {
            this.updateJobStatus(jobId, 'failed', 0);
            throw new Error(`Compilation failed: ${error.message}`);
        }
    }

    /**
     * Upload image using buffer instead of file system
     */
    async uploadImageToPage(page, imageBuffer, fileName) {
        // Create a data URL from buffer
        const base64 = imageBuffer.toString('base64');
        const mimeType = this.getMimeType(fileName);
        const dataUrl = `data:${mimeType};base64,${base64}`;

        // Inject file upload simulation
        await page.evaluate((dataUrl, fileName) => {
            // Create blob from data URL
            const arr = dataUrl.split(',');
            const mime = arr[0].match(/:(.*?);/)[1];
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while (n--) {
                u8arr[n] = bstr.charCodeAt(n);
            }
            const blob = new Blob([u8arr], { type: mime });
            const file = new File([blob], fileName, { type: mime });

            // Find file input and simulate upload
            const fileInput = document.querySelector('input[type="file"]');
            if (fileInput) {
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                fileInput.files = dataTransfer.files;
                fileInput.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }, dataUrl, fileName);

        // Wait for upload confirmation
        await page.waitForSelector('button, a', { timeout: 10000 });
    }

    /**
     * Start compilation process
     */
    async startCompilation(page) {
        // Wait for and click start button
        await page.waitForSelector('button', { timeout: 10000 })
        const clicked = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'))
            const btn = buttons.find(b => {
                const t = (b.textContent || '').toLowerCase()
                return t.includes('start') || t.includes('compile')
            })
            if (btn) { btn.click(); return true }
            return false
        })
        if (!clicked) throw new Error('Start button not found')
        await page.waitForTimeout(2000);
    }

    /**
     * Wait for compilation with Vercel timeout considerations
     */
    async waitForCompilation(page, jobId) {
        const maxWaitTime = 240000; // 4 minutes (leave buffer for Vercel's 5-min limit)
        const checkInterval = 3000;
        const startTime = Date.now();

        while (Date.now() - startTime < maxWaitTime) {
            // Check progress
            const progress = await page.evaluate(() => {
                const text = document.body.textContent;
                const match = text.match(/Progress:\s*(\d+(?:\.\d+)?)\s*%/i);
                return match ? parseFloat(match[1]) : null;
            });

            if (progress) {
                const adjustedProgress = 40 + (progress * 0.5); // Scale to 40-90%
                this.updateJobStatus(jobId, 'compiling', adjustedProgress);
            }

            // Check if download button is available
            const downloadReady = await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                return buttons.some(btn => 
                    btn.textContent.toLowerCase().includes('download') && !btn.disabled
                );
            });

            if (downloadReady) {
                this.updateJobStatus(jobId, 'downloading', 90);
                return await this.downloadFile(page);
            }

            await page.waitForTimeout(checkInterval);
        }

        throw new Error('Compilation timeout');
    }

    /**
     * Download compiled file using CDP
     */
    async downloadFile(page) {
        return new Promise(async (resolve, reject) => {
            const client = await page.target().createCDPSession();
            
            // Set up download handling
            await client.send('Page.setDownloadBehavior', {
                behavior: 'allow'
            });

            const timeout = setTimeout(() => {
                reject(new Error('Download timeout'));
            }, 30000);

            // Listen for download
            client.on('Browser.downloadWillBegin', (event) => {
                console.log('Download started:', event.suggestedFilename);
            });

            client.on('Browser.downloadProgress', async (event) => {
                if (event.state === 'completed') {
                    clearTimeout(timeout);
                    
                    // Get the downloaded content
                    const response = await page.evaluate(() => {
                        return new Promise((resolve) => {
                            const buttons = Array.from(document.querySelectorAll('button'));
                            const downloadBtn = buttons.find(btn => 
                                btn.textContent.toLowerCase().includes('download')
                            );
                            if (downloadBtn) {
                                // Extract download URL from button's onclick or parent link
                                const link = downloadBtn.closest('a') || downloadBtn;
                                resolve(link.href || link.getAttribute('data-href'));
                            }
                        });
                    });

                    if (response) {
                        const fileResponse = await page.evaluate(async (url) => {
                            const response = await fetch(url);
                            const arrayBuffer = await response.arrayBuffer();
                            return Array.from(new Uint8Array(arrayBuffer));
                        }, response);
                        
                        resolve(Buffer.from(fileResponse));
                    } else {
                        reject(new Error('Could not extract download URL'));
                    }
                }
            });

            // Click download button
            await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                 const downloadBtn = buttons.find(btn => (btn.textContent||'').toLowerCase().includes('download'))
                if (downloadBtn) downloadBtn.click();
            });
        });
    }

    /**
     * Utility methods
     */
    getMimeType(fileName) {
        const ext = fileName.split('.').pop().toLowerCase();
        const mimeTypes = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'webp': 'image/webp'
        };
        return mimeTypes[ext] || 'image/jpeg';
    }

    updateJobStatus(jobId, status, progress) {
        this.activeJobs.set(jobId, { 
            status, 
            progress, 
            timestamp: new Date().toISOString() 
        });
    }

    getJobStatus(jobId) {
        return this.activeJobs.get(jobId) || null;
    }
}

// Export a singleton instance that survives module re-imports in dev
const g = globalThis
if (!g.__mindarService) {
  g.__mindarService = new VercelMindARService()
}
export const mindarService = g.__mindarService