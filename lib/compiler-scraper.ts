import puppeteer from 'puppeteer'
import { writeFile, unlink } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'

export class CompilerScraper {
  private browser: any
  private page: any

  async init() {
    console.log('🚀 Initializing browser for compilation...')
    console.log('Environment:', {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      platform: process.platform,
      arch: process.arch
    })
    
    // Different configuration for different environments
    const isProduction = process.env.NODE_ENV === 'production'
    const isVercel = process.env.VERCEL === '1'
    const isServerless = isVercel || process.env.AWS_LAMBDA_FUNCTION_NAME
    
    let launchOptions: any = {
      headless: true, // Run in background
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding'
      ]
    }

    // For serverless environments, try to find Chrome in common locations
    if (isServerless) {
      console.log('🔍 Serverless environment detected, trying to find Chrome...')
      
      // Common Chrome paths in different environments
      const chromePaths = [
        '/usr/bin/google-chrome-stable',
        '/usr/bin/google-chrome',
        '/usr/bin/chromium-browser',
        '/usr/bin/chromium',
        '/opt/google/chrome/chrome',
        '/snap/bin/chromium',
        process.env.CHROME_PATH
      ].filter(Boolean)

      for (const chromePath of chromePaths) {
        try {
          const fs = require('fs')
          if (fs.existsSync(chromePath)) {
            console.log(`✅ Found Chrome at: ${chromePath}`)
            launchOptions.executablePath = chromePath
            break
          }
        } catch (error) {
          console.log(`⚠️ Chrome not found at: ${chromePath}`)
        }
      }

      // Additional serverless optimizations
      launchOptions.args.push(
        '--single-process',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-default-apps'
      )
    }

