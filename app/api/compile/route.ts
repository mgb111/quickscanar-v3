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
          <!-- Load MindAR as regular script first (fallback) -->
          <script src="/js/mindar-compiler.js"></script>
          <script type="module">
            console.log('DEBUG: Starting MindAR initialization...');
            
            // Wait a bit for the script to load
            await new Promise(resolve => setTimeout(resolve, 500));
            
            try {
              console.log('DEBUG: Checking for MINDAR global after script load...');
              if (window.MINDAR && window.MINDAR.IMAGE && window.MINDAR.IMAGE.MindARThree) {
                console.log('DEBUG: Found MindARThree in MINDAR.IMAGE namespace');
                window.MindARThree = window.MINDAR.IMAGE.MindARThree;
                console.log('DEBUG: MindARThree assigned from global namespace');
              } else {
                console.log('DEBUG: Attempting ES module import as fallback...');
                try {
                  const { MindARThree } = await import('/js/mindar-compiler.js');
                  console.log('DEBUG: ES module import successful');
                  window.MindARThree = MindARThree;
                } catch (importError) {
                  console.error('DEBUG: ES module import also failed:', importError);
                }
              }
              
              // Final verification
              console.log('DEBUG: Final MindARThree check:', typeof window.MindARThree);
              if (window.MindARThree) {
                console.log('DEBUG: MindARThree successfully available');
                console.log('DEBUG: MindARThree constructor:', window.MindARThree.toString().substring(0, 200));
              } else {
                console.error('DEBUG: MindARThree still not available');
                console.error('DEBUG: Available globals:', Object.keys(window).filter(k => 
                  k.toLowerCase().includes('mind') || k.toLowerCase().includes('ar')
                ));
                console.error('DEBUG: window.MINDAR:', window.MINDAR);
              }
            } catch (error) {
              console.error('DEBUG: Initialization error:', error);
            }
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
            
            // Wait for local MindAR to load with detailed debugging
            async function waitForDependencies() {
              console.log('DEBUG: Starting waitForDependencies...');
              
              let attempts = 0;
              while (attempts < 50) {
                console.log('DEBUG: Attempt ' + (attempts + 1) + '/50 - checking for MindAR...');
                
                await new Promise(resolve => setTimeout(resolve, 100));
                
                // Comprehensive debugging of what's available
                console.log('DEBUG: Current window keys containing mind:', 
                  Object.keys(window).filter(k => k.toLowerCase().includes('mind')));
                console.log('DEBUG: Current window keys containing ar:', 
                  Object.keys(window).filter(k => k.toLowerCase().includes('ar')));
                
                // Check if MINDAR is available from the local file
                if ((window as any).MINDAR) {
                  console.log('DEBUG: window.MINDAR exists:', typeof (window as any).MINDAR);
                  console.log('DEBUG: window.MINDAR keys:', Object.keys((window as any).MINDAR || {}));
                  
                  if ((window as any).MINDAR.IMAGE) {
                    console.log('DEBUG: window.MINDAR.IMAGE exists:', typeof (window as any).MINDAR.IMAGE);
                    console.log('DEBUG: window.MINDAR.IMAGE keys:', Object.keys((window as any).MINDAR.IMAGE || {}));
                    
                    if ((window as any).MINDAR.IMAGE.MindARThree) {
                      console.log('DEBUG: SUCCESS - MindARThree found at window.MINDAR.IMAGE.MindARThree');
                      return true;
                    }
                  }
                }
                
                // Check if MindARThree is available as a global
                if (typeof (window as any).MindARThree !== 'undefined') {
                  console.log('DEBUG: SUCCESS - MindARThree found as global:', typeof (window as any).MindARThree);
                  return true;
                }
                
                // Check for any other MindAR-related globals
                const allGlobals = Object.keys(window);
                const mindArRelated = allGlobals.filter(key => 
                  key.toLowerCase().includes('mindar') || 
                  key.toLowerCase().includes('mind') ||
                  (key.toLowerCase().includes('ar') && key.length < 10)
                );
                
                if (mindArRelated.length > 0) {
                  console.log('DEBUG: Found MindAR-related globals:', mindArRelated);
                  mindArRelated.forEach(key => {
                    console.log('DEBUG: ' + key + ':', typeof (window as any)[key], (window as any)[key]);
                  });
                }
                
                attempts++;
              }
              
              // Final comprehensive error report
              console.error('DEBUG: FAILED - MindAR not found after 50 attempts');
              console.error('DEBUG: Final window analysis:');
              console.error('DEBUG: - window.MINDAR:', typeof (window as any).MINDAR, (window as any).MINDAR);
              console.error('DEBUG: - window.MindARThree:', typeof (window as any).MindARThree, (window as any).MindARThree);
              
              const finalGlobals = Object.keys(window).filter(key => 
                key.toLowerCase().includes('mind') || 
                key.toLowerCase().includes('ar') ||
                key.toLowerCase().includes('three')
              );
            }
            
            // Check if MindARThree is available as a global
            if (typeof (window as any).MindARThree !== 'undefined') {
              console.log('DEBUG: SUCCESS - MindARThree found as global:', typeof (window as any).MindARThree);
              return true;
            }
            
            // Check for any other MindAR-related globals
            const allGlobals = Object.keys(window);
            const mindArRelated = allGlobals.filter(key => 
              key.toLowerCase().includes('mindar') || 
              key.toLowerCase().includes('mind') ||
              (key.toLowerCase().includes('ar') && key.length < 10)
            );
            
            if (mindArRelated.length > 0) {
              console.log('DEBUG: Found MindAR-related globals:', mindArRelated);
              mindArRelated.forEach(key => {
                console.log('DEBUG: ' + key + ':', typeof (window as any)[key], (window as any)[key]);
              });
            }
            
            attempts++;
          }
          
          // Final comprehensive error report
          console.error('DEBUG: FAILED - MindAR not found after 50 attempts');
          console.error('DEBUG: Final window analysis:');
          console.error('DEBUG: - window.MINDAR:', typeof (window as any).MINDAR, (window as any).MINDAR);
          console.error('DEBUG: - window.MindARThree:', typeof (window as any).MindARThree, (window as any).MindARThree);
          
          const finalGlobals = Object.keys(window).filter(key => 
            key.toLowerCase().includes('mind') || 
            key.toLowerCase().includes('ar') ||
            key.toLowerCase().includes('three')
          );
          console.error('DEBUG: - All relevant globals:', finalGlobals);
          
          throw new Error('MindAR not available after loading local file. Checked: window.MINDAR.IMAGE.MindARThree, window.MindARThree. Available globals: ' + finalGlobals.join(', '));
        }
        
        (window as any).compileImage = async function(imageBase64: any) {
          try {
            console.log('DEBUG: Starting compilation in browser...');
            document.getElementById('progress')!.textContent = 'Loading MindAR compiler...';
            
            // Wait for dependencies to load first
            console.log('DEBUG: Calling waitForDependencies...');
            await waitForDependencies();
            console.log('DEBUG: waitForDependencies completed successfully');
            
            document.getElementById('progress')!.textContent = 'Initializing MindAR compiler...';
            
            // Convert base64 to image element first
            console.log('DEBUG: Creating image element...');
            const img = new Image();
            img.src = imageBase64;
            
            await new Promise((resolve, reject) => {
              img.onload = () => {
                console.log('DEBUG: Image loaded successfully, size:', img.width, 'x', img.height);
                resolve(true);
              };
              img.onerror = (error) => {
                console.error('DEBUG: Image load failed:', error);
                reject(error);
              };
            });
            
            document.getElementById('progress')!.textContent = 'Compiling image with MindAR...';
            console.log('DEBUG: Starting compilation attempts...');
            
            // Get MindARThree from the loaded local file
            const MindARThree = (window as any).MINDAR?.IMAGE?.MindARThree || (window as any).MindARThree;
            console.log('DEBUG: MindARThree found:', !!MindARThree);
            console.log('DEBUG: MindARThree type:', typeof MindARThree);
            console.log('DEBUG: MindARThree keys:', Object.getOwnPropertyNames(MindARThree || {}));
            
            if (!MindARThree) {
              throw new Error('MindARThree not found. Available: ' + Object.keys((window as any).MINDAR?.IMAGE || {}));
            }
            
            // Check if this is a compiler class with static compile method
            if (typeof MindARThree.Compiler === 'function') {
              console.log('DEBUG: Using MindARThree.Compiler');
              const compiler = new MindARThree.Compiler();
              const result = await compiler.compileImageTargets([img]);
              return { success: true, data: result };
            }
            
            // Try static compile method
            if (typeof MindARThree.compile === 'function') {
              console.log('DEBUG: Using static compile method');
              const result = await MindARThree.compile([img]);
              return { success: true, data: result };
            }
            
            // Try creating instance and check for compile methods
            try {
              console.log('DEBUG: Attempting to create MindARThree instance...');
              const mindarThree = new MindARThree({
                container: document.body,
                imageTargetSrc: null
              });
              console.log('DEBUG: MindARThree instance created');
              console.log('DEBUG: Instance methods:', Object.getOwnPropertyNames(mindarThree));
              
              if (mindarThree.compile) {
                console.log('DEBUG: Using instance compile method');
                const result = await mindarThree.compile([img]);
                return { success: true, data: result };
              } else if (mindarThree.addImageTargets) {
                console.log('DEBUG: Using addImageTargets method');
                const result = await mindarThree.addImageTargets([img]);
                return { success: true, data: result };
              }
            } catch (instanceError) {
              console.error('DEBUG: Failed to create instance:', instanceError);
            }
            
            // Check for global compilation functions
            if (typeof (window as any).compileImageTargets === 'function') {
              console.log('DEBUG: Using global compileImageTargets function');
              const result = await (window as any).compileImageTargets([img]);
              return { success: true, data: result };
            }
            
            // Final error with detailed information
            const availableGlobals = Object.keys(window).filter(key => 
              key.toLowerCase().includes('mindar') || 
              key.toLowerCase().includes('compile')
            );
            
            return { 
              success: false, 
              message: 'No working compilation method found in MindAR',
              availableGlobals: availableGlobals.join(', '),
              mindARThreeType: typeof MindARThree,
              mindARThreeKeys: Object.getOwnPropertyNames(MindARThree || {}).join(', ')
            };
          } catch (error: any) {
            console.error('DEBUG: Browser compilation error:', error);
            console.error('DEBUG: Error stack:', error.stack);
            document.getElementById('progress')!.textContent = 'Error: ' + error.message;
            return { 
              success: false, 
              error: error.message,
              errorStack: error.stack,
              errorType: typeof error
            };
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
    throw new Error(`Browser compilation failed: ${result.error || result.message}`)
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
