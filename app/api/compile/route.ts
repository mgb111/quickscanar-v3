import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'

// Puppeteer-based compilation with proper browser context
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    console.log('Starting Puppeteer-based compilation...')
    
    // Parse the form data
    const formData = await request.formData()
    const markerImage = formData.get('markerImage') as File
    
    if (!markerImage) {
      console.log('No marker image provided')
      return NextResponse.json(
        { success: false, message: 'No marker image provided' },
        { status: 400 }
      )
    }

    console.log('Marker image received:', markerImage.name, markerImage.type, markerImage.size)

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(markerImage.type)) {
      console.log('Invalid file type:', markerImage.type)
      return NextResponse.json(
        { success: false, message: 'Invalid file type. Only JPEG and PNG images are allowed.' },
        { status: 400 }
      )
    }

    // Setup file paths
    const uniqueId = uuidv4()
    const mindFileName = `${uniqueId}.mind`
    const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.cwd().includes('/var/task')
    
    let uploadsDir: string
    let mindFilePath: string
    let publicPath: string
    
    if (isServerless) {
      uploadsDir = '/tmp'
      mindFilePath = path.join(uploadsDir, mindFileName)
      publicPath = `/api/download/${mindFileName}`
    } else {
      uploadsDir = path.join(process.cwd(), 'public', 'uploads')
      if (!existsSync(uploadsDir)) {
        console.log('Creating uploads directory:', uploadsDir)
        await mkdir(uploadsDir, { recursive: true })
      }
      mindFilePath = path.join(uploadsDir, mindFileName)
      publicPath = `/uploads/${mindFileName}`
    }

    console.log('Generated file path:', mindFilePath)

    // Convert image to base64 for browser processing
    const imageBuffer = Buffer.from(await markerImage.arrayBuffer())
    const imageBase64 = `data:${markerImage.type};base64,${imageBuffer.toString('base64')}`

    // Launch Puppeteer browser with optimized settings
    console.log('Launching headless browser...')
    
    const browser = await puppeteer.launch({
      args: isServerless ? [
        ...chromium.args,
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--no-first-run',
        '--no-zygote',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-ipc-flooding-protection',
        '--font-render-hinting=none',
        '--disable-gpu',
        '--single-process'
      ] : [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ],
      defaultViewport: isServerless ? chromium.defaultViewport : { width: 1280, height: 720 },
      executablePath: isServerless ? await chromium.executablePath() : undefined,
      headless: true,
      timeout: 60000
    })

    try {
      const page = await browser.newPage()
      
      // Set longer timeout for network requests
      page.setDefaultTimeout(60000)
      page.setDefaultNavigationTimeout(60000)
      
      // Create HTML page with MindAR compiler - using unpkg as alternative CDN
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body>
          <div id="progress">Loading...</div>
          <script>
            // Global error handler
            window.onerror = function(msg, url, line, col, error) {
              console.error('Global error:', msg, url, line, col, error);
              return false;
            };
            
            // Load MindAR compiler with multiple fallback CDNs
            async function loadMindARCompiler() {
              const cdnUrls = [
                'https://unpkg.com/@maherboughdiri/mind-ar-compiler@1.0.1/index.js',
                'https://cdn.jsdelivr.net/npm/@maherboughdiri/mind-ar-compiler@1.0.1/index.js',
                'https://cdn.skypack.dev/@maherboughdiri/mind-ar-compiler@1.0.1'
              ];
              
              for (let i = 0; i < cdnUrls.length; i++) {
                try {
                  console.log('Trying CDN:', cdnUrls[i]);
                  const script = document.createElement('script');
                  script.src = cdnUrls[i];
                  
                  await new Promise((resolve, reject) => {
                    script.onload = resolve;
                    script.onerror = reject;
                    document.head.appendChild(script);
                  });
                  
                  // Wait for MindARCompiler to be available
                  let attempts = 0;
                  while (!window.MindARCompiler && attempts < 100) {
                    await new Promise(resolve => setTimeout(resolve, 50));
                    attempts++;
                  }
                  
                  if (window.MindARCompiler) {
                    console.log('MindAR compiler loaded successfully from:', cdnUrls[i]);
                    return true;
                  }
                } catch (error) {
                  console.error('Failed to load from CDN:', cdnUrls[i], error);
                  continue;
                }
              }
              
              throw new Error('Failed to load MindAR compiler from all CDN sources');
            }
            
            window.compileImage = async function(imageBase64) {
              try {
                console.log('Starting compilation in browser...');
                document.getElementById('progress').textContent = 'Loading MindAR compiler...';
                
                // Load the compiler
                await loadMindARCompiler();
                
                document.getElementById('progress').textContent = 'Converting image...';
                
                // Convert base64 to File object
                const response = await fetch(imageBase64);
                const blob = await response.blob();
                const file = new File([blob], 'marker.jpg', { type: 'image/jpeg' });
                
                console.log('File created, size:', file.size);
                document.getElementById('progress').textContent = 'Compiling...';
                
                // Use MindAR compiler
                const compiler = window.MindARCompiler;
                
                if (!compiler || !compiler.compileFiles) {
                  throw new Error('MindAR compiler not available or missing compileFiles method');
                }
                
                console.log('Compiler loaded, starting compilation...');
                const result = await compiler.compileFiles([file]);
                console.log('Compilation completed');
                
                document.getElementById('progress').textContent = 'Compilation complete!';
                
                // Convert ArrayBuffer to base64 for transfer
                const uint8Array = new Uint8Array(result);
                const base64 = btoa(String.fromCharCode.apply(null, uint8Array));
                return { success: true, data: base64 };
              } catch (error) {
                console.error('Browser compilation error:', error);
                document.getElementById('progress').textContent = 'Error: ' + error.message;
                return { success: false, error: error.message };
              }
            };
            
            console.log('Browser context ready');
          </script>
        </body>
        </html>
      `
      
      await page.setContent(html)
      console.log('Page content loaded')
      
      // Wait for the compile function to be ready
      await page.waitForFunction('window.compileImage', { timeout: 30000 })
      console.log('Compiler function ready')
      
      // Execute compilation
      console.log('Executing compilation in browser...')
      const result = await page.evaluate(async (imageBase64) => {
        return await (window as any).compileImage(imageBase64)
      }, imageBase64)
      
      if (!result.success) {
        throw new Error(`Browser compilation failed: ${result.error}`)
      }
      
      // Convert base64 back to buffer and save
      const compiledBuffer = Buffer.from(result.data, 'base64')
      await writeFile(mindFilePath, compiledBuffer)
      
      console.log('Puppeteer compilation completed successfully')
      
      return NextResponse.json({
        success: true,
        message: 'Image compilation successful',
        filePath: publicPath,
        fileName: mindFileName
      })
      
    } finally {
      await browser.close()
      console.log('Browser closed')
    }

  } catch (error) {
    console.error('Puppeteer compilation error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { success: false, message: `Compilation failed: ${errorMessage}` },
      { status: 500 }
    )
  }
}

// Optional: Add GET method to check endpoint status
export async function GET() {
  return NextResponse.json({
    message: 'MindAR Compilation Endpoint',
    status: 'active',
    supportedFormats: ['image/jpeg', 'image/png']
  })
}
