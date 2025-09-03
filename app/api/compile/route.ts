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
    console.log('MindAR compilation endpoint called')
    
    // Parse the form data
    const formData = await request.formData()
    const markerImage = formData.get('markerImage') as File
    
    if (!markerImage) {
      return NextResponse.json(
        { success: false, message: 'No marker image provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(markerImage.type)) {
      return NextResponse.json(
        { success: false, message: 'Invalid file type. Only JPEG and PNG images are allowed.' },
        { status: 400 }
      )
    }

    console.log('Starting Puppeteer-based MindAR compilation with local file...')

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
      
      // Ensure fresh assets: disable HTTP cache in headless browser
      await page.setCacheEnabled(false)
      
      // Set longer timeout for network requests
      page.setDefaultTimeout(60000)
      page.setDefaultNavigationTimeout(60000)
      
      // Create HTML page with local MindAR compiler
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <script type="module">
            // Import MindARThree from local ES module and expose globally for Puppeteer
            import { MindARThree } from '/js/mindar-compiler.js';
            window.MindARThree = MindARThree;
            console.log('MindARThree successfully attached to window.');
          </script>
        </head>
        <body>
          <div id="progress">Loading...</div>
          <script>
            // Global error handler
            window.onerror = function(msg, url, line, col, error) {
              console.error('Global error:', msg, url, line, col, error);
              return false;
            };
            
            // Wait for local MindAR to load
            async function waitForDependencies() {
              console.log('Waiting for local MindAR to load...');
              
              let attempts = 0;
              while (attempts < 50) {
                await new Promise(resolve => setTimeout(resolve, 100));
                
                // Check if MINDAR is available from the local file
                if (window.MINDAR && window.MINDAR.IMAGE && window.MINDAR.IMAGE.MindARThree) {
                  console.log('MindAR loaded from local file - MindARThree available');
                  return true;
                }
                
                // Check if MindARThree is available as a global
                if (typeof window.MindARThree !== 'undefined') {
                  console.log('MindARThree available as global from local file');
                  return true;
                }
                
                attempts++;
              }
              
              throw new Error('MindAR not available after loading local file');
            }
            
            window.compileImage = async function(imageBase64) {
              try {
                console.log('Starting compilation in browser...');
                document.getElementById('progress').textContent = 'Loading MindAR compiler...';
                
                // Wait for dependencies to load first
                await waitForDependencies();
                
                document.getElementById('progress').textContent = 'Initializing MindAR compiler...';
                
                // Get MindARThree from the loaded local file
                const MindARThree = window.MINDAR?.IMAGE?.MindARThree || window.MindARThree;
                
                if (!MindARThree) {
                  throw new Error('MindARThree not found in loaded file');
                }
                
                // Initialize MindAR
                const mindarThree = new MindARThree({
                  container: document.body,
                  imageTargetSrc: null // We'll compile the target
                });
                
                // Convert base64 to image element
                const img = new Image();
                img.src = imageBase64;
                
                await new Promise((resolve, reject) => {
                  img.onload = resolve;
                  img.onerror = reject;
                });
                
                document.getElementById('progress').textContent = 'Compiling image with MindAR...';
                
                // Check if the MindARThree instance has a compiler method
                if (mindarThree.compile) {
                  console.log('Using MindARThree.compile method');
                  const result = await mindarThree.compile([img]);
                  return { success: true, data: result };
                } else if (mindarThree.addImageTargets) {
                  console.log('Using MindARThree.addImageTargets method');
                  const result = await mindarThree.addImageTargets([img]);
                  return { success: true, data: result };
                } else {
                  console.log('Checking for global compilation functions...');
                  
                  // Check for compilation functions in the global scope
                  if (typeof window.compileImageTargets === 'function') {
                    const result = await window.compileImageTargets([img]);
                    return { success: true, data: result };
                  }
                  
                  return { 
                    success: false, 
                    message: 'No compilation method found in MindAR. Available methods: ' + Object.getOwnPropertyNames(mindarThree).join(', '),
                    availableGlobals: Object.keys(window).filter(key => key.toLowerCase().includes('mindar') || key.toLowerCase().includes('compile')).join(', ')
                  };
                }
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