    // Multiple fallback strategies
    const strategies = [
      // Strategy 1: Use specified executablePath or let Puppeteer auto-detect
      () => {
        console.log('🚀 Strategy 1: Auto-detect or specified path')
        return puppeteer.launch(launchOptions)
      },
      
      // Strategy 2: Force download if not found
      () => {
        console.log('🚀 Strategy 2: Force browser download')
        const { executablePath, ...optionsWithoutPath } = launchOptions
        return puppeteer.launch({
          ...optionsWithoutPath,
          // Don't specify executablePath to force download
        })
      },
      
      // Strategy 3: Minimal configuration
      () => {
        console.log('🚀 Strategy 3: Minimal configuration')
        return puppeteer.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        })
      }
    ]

    let lastError
    for (let index = 0; index < strategies.length; index++) {
      const strategy = strategies[index]
      try {
        console.log(`Trying launch strategy ${index + 1}...`)
        this.browser = await strategy()
        console.log(`✅ Strategy ${index + 1} successful`)
        break
      } catch (error: any) {
        console.log(`❌ Strategy ${index + 1} failed:`, error.message)
        lastError = error
        
        if (index === strategies.length - 1) {
          // All strategies failed
          throw new Error(`All browser launch strategies failed. Last error: ${error.message}. 
            
Troubleshooting:
1. If running locally: Run 'npx puppeteer browsers install chrome'
2. If on server: Install Chrome with 'apt-get install -y google-chrome-stable'
3. If serverless: Chrome might not be available in this environment
4. Consider using a service like Browserless.io for serverless web scraping

Environment details:
- Platform: ${process.platform}
- Arch: ${process.arch}
- NODE_ENV: ${process.env.NODE_ENV}
- Cache path issue detected: ${error.message.includes('/home/sbx_user1051/') ? 'Yes (serverless container)' : 'No'}`)
        }
      }
    }

    this.page = await this.browser.newPage()
    
    // Set a longer timeout for compilation
    this.page.setDefaultTimeout(120000) // 2 minutes
    
    // Set user agent to avoid detection
    await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.7258.68 Safari/537.36')
    
    console.log('✅ Browser initialized successfully')
  }

  async convertImageToMind(imageFile: File): Promise<Buffer> {
    try {
      console.log('🔄 Starting image to mind conversion...')
      
      // Save file temporarily for upload
      const tempImagePath = join(tmpdir(), `temp-${Date.now()}-${imageFile.name}`)
      const imageBuffer = Buffer.from(await imageFile.arrayBuffer())
      await writeFile(tempImagePath, imageBuffer)
      
      console.log('📁 Temporary image saved:', tempImagePath)
      
      // Navigate to your compiler page
      console.log('🌐 Navigating to compiler page...')
      await this.page.goto('https://quickscanar.com/compiler/', { 
        waitUntil: 'networkidle0' 
      })
      
      // Wait for the page to fully load
      console.log('⏳ Waiting for page elements...')
      await this.page.waitForSelector('input[type="file"]', { timeout: 30000 })
      
      // Find the file input (may be hidden in iframe or nested)
      console.log('📤 Uploading image file...')
      const fileInput = await this.page.$('input[type="file"]')
      if (!fileInput) {
        throw new Error('File input not found on page')
      }
      
      await fileInput.uploadFile(tempImagePath)
      console.log('✅ File uploaded successfully')
      
      // Wait a moment for file processing
      await this.page.waitForTimeout(2000)
      
      // Look for compile button with multiple possible selectors
      console.log('🔍 Looking for compile button...')
      const compileSelectors = [
        'button:contains("Compile")',
        'button:contains("Convert")', 
        'button:contains("Generate")',
        '.compile-btn',
        '#compile-btn',
        '.convert-btn',
        '#convert-btn',
        '[data-action="compile"]',
        'input[type="submit"]'
      ]
      
      let compileButton = null
      for (const selector of compileSelectors) {
        try {
          compileButton = await this.page.$(selector)
          if (compileButton) {
            console.log(`✅ Found compile button with selector: ${selector}`)
            break
          }
        } catch (e) {
          // Continue to next selector
        }
      }
      
      if (!compileButton) {
        // Try to find any button on the page
        const allButtons = await this.page.$$('button')
        console.log(`📊 Found ${allButtons.length} buttons on page`)
        
        if (allButtons.length > 0) {
          compileButton = allButtons[allButtons.length - 1] // Use last button as fallback
          console.log('⚠️ Using fallback button (last button on page)')
        } else {
          throw new Error('No compile button found on page')
        }
      }
      
      // Click the compile button
      console.log('🎯 Clicking compile button...')
      await compileButton.click()
      
      // Wait for compilation to complete - look for various success indicators
      console.log('⏳ Waiting for compilation to complete...')
      const completionSelectors = [
        '.download-ready',
        '.mind-file-ready', 
        '[data-status="completed"]',
        '.download-link',
        '.mind-download',
        'a[href$=".mind"]',
        'button:contains("Download")',
        '.compilation-complete'
      ]
      
      let downloadElement = null
      for (const selector of completionSelectors) {
        try {
          await this.page.waitForSelector(selector, { timeout: 90000 }) // 1.5 minutes
          downloadElement = await this.page.$(selector)
          if (downloadElement) {
            console.log(`✅ Compilation complete! Found element: ${selector}`)
            break
          }
        } catch (e) {
          // Continue to next selector
        }
      }
      
      if (!downloadElement) {
        // Fallback: wait for any new link or button that might be the download
        console.log('⚠️ Using fallback download detection...')
        await this.page.waitForTimeout(30000) // Wait 30 seconds for processing
        
        // Look for any .mind file link
        downloadElement = await this.page.$('a[href$=".mind"]')
        if (!downloadElement) {
          throw new Error('Compilation may have failed - no download link found')
        }
      }
      
      // Get the download URL
      let downloadUrl = null
      if (downloadElement.tagName === 'A') {
        downloadUrl = await downloadElement.evaluate((el: any) => el.href)
      } else {
        // Look for data attributes or click to trigger download
        downloadUrl = await downloadElement.evaluate((el: any) => 
          el.getAttribute('data-download-url') || 
          el.getAttribute('href') ||
          el.querySelector('a')?.href
        )
      }
      
      if (!downloadUrl) {
        // Try clicking the element to trigger download
        console.log('🎯 Triggering download by clicking element...')
        await downloadElement.click()
        
        // Wait for download to start and capture response
        const response = await this.page.waitForResponse((response: any) => 
          response.url().includes('.mind') || 
          response.headers()['content-type']?.includes('application/octet-stream')
        )
        
        const mindFileBuffer = await response.buffer()
        console.log('✅ Mind file downloaded via click trigger')
        
        // Clean up
        await unlink(tempImagePath)
        return mindFileBuffer
      }
      
      // Download the .mind file
      console.log('📥 Downloading mind file from:', downloadUrl)
      const response = await this.page.goto(downloadUrl)
      const mindFileBuffer = await response.buffer()
      
      console.log('✅ Mind file downloaded successfully')
      
      // Clean up temporary file
      await unlink(tempImagePath)
      
      return mindFileBuffer
      
    } catch (error) {
      console.error('❌ Scraping failed:', error)
      
      // Try to get page content for debugging
      try {
        const pageContent = await this.page.content()
        console.log('📄 Page content length:', pageContent.length)
        
        // Look for error messages on page
        const errorMessages = await this.page.$$eval('[class*="error"], .alert-danger, .error-message', 
          (elements: any[]) => elements.map((el: any) => el.textContent)
        )
        if (errorMessages.length > 0) {
          console.log('⚠️ Page errors found:', errorMessages)
        }
      } catch (debugError) {
        console.log('Unable to get debug info from page')
      }
      
      throw new Error(`Failed to convert image to mind file: ${(error as any).message}`)
    }
  }

  async close() {
    if (this.browser) {
      console.log('🔄 Closing browser...')
      await this.browser.close()
      console.log('✅ Browser closed')
    }
  }

  // Helper method to check if the compiler page is accessible
  async testPageAccess(): Promise<boolean> {
    try {
      await this.init()
      await this.page.goto('https://quickscanar.com/compiler/')
      const title = await this.page.title()
      await this.close()
      return title.includes('AR') || title.includes('Compiler')
    } catch (error) {
      console.error('Page access test failed:', error)
      return false
    }
  }
}

// Utility function for testing
export async function testCompilerScraper() {
  const scraper = new CompilerScraper()
  
  try {
    const isAccessible = await scraper.testPageAccess()
    console.log('Compiler page accessible:', isAccessible)
    return isAccessible
  } catch (error) {
    console.error('Test failed:', error)
    return false
  }
}
